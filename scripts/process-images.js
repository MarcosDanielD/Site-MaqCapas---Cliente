/**
 * scripts/process-images.js
 * Pipeline de processamento e otimização de imagens de alta performance:
 * - Gera versões responsivas: 480, 800, 1200 e 1600 px (sem upscaling)
 * - Formatos: AVIF (qualidade 55), WebP (qualidade 82) e JPG como fallback
 * - Aplica nitidez leve (sharpen sigma 0.6)
 * - Correção suave de brilho/contraste apenas em imagens escuras (meanLum < 110)
 * - Enquadramento inteligente (attention strategy)
 * - Gera manifest com coordenadas de foco (focus: "50% 40%"), dimensões e tamanhos em bytes
 * - Cria og-image 1200x630 e favicons
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcImagesDir = path.join(rootDir, 'assets', 'images');
const pubImagesDir = path.join(rootDir, 'public', 'assets', 'images');
const pubIconsDir = path.join(rootDir, 'public', 'assets', 'icons');
const manifestPath = path.join(rootDir, 'scripts', 'images-manifest.json');

[pubImagesDir, pubIconsDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Coordenadas de foco manuais e enquadramento inteligente
const focusMap = {
  'capa_computador_real.jpg': '50% 50%',
  'capa_noiva_real.jpg': '50% 38%',
  'capa_noiva_clean_real.png': '50% 45%',
  'porta_terno_real.jpg': '50% 32%',
  'porta_terno_detalhe_real.jpg': '50% 50%',
  'capa_industrial_real.jpg': '50% 50%',
  'embalagem_sapatos.png': '50% 50%',
  'sacola_tnt.jpg': '50% 50%',
  'arara_vestuarios.jpg': '50% 50%',
  'capa_computador.jpg': '50% 50%',
  'capa_noiva_terno.png': '50% 45%',
  'porta_terno.jpg': '50% 35%',
  'capa_industrial.jpg': '50% 50%',
  'couture.jpg': '50% 50%',
  'tech.jpg': '50% 50%',
  'industrial.jpg': '50% 50%',
  'hero.jpg': '50% 50%',
  'marq-lab.png': '50% 50%',
  'logo_original.png': '50% 50%'
};

const TARGET_WIDTHS = [480, 800, 1200, 1600];

async function getLuminance(filePath) {
  const raw = await sharp(filePath).greyscale().raw().toBuffer();
  let sum = 0;
  for (let i = 0; i < raw.length; i++) sum += raw[i];
  return sum / raw.length;
}

async function processAll() {
  console.log('--- INICIANDO PROCESSAMENTO DE IMAGENS ---');
  const manifest = {};
  const imageFiles = fs.readdirSync(srcImagesDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

  for (const filename of imageFiles) {
    const srcPath = path.join(srcImagesDir, filename);
    const parsed = path.parse(filename);
    const baseName = parsed.name;
    const meta = await sharp(srcPath).metadata();
    const origW = meta.width;
    const origH = meta.height;
    const lum = await getLuminance(srcPath);

    const focus = focusMap[filename] || '50% 50%';

    console.log(`\nProcessando: ${filename} (${origW}x${origH}, lum: ${lum.toFixed(1)})`);

    // Determina larguras sem upscaling
    const widthsToGen = TARGET_WIDTHS.filter(w => w < origW);
    if (!widthsToGen.includes(origW)) {
      widthsToGen.push(origW);
    }
    widthsToGen.sort((a, b) => a - b);

    // Pipeline base com nitidez leve e modulação de brilho se necessário
    function createPipeline(targetW) {
      const targetH = Math.round((targetW / origW) * origH);
      let p = sharp(srcPath).resize(targetW, targetH, {
        fit: 'cover',
        position: sharp.strategy.attention
      });

      // Nitidez leve sigma 0.6
      p = p.sharpen({ sigma: 0.6 });

      // Correção suave de brilho/contraste apenas se visivelmente escura
      if (lum < 110) {
        p = p.modulate({ brightness: 1.05, contrast: 1.03 });
      }

      return p;
    }

    const sizesManifest = {};

    for (const w of widthsToGen) {
      const h = Math.round((w / origW) * origH);
      const suffix = `-${w}`;

      // 1. AVIF (qualidade 55)
      const avifName = `${baseName}${suffix}.avif`;
      const avifPath = path.join(pubImagesDir, avifName);
      await createPipeline(w).avif({ quality: 55, effort: 4 }).toFile(avifPath);
      const avifBytes = fs.statSync(avifPath).size;

      // 2. WebP (qualidade 82)
      const webpName = `${baseName}${suffix}.webp`;
      const webpPath = path.join(pubImagesDir, webpName);
      await createPipeline(w).webp({ quality: 82, effort: 4 }).toFile(webpPath);
      const webpBytes = fs.statSync(webpPath).size;

      // 3. JPG (qualidade 80)
      const jpgName = `${baseName}${suffix}.jpg`;
      const jpgPath = path.join(pubImagesDir, jpgName);
      await createPipeline(w).jpeg({ quality: 80, progressive: true }).toFile(jpgPath);
      const jpgBytes = fs.statSync(jpgPath).size;

      sizesManifest[w] = {
        width: w,
        height: h,
        avif: { file: avifName, bytes: avifBytes, kb: (avifBytes / 1024).toFixed(1) + ' KB' },
        webp: { file: webpName, bytes: webpBytes, kb: (webpBytes / 1024).toFixed(1) + ' KB' },
        jpg: { file: jpgName, bytes: jpgBytes, kb: (jpgBytes / 1024).toFixed(1) + ' KB' }
      };

      console.log(`  -> ${w}px: WebP ${(webpBytes / 1024).toFixed(1)} KB | AVIF ${(avifBytes / 1024).toFixed(1)} KB | JPG ${(jpgBytes / 1024).toFixed(1)} KB`);
    }

    // Cria também a versão canônica sem sufixo (aponta para a versão otimizada de maior resolução)
    const defW = widthsToGen[widthsToGen.length - 1];
    const defWebpPath = path.join(pubImagesDir, `${baseName}.webp`);
    const defJpgPath = path.join(pubImagesDir, `${baseName}.jpg`);
    const defAvifPath = path.join(pubImagesDir, `${baseName}.avif`);

    fs.copyFileSync(path.join(pubImagesDir, `${baseName}-${defW}.webp`), defWebpPath);
    fs.copyFileSync(path.join(pubImagesDir, `${baseName}-${defW}.jpg`), defJpgPath);
    fs.copyFileSync(path.join(pubImagesDir, `${baseName}-${defW}.avif`), defAvifPath);

    manifest[filename] = {
      base: `${baseName}.webp`,
      orig: filename,
      width: origW,
      height: origH,
      aspectRatio: (origW / origH).toFixed(3),
      focus: focus,
      sizes: sizesManifest,
      availableWidths: widthsToGen
    };
  }

  // Gera og-image (1200x630)
  console.log('\n--- Gerando og-image 1200x630 ---');
  const heroSrc = path.join(srcImagesDir, 'capa_computador_real.jpg');
  const ogJpgPath = path.join(pubImagesDir, 'og-image.jpg');
  const ogWebpPath = path.join(pubImagesDir, 'og-image.webp');

  const ogBuffer = await sharp(heroSrc)
    .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
    .sharpen({ sigma: 0.6 })
    .toBuffer();

  const ogOverlaySvg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(12,11,9,0.3)"/>
          <stop offset="60%" stop-color="rgba(12,11,9,0.7)"/>
          <stop offset="100%" stop-color="rgba(12,11,9,0.95)"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect x="50" y="50" width="1100" height="530" fill="none" stroke="#d4a373" stroke-width="2" rx="12" opacity="0.6"/>
      <text x="80" y="320" font-family="'Outfit', sans-serif" font-weight="bold" font-size="54" fill="#ffffff">MAQCAPAS</text>
      <text x="80" y="380" font-family="'Inter', sans-serif" font-size="28" fill="#d4a373">Capas de Proteção Sob Medida</text>
      <text x="80" y="430" font-family="'Inter', sans-serif" font-size="20" fill="#a8a29e">Informática • Vestuário de Noivas • Máquinas Industriais</text>
      <text x="80" y="530" font-family="'Inter', sans-serif" font-weight="bold" font-size="22" fill="#f0ece4">Curitiba / PR • Fabricação Própria Desde 1987</text>
    </svg>
  `);

  await sharp(ogBuffer)
    .composite([{ input: ogOverlaySvg, top: 0, left: 0 }])
    .jpeg({ quality: 85, progressive: true })
    .toFile(ogJpgPath);

  await sharp(ogBuffer)
    .composite([{ input: ogOverlaySvg, top: 0, left: 0 }])
    .webp({ quality: 85 })
    .toFile(ogWebpPath);

  manifest['og-image.jpg'] = {
    width: 1200,
    height: 630,
    bytes: fs.statSync(ogJpgPath).size,
    focus: '50% 50%'
  };

  // Salva manifesto completo
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n✓ Manifesto salvo em ${manifestPath}`);
  console.log('--- Processamento concluído com sucesso ---');
}

processAll().catch(e => {
  console.error('Erro no processamento:', e);
  process.exit(1);
});
