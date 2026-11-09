/**
 * scripts/evaluate-photos.js
 * Avaliação técnica e seleção das melhores fotos reais para o catálogo MaqCapas.
 * Calcula nitidez (variância do Laplaciano), resolução, exposição e gera folha de contato.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const assetsImages = path.join(rootDir, 'assets', 'images');
const assetsOriginal = path.join(rootDir, 'assets', 'original');
const parentDir = path.resolve(rootDir, '..');

// Lista de candidatos por produto
const candidates = {
  informatica: [
    {
      name: 'capa_computador_real.jpg',
      path: path.join(assetsImages, 'capa_computador_real.jpg'),
      label: 'Oficina / Conjunto Completo'
    }
  ],
  noiva: [
    {
      name: 'capa_noiva_real.jpg',
      path: path.join(assetsImages, 'capa_noiva_real.jpg'),
      label: 'Vestido de Noiva em Uso Real (WhatsApp)'
    },
    {
      name: 'capa_noiva_clean_real.png',
      path: path.join(assetsImages, 'capa_noiva_clean_real.png'),
      label: 'Recorte de Vestido Branco (img_3)'
    },
    {
      name: 'arara_vestuarios.jpg',
      path: path.join(assetsImages, 'arara_vestuarios.jpg'),
      label: 'Arara com Múltiplas Capas de Vestuário'
    }
  ],
  porta_terno: [
    {
      name: 'porta_terno_real.jpg',
      path: path.join(assetsImages, 'porta_terno_real.jpg'),
      label: 'Porta-Ternos Executivo Frontal Montado'
    },
    {
      name: 'porta_terno_detalhe_real.jpg',
      path: path.join(assetsImages, 'porta_terno_detalhe_real.jpg'),
      label: 'Porta-Ternos Close-up Zíper e Tecido'
    }
  ],
  industrial: [
    {
      name: 'capa_industrial_real.jpg',
      path: path.join(assetsImages, 'capa_industrial_real.jpg'),
      label: 'Capa Industrial para Máquina Pesada'
    }
  ],
  embalagens: [
    {
      name: 'embalagem_sapatos.png',
      path: path.join(assetsImages, 'embalagem_sapatos.png'),
      label: 'Saco Protetor para Calçados em TNT e Cristal'
    }
  ],
  sacolas: [
    {
      name: 'sacola_tnt.jpg',
      path: path.join(assetsImages, 'sacola_tnt.jpg'),
      label: 'Sacola Ecológica Promocional em TNT'
    }
  ]
};

async function computeMetrics(filePath) {
  const meta = await sharp(filePath).metadata();
  const raw = await sharp(filePath).greyscale().raw().toBuffer();
  
  const n = raw.length;
  let sum = 0;
  let lowClip = 0;
  let highClip = 0;
  for (let i = 0; i < n; i++) {
    const v = raw[i];
    sum += v;
    if (v <= 5) lowClip++;
    if (v >= 250) highClip++;
  }
  const meanLum = sum / n;

  // Laplaciano 3x3 kernel
  const lapBuf = await sharp(filePath)
    .greyscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
    })
    .raw()
    .toBuffer();

  let lapSum = 0;
  for (let i = 0; i < lapBuf.length; i++) {
    lapSum += lapBuf[i];
  }
  const lapMean = lapSum / lapBuf.length;

  let lapVar = 0;
  for (let i = 0; i < lapBuf.length; i++) {
    const d = lapBuf[i] - lapMean;
    lapVar += d * d;
  }
  lapVar = lapVar / lapBuf.length;

  const megapixels = (meta.width * meta.height) / 1000000;

  return {
    width: meta.width,
    height: meta.height,
    megapixels: megapixels.toFixed(2),
    aspectRatio: (meta.width / meta.height).toFixed(3),
    lapVar: parseFloat(lapVar.toFixed(1)),
    meanLum: parseFloat(meanLum.toFixed(1)),
    lowClipPct: ((lowClip / n) * 100).toFixed(1) + '%',
    highClipPct: ((highClip / n) * 100).toFixed(1) + '%'
  };
}

async function run() {
  console.log('--- AVALIAÇÃO TÉCNICA DAS FOTOS REAIS CANDIDATAS ---');
  const results = {};

  for (const [prod, list] of Object.entries(candidates)) {
    console.log(`\nProduto: [${prod.toUpperCase()}]`);
    results[prod] = [];
    for (const item of list) {
      if (!fs.existsSync(item.path)) {
        console.warn(`Arquivo não encontrado: ${item.path}`);
        continue;
      }
      const m = await computeMetrics(item.path);
      
      // Cálculo de nota ponderada (0 a 10):
      // - Resolução (peso 2.5): ideal >= 1 MP
      // - Nitidez Laplaciana (peso 3.0): var >= 25
      // - Exposição (peso 2.5): lum entre 100 e 180 sem clipping severo
      // - Enquadramento (peso 2.0): proporção e clareza do produto
      let resScore = Math.min(10, Math.max(4, m.megapixels * 3.5));
      let lapScore = Math.min(10, Math.max(3, Math.log10(m.lapVar + 1) * 3.8));
      let expScore = 10 - Math.min(5, Math.abs(m.meanLum - 140) / 15);
      let enqScore = 9.0;
      if (item.name.includes('detalhe')) enqScore = 8.5; // close-up é ótimo para galeria, não como produto inteiro
      if (item.name.includes('arara')) enqScore = 8.0;

      const finalScore = (resScore * 0.25 + lapScore * 0.30 + expScore * 0.25 + enqScore * 0.20).toFixed(1);

      const entry = {
        name: item.name,
        path: item.path,
        label: item.label,
        metrics: m,
        score: parseFloat(finalScore)
      };
      results[prod].push(entry);
      console.log(`  - ${item.name} | Res: ${m.width}x${m.height} (${m.megapixels} MP) | LapVar: ${m.lapVar} | Lum: ${m.meanLum} | Nota: ${finalScore}`);
    }
  }

  // Seleciona a melhor foto para cada produto
  const chosen = {
    informatica: results.informatica[0],
    noiva: results.noiva.find(r => r.name === 'capa_noiva_real.jpg') || results.noiva[0],
    porta_terno: results.porta_terno.find(r => r.name === 'porta_terno_real.jpg') || results.porta_terno[0],
    industrial: results.industrial[0],
    embalagens: results.embalagens[0],
    sacolas: results.sacolas[0]
  };

  console.log('\n--- FOTOS ESCOLHIDAS COMO PRINCIPAIS ---');
  for (const [prod, c] of Object.entries(chosen)) {
    console.log(`${prod}: ${c.name} (Nota: ${c.score})`);
  }

  // Gera folha de contato PNG (6 fotos em grid 3 colunas x 2 linhas)
  await generateContactSheet(chosen);

  return { results, chosen };
}

async function generateContactSheet(chosen) {
  const cellW = 400;
  const cellH = 360;
  const cols = 3;
  const rows = 2;
  const sheetW = cols * cellW;
  const sheetH = rows * cellH;

  const entries = [
    { prod: 'Informática & TI', item: chosen.informatica, focus: '50% 50%' },
    { prod: 'Vestido de Noiva', item: chosen.noiva, focus: '50% 40%' },
    { prod: 'Porta-Ternos', item: chosen.porta_terno, focus: '50% 35%' },
    { prod: 'Indústria & Máquinas', item: chosen.industrial, focus: '50% 50%' },
    { prod: 'Embalagens / Calçados', item: chosen.embalagens, focus: '50% 50%' },
    { prod: 'Sacolas em TNT', item: chosen.sacolas, focus: '50% 50%' }
  ];

  const composites = [];

  for (let i = 0; i < entries.length; i++) {
    const { prod, item, focus } = entries[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellW;
    const y = row * cellH;

    // Redimensiona a foto para 380x260 com recorte inteligente
    const imgBuf = await sharp(item.path)
      .resize(380, 260, {
        fit: 'cover',
        position: sharp.strategy.attention
      })
      .sharpen({ sigma: 0.6 })
      .toBuffer();

    composites.push({
      input: imgBuf,
      top: y + 20,
      left: x + 10
    });

    // Legenda da célula em SVG
    const safeProd = prod.toUpperCase().replace(/&/g, 'E');
    const svgOverlay = Buffer.from(`
      <svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="285" width="380" height="65" rx="6" fill="#181614" />
        <text x="25" y="308" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#d4a373">${safeProd}</text>
        <text x="25" y="326" font-family="Arial, sans-serif" font-size="11" fill="#f0ece4">${item.name} (${item.metrics.width}x${item.metrics.height})</text>
        <text x="25" y="342" font-family="Arial, sans-serif" font-size="10" fill="#a8a29e">LapVar: ${item.metrics.lapVar} | Lum: ${item.metrics.meanLum} | Nota: ${item.score}/10 | Foco: ${focus}</text>
      </svg>
    `);

    composites.push({
      input: svgOverlay,
      top: y,
      left: x
    });
  }

  const outDir = path.join(rootDir, 'public', 'assets', 'images');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const sheetPath = path.join(outDir, 'folha_de_contato_escolhidas.png');

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 12, g: 11, b: 9, alpha: 1 }
    }
  })
    .composite(composites)
    .png()
    .toFile(sheetPath);

  console.log(`\n✓ Folha de contato gerada com sucesso em: ${sheetPath}`);
}

run();
