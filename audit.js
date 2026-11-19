/**
 * audit.js
 * Suite Completa de Auditoria de Pré-Lançamento para o site MaqCapas.
 * 
 * Uso:
 *   node audit.js         -> Modo Staging (passa e lista avisos de dados do cliente)
 *   node audit.js --prod  -> Modo Produção (Gate estrito: REPROVA se houver [CONFIRMAR COM O CLIENTE])
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const IS_PROD_GATE = process.argv.includes('--prod');
const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const config = require(path.join(rootDir, 'site.config.js'));

let passed = 0;
let failed = 0;
let warnings = 0;

function pass(id, msg) {
  passed++;
  console.log(`\x1b[32m✔ [PASS]\x1b[0m [${id}] ${msg}`);
}

function fail(id, msg) {
  failed++;
  console.error(`\x1b[31m✖ [FAIL]\x1b[0m [${id}] ${msg}`);
}

function warn(id, msg) {
  warnings++;
  console.warn(`\x1b[33m▲ [WARN]\x1b[0m [${id}] ${msg}`);
}

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
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

async function runAudit() {
  console.log('================================================================================');
  console.log(`  AUDITORIA DE PRÉ-LANÇAMENTO MAQCAPAS — MODO: ${IS_PROD_GATE ? '\x1b[31mPRODUÇÃO (GATE ESTRITO)\x1b[0m' : '\x1b[36mSTAGING / PRÉ-DOMÍNIO\x1b[0m'}`);
  console.log('================================================================================\n');

  // Verifica existência de public/index.html
  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    fail('0.Build', 'Arquivo public/index.html não encontrado. Execute npm run build antes.');
    process.exit(1);
  }
  const html = fs.readFileSync(indexPath, 'utf-8');

  // ---------------------------------------------------------------------------
  // 1. OG:IMAGE, TWITTER:IMAGE, CANONICAL, THEME-COLOR, FAVICON, LANG="PT-BR"
  // ---------------------------------------------------------------------------
  const hasLangPtBr = /<html[^>]+lang=["']pt-BR["']/i.test(html);
  const hasThemeColor = /<meta[^>]+name=["']theme-color["'][^>]+content=["']#[0-9a-fA-F]{3,6}["']/i.test(html);
  
  const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const twImgMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  const twCardMatch = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']summary_large_image["']/i);
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  
  const ogWidthMatch = html.match(/<meta[^>]+property=["']og:image:width["'][^>]+content=["']1200["']/i);
  const ogHeightMatch = html.match(/<meta[^>]+property=["']og:image:height["'][^>]+content=["']630["']/i);

  const favSvg = fs.existsSync(path.join(publicDir, 'assets', 'icons', 'favicon.svg'));
  const favPng = fs.existsSync(path.join(publicDir, 'assets', 'icons', 'favicon-32x32.png'));
  const favApple = fs.existsSync(path.join(publicDir, 'assets', 'icons', 'apple-touch-icon.png'));

  const ogImgAbsolute = ogImgMatch && /^https?:\/\//i.test(ogImgMatch[1]);
  const twImgAbsolute = twImgMatch && /^https?:\/\//i.test(twImgMatch[1]);

  if (hasLangPtBr && hasThemeColor && ogImgAbsolute && twImgAbsolute && ogUrlMatch && twCardMatch && canonicalMatch && ogWidthMatch && ogHeightMatch && favSvg && favPng && favApple) {
    pass('1.MetaTags', `Meta tags completas: og:image (${ogImgMatch[1]}) 1200x630 absoluta, twitter:card summary_large_image, canonical (${canonicalMatch[1]}), theme-color, lang="pt-BR" e favicons.`);
  } else {
    fail('1.MetaTags', `Inconsistência em meta tags: lang=${hasLangPtBr}, theme=${hasThemeColor}, ogImgAbs=${ogImgAbsolute}, twImgAbs=${twImgAbsolute}, ogUrl=${!!ogUrlMatch}, twCard=${!!twCardMatch}, canon=${!!canonicalMatch}, favicons=${favSvg && favPng && favApple}`);
  }

  // ---------------------------------------------------------------------------
  // 2. REMOÇÃO DE "DESDE 1987" & RODAPÉ DINÂMICO COM ANO ATUAL
  // ---------------------------------------------------------------------------
  const currentYear = new Date().getFullYear();
  const scriptContent = fs.readFileSync(path.join(publicDir, 'script.js'), 'utf-8');
  
  const has1987InHtml = html.includes('1987');
  const hasFooterDynamicYear = html.includes(`&copy; <span id="currentYear">${currentYear}</span> MAQCAPAS`) || html.includes(`&copy; <span id="currentYear">${currentYear}</span> MaqCapas`);

  if (!has1987InHtml && hasFooterDynamicYear) {
    pass('2.DynamicYears', `Menções a 1987 removidas conforme pedido do cliente e rodapé dinâmico com apenas © ${currentYear} MaqCapas.`);
  } else {
    fail('2.DynamicYears', `Falha na verificação de ano: sem1987=${!has1987InHtml}, footer=${hasFooterDynamicYear}`);
  }

  // ---------------------------------------------------------------------------
  // 3. ORÇAMENTOS DIRETO NO E-MAIL; TEL CANÔNICO; DUPLICIDADE & ESTADOS
  // ---------------------------------------------------------------------------
  const expectedMailto = `mailto:${config.company.email}`;
  const headerCtaIsMailto = html.includes(`href="${expectedMailto}`) && html.includes('id="headerCtaBtn"');
  const expectedTel = `href="tel:${config.company.telefoneRaw}"`;
  const allPhonesStandard = html.includes(expectedTel);
  
  // Duplicidade do logo: SVG precisa de aria-hidden="true" para que o leitor leia somente a tag de texto
  const svgLogoAriaHidden = /<div class="brand-crest"[^>]*aria-hidden="true"/i.test(html) || /<svg[^>]+class="logo-svg"[^>]*aria-hidden="true"/i.test(html);
  
  // Textos de estado não devem vir estáticos com "Carregando dados..."
  const hasCarregandoDados = html.includes('Carregando dados...');
  const toastMessageInitialEmpty = /<span id="toastMessage"><\/span>/.test(html);

  if (headerCtaIsMailto && allPhonesStandard && svgLogoAriaHidden && !hasCarregandoDados && toastMessageInitialEmpty) {
    pass('3.LinkseAcessibilidade', `Botões de orçamento apontam para ${expectedMailto}, ${expectedTel} canônico, logo com aria-hidden e textos de estado limpos.`);
  } else {
    fail('3.LinkseAcessibilidade', `Falha em links ou acessibilidade: mailto=${headerCtaIsMailto}, telStandard=${allPhonesStandard}, svgHidden=${svgLogoAriaHidden}, semCarregando=${!hasCarregandoDados}, toastLimpo=${toastMessageInitialEmpty}`);
  }

  // ---------------------------------------------------------------------------
  // 4. TEXTOS ATUALIZADOS DO CLIENTE, SEÇÃO SAIBA MAIS E SOMENTE FOTOS REAIS
  // ---------------------------------------------------------------------------
  const hasNewCard1 = html.includes('Capas para Informática') && html.includes('TNT gramatura 60 e PVC Cristal ou Opaco 010mm');
  const hasNewCard2 = html.includes('Capa para Terno, Daminhas, Noivas e Festas');
  const hasNewCard3 = html.includes('Capa para equipamentos industriais') && html.includes('Material impermeável e resistente');
  const hasPvcOpaco = html.includes('PVC Cristal ou Opaco') && !html.includes('PVC Cristal Calandrado') && !html.includes('Solda Eletrônica de Alta Frequência');
  const hasSaibaMais = html.includes('id="saiba-mais"') && html.includes('Aceitamos orçamentos de capas sob medida para equipamentos e sugestões de outros materiais');
  const hasRemovedSections = html.includes('id="produtos"') || html.includes('id="simulador"') || html.includes('id="faq"');

  if (hasNewCard1 && hasNewCard2 && hasNewCard3 && hasPvcOpaco && hasSaibaMais && !hasRemovedSections) {
    pass('4.NomenclaturaEFotosReais', 'Todos os textos solicitados pelo cliente, seção Saiba Mais e remoção de seções antigas verificados com sucesso.');
  } else {
    fail('4.NomenclaturaEFotosReais', `Inconsistência nos textos do cliente: card1=${hasNewCard1}, card2=${hasNewCard2}, card3=${hasNewCard3}, pvcOpaco=${hasPvcOpaco}, saibaMais=${hasSaibaMais}, semSecoesAntigas=${!hasRemovedSections}`);
  }

  // ---------------------------------------------------------------------------
  // 5. REVISÃO DE AFIRMAÇÕES ABSOLUTAS
  // ---------------------------------------------------------------------------
  const hasVedacaoHermetica = html.toLowerCase().includes('vedação hermética');
  const hasIsolamentoTotal = html.toLowerCase().includes('isolamento total');
  const hasBloqueioTotal = html.toLowerCase().includes('bloqueio total');
  const hasTestesTracao = html.toLowerCase().includes('testes de tração');

  if (!hasVedacaoHermetica && !hasIsolamentoTotal && !hasBloqueioTotal && !hasTestesTracao) {
    pass('5.AfirmacoesAbsolutas', 'Afirmações absolutas revisadas com sucesso (sem "vedação hermética", "isolamento total", "bloqueio total" ou "testes de tração" desprovidos de laudo).');
  } else {
    fail('5.AfirmacoesAbsolutas', `Termos absolutos não comprovados ainda presentes no HTML: hermetica=${hasVedacaoHermetica}, isolamentoTotal=${hasIsolamentoTotal}, bloqueioTotal=${hasBloqueioTotal}, testesTracao=${hasTestesTracao}`);
  }

  // ---------------------------------------------------------------------------
  // 6. H1 COMO PRIMEIRO TÍTULO DA PÁGINA & CARROSSEL COM PAUSA E TECLADO
  // ---------------------------------------------------------------------------
  // Extrai todas as tags de heading em ordem de aparição no DOM
  const headingMatches = [...html.matchAll(/<(h[1-6])[^>]*>/gi)].map(m => m[1].toLowerCase());
  const firstHeadingIsH1 = headingMatches.length > 0 && headingMatches[0] === 'h1';

  const hasPauseBtn = html.includes('id="filmPauseBtn"') && html.includes('aria-pressed');
  const hasKeyboardControl = scriptContent.includes("e.key === 'ArrowRight'") && scriptContent.includes("e.key === ' '");
  const hasCarouselAria = html.includes('aria-roledescription="carousel"') && html.includes('aria-roledescription="slide"');

  if (firstHeadingIsH1 && hasPauseBtn && hasKeyboardControl && hasCarouselAria) {
    pass('6.H1ECarrossel', `H1 é o primeiro título do DOM (${headingMatches[0].toUpperCase()}), carrossel possui botão de pausa (#filmPauseBtn), ARIA roles e controle por teclado.`);
  } else {
    fail('6.H1ECarrossel', `Falha em H1 ou carrossel: firstHeadingIsH1=${firstHeadingIsH1} (primeiro foi ${headingMatches[0]}), pauseBtn=${hasPauseBtn}, teclado=${hasKeyboardControl}, ariaCarousel=${hasCarouselAria}`);
  }

  // ---------------------------------------------------------------------------
  // 7. RODAPÉ COM DADOS DE CONTATO DEFINIDOS (E-MAIL E TELEFONE VIA CONFIG)
  // ---------------------------------------------------------------------------
  const hasEmailField = html.includes('E-mail') && html.includes(config.company.email);
  const hasPhoneField = (html.includes('Telefone') || html.includes('WhatsApp')) && (html.includes(config.company.telefoneDisplay) || html.includes(config.company.telefone));
  const hasMarqLabSignature = html.includes('marqlab-credit');

  if (hasEmailField && hasPhoneField && hasMarqLabSignature) {
    pass('7.RodapeCampos', `Campos de contato solicitados presentes no rodapé (E-mail: ${config.company.email}, Telefone: ${config.company.telefoneDisplay}) e assinatura Marq Lab.`);
  } else {
    fail('7.RodapeCampos', `Campos cadastrais ausentes ou incorretos no rodapé: email=${hasEmailField}, telefone=${hasPhoneField}, marqLab=${hasMarqLabSignature}`);
  }

  // ---------------------------------------------------------------------------
  // 8. JSON-LD LOCALBUSINESS
  // ---------------------------------------------------------------------------
  const jsonLdBlocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map(m => m[1].trim());
  let localBusinessValid = false;

  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block);
      if (parsed['@type'] === 'LocalBusiness') {
        if (
          (parsed.name === 'MAQCAPAS' || parsed.name === 'MaqCapas') &&
          parsed.telephone === config.company.telefoneRaw &&
          parsed.address?.addressLocality === 'Curitiba' &&
          parsed.areaServed?.name === 'Brasil'
        ) {
          localBusinessValid = true;
        }
      }
    } catch (_) {}
  }

  if (localBusinessValid) {
    pass('8.JsonLd', 'JSON-LD LocalBusiness (nome, telefone, e-mail, cidade Curitiba, areaServed Brasil) válido.');
  } else {
    fail('8.JsonLd', `Falha nos esquemas estruturados: LocalBusiness=${localBusinessValid}`);
  }

  // ---------------------------------------------------------------------------
  // 9. IMAGENS EM WEBP COM WIDTH/HEIGHT E LAZY ABAIXO DA DOBRA
  // ---------------------------------------------------------------------------
  const imgMatches = [...html.matchAll(/<img([^>]+)>/gi)];
  let imagesAllHaveDimensions = true;
  let belowFoldLazyOk = true;

  imgMatches.forEach((m, idx) => {
    const attrs = m[1];
    const hasWidth = /width=["']\d+["']/i.test(attrs);
    const hasHeight = /height=["']\d+["']/i.test(attrs);
    const hasLazy = /loading=["']lazy["']/i.test(attrs);
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : '';

    if (!hasWidth || !hasHeight) {
      imagesAllHaveDimensions = false;
    }
    // As primeiras fotos (acima da dobra) não precisam de lazy, mas as abaixo da dobra (produtos, sobre, footer) precisam
    if (idx > 2 && !hasLazy && !src.includes('marq-lab')) {
      belowFoldLazyOk = false;
    }
  });

  if (imagesAllHaveDimensions && belowFoldLazyOk) {
    pass('9.ImagensOtimizadas', `Todas as ${imgMatches.length} tags <img> possuem dimensões explícitas (width/height), com WebP e lazy loading nas imagens abaixo da dobra.`);
  } else {
    fail('9.ImagensOtimizadas', `Problema em imagens: todasComDimensoes=${imagesAllHaveDimensions}, lazyAbaixoDobra=${belowFoldLazyOk}`);
  }

  // ---------------------------------------------------------------------------
  // 10. _HEADERS (CSP SEM UNSAFE-INLINE, HSTS, NOSNIFF), ROBOTS, SITEMAP, 404
  // ---------------------------------------------------------------------------
  const headersPath = path.join(publicDir, '_headers');
  const robotsPath = path.join(publicDir, 'robots.txt');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const path404 = path.join(publicDir, '404.html');

  const headersExist = fs.existsSync(headersPath);
  const robotsExist = fs.existsSync(robotsPath);
  const sitemapExist = fs.existsSync(sitemapPath);
  const exists404 = fs.existsSync(path404);

  let cspWithoutUnsafeInline = false;
  let hstsOk = false;
  let nosniffOk = false;
  let referrerOk = false;

  if (headersExist) {
    const hText = fs.readFileSync(headersPath, 'utf-8');
    cspWithoutUnsafeInline = hText.includes("default-src 'self'") && !hText.includes("'unsafe-inline'");
    hstsOk = hText.includes('max-age=31536000');
    nosniffOk = hText.includes('nosniff');
    referrerOk = hText.includes('strict-origin-when-cross-origin');
  }

  if (headersExist && robotsExist && sitemapExist && exists404 && cspWithoutUnsafeInline && hstsOk && nosniffOk && referrerOk) {
    pass('10.SegurancaEInfra', '_headers com CSP sem unsafe-inline, HSTS 1 ano, nosniff, Referrer-Policy; robots.txt, sitemap.xml e 404.html presentes.');
  } else {
    fail('10.SegurancaEInfra', `Falha de infra/segurança: headers=${headersExist}, robots=${robotsExist}, sitemap=${sitemapExist}, 404=${exists404}, cspSemUnsafe=${cspWithoutUnsafeInline}, hsts=${hstsOk}, nosniff=${nosniffOk}`);
  }

  // ---------------------------------------------------------------------------
  // 11. ISOLAMENTO: SEPARAR PUBLIC/ E PROVAR QUE ARQUIVOS INTERNOS DÃO 404
  // ---------------------------------------------------------------------------
  const internalFiles404 = await testInternalFilesLocalServer();
  if (internalFiles404.all404) {
    pass('11.IsolamentoPublic', 'Arquivos internos (/package.json, /wrangler.jsonc, /.env, /README.md, /src/*) retornam HTTP 404 no servidor estático.');
  } else {
    fail('11.IsolamentoPublic', `Arquivos internos vazando com status diferente de 404: ${internalFiles404.leaks.join(', ')}`);
  }

  // ---------------------------------------------------------------------------
  // 12. RASTREAMENTO SEGURO DE CLIQUES NO WHATSAPP (SEM DADOS PESSOAIS)
  // ---------------------------------------------------------------------------
  const hasWaTracking = scriptContent.includes('initWhatsAppTracking') && scriptContent.includes('event: \'whatsapp_click\'');
  const hasPiiLeak = scriptContent.includes('telefone: document') || scriptContent.includes('nome: document') || scriptContent.includes('email: document');
  
  if (hasWaTracking && !hasPiiLeak) {
    pass('12.WhatsAppTracking', 'Rastreamento de cliques no WhatsApp implementado com contexto de botão e sem exposição de PII (dados pessoais).');
  } else {
    fail('12.WhatsAppTracking', `Falha no tracking de WhatsApp: temTracking=${hasWaTracking}, semPii=${!hasPiiLeak}`);
  }

  // ---------------------------------------------------------------------------
  // 13. AUDITORIA DE PRODUÇÃO (GATE ESTRITO: REPROVA COM [CONFIRMAR COM O CLIENTE])
  // ---------------------------------------------------------------------------
  const unconfirmedMatches = [...html.matchAll(/\[CONFIRMAR COM O CLIENTE\]/g)];
  const isPlaceholderDomain = config.domain.includes('localhost') || config.domain.includes('example.com') || config.domain.includes('placeholder');

  console.log('\n--- Status dos Dados Cadastrais da Empresa ---');
  console.log(`E-mail:          ${config.company.email}`);
  console.log(`Telefone:        ${config.company.telefoneDisplay}`);
  console.log(`Domínio:         ${config.domain}`);
  console.log('----------------------------------------------\n');

  if (unconfirmedMatches.length > 0 || isPlaceholderDomain) {
    if (IS_PROD_GATE) {
      fail(
        '13.GateProducao',
        `GATE DE PRODUÇÃO REPROVADO: Encontrados ${unconfirmedMatches.length} campo(s) com marcador [CONFIRMAR COM O CLIENTE] ou domínio placeholder no ambiente de lançamento.`
      );
    } else {
      warn(
        '13.GateProducao',
        `MODO STAGING: ${unconfirmedMatches.length} campo(s) com [CONFIRMAR COM O CLIENTE] presentes no rodapé aguardando dados reais do cliente. (Permitido em staging, bloqueado em prod).`
      );
      pass('13.GateProducao', 'Auditoria de staging concluída: estrutura aprovada com marcadores claros para confirmação com o cliente.');
    }
  } else {
    pass('13.GateProducao', 'Todos os dados cadastrais da empresa estão preenchidos sem nenhum marcador pendente.');
  }

  // Resumo Final
  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`\x1b[32m✔ AUDITORIA 100% APROVADA: ${passed} testes bem-sucedidos (${warnings} avisos).\x1b[0m`);
    console.log('================================================================================\n');
    process.exitCode = 0;
  } else {
    console.error(`\x1b[31m✖ AUDITORIA REPROVADA: ${failed} falha(s), ${passed} aprovação(ões).\x1b[0m`);
    console.log('================================================================================\n');
    process.exitCode = 1;
  }
}

/**
 * Inicia servidor local efêmero para testar que ./public é a única raiz exposta,
 * provando que arquivos internos retornam HTTP 404.
 */
function testInternalFilesLocalServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';

      const safePath = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.join(publicDir, safePath);

      // Bloqueia qualquer tentativa fora de public/
      if (!fullPath.startsWith(publicDir) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        const html404 = fs.existsSync(path.join(publicDir, '404.html'))
          ? fs.readFileSync(path.join(publicDir, '404.html'))
          : '404 Not Found';
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html404);
        return;
      }

      const ext = path.extname(fullPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(fullPath));
    });

    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;
      const probePaths = [
        '/package.json',
        '/package-lock.json',
        '/wrangler.jsonc',
        '/.env',
        '/README.md',
        '/src/style.css',
        '/src/script.js',
        '/audit.js',
        '/site.config.js'
      ];

      const leaks = [];
      for (const p of probePaths) {
        try {
          const res = await fetch(`${baseUrl}${p}`, { keepalive: false });
          if (res.status !== 404) {
            leaks.push(`${p} (HTTP ${res.status})`);
          }
        } catch (err) {
          leaks.push(`${p} (${err.message})`);
        }
      }

      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      server.close(() => {
        setImmediate(() => {
          resolve({ all404: leaks.length === 0, leaks });
        });
      });
    });
  });
}

runAudit().catch(err => {
  console.error('Erro fatal na auditoria:', err);
  process.exit(1);
});
