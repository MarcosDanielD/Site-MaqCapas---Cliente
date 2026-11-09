const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');
const srcImgDir = path.join(rootDir, 'assets/images');
const outImgDir = path.join(rootDir, 'public/assets/images');
const outIconsDir = path.join(rootDir, 'public/assets/icons');

fs.mkdirSync(outImgDir, { recursive: true });
fs.mkdirSync(outIconsDir, { recursive: true });

async function run() {
  console.log('--- Processando Imagens do Site MaqCapas ---');

  // 1. Processar novas fotos da raiz do projeto
  const waGownPath = path.join(parentDir, 'WhatsApp Image 2026-11-06 at 18.11.54.jpeg');
  const waSuitPath = path.join(parentDir, 'WhatsApp Image 2026-11-06 at 18.11.55.jpeg');

  if (fs.existsSync(waGownPath)) {
    // Crop limpo sem barra de status nem navegação
    await sharp(waGownPath)
      .extract({ left: 0, top: 80, width: 717, height: 1180 })
      .jpeg({ quality: 90 })
      .toFile(path.join(srcImgDir, 'capa_noiva_real.jpg'));
    console.log('✔ Nova foto processada: capa_noiva_real.jpg');
  }

  if (fs.existsSync(waSuitPath)) {
    await sharp(waSuitPath)
      .jpeg({ quality: 90 })
      .toFile(path.join(srcImgDir, 'porta_terno_detalhe_real.jpg'));
    console.log('✔ Nova foto processada: porta_terno_detalhe_real.jpg');
  }

  // Extrair versão recortada da capa de vestido de noiva limpa de img_3.png se existir
  const img3Path = path.join(rootDir, 'assets/original/img_3.png');
  if (fs.existsSync(img3Path)) {
    await sharp(img3Path)
      .extract({ left: 454, top: 0, width: 454, height: 700 })
      .png()
      .toFile(path.join(srcImgDir, 'capa_noiva_clean_real.png'));
    console.log('✔ Capa noiva limpa extraída de img_3.png');
  }

  // 2. Criar og-image 1200x630 profissional
  const ogBg = path.join(srcImgDir, 'capa_computador_real.jpg');
  if (fs.existsSync(ogBg)) {
    const svgOverlay = Buffer.from(`
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#181614" stop-opacity="0.88"/>
            <stop offset="60%" stop-color="#181614" stop-opacity="0.75"/>
            <stop offset="100%" stop-color="#181614" stop-opacity="0.92"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)" />
        <rect x="70" y="70" width="1060" height="490" fill="none" stroke="#d4a373" stroke-width="2" stroke-opacity="0.4" rx="16"/>
        <text x="120" y="220" font-family="'Outfit', 'Inter', sans-serif" font-size="64" font-weight="800" fill="#ffffff" letter-spacing="4">MAQCAPAS</text>
        <text x="120" y="275" font-family="'Inter', sans-serif" font-size="20" font-weight="600" fill="#d4a373" letter-spacing="3">COMÉRCIO DE CAPAS SOB MEDIDA &#8226; DESDE 1987</text>
        <line x1="120" y1="315" x2="420" y2="315" stroke="#d4a373" stroke-width="3" />
        <text x="120" y="380" font-family="'Inter', sans-serif" font-size="34" font-weight="700" fill="#f5f5f5">Capas de Proteção Técnica e Têxtil</text>
        <text x="120" y="430" font-family="'Inter', sans-serif" font-size="24" fill="#d1d5db">Informática &#8226; Noivas &#8226; Alfaiataria &#8226; Máquinas Industriais</text>
        <text x="120" y="500" font-family="'Inter', sans-serif" font-size="22" font-weight="600" fill="#d4a373">Curitiba/PR &#8226; Envio para Todo o Brasil &#8226; WhatsApp (41) 99934-3814</text>
      </svg>
    `);

    await sharp(ogBg)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .jpeg({ quality: 92 })
      .toFile(path.join(outImgDir, 'og-image.jpg'));

    await sharp(path.join(outImgDir, 'og-image.jpg'))
      .webp({ quality: 90 })
      .toFile(path.join(outImgDir, 'og-image.webp'));

    console.log('✔ og-image.jpg e og-image.webp criados (1200x630)');
  }

  // 3. Criar Favicon SVG e ICO
  const faviconSvg = `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#181614"/>
      <polygon points="32,8 56,20 8,20" fill="#d4a373" stroke="#d4a373" stroke-width="1.5"/>
      <rect x="8" y="20" width="48" height="24" fill="#ffffff"/>
      <polygon points="32,56 56,44 8,44" fill="#d4a373" stroke="#d4a373" stroke-width="1.5"/>
      <text x="32" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#181614" text-anchor="middle" letter-spacing="1">M</text>
    </svg>
  `.trim();

  fs.writeFileSync(path.join(outIconsDir, 'favicon.svg'), faviconSvg, 'utf8');
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(outIconsDir, 'favicon-32x32.png'));
  await sharp(Buffer.from(faviconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(outIconsDir, 'apple-touch-icon.png'));
  console.log('✔ Favicons SVG e PNG criados');

  // Copiar marq-lab.png
  const marqLabPath = path.join(rootDir, 'assets/marq-lab.png');
  if (fs.existsSync(marqLabPath)) {
    fs.copyFileSync(marqLabPath, path.join(rootDir, 'public/assets/marq-lab.png'));
    fs.copyFileSync(marqLabPath, path.join(outImgDir, 'marq-lab.png'));
    console.log('✔ marq-lab.png copiado');
  }

  // 4. Converter todas as imagens de srcImgDir para public/assets/images em WebP e JPEG/PNG
  const files = fs.readdirSync(srcImgDir);
  const manifest = {};

  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
    const base = path.basename(f, ext);
    const inPath = path.join(srcImgDir, f);
    const destOrig = path.join(outImgDir, f);
    const destWebp = path.join(outImgDir, `${base}.webp`);

    // Copiar original para fallback
    fs.copyFileSync(inPath, destOrig);

    // Gerar WebP
    const meta = await sharp(inPath).metadata();
    await sharp(inPath).webp({ quality: 84 }).toFile(destWebp);

    manifest[f] = {
      base: `${base}.webp`,
      orig: f,
      width: meta.width,
      height: meta.height,
      aspectRatio: (meta.width / meta.height).toFixed(3)
    };
    manifest[`${base}.webp`] = manifest[f];
    console.log(`✔ Otimizado: ${f} -> ${base}.webp (${meta.width}x${meta.height})`);
  }

  // Medir og-image
  if (fs.existsSync(path.join(outImgDir, 'og-image.jpg'))) {
    const ogMeta = await sharp(path.join(outImgDir, 'og-image.jpg')).metadata();
    manifest['og-image.jpg'] = { width: ogMeta.width, height: ogMeta.height };
    manifest['og-image.webp'] = { width: ogMeta.width, height: ogMeta.height };
  }

  fs.writeFileSync(path.join(rootDir, 'scripts/images-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✔ images-manifest.json gerado com dimensões exatas de todas as imagens.');
}

run().catch(err => {
  console.error('Falha no processamento de imagens:', err);
  process.exit(1);
});
