/**
 * scripts/process-images.js
 * Pipeline de processamento e enquadramento completo (cabide + capa inteira) das fotos reais:
 * - Preserva 100% da altura vertical (do gancho do cabide até a barra inferior) das 3 fotos novas
 * - Estende suavemente a parede original nas laterais para compor o quadro 4:3 sem cortar o produto
 * - Aplica nitidez calibrada (sharpen) e realce suave de iluminação/contraste
 * - Gera versões responsivas: 480, 800, 1200 e 1600 px em AVIF, WebP e JPG
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

// Remove arquivos antigos/excluídos
for (const dir of [srcImagesDir, pubImagesDir]) {
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (
        f.startsWith('embalagem_sapatos') ||
        f.startsWith('capa_noiva_clean_real') ||
        f.startsWith('sacola_tnt') ||
        f.startsWith('test_')
      ) {
        try { fs.unlinkSync(path.join(dir, f)); } catch (_) {}
      }
    }
  }
}

const TARGET_WIDTHS = [480, 800, 1200, 1600];

/**
 * Compõe uma foto vertical (960x1280) em quadro 4:3 (1600x1200) mantendo 100% da altura
 * (cabide no topo + capa inteira até a base) e estendendo a parede real nas laterais.
 */
async function composeFullHeightVerticalPhoto(srcPath, brightness = 1.05, isNarrow = false) {
  const meta = await sharp(srcPath).metadata();
  const origW = meta.width;   // 960
  const origH = meta.height;  // 1280

  // Recorta a faixa central contendo 100% do produto + parede uniforme (sem canto de porta ou quina de parede)
  const trimLeft = isNarrow ? 120 : 60;
  const trimRight = isNarrow ? 155 : 60;
  const centerW = origW - trimLeft - trimRight;
  const canvasH = origH;             // 1280 (100% da altura original: cabide ao fim da capa)
  const canvasW = Math.round(canvasH * (4 / 3)); // 1707 (proporção 4:3)
  const sideW = Math.ceil((canvasW - centerW) / 2) + 8;

  // Extrai faixa da parede esquerda e estende suavemente mantendo o gradiente vertical exato da parede
  const leftWall = await sharp(srcPath)
    .extract({ left: trimLeft, top: 0, width: 32, height: origH })
    .resize(sideW, canvasH, { fit: 'fill' })
    .blur(18)
    .toBuffer();

  // Extrai faixa da parede direita e estende suavemente mantendo o gradiente vertical exato da parede
  const rightWall = await sharp(srcPath)
    .extract({ left: origW - trimRight - 32, top: 0, width: 32, height: origH })
    .resize(sideW, canvasH, { fit: 'fill' })
    .blur(18)
    .toBuffer();

  // Extrai o centro completo (100% da altura, cabide inteiro + capa inteira)
  const centerSubject = await sharp(srcPath)
    .extract({ left: trimLeft, top: 0, width: centerW, height: origH })
    .toBuffer();

  const rawComposed = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 3,
      background: { r: 215, g: 212, b: 205 }
    }
  })
    .composite([
      { input: leftWall, left: 0, top: 0 },
      { input: rightWall, left: canvasW - sideW, top: 0 },
      { input: centerSubject, left: Math.round((canvasW - centerW) / 2), top: 0 }
    ])
    .jpeg({ quality: 96 })
    .toBuffer();

  const composed = await sharp(rawComposed)
    .resize(1600, 1200, { fit: 'fill' })
    .modulate({ brightness, saturation: 1.03 })
    .linear(1.06, -4)
    .sharpen({ sigma: 0.85 })
    .toBuffer();

  return { buffer: composed, width: 1600, height: 1200, focus: '50% 50%' };
}

