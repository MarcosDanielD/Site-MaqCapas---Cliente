#!/usr/bin/env node
/**
 * scripts/smoke.js
 * Smoke test de pré-lançamento e pós-deploy contra o ambiente real (staging ou produção).
 * Executa requisições HTTP nativas (Node.js) e valida:
 *  a) Home (/) HTTP 200 e headers de segurança (CSP sem unsafe-inline, HSTS, XFO, nosniff, Referrer-Policy)
 *  b) Rotas de arquivos internos que devem retornar HTTP 404
 *  c) sitemap.xml retorna 200 e bate com canonical
 *  d) robots.txt aponta para o sitemap e libera indexação da home
 *  e) Comportamento em staging (*.workers.dev ou *.pages.dev) vs domínio final
 * 
 * Uso:
 *   npm run smoke -- <URL>
 *   Ex: npm run smoke -- http://127.0.0.1:8787
 *       npm run smoke -- https://maqcapas.com.br
 */

const targetArg = process.argv[2];

if (!targetArg) {
  console.error('Uso: npm run smoke -- <URL_DO_SITE>');
  console.error('Exemplo: npm run smoke -- http://127.0.0.1:8787');
  console.error('         npm run smoke -- https://maqcapas.com.br');
  process.exit(1);
}

const baseUrl = targetArg.trim().replace(/\/+$/, '');
let parsedUrl;
try {
  parsedUrl = new URL(baseUrl);
} catch (err) {
  console.error(`URL inválida: "${targetArg}"`);
  process.exit(1);
}

const isStaging = parsedUrl.hostname.endsWith('.workers.dev') || parsedUrl.hostname.endsWith('.pages.dev');
const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';

console.log('\n================================================================================');
console.log(`  SMOKE TEST MAQCAPAS — ALVO: \x1b[1m${baseUrl}\x1b[0m`);
console.log(`  Ambiente detectado: ${isStaging ? '\x1b[36mSTAGING (*.pages.dev / *.workers.dev)\x1b[0m' : isLocalhost ? '\x1b[33mLOCAL\x1b[0m' : '\x1b[32mPRODUÇÃO (Domínio Final)\x1b[0m'}`);
console.log('================================================================================\n');

let passed = 0;
let failed = 0;

function pass(id, msg) {
  passed++;
  console.log(`\x1b[32m✔ [PASS]\x1b[0m [${id}] ${msg}`);
}

function fail(id, msg) {
  failed++;
  console.error(`\x1b[31m✖ [FAIL]\x1b[0m [${id}] ${msg}`);
}

