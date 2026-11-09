/**
 * scripts/test-smoke-local.js
 * Inicia servidor local que simula os headers de _headers e executa smoke.js.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// Parse dos headers de public/_headers
function getSecurityHeaders() {
  const headersPath = path.join(publicDir, '_headers');
  const headers = {};
  if (fs.existsSync(headersPath)) {
    const lines = fs.readFileSync(headersPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('/*')) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        headers[key] = val;
      }
    }
  }
  return headers;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const fullPath = path.join(publicDir, path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, ''));

  if (!fullPath.startsWith(publicDir) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    const html404 = fs.existsSync(path.join(publicDir, '404.html'))
      ? fs.readFileSync(path.join(publicDir, '404.html'))
      : '404 Not Found';
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html404);
    return;
  }

  const secHeaders = getSecurityHeaders();
  const ext = path.extname(fullPath).toLowerCase();
  secHeaders['Content-Type'] = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, secHeaders);
  res.end(fs.readFileSync(fullPath));
});

server.listen(8787, '127.0.0.1', () => {
  console.log('Servidor de teste de fumaça rodando em http://127.0.0.1:8787');
  const child = spawn('node', [path.join(__dirname, 'smoke.js'), 'http://127.0.0.1:8787'], {
    stdio: 'inherit'
  });

  child.on('close', (code) => {
    server.close(() => {
      process.exitCode = code;
    });
  });
});
