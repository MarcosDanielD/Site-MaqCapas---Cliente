/**
 * scripts/process-images.js
 * Pipeline de processamento, enquadramento 4:3 nativo e otimização de imagens reais:
 * - Enquadra todas as fotos reais em proporção 4:3 limpa (sem bordas borradas e sem cortar o produto)
 * - Aplica nitidez calibrada (sharpen) e realce suave de contraste/iluminação natural
 * - Gera versões responsivas: 480, 800, 1200 e 1600 px (sem upscaling acima do master)
 * - Formatos: AVIF (qualidade 55), WebP (qualidade 82) e JPG como fallback
 * - Cria og-image 1200x630
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

// Remove arquivos temporários ou removidos (embalagem_sapatos, test_*)
for (const dir of [srcImagesDir, pubImagesDir]) {
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith('embalagem_sapatos') || f.startsWith('test_')) {
        try { fs.unlinkSync(path.join(dir, f)); } catch (_) {}
      }
    }
  }
}

const TARGET_WIDTHS = [480, 800, 1200, 1600];

/**
 * Se a foto original de Vestido de Noiva estiver na pasta pai, prepara o recorte 4:3 limpo
 * removendo os ícones de captura de tela dos cantos superiores.
 */
async function ensureCleanNoivaSource() {
  const parentOrig = path.resolve(rootDir, '..', 'WhatsApp Image 2026-11-06 at 18.11.54.jpeg');
  const destNoiva = path.join(srcImagesDir, 'capa_noiva_real.jpg');
  if (!fs.existsSync(parentOrig)) return;

  const leftPatch = await sharp(parentOrig)
    .extract({ left: 0, top: 182, width: 135, height: 108 })
    .flip()
    .toBuffer();
  const rightPatch = await sharp(parentOrig)
    .extract({ left: 575, top: 182, width: 142, height: 108 })
    .flip()
    .toBuffer();

  const patchedFull = await sharp(parentOrig)
    .composite([
      { input: leftPatch, left: 0, top: 72 },
      { input: rightPatch, left: 575, top: 72 }
    ])
    .toBuffer();

  // Extrai quadro 4:3 nativo (717x538) pegando cabide, visor em PVC cristal, zíper e corpo superior
  await sharp(patchedFull)
    .extract({ left: 0, top: 74, width: 717, height: 538 })
    .jpeg({ quality: 95 })
    .toFile(destNoiva);
}

/**
 * Cria um buffer master 4:3 centralizado e aprimorado para cada imagem,
 * garantindo que nenhum produto seja cortado nos cards ou galerias.
 */
