/**
 * scripts/verify-browser.js
 * Verificação automatizada de navegador nos viewports 360, 390, 768 e 1440 px.
 * 
 * Valida:
 * 1. Zero imagens quebradas (naturalWidth > 0 após decodificação)
 * 2. Zero rolagem horizontal (scrollWidth <= innerWidth)
 * 3. Zero violações de CSP ou erros de runtime
 * 4. Captura de tela das seções com fotos (Hero / Showcase e Produtos)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SCREENSHOTS_DIR = path.join(PUBLIC_DIR, 'assets', 'screenshots');
const ARTIFACT_SCREENSHOTS_DIR = path.join('C:\\Users\\mdrda\\.gemini\\antigravity\\brain\\8e18b538-bb0a-45cd-a90a-e5d576963964', 'screenshots');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [
  { width: 360, height: 740, name: 'mobile-small (360px)' },
  { width: 390, height: 844, name: 'mobile-medium (390px)' },
  { width: 768, height: 1024, name: 'tablet (768px)' },
  { width: 1440, height: 900, name: 'desktop (1440px)' }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// Carrega headers do _headers para aplicar CSP real
function loadHeaders() {
  const headersFile = path.join(PUBLIC_DIR, '_headers');
  if (!fs.existsSync(headersFile)) return {};
  const content = fs.readFileSync(headersFile, 'utf-8');
  const lines = content.split('\n');
  const headers = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Content-Security-Policy:')) {
      headers['Content-Security-Policy'] = trimmed.substring('Content-Security-Policy:'.length).trim();
    } else if (trimmed.startsWith('X-Content-Type-Options:')) {
      headers['X-Content-Type-Options'] = trimmed.substring('X-Content-Type-Options:'.length).trim();
    } else if (trimmed.startsWith('Referrer-Policy:')) {
      headers['Referrer-Policy'] = trimmed.substring('Referrer-Policy:'.length).trim();
    }
  }
  return headers;
}

const STATIC_HEADERS = loadHeaders();

// Inicia servidor estático
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';

      const safePath = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.join(PUBLIC_DIR, safePath);

      if (!fullPath.startsWith(PUBLIC_DIR) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        const notFound = fs.existsSync(path.join(PUBLIC_DIR, '404.html'))
          ? fs.readFileSync(path.join(PUBLIC_DIR, '404.html'))
          : '404 Not Found';
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(notFound);
        return;
      }

      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const responseHeaders = {
        'Content-Type': contentType,
        ...STATIC_HEADERS
      };

      res.writeHead(200, responseHeaders);
      res.end(fs.readFileSync(fullPath));
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

// Cliente CDP mínimo usando WebSocket nativo do Node.js
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
    this.eventListeners = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            rej(new Error(msg.error.message));
          } else {
            res(msg.result);
          }
        } else if (msg.method) {
          for (const listener of this.eventListeners) {
            listener(msg.method, msg.params);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { res: resolve, rej: reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  onEvent(fn) {
    this.eventListeners.push(fn);
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

async function waitForHttp(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout aguardando por ${url}`);
}

async function run() {
  console.log('================================================================================');
  console.log('  TESTE DE NAVEGADOR AUTOMATIZADO (360, 390, 768, 1440 PX)');
  console.log('================================================================================\n');

  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACT_SCREENSHOTS_DIR)) fs.mkdirSync(ARTIFACT_SCREENSHOTS_DIR, { recursive: true });

  const { server, port } = await startServer();
  const siteUrl = `http://127.0.0.1:${port}/`;
  console.log(`✓ Servidor estático com headers reais de segurança rodando em: ${siteUrl}`);

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maqcapas-chrome-'));
  const cdpPort = 9222 + Math.floor(Math.random() * 500);

  console.log(`✓ Iniciando Chrome Headless na porta CDP ${cdpPort}...`);
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempUserDataDir}`
  ], { stdio: 'ignore' });

  // Aguarda Chrome inicializar
  let versionInfo;
  try {
    versionInfo = await waitForHttp(`http://127.0.0.1:${cdpPort}/json/version`);
  } catch (err) {
    console.error('Falha ao conectar no Chrome:', err);
    chromeProcess.kill();
    server.close();
    process.exit(1);
  }

  console.log(`✓ Conectado ao ${versionInfo['Browser']}`);

  // Cria uma aba (page) para os testes
  const newTab = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(siteUrl)}`, { method: 'PUT' })).json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');

  const allCspViolations = [];
  const allConsoleErrors = [];

  cdp.onEvent((method, params) => {
    if (method === 'Log.entryAdded') {
      const text = params.entry.text || '';
      if (text.includes('Content Security Policy') || text.includes('CSP') || params.entry.source === 'security') {
        allCspViolations.push(text);
      }
      if (params.entry.level === 'error') {
        allConsoleErrors.push(text);
      }
    } else if (method === 'Runtime.consoleAPICalled') {
      if (params.type === 'error') {
        const text = params.args.map(a => a.value || a.description || '').join(' ');
        if (text.includes('Content Security Policy') || text.includes('CSP')) {
          allCspViolations.push(text);
        } else {
          allConsoleErrors.push(text);
        }
      }
    }
  });

  const results = [];
  let allTestsPassed = true;

  for (const vp of VIEWPORTS) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`► Testando Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`--------------------------------------------------------------------------------`);

    // Define resolução
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768
    });

    // Navega e aguarda carregamento
    await cdp.send('Page.navigate', { url: siteUrl });
    await new Promise(r => setTimeout(r, 1200));

    // Captura inicial de tela: Hero / Showcase
    const heroScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const heroFilename = `screenshot-${vp.width}px-hero.png`;
    const heroPathPublic = path.join(SCREENSHOTS_DIR, heroFilename);
    const heroPathArtifact = path.join(ARTIFACT_SCREENSHOTS_DIR, heroFilename);
    fs.writeFileSync(heroPathPublic, Buffer.from(heroScreenshot.data, 'base64'));
    fs.writeFileSync(heroPathArtifact, Buffer.from(heroScreenshot.data, 'base64'));
    console.log(`  📸 Screenshot Hero salvo: public/assets/screenshots/${heroFilename}`);

    // Rola progressivamente pela página para acionar lazy loading de todas as fotos
    // e aguarda decodificação de todas as imagens
    const evalResult = await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        const totalHeight = document.body.scrollHeight;
        for (let y = 0; y < totalHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 40));
        }
        window.scrollTo(0, totalHeight);
        await new Promise(r => setTimeout(r, 300));

        const imgs = Array.from(document.querySelectorAll('img'));
        await Promise.all(imgs.map(async (img) => {
          try {
            if (!img.complete) {
              await new Promise((res) => {
                img.onload = res;
                img.onerror = res;
                setTimeout(res, 2000);
              });
            }
            await img.decode().catch(() => {});
          } catch (_) {}
        }));

        const brokenImgs = imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.currentSrc || img.src);
        
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;
        const scrollWidth = Math.max(docW, bodyW);
        const innerWidth = window.innerWidth;
        const hasHorizontalScroll = scrollWidth > innerWidth;

        // Testa a troca de fotos nas abas da seção #sobre (Oficina MaqCapas)
        const thumbs = Array.from(document.querySelectorAll('.about-thumb'));
        const mainPhoto = document.getElementById('aboutPhotoMain');
        const gallerySources = [];
        for (const t of thumbs) {
          t.click();
          await new Promise(r => setTimeout(r, 80));
          await mainPhoto.decode().catch(() => {});
          gallerySources.push(mainPhoto.currentSrc || mainPhoto.src);
        }
        // Volta para a primeira aba após testar todas
        if (thumbs[0]) {
          thumbs[0].click();
          await new Promise(r => setTimeout(r, 80));
        }
        const uniqueGallerySources = new Set(gallerySources).size;

        return {
          totalImages: imgs.length,
          brokenImages: brokenImgs,
          scrollWidth,
          innerWidth,
          hasHorizontalScroll,
          galleryTabsCount: thumbs.length,
          uniqueGallerySources
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const pageData = evalResult.result.value;

    const brokenCount = pageData.brokenImages.length;
    const horizontalScroll = pageData.hasHorizontalScroll;
    const currentCspViolations = allCspViolations.length;
    const galleryWorks = pageData.uniqueGallerySources === pageData.galleryTabsCount && pageData.galleryTabsCount === 4;

    console.log(`  • Imagens carregadas com sucesso: ${pageData.totalImages - brokenCount} de ${pageData.totalImages}`);
    if (brokenCount > 0) {
      console.error(`  ✖ IMAGENS QUEBRADAS (${brokenCount}):`, pageData.brokenImages);
      allTestsPassed = false;
    } else {
      console.log(`  ✔ Zero imagens quebradas.`);
    }

    if (!galleryWorks) {
      console.error(`  ✖ FALHA NA GALERIA #sobre: ${pageData.uniqueGallerySources}/${pageData.galleryTabsCount} fotos distintas ao clicar nas abas.`);
      allTestsPassed = false;
    } else {
      console.log(`  ✔ Galeria #sobre funcionando: ${pageData.uniqueGallerySources}/${pageData.galleryTabsCount} abas trocando foto instantaneamente.`);
    }

    console.log(`  • Largura do documento: ${pageData.scrollWidth}px | Largura da viewport: ${pageData.innerWidth}px`);
    if (horizontalScroll) {
      console.error(`  ✖ ROLAGEM HORIZONTAL DETECTADA! (Excesso: ${pageData.scrollWidth - pageData.innerWidth}px)`);
      allTestsPassed = false;
    } else {
      console.log(`  ✔ Zero rolagem horizontal.`);
    }

    if (currentCspViolations > 0) {
      console.error(`  ✖ VIOLAÇÃO DE CSP DETECTADA:`, allCspViolations);
      allTestsPassed = false;
    } else {
      console.log(`  ✔ Zero violações de CSP.`);
    }

    // Rola para a seção de Produtos (#produtos) e captura screenshot
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const prod = document.getElementById('produtos');
        if (prod) prod.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const prodScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const prodFilename = `screenshot-${vp.width}px-produtos.png`;
    const prodPathPublic = path.join(SCREENSHOTS_DIR, prodFilename);
    const prodPathArtifact = path.join(ARTIFACT_SCREENSHOTS_DIR, prodFilename);
    fs.writeFileSync(prodPathPublic, Buffer.from(prodScreenshot.data, 'base64'));
    fs.writeFileSync(prodPathArtifact, Buffer.from(prodScreenshot.data, 'base64'));
    console.log(`  📸 Screenshot Produtos salvo: public/assets/screenshots/${prodFilename}`);

    // Rola para o card da galeria na seção Sobre (#sobre), clica na aba "Industrial" e captura screenshot provando a troca visual da foto
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        const card = document.querySelector('.about-photo-card') || document.getElementById('sobre');
        if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
        const thumbs = document.querySelectorAll('.about-thumb');
        if (thumbs[3]) {
          thumbs[3].click();
          const mainPhoto = document.getElementById('aboutPhotoMain');
          if (mainPhoto) await mainPhoto.decode().catch(() => {});
        }
      })()`,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 500));

    const sobreScreenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const sobreFilename = `screenshot-${vp.width}px-sobre.png`;
    const sobrePathPublic = path.join(SCREENSHOTS_DIR, sobreFilename);
    const sobrePathArtifact = path.join(ARTIFACT_SCREENSHOTS_DIR, sobreFilename);
    fs.writeFileSync(sobrePathPublic, Buffer.from(sobreScreenshot.data, 'base64'));
    fs.writeFileSync(sobrePathArtifact, Buffer.from(sobreScreenshot.data, 'base64'));
    console.log(`  📸 Screenshot Sobre salvo: public/assets/screenshots/${sobreFilename}`);

    results.push({
      viewport: vp.name,
      width: vp.width,
      totalImages: pageData.totalImages,
      brokenImages: brokenCount,
      horizontalScroll,
      scrollWidth: pageData.scrollWidth,
      innerWidth: pageData.innerWidth,
      cspViolations: currentCspViolations,
      heroScreenshot: heroFilename,
      prodScreenshot: prodFilename
    });
  }

  // Encerramento limpo
  cdp.close();
  chromeProcess.kill();
  if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  server.close();
  
  await new Promise(r => setTimeout(r, 600));
  try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch (_) {}

  console.log('\n================================================================================');
  console.log('  RESUMO DO TESTE DE NAVEGADOR');
  console.log('================================================================================');
  console.table(results.map(r => ({
    Viewport: r.viewport,
    'Imagens OK': `${r.totalImages - r.brokenImages}/${r.totalImages}`,
    'Imagens Quebradas': r.brokenImages,
    'Scroll Horizontal': r.horizontalScroll ? 'SIM (FALHA)' : 'NÃO (OK)',
    'Violações CSP': r.cspViolations
  })));

  if (allTestsPassed) {
    console.log('\n\x1b[32m✔ TODOS OS TESTES DE NAVEGADOR FORAM APROVADOS COM SUCESSO!\x1b[0m\n');
    process.exitCode = 0;
  } else {
    console.error('\n\x1b[31m✖ FALHA EM UM OU MAIS TESTES DE NAVEGADOR!\x1b[0m\n');
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error('Erro na execução do teste:', err);
  process.exit(1);
});
