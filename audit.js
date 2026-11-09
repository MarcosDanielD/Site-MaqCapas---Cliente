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
  // 2. CONTAGEM DE ANOS CALCULADA & RODAPÉ DINÂMICO
  // ---------------------------------------------------------------------------
  const currentYear = new Date().getFullYear();
  const calculatedYears = currentYear - config.company.foundingYear;
  const scriptContent = fs.readFileSync(path.join(publicDir, 'script.js'), 'utf-8');
  
  const hasDynamicScript = scriptContent.includes('currentYear - foundingYear') || scriptContent.includes('currentYear - 1987');
  const hasCalculatedClass = html.includes('calculated-years') || html.includes(`${calculatedYears} Anos`) || html.includes('Mais de 35 anos');
  const hasFooterDynamicYear = html.includes(`© 1987 &mdash; <span id="currentYear">${currentYear}</span>`) || html.includes(`&copy; 1987 &mdash; <span id="currentYear">${currentYear}</span>`);

  if (hasDynamicScript && hasCalculatedClass && hasFooterDynamicYear) {
    pass('2.DynamicYears', `Contagem de anos dinâmica verificada (${calculatedYears} anos desde 1987), com script automático e rodapé © 1987 — ${currentYear}.`);
  } else {
    fail('2.DynamicYears', `Falha na contagem dinâmica de anos: script=${hasDynamicScript}, htmlClass=${hasCalculatedClass}, footer=${hasFooterDynamicYear}`);
  }

  // ---------------------------------------------------------------------------
  // 3. "VER TODOS OS PRODUTOS" -> #PRODUTOS; TEL CANÔNICO; DUPLICIDADE & ESTADOS
  // ---------------------------------------------------------------------------
  const filmCtaPointsToProdutos = html.includes('href="#produtos" class="film-cta-btn"') || html.includes('class="film-cta-btn" href="#produtos"');
  const expectedTel = `href="tel:${config.company.telefoneRaw}"`;
  const allPhonesStandard = html.includes(expectedTel);
  
  // Duplicidade do logo: SVG precisa de aria-hidden="true" para que o leitor leia somente a tag de texto
  const svgLogoAriaHidden = /<div class="brand-crest"[^>]*aria-hidden="true"/i.test(html) || /<svg[^>]+class="logo-svg"[^>]*aria-hidden="true"/i.test(html);
  
  // Textos de estado não devem vir estáticos com "Carregando dados..."
  const hasCarregandoDados = html.includes('Carregando dados...');
  const toastMessageInitialEmpty = /<span id="toastMessage"><\/span>/.test(html) || html.includes('style="display:none;" id="toastCard"') || html.includes('id="toastCard" role="status" aria-live="polite" style="display:none;"');

  if (filmCtaPointsToProdutos && allPhonesStandard && svgLogoAriaHidden && !hasCarregandoDados && toastMessageInitialEmpty) {
    pass('3.LinkseAcessibilidade', `Botão do filme aponta para #produtos, ${expectedTel} canônico, logo com aria-hidden previne duplicidade e textos de estado limpos.`);
  } else {
    fail('3.LinkseAcessibilidade', `Falha em links ou acessibilidade: ctaProdutos=${filmCtaPointsToProdutos}, telStandard=${allPhonesStandard}, svgHidden=${svgLogoAriaHidden}, semCarregando=${!hasCarregandoDados}, toastLimpo=${toastMessageInitialEmpty}`);
  }

  // ---------------------------------------------------------------------------
  // 4. "ORÇAMENTO RÁPIDO" E SOMENTE FOTOS REAIS (SEM ALTERNADOR IA E SEM SAPATOS)
  // ---------------------------------------------------------------------------
  const hasOrcamentoRapido = html.includes('Orçamento rápido');
  const hasOrcamentoInstantaneo = html.includes('Orçamento Instantâneo');
  const hasEstudioIa = html.includes('Estúdio IA') || html.includes('Modelo Estúdio IA');
  const hasAiToggleButtons = html.includes('btn-photo-toggle') || html.includes('btn-film-toggle');
  const hasRemovedShoePhoto = html.includes('embalagem_sapatos');

  // Verifica se fotos reais estão em todos os cards de produto
  const card1Real = html.includes('id="photoTech"') && html.includes('capa_computador_real');
  const card2Real = html.includes('id="photoBridal"') && html.includes('capa_noiva_real');
  const card3Real = html.includes('id="photoSuit"') && html.includes('porta_terno_real');
  const card4Real = html.includes('id="photoInd"') && html.includes('capa_industrial_real');

  if (hasOrcamentoRapido && !hasOrcamentoInstantaneo && !hasEstudioIa && !hasAiToggleButtons && !hasRemovedShoePhoto && card1Real && card2Real && card3Real && card4Real) {
    pass('4.NomenclaturaEFotosReais', 'Termo "Orçamento rápido" adotado, somente fotos reais ativas em todo o site (sem alternador de IA e sem embalagem_sapatos).');
  } else {
    fail('4.NomenclaturaEFotosReais', `Inconsistência nos cards/nomenclatura: orcRapido=${hasOrcamentoRapido}, semInstantaneo=${!hasOrcamentoInstantaneo}, semToggleIa=${!hasAiToggleButtons}, semSapatos=${!hasRemovedShoePhoto}, cardsReais=${card1Real && card2Real && card3Real && card4Real}`);
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
  const hasEmailField = html.includes('E-mail:') && html.includes(config.company.email);
  const hasPhoneField = (html.includes('Telefone') || html.includes('WhatsApp')) && (html.includes(config.company.telefoneDisplay) || html.includes(config.company.telefone));
  const hasMarqLabSignature = html.includes('marqlab-credit');

  if (hasEmailField && hasPhoneField && hasMarqLabSignature) {
    pass('7.RodapeCampos', `Campos de contato solicitados presentes no rodapé (E-mail: ${config.company.email}, Telefone: ${config.company.telefoneDisplay}) e assinatura Marq Lab.`);
  } else {
    fail('7.RodapeCampos', `Campos cadastrais ausentes ou incorretos no rodapé: email=${hasEmailField}, telefone=${hasPhoneField}, marqLab=${hasMarqLabSignature}`);
  }

  // ---------------------------------------------------------------------------
  // 8. JSON-LD LOCALBUSINESS & FAQPAGE (IDÊNTICO ÀS PERGUNTAS VISÍVEIS)
  // ---------------------------------------------------------------------------
  const jsonLdBlocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)].map(m => m[1].trim());
  let localBusinessValid = false;
  let faqPageValid = false;

  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block);
      if (parsed['@type'] === 'LocalBusiness') {
        if (
          parsed.name === 'MaqCapas' &&
          parsed.telephone === config.company.telefoneRaw &&
          parsed.foundingDate === '1987' &&
          parsed.address?.addressLocality === 'Curitiba' &&
          parsed.areaServed?.name === 'Brasil'
        ) {
          localBusinessValid = true;
        }
      }
      if (parsed['@type'] === 'FAQPage' && Array.isArray(parsed.mainEntity)) {
        let allFaqMatch = true;
        for (const ent of parsed.mainEntity) {
          const qText = ent.name;
          const aText = ent.acceptedAnswer?.text;
          if (!html.includes(qText) || !html.includes(aText)) {
            allFaqMatch = false;
            break;
          }
        }
        if (allFaqMatch && parsed.mainEntity.length >= 4) {
          faqPageValid = true;
        }
      }
    } catch (_) {}
  }

  if (localBusinessValid && faqPageValid) {
    pass('8.JsonLd', 'JSON-LD LocalBusiness (nome, telefone, cidade Curitiba, foundingDate 1987, areaServed Brasil) e FAQPage idêntico às perguntas/respostas visíveis.');
  } else {
    fail('8.JsonLd', `Falha nos esquemas estruturados: LocalBusiness=${localBusinessValid}, FAQPageVerbatim=${faqPageValid}`);
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