async function buildMasterBuffer(filename, srcPath) {
  const meta = await sharp(srcPath).metadata();
  const origW = meta.width;
  const origH = meta.height;

  // Logos continuam intocadas em sua proporção original
  if (filename === 'marq-lab.png' || filename === 'logo_original.png') {
    const buf = await sharp(srcPath).toBuffer();
    return { buffer: buf, width: origW, height: origH, focus: '50% 50%' };
  }

  // 1. Capa de Noiva Real (já em 4:3 nativo 717x538 após ensureCleanNoivaSource):
  if (filename === 'capa_noiva_real.jpg') {
    const buf = await sharp(srcPath)
      .modulate({ brightness: 1.05, saturation: 1.04 })
      .linear(1.07, -4)
      .sharpen({ sigma: 0.85 })
      .toBuffer();
    return { buffer: buf, width: origW, height: origH, focus: '50% 50%' };
  }

  // 2. Porta-Terno Real (960x1280 -> recorte 4:3 nativo 960x720 pegando cabide, ombros, visor e corpo):
  if (filename === 'porta_terno_real.jpg') {
    const cropW = origW;
    const cropH = Math.round(origW * 0.75); // 720
    const topOffset = Math.min(18, Math.max(0, origH - cropH));

    const buf = await sharp(srcPath)
      .extract({ left: 0, top: topOffset, width: cropW, height: cropH })
      .modulate({ brightness: 1.07, saturation: 1.04 })
      .linear(1.08, -4)
      .sharpen({ sigma: 0.85 })
      .toBuffer();

    return { buffer: buf, width: cropW, height: cropH, focus: '50% 50%' };
  }

  // 3. Detalhe de Porta-Terno (960x1280 -> recorte 4:3 nativo 800x600 focado no cursor do zíper e visor cristal):
  if (filename === 'porta_terno_detalhe_real.jpg') {
    const cropW = origW;
    const cropH = Math.round(origW * 0.75); // 720
    const topOffset = Math.min(Math.max(0, Math.round(origH * 0.14)), origH - cropH);

    const cropped = await sharp(srcPath)
      .extract({ left: 0, top: topOffset, width: cropW, height: cropH })
      .resize(800, 600)
      .modulate({ brightness: 1.05, saturation: 1.04 })
      .linear(1.07, -5)
      .sharpen({ sigma: 0.85 })
      .toBuffer();

    return { buffer: cropped, width: 800, height: 600, focus: '50% 50%' };
  }

  // 4. Informática Real (2592x1944 - já é 4:3 nativo):
  // Redimensiona master para 1600x1200 mantendo 100% da cena original sem bordas artificiais
  if (filename === 'capa_computador_real.jpg') {
    const masterW = 1600;
    const masterH = 1200;

    const buf = await sharp(srcPath)
      .resize(masterW, masterH, { fit: 'cover', position: 'center' })
      .modulate({ brightness: 1.04, saturation: 1.05 })
      .linear(1.07, -5)
      .sharpen({ sigma: 0.9 })
      .toBuffer();

    return { buffer: buf, width: masterW, height: masterH, focus: '50% 50%' };
  }

  // 5. Sacola TNT (500x375 - fundo branco):
  // Adiciona margem branca limpa de 6% para centralizar a sacola com as alças inteiras
  if (filename === 'sacola_tnt.jpg') {
    const canvasW = origW;
    const canvasH = Math.round(origW * 0.75);
    const fgW = Math.round(canvasW * 0.92);
    const fgH = Math.round(canvasH * 0.92);

    const fgBuffer = await sharp(srcPath)
      .resize(fgW, fgH, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .linear(1.05, -3)
      .sharpen({ sigma: 0.8 })
      .toBuffer();

    const composed = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .composite([{ input: fgBuffer, gravity: 'center' }])
      .jpeg({ quality: 95 })
      .toBuffer();

    return { buffer: composed, width: canvasW, height: canvasH, focus: '50% 50%' };
  }

  // 6. Capa Industrial Real e Arara de Vestuários (enquadramento 4:3 centralizado com atenção)
  if (filename === 'capa_industrial_real.jpg' || filename === 'arara_vestuarios.jpg') {
    const targetW = origW;
    const targetH = Math.round(origW * 0.75);

    if (targetH <= origH) {
      const buf = await sharp(srcPath)
        .resize(targetW, targetH, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .modulate({ brightness: 1.03, saturation: 1.05 })
        .linear(1.06, -4)
        .sharpen({ sigma: 0.85 })
        .toBuffer();
      return { buffer: buf, width: targetW, height: targetH, focus: '50% 50%' };
    } else {
      const cleanW = Math.round(origH * (4 / 3));
      const buf = await sharp(srcPath)
        .resize(cleanW, origH, {
          fit: 'cover',
          position: sharp.strategy.attention
        })
        .modulate({ brightness: 1.03, saturation: 1.05 })
        .linear(1.06, -4)
        .sharpen({ sigma: 0.85 })
        .toBuffer();
      return { buffer: buf, width: cleanW, height: origH, focus: '50% 50%' };
    }
  }

  // Demais imagens de apoio: preserva proporção com nitidez leve
  const defaultBuf = await sharp(srcPath)
    .sharpen({ sigma: 0.65 })
    .toBuffer();
  return { buffer: defaultBuf, width: origW, height: origH, focus: '50% 50%' };
}

async function processAll() {
  console.log('--- INICIANDO PROCESSAMENTO E CENTRALIZAÇÃO DE IMAGENS (4:3 NATIVO) ---');
  await ensureCleanNoivaSource();

  const manifest = {};
  const imageFiles = fs.readdirSync(srcImagesDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

  for (const filename of imageFiles) {
    const srcPath = path.join(srcImagesDir, filename);
    const parsed = path.parse(filename);
    const baseName = parsed.name;

    const { buffer: masterBuffer, width: masterW, height: masterH, focus } = await buildMasterBuffer(filename, srcPath);

    console.log(`\nProcessando: ${filename} -> Master (${masterW}x${masterH}, focus: ${focus})`);

    // Determina larguras responsivas sem upscaling acima do masterW
    const widthsToGen = TARGET_WIDTHS.filter(w => w < masterW);
    if (!widthsToGen.includes(masterW)) {
      widthsToGen.push(masterW);
    }
    widthsToGen.sort((a, b) => a - b);

    const sizesManifest = {};

    for (const w of widthsToGen) {
      const h = Math.round((w / masterW) * masterH);
      const suffix = `-${w}`;

      const resized = sharp(masterBuffer).resize(w, h, { fit: 'fill' });

      // 1. AVIF (qualidade 55)
      const avifName = `${baseName}${suffix}.avif`;
      const avifPath = path.join(pubImagesDir, avifName);
      await resized.clone().avif({ quality: 55, effort: 4 }).toFile(avifPath);
      const avifBytes = fs.statSync(avifPath).size;

      // 2. WebP (qualidade 82)
      const webpName = `${baseName}${suffix}.webp`;
      const webpPath = path.join(pubImagesDir, webpName);
      await resized.clone().webp({ quality: 82, effort: 4 }).toFile(webpPath);
      const webpBytes = fs.statSync(webpPath).size;

      // 3. JPG (qualidade 80)
      const jpgName = `${baseName}${suffix}.jpg`;
      const jpgPath = path.join(pubImagesDir, jpgName);
      await resized.clone().jpeg({ quality: 80, progressive: true }).toFile(jpgPath);
      const jpgBytes = fs.statSync(jpgPath).size;

      sizesManifest[w] = {
        width: w,
        height: h,
        avif: { file: avifName, bytes: avifBytes, kb: (avifBytes / 1024).toFixed(1) + ' KB' },
        webp: { file: webpName, bytes: webpBytes, kb: (webpBytes / 1024).toFixed(1) + ' KB' },
        jpg: { file: jpgName, bytes: jpgBytes, kb: (jpgBytes / 1024).toFixed(1) + ' KB' }
      };

      console.log(`  -> ${w}x${h}px: WebP ${(webpBytes / 1024).toFixed(1)} KB | AVIF ${(avifBytes / 1024).toFixed(1)} KB | JPG ${(jpgBytes / 1024).toFixed(1)} KB`);
    }

    // Cria versão canônica sem sufixo em public/assets/images/
    const defW = widthsToGen[widthsToGen.length - 1];
    fs.copyFileSync(path.join(pubImagesDir, `${baseName}-${defW}.webp`), path.join(pubImagesDir, `${baseName}.webp`));
    fs.copyFileSync(path.join(pubImagesDir, `${baseName}-${defW}.jpg`), path.join(pubImagesDir, `${baseName}.jpg`));
    fs.copyFileSync(path.join(pubImagesDir, `${baseName}-${defW}.avif`), path.join(pubImagesDir, `${baseName}.avif`));

    manifest[filename] = {
      base: `${baseName}.webp`,
      orig: filename,
      width: masterW,
      height: masterH,
      aspectRatio: (masterW / masterH).toFixed(3),
      focus: focus,
      sizes: sizesManifest,
      availableWidths: widthsToGen
    };
  }

  // Gera og-image (1200x630)
  console.log('\n--- Gerando og-image 1200x630 ---');
  const heroSrc = path.join(pubImagesDir, 'capa_computador_real.jpg');
  const ogJpgPath = path.join(pubImagesDir, 'og-image.jpg');
  const ogWebpPath = path.join(pubImagesDir, 'og-image.webp');

  const ogBuffer = await sharp(heroSrc)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
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

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n✓ Manifesto salvo em ${manifestPath}`);
  console.log('--- Processamento concluído com sucesso ---');
}

processAll().catch(e => {
  console.error('Erro no processamento:', e);
  process.exit(1);
});