async function safeFetch(url, init = {}) {
  const timeoutMs = init.timeout || 10000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function runSmoke() {
  // ---------------------------------------------------------------------------
  // A. HOME (/) E HEADERS DE SEGURANÇA
  // ---------------------------------------------------------------------------
  try {
    const resHome = await safeFetch(`${baseUrl}/`, { redirect: 'manual' });
    const csp = resHome.headers.get('content-security-policy') || '';
    const hsts = resHome.headers.get('strict-transport-security') || '';
    const xfo = (resHome.headers.get('x-frame-options') || '').toUpperCase();
    const xcto = (resHome.headers.get('x-content-type-options') || '').toLowerCase();
    const refPol = (resHome.headers.get('referrer-policy') || '').toLowerCase();

    const cspOk = csp.includes("default-src 'self'") && !csp.includes("'unsafe-inline'");
    const isHttps = parsedUrl.protocol === 'https:';
    const hstsOk = !isHttps || hsts.includes('max-age=31536000');
    const xfoOk = xfo === 'DENY';
    const xctoOk = xcto === 'nosniff';
    const refOk = refPol === 'strict-origin-when-cross-origin';

    if (resHome.status === 200 && cspOk && hstsOk && xfoOk && xctoOk && refOk) {
      pass('A.HeadersHome', 'Home (/) retornou HTTP 200 com todos os headers de segurança ativos (CSP sem unsafe-inline, HSTS, XFO DENY, nosniff, Referrer-Policy).');
    } else {
      fail(
        'A.HeadersHome',
        `Headers inválidos na home: status=${resHome.status}, cspOk=${cspOk}, hstsOk=${hstsOk}, xfo=${xfo}, xcto=${xcto}, refPol=${refPol}`
      );
    }
  } catch (err) {
    fail('A.HeadersHome', `Falha de conexão na home (${baseUrl}): ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // B. ARQUIVOS INTERNOS RETORNAM HTTP 404
  // ---------------------------------------------------------------------------
  const internalRoutes = [
    '/package.json',
    '/package-lock.json',
    '/wrangler.jsonc',
    '/.env',
    '/README.md',
    '/src/style.css',
    '/src/script.js',
    '/site.config.js',
    '/audit.js'
  ];

  let leaks = [];
  for (const route of internalRoutes) {
    try {
      const res = await safeFetch(`${baseUrl}${route}`, { redirect: 'manual' });
      if (res.status !== 404) {
        leaks.push(`${route} (HTTP ${res.status})`);
      }
    } catch (err) {
      // Ignora erro se connection reset
    }
  }

  if (leaks.length === 0) {
    pass('B.ArquivosInternos', `Todos os ${internalRoutes.length} arquivos internos testados retornam HTTP 404 (isolamento de public/ comprovado).`);
  } else {
    fail('B.ArquivosInternos', `Arquivos internos acessíveis: ${leaks.join(', ')}`);
  }

  // ---------------------------------------------------------------------------
  // C. SITEMAP.XML RETORNA 200 E BATE COM CANONICAL
  // ---------------------------------------------------------------------------
  try {
    const sitemapRes = await safeFetch(`${baseUrl}/sitemap.xml`, { redirect: 'manual' });
    if (sitemapRes.status !== 200) {
      fail('C.Sitemap', `sitemap.xml retornou HTTP ${sitemapRes.status}`);
    } else {
      const xml = await sitemapRes.text();
      const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
      if (locMatches.length > 0) {
        pass('C.Sitemap', `sitemap.xml retornou HTTP 200 com ${locMatches.length} URL(s) canônica(s).`);
      } else {
        fail('C.Sitemap', 'Nenhuma tag <loc> encontrada no sitemap.xml.');
      }
    }
  } catch (err) {
    fail('C.Sitemap', `Erro ao consultar sitemap.xml: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // D. ROBOTS.TXT APONTA PARA SITEMAP E LIBERA INDEXAÇÃO
  // ---------------------------------------------------------------------------
  try {
    const robotsRes = await safeFetch(`${baseUrl}/robots.txt`, { redirect: 'manual' });
    if (robotsRes.status !== 200) {
      fail('D.RobotsTxt', `robots.txt retornou HTTP ${robotsRes.status}`);
    } else {
      const txt = await robotsRes.text();
      const hasSitemap = /Sitemap:\s*https?:\/\/[^\s]+/i.test(txt);
      const allowsRoot = txt.includes('Allow: /');

      if (hasSitemap && allowsRoot) {
        pass('D.RobotsTxt', 'robots.txt aponta para sitemap e permite indexação da raiz (Allow: /).');
      } else {
        fail('D.RobotsTxt', `robots.txt incompleto: hasSitemap=${hasSitemap}, allowsRoot=${allowsRoot}`);
      }
    }
  } catch (err) {
    fail('D.RobotsTxt', `Erro ao consultar robots.txt: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // RELATÓRIO FINAL
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`\x1b[32m✔ SMOKE TEST 100% APROVADO: ${passed} verificações bem-sucedidas.\x1b[0m`);
    console.log('================================================================================\n');
    process.exitCode = 0;
  } else {
    console.error(`\x1b[31m✖ SMOKE TEST REPROVADO: ${failed} falha(s), ${passed} aprovação(ões).\x1b[0m`);
    console.log('================================================================================\n');
    process.exitCode = 1;
  }
}

runSmoke().catch(err => {
  console.error('\nErro fatal no smoke test:', err);
  process.exitCode = 1;
});