/**
 * Cria um buffer master 4:3 centralizado e aprimorado para cada imagem
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

  // 1. As 3 fotos novas de vestuário (Porta-Terno, Capa Branca Noiva, Capa Longa Gilka):
  // Mantém 100% da altura (cabide + capa inteira) em quadro 4:3 com parede contínua
  if (
    filename === 'porta_terno_real.jpg' ||
    filename === 'capa_noiva_real.jpg' ||
    filename === 'porta_terno_detalhe_real.jpg'
  ) {
    const boost = filename === 'capa_noiva_real.jpg' ? 1.08 : 1.05;
    const isNarrow = filename !== 'porta_terno_real.jpg';
    return await composeFullHeightVerticalPhoto(srcPath, boost, isNarrow);
  }

  // 2. Informática Real (2592x1944 - já é 4:3 nativo):
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

  // 3. Capa Industrial Real (já restaurada em HD 4:3): preserva fidelidade natural
  if (filename === 'capa_industrial_real.jpg') {
    const cleanW = 1200;
    const cleanH = 900;
    const buf = await sharp(srcPath)
      .resize(cleanW, cleanH, { fit: 'cover', position: 'center' })
      .sharpen({ sigma: 0.65 })
      .toBuffer();
    return { buffer: buf, width: cleanW, height: cleanH, focus: '50% 50%' };
  }

  // 4. Arara de Vestuários (enquadramento 4:3 centralizado)
  if (filename === 'arara_vestuarios.jpg') {
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
  console.log('--- INICIANDO PROCESSAMENTO DE IMAGENS (CABIDE + CAPA INTEIRA VISÍVEIS) ---');

  const manifest = {};
  const imageFiles = fs.readdirSync(srcImagesDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

  for (const filename of imageFiles) {
    const srcPath = path.join(srcImagesDir, filename);
    const parsed = path.parse(filename);
    const baseName = parsed.name;

    const { buffer: masterBuffer, width: masterW, height: masterH, focus } = await buildMasterBuffer(filename, srcPath);

    console.log(`\nProcessando: ${filename} -> Master (${masterW}x${masterH}, focus: ${focus})`);

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
      <text x="80" y="530" font-family="'Inter', sans-serif" font-weight="bold" font-size="22" fill="#f0ece4">Curitiba / PR • Fabricação Própria Sob Medida</text>
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

  // Gera Favicons a partir de assets/images/logo_original.png na raiz do projeto, em public/ e em public/assets/icons/
  console.log('\n--- Gerando Favicons a partir de logo_original.png (favicon.ico 48x48, favicon-48x48.png, apple-touch-icon.png 180x180, icon-512.png) ---');
  const logoSrcPath = path.join(srcImagesDir, 'logo_original.png');
  const transparentBg = { r: 255, g: 255, b: 255, alpha: 0 };

  const png32Buf = await sharp(logoSrcPath).resize(32, 32, { fit: 'contain', background: transparentBg }).png().toBuffer();
  const png48Buf = await sharp(logoSrcPath).resize(48, 48, { fit: 'contain', background: transparentBg }).png().toBuffer();
  const png96Buf = await sharp(logoSrcPath).resize(96, 96, { fit: 'contain', background: transparentBg }).png().toBuffer();
  const png180Buf = await sharp(logoSrcPath).resize(180, 180, { fit: 'contain', background: transparentBg }).png().toBuffer();
  const png192Buf = await sharp(logoSrcPath).resize(192, 192, { fit: 'contain', background: transparentBg }).png().toBuffer();
  const png512Buf = await sharp(logoSrcPath).resize(512, 512, { fit: 'contain', background: transparentBg }).png().toBuffer();

  // Cria favicon.ico binário (48x48) a partir de png48Buf
  const icoHeader = Buffer.alloc(22);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type: 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Image count: 1
  icoHeader.writeUInt8(48, 6);   // Width: 48px
  icoHeader.writeUInt8(48, 7);   // Height: 48px
  icoHeader.writeUInt8(0, 8);    // Palette
  icoHeader.writeUInt8(0, 9);    // Reserved
  icoHeader.writeUInt16LE(1, 10); // Color planes
  icoHeader.writeUInt16LE(32, 12); // Bits per pixel
  icoHeader.writeUInt32LE(png48Buf.length, 14); // Size of PNG data
  icoHeader.writeUInt32LE(22, 18); // Offset of PNG data
  const icoBuffer = Buffer.concat([icoHeader, png48Buf]);

  // Salva na raiz do projeto (rootDir), na raiz pública (public/) e em public/assets/icons/
  const targetDirs = [rootDir, path.join(rootDir, 'public'), pubIconsDir];
  for (const dir of targetDirs) {
    fs.writeFileSync(path.join(dir, 'favicon.ico'), icoBuffer);
    fs.writeFileSync(path.join(dir, 'favicon-48x48.png'), png48Buf);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), png180Buf);
    fs.writeFileSync(path.join(dir, 'icon-512.png'), png512Buf);
  }

  // Mantém também os tamanhos auxiliares em public/assets/icons/
  fs.writeFileSync(path.join(pubIconsDir, 'favicon-32x32.png'), png32Buf);
  fs.writeFileSync(path.join(pubIconsDir, 'favicon-96x96.png'), png96Buf);
  fs.writeFileSync(path.join(pubIconsDir, 'favicon-192x192.png'), png192Buf);
  const logoBase64 = png192Buf.toString('base64');
  const iconSvg = Buffer.from(`<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,${logoBase64}" width="192" height="192"/></svg>`);
  fs.writeFileSync(path.join(pubIconsDir, 'favicon.svg'), iconSvg);

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n✓ Manifesto salvo em ${manifestPath}`);
  console.log('--- Processamento concluído com sucesso ---');
}

processAll().catch(e => {
  console.error('Erro no processamento:', e);
  process.exit(1);
});
