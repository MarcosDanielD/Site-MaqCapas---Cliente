/**
 * scripts/build.js
 * Compilação e geração dos arquivos estáticos em ./public
 * Padrão de marca único (MAQCAPAS), sob medida apenas para equipamentos e seção Produtos.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const publicDir = path.join(rootDir, 'public');
const configPath = path.join(rootDir, 'site.config.js');
const manifestPath = path.join(rootDir, 'scripts', 'images-manifest.json');

const config = require(configPath);
const manifest = fs.existsSync(manifestPath) ? require(manifestPath) : {};
const ASSET_VER = '20261117v2';

const currentYear = new Date().getFullYear();
const mailtoQuoteUrl = `mailto:${config.company.email}?subject=${encodeURIComponent('Orçamento - MAQCAPAS')}&body=${encodeURIComponent('Olá! Gostaria de solicitar um orçamento com a MAQCAPAS.')}`;

console.log('--- Iniciando build do MAQCAPAS ---');
console.log(`Domínio configurado: ${config.domain}`);
console.log(`Telefone: ${config.company.telefoneDisplay} | E-mail de Orçamento: ${config.company.email}`);

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 1. Copia style.css
const cssSrc = fs.readFileSync(path.join(srcDir, 'style.css'), 'utf-8');
fs.writeFileSync(path.join(publicDir, 'style.css'), cssSrc, 'utf-8');
console.log('✓ style.css atualizado em public/');

// 2. Copia script.js
const jsSrc = fs.readFileSync(path.join(srcDir, 'script.js'), 'utf-8');
fs.writeFileSync(path.join(publicDir, 'script.js'), jsSrc, 'utf-8');
console.log('✓ script.js atualizado em public/');

// 3. Script de redirecionamento automático de URLs antigas do Google Search e 404.html
const redirect404Js = `(function() {
  var p = (window.location.pathname || '').toLowerCase();
  if (p && p !== '/404.html' && p !== '/404') {
    if (p.indexOf('contato') !== -1 || p.indexOf('orcamento') !== -1) {
      window.location.replace('/#saiba-mais');
    } else {
      window.location.replace('/');
    }
  }
})();
`;
fs.writeFileSync(path.join(publicDir, 'redirect-404.js'), redirect404Js, 'utf-8');

const html404 = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAQCAPAS | Redirecionando...</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${config.domain}/">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/icons/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="96x96" href="/assets/icons/favicon-96x96.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/icons/favicon-192x192.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
  <link rel="stylesheet" href="/style.css?v=${ASSET_VER}">
  <script src="/redirect-404.js?v=${ASSET_VER}"></script>
</head>
<body class="error-page">
  <div class="top-bar">
    <div class="top-bar-inner">
      <span>MAQCAPAS &bull; Curitiba/PR &bull; Envio para todo o Brasil</span>
      <div class="top-bar-links">
        <a href="tel:${config.company.telefoneRaw}" class="top-phone">${config.company.telefoneDisplay}</a>
      </div>
    </div>
  </div>

  <header class="header">
    <div class="header-container">
      <a href="/" class="brand" aria-label="MAQCAPAS Início">
        <div class="brand-crest" aria-hidden="true">
          <svg viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg" focusable="false">
            <polygon points="80,4 152,24 8,24" fill="#24211e" stroke="#181614" stroke-width="2"/>
            <rect x="8" y="24" width="144" height="22" fill="#ffffff" stroke="#181614" stroke-width="2"/>
            <polygon points="80,66 152,46 8,46" fill="#24211e" stroke="#181614" stroke-width="2"/>
            <text x="80" y="41" font-family="'Outfit', sans-serif" font-weight="700" font-size="19" fill="#181614" text-anchor="middle" letter-spacing="2">MAQCAPAS</text>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">MAQCAPAS</span>
          <span class="brand-sub">CAPAS PARA PROTEÇÃO</span>
        </div>
      </a>
      <div class="header-action">
        <a href="${mailtoQuoteUrl}" class="btn btn-header-cta">
          <span>Solicitar Orçamento</span>
        </a>
      </div>
    </div>
  </header>

  <main id="main-content" class="container text-center" style="padding: 6rem 1.5rem; min-height: 60vh;">
    <h1 class="hero-title" style="font-size: 3rem; margin-bottom: 1rem;">404</h1>
    <h2 class="section-title" style="margin-bottom: 1.5rem;">Página Não Encontrada</h2>
    <p class="hero-description" style="max-width: 520px; margin: 0 auto 2rem;">
      Página não encontrada. Volte para a página inicial da MAQCAPAS.
    </p>
    <a href="/" class="btn btn-dark btn-lg">Voltar à Página Inicial</a>
  </main>

  <footer class="footer">
    <div class="container footer-bottom-inner" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 2rem;">
      <p>&copy; ${currentYear} MAQCAPAS &bull; Curitiba &bull; Brasil</p>
    </div>
  </footer>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, '404.html'), html404, 'utf-8');

// 4. robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${config.domain}/sitemap.xml
`;
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');

// 5. sitemap.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.domain}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');

// 6. _headers (CSP estrita sem unsafe-inline)
const headersTxt = `/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' mailto:;
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups

/
  Cache-Control: public, max-age=0, must-revalidate

/404.html
  X-Robots-Tag: noindex, nofollow
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=0, must-revalidate

/*.css
  Cache-Control: public, max-age=0, must-revalidate

/*.js
  Cache-Control: public, max-age=0, must-revalidate
`;
fs.writeFileSync(path.join(publicDir, '_headers'), headersTxt, 'utf-8');

// 7. _redirects (Redireciona todas as URLs antigas indexadas no Google para a página principal)
const redirectsTxt = `/index.html / 301
/copia-produtos-da-maqcapas / 301
/copia-produtos-da-maqcapas/* / 301
/produtos-da-maqcapas / 301
/produtos / 301
/capas-para-roupas / 301
/contato /#saiba-mais 301
/contato/* /#saiba-mais 301
/faca-seu-orcamento /#saiba-mais 301
/orcamento /#saiba-mais 301
/sobre /#sobre 301
`;
fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsTxt, 'utf-8');

// Cria também rotas físicas para as subpáginas antigas do Google Search
const legacyRoutes = [
  { dir: 'copia-produtos-da-maqcapas', target: '/' },
  { dir: 'contato', target: '/#saiba-mais' },
  { dir: 'capas-para-roupas', target: '/' },
  { dir: 'faca-seu-orcamento', target: '/#saiba-mais' }
];
for (const route of legacyRoutes) {
  const routeDir = path.join(publicDir, route.dir);
  if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${route.target}">
  <link rel="canonical" href="${config.domain}/">
  <title>MAQCAPAS</title>
  <script src="/redirect-404.js?v=${ASSET_VER}"></script>
</head>
<body>
  <p><a href="${route.target}">Acessar MAQCAPAS</a></p>
</body>
</html>`, 'utf-8');
}

// 8. JSON-LD Schema: LocalBusiness
const jsonLdLocalBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "MAQCAPAS",
  "alternateName": "MAQCAPAS",
  "logo": `${config.domain}/assets/icons/favicon-192x192.png`,
  "image": `${config.domain}/assets/images/og-image.jpg`,
  "telephone": config.company.telefoneRaw,
  "email": config.company.email,
  "url": `${config.domain}/`,
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": config.company.cidade,
    "addressRegion": config.company.estado,
    "addressCountry": config.company.paisCode
  },
  "areaServed": {
    "@type": "Country",
    "name": config.company.pais
  },
  "description": config.company.description
};

/**
 * Helper para obter srcsets de uma imagem no manifesto (com cache-busting)
 */
function getImageSources(imgKey) {
  const data = manifest[imgKey];
  const baseName = path.parse(imgKey).name;
  if (!data || !data.sizes) {
    return {
      avifSrcset: `assets/images/${baseName}.avif?v=${ASSET_VER}`,
      webpSrcset: `assets/images/${baseName}.webp?v=${ASSET_VER}`,
      jpgSrcset: `assets/images/${baseName}.jpg?v=${ASSET_VER}`,
      defaultSrc: `assets/images/${baseName}.jpg?v=${ASSET_VER}`,
      webpMainSrc: `assets/images/${baseName}.webp?v=${ASSET_VER}`,
      thumbSrc: `assets/images/${baseName}.webp?v=${ASSET_VER}`,
      width: 800,
      height: 600
    };
  }
  const widths = Object.keys(data.sizes).map(Number).sort((a, b) => a - b);
  const largestW = widths[widths.length - 1];
  const galleryW = widths.includes(800) ? 800 : largestW;
  return {
    avifSrcset: widths.map(w => `assets/images/${baseName}-${w}.avif?v=${ASSET_VER} ${w}w`).join(', '),
    webpSrcset: widths.map(w => `assets/images/${baseName}-${w}.webp?v=${ASSET_VER} ${w}w`).join(', '),
    jpgSrcset: widths.map(w => `assets/images/${baseName}-${w}.jpg?v=${ASSET_VER} ${w}w`).join(', '),
    defaultSrc: `assets/images/${baseName}-${largestW}.jpg?v=${ASSET_VER}`,
    webpMainSrc: `assets/images/${baseName}-${galleryW}.webp?v=${ASSET_VER}`,
    thumbSrc: `assets/images/${baseName}-${widths[0]}.webp?v=${ASSET_VER}`,
    thumbWidth: data.sizes[widths[0]].width,
    thumbHeight: data.sizes[widths[0]].height,
    width: data.width,
    height: data.height
  };
}

/**
 * Helper para renderizar tag <picture> rica com AVIF, WebP, JPG, srcset e sizes
 */
function renderPictureTag({
  imgKey,
  alt,
  id = '',
  className = '',
  loading = 'lazy',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  decoding = 'async',
  fetchpriority = ''
}) {
  const idAttr = id ? ` id="${id}"` : '';
  const fpAttr = fetchpriority ? ` fetchpriority="${fetchpriority}"` : '';
  const srcInfo = getImageSources(imgKey);

  return `<picture>
    <source type="image/avif" srcset="${srcInfo.avifSrcset}" sizes="${sizes}">
    <source type="image/webp" srcset="${srcInfo.webpSrcset}" sizes="${sizes}">
    <img src="${srcInfo.defaultSrc}" srcset="${srcInfo.jpgSrcset}" sizes="${sizes}" alt="${alt}" class="${className}"${idAttr} width="${srcInfo.width}" height="${srcInfo.height}" loading="${loading}" decoding="${decoding}"${fpAttr}>
  </picture>`;
}

/**
 * Helper para renderizar botão de miniatura da galeria #sobre com troca direta em <img>
 */
function renderAboutThumb({ imgKey, label, alt, title, desc, active = false }) {
  const srcInfo = getImageSources(imgKey);
  const activeClass = active ? ' active' : '';
  const ariaPressed = active ? 'true' : 'false';
  return `<button type="button" class="about-thumb${activeClass}" aria-pressed="${ariaPressed}" data-src="${srcInfo.webpMainSrc}" data-width="${srcInfo.width}" data-height="${srcInfo.height}" data-alt="${alt}" data-title="${title}" data-desc="${desc}">
                  <img src="${srcInfo.thumbSrc}" alt="" width="${srcInfo.thumbWidth || 480}" height="${srcInfo.thumbHeight || 360}" loading="lazy">
                  <span>${label}</span>
                </button>`;
}

// 9. Gera index.html completo
const indexHtml = `<!DOCTYPE html>
<html lang="${config.meta.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAQCAPAS | Capas para Proteção</title>
  <meta name="description" content="${config.company.description}">
  <meta name="theme-color" content="${config.meta.themeColor}">
  <link rel="canonical" href="${config.domain}/">

  <!-- Preload da maior imagem acima da dobra (Hero / Film Scene 0) -->
  <link rel="preload" as="image" href="assets/images/porta_terno_real-1200.webp?v=${ASSET_VER}" type="image/webp" fetchpriority="high">

  <!-- Favicons (Múltiplos de 48px + /favicon.ico para exibição nos resultados do Google Search) -->
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="48x48" href="assets/icons/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="96x96" href="assets/icons/favicon-96x96.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/icons/favicon-192x192.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="assets/icons/apple-touch-icon.png">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${config.meta.locale}">
  <meta property="og:site_name" content="MAQCAPAS">
  <meta property="og:title" content="MAQCAPAS | Capas para Proteção">
  <meta property="og:description" content="${config.company.description}">
  <meta property="og:url" content="${config.domain}/">
  <meta property="og:image" content="${config.domain}/assets/images/og-image.jpg">
  <meta property="og:image:width" content="${config.meta.ogImageWidth}">
  <meta property="og:image:height" content="${config.meta.ogImageHeight}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${config.meta.twitterCard}">
  <meta name="twitter:title" content="MAQCAPAS | Capas para Proteção">
  <meta name="twitter:description" content="${config.company.description}">
  <meta name="twitter:image" content="${config.domain}/assets/images/og-image.jpg">

  <!-- Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="style.css?v=${ASSET_VER}">

  <!-- JSON-LD Structured Data: LocalBusiness -->
  <script type="application/ld+json">
${JSON.stringify(jsonLdLocalBusiness, null, 2)}
  </script>
</head>
<body>

  <!-- Top Announcement Bar -->
  <div class="top-bar">
    <div class="top-bar-inner">
      <span>MAQCAPAS &bull; Curitiba/PR &bull; Envio para todo o Brasil</span>
      <div class="top-bar-links">
        <a href="tel:${config.company.telefoneRaw}" class="top-phone" data-tracking-placement="top_bar_phone">${config.company.telefoneDisplay}</a>
        <span class="top-dot">&bull;</span>
        <a href="${mailtoQuoteUrl}" class="top-phone" data-tracking-placement="top_bar_email">${config.company.email}</a>
      </div>
    </div>
  </div>

  <!-- Header -->
  <header class="header" id="header">
    <div class="header-container">
      
      <!-- Brand Logo -->
      <a href="#hero" class="brand" aria-label="MAQCAPAS - Página Inicial">
        <div class="brand-crest" aria-hidden="true">
          <svg viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg" focusable="false">
            <polygon points="80,4 152,24 8,24" fill="#24211e" stroke="#181614" stroke-width="2"/>
            <rect x="8" y="24" width="144" height="22" fill="#ffffff" stroke="#181614" stroke-width="2"/>
            <polygon points="80,66 152,46 8,46" fill="#24211e" stroke="#181614" stroke-width="2"/>
            <text x="80" y="41" font-family="'Outfit', sans-serif" font-weight="700" font-size="19" fill="#181614" text-anchor="middle" letter-spacing="2">MAQCAPAS</text>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">MAQCAPAS</span>
          <span class="brand-sub">CAPAS PARA PROTEÇÃO</span>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="nav-menu" aria-label="Menu principal">
        <a href="#hero" class="nav-link">Início</a>
        <a href="#por-que-proteger" class="nav-link">Por Que Proteger?</a>
        <a href="#materiais" class="nav-link">Produtos</a>
        <a href="#saiba-mais" class="nav-link">Saiba Mais</a>
      </nav>

      <!-- Botão de Orçamento no Header (Direciona para o E-mail) -->
      <div class="header-action">
        <a href="${mailtoQuoteUrl}" class="btn btn-header-cta" id="headerCtaBtn" data-tracking-placement="header_cta">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <span>Fazer Orçamento</span>
        </a>

        <!-- Mobile Toggle -->
        <button class="mobile-toggle" id="mobileMenuBtn" aria-label="Abrir menu de navegação" aria-expanded="false">
          <span></span>
          <span></span>
        </button>
      </div>

    </div>

    <!-- Mobile Drawer -->
    <div class="mobile-drawer" id="mobileDrawer">
      <nav class="mobile-nav" aria-label="Menu móvel">
        <a href="#hero" class="mobile-nav-item">Início</a>
        <a href="#por-que-proteger" class="mobile-nav-item">Por Que Proteger?</a>
        <a href="#materiais" class="mobile-nav-item">Produtos</a>
        <a href="#saiba-mais" class="mobile-nav-item">Saiba Mais</a>
        <a href="${mailtoQuoteUrl}" class="btn btn-dark w-full" data-tracking-placement="mobile_drawer_email">Orçamento por E-mail (${config.company.email})</a>
      </nav>
    </div>
  </header>

  <!-- Conteúdo Principal -->
  <main id="main-content">

    <!-- PRIMEIRO TÍTULO DA PÁGINA (H1 estrito para acessibilidade e semântica SEO) -->
    <h1 class="sr-only">MAQCAPAS &mdash; Fabricação de Capas para Proteção</h1>

    <!-- ════════════════════════════════════════════
         SCROLL FILM / CARROSSEL DIRETO E SIMPLES
         ════════════════════════════════════════════ -->
    <div class="scroll-film" id="scrollFilm" role="region" aria-roledescription="carousel" aria-label="Apresentação de produtos MAQCAPAS">

      <div class="film-sticky" id="filmSticky">

        <!-- ── Cena 1: Capas para Ternos ── -->
        <div class="film-scene is-active" id="scene0" role="group" aria-roledescription="slide" aria-label="Cena 1 de 4: Capas para Ternos">
          <div class="film-scene-photo film-photo-scene0" aria-label="Capas para ternos em TNT"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">01</span>
              <span class="film-scene-tag film-scene-tag--real">Vestuário</span>
              <h2 class="film-scene-title">Capas para ternos</h2>
              <p class="film-scene-desc">Capas para ternos em TNT gramatura 60.</p>
            </div>
          </div>
        </div>

        <!-- ── Cena 2: Equipamentos e Informática (Sob Medida) ── -->
        <div class="film-scene" id="scene1" role="group" aria-roledescription="slide" aria-label="Cena 2 de 4: Capas para Equipamentos">
          <div class="film-scene-photo film-photo-scene1" aria-label="Capas sob medida para equipamentos e informática"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">02</span>
              <span class="film-scene-tag film-scene-tag--real">Equipamentos</span>
              <h2 class="film-scene-title">Capa equipamentos</h2>
              <p class="film-scene-desc">Capas sob medida para equipamentos, monitores, gabinetes e teclados em TNT ou PVC Cristal ou Opaco.</p>
            </div>
          </div>
        </div>

        <!-- ── Cena 3: Vestidos de Noivas, Festas e Daminhas ── -->
        <div class="film-scene" id="scene2" role="group" aria-roledescription="slide" aria-label="Cena 3 de 4: Vestidos de Noivas, Festas e Daminhas">
          <div class="film-scene-photo film-photo-scene2" aria-label="Capas para vestidos de noivas, festas e daminhas em TNT"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">03</span>
              <span class="film-scene-tag film-scene-tag--real">Vestuário</span>
              <h2 class="film-scene-title">Capas para vestidos de noivas, festas e daminhas</h2>
              <p class="film-scene-desc">Capas em TNT gramatura 60.</p>
            </div>
          </div>
        </div>

        <!-- ── Cena 4: Contato (E-mail, Telefone e WhatsApp) ── -->
        <div class="film-scene" id="scene3" role="group" aria-roledescription="slide" aria-label="Cena 4 de 4: Contato MAQCAPAS">
          <div class="film-scene-photo film-photo-scene3" aria-label="Capa sob medida para equipamentos fabricada pela MAQCAPAS"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">04</span>
              <span class="film-scene-tag film-scene-tag--real">Contato</span>
              <h2 class="film-scene-title">Contato MAQCAPAS</h2>
              <div class="film-contact-list">
                <p class="film-contact-item">
                  <strong>E-mail (Orçamentos):</strong><br>
                  <a href="${mailtoQuoteUrl}" class="film-contact-link" data-tracking-placement="film_scene_email">${config.company.email}</a>
                </p>
                <p class="film-contact-item">
                  <strong>Telefone:</strong><br>
                  <a href="tel:${config.company.telefoneRaw}" class="film-contact-link">${config.company.telefoneDisplay}</a>
                </p>
                <p class="film-contact-item">
                  <strong>WhatsApp:</strong><br>
                  <a href="https://wa.me/${config.company.whatsappNumber}" target="_blank" rel="noopener" class="film-contact-link">${config.company.telefoneDisplay}</a>
                </p>
              </div>
              <!-- CTA final apontando para #saiba-mais dentro do fluxo do conteúdo -->
              <div class="film-final-cta">
                <a href="#saiba-mais" class="film-cta-btn">Saiba mais &nbsp;→</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Controles de Navegação e Botão de Pausa (WAI-ARIA Carousel) -->
        <div class="film-controls" role="toolbar" aria-label="Controles da apresentação de produtos">
          <button type="button" class="film-ctrl-btn" id="filmPrevBtn" aria-label="Cena anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button type="button" class="film-ctrl-btn" id="filmPauseBtn" aria-label="Pausar apresentação automática" aria-pressed="false">
            <svg class="icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <svg class="icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button type="button" class="film-ctrl-btn" id="filmNextBtn" aria-label="Próxima cena">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <!-- Barra de progresso das cenas -->
        <div class="film-progress-bar" aria-hidden="true">
          <div class="film-progress-track" id="filmProgressTrack"></div>
        </div>

        <!-- Indicador de scroll inicial -->
        <div class="film-scroll-hint" id="filmScrollHint" aria-hidden="true">
          <div class="film-scroll-line"></div>
          <span>Role para navegar</span>
        </div>

      </div>
    </div>

    <!-- Hero Section -->
    <section class="hero-section" id="hero">
      <div class="container text-center">
        
        <div class="hero-pill">MAQCAPAS</div>

        <h2 class="hero-title">
          Capas para Proteção
        </h2>

        <p class="hero-description">
          Capas para vestidos de festas, vestidos de noivas, daminhas e ternos, e capas sob medida para equipamentos.
        </p>

        <!-- Showcase: FOTOS REAIS COM PICTURE RESPONSIVO -->
        <div class="hero-showcase">
          
          <!-- Card 1: Informática (Equipamentos Sob Medida) -->
          <div class="showcase-card">
            <div class="showcase-media">
              ${renderPictureTag({
                imgKey: 'capa_computador_real.jpg',
                alt: 'Capas sob medida para equipamentos de informática fabricadas pela MAQCAPAS',
                id: 'showcasePhoto0',
                className: 'showcase-img',
                loading: 'eager',
                sizes: '(max-width: 768px) 100vw, 380px'
              })}
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Equipamentos &bull; Sob Medida</span>
              <h3 class="showcase-heading">Capas para Informática</h3>
              <p class="showcase-copy">TNT gramatura 60 e PVC Cristal ou Opaco 010mm</p>
            </div>
          </div>

          <!-- Card 2: Vestuário & Noivas (Sem "sob medida") -->
          <div class="showcase-card">
            <div class="showcase-media">
              ${renderPictureTag({
                imgKey: 'capa_noiva_real.jpg',
                alt: 'Capa para terno, daminhas, noivas e festas em TNT',
                id: 'showcasePhoto1',
                className: 'showcase-img',
                loading: 'eager',
                sizes: '(max-width: 768px) 100vw, 380px'
              })}
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Vestuário</span>
              <h3 class="showcase-heading">Capa para Terno, Daminhas, Noivas e Festas</h3>
              <p class="showcase-copy">TNT gramatura 60</p>
            </div>
          </div>

          <!-- Card 3: Equipamentos Industriais (Sob Medida) -->
          <div class="showcase-card">
            <div class="showcase-media">
              ${renderPictureTag({
                imgKey: 'capa_industrial_real.jpg',
                alt: 'Capa sob medida para equipamentos industriais',
                id: 'showcasePhoto2',
                className: 'showcase-img',
                loading: 'eager',
                sizes: '(max-width: 768px) 100vw, 380px'
              })}
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Equipamentos &bull; Sob Medida</span>
              <h3 class="showcase-heading">Capa para equipamentos industriais</h3>
              <p class="showcase-copy">Confeccionado com material impermeável e resistente</p>
            </div>
          </div>

        </div>

        <!-- Trust Strip (Apenas Fabricação Própria e Envio Nacional) -->
        <div class="trust-strip">
          <div class="trust-item">
            <strong>Fabricação Própria</strong>
            <span>Sem intermediários</span>
          </div>
          <div class="trust-divider"></div>
          <div class="trust-item">
            <strong>Envio Nacional</strong>
            <span>Entrega em todo o Brasil</span>
          </div>
        </div>

      </div>
    </section>

    <!-- Section: Por Que Proteger? -->
    <section class="section section-alt" id="por-que-proteger">
      <div class="container">
        
        <div class="section-header text-center">
          <h2 class="section-title">Por Que Utilizar Capas Protetoras?</h2>
        </div>

        <div class="reasons-grid">
          
          <div class="reason-card reason-card--title-only">
            <span class="reason-index">01</span>
            <h3 class="reason-title">Acidez Residual de Poeira e Umidade</h3>
          </div>

          <div class="reason-card reason-card--title-only">
            <span class="reason-index">02</span>
            <h3 class="reason-title">Atrito e Travamento Mecânico</h3>
          </div>

          <div class="reason-card">
            <span class="reason-index">03</span>
            <h3 class="reason-title">Preservação Têxtil sem Mofo</h3>
            <p class="reason-text">
              Capas em TNT que protegem ternos e vestidos contra poeira e umidade.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- Section: Produtos (Onde dizia Materiais agora diz Produtos com os 5 itens) -->
    <section class="section" id="materiais">
      <div class="container">
        
        <div class="section-header text-center">
          <h2 class="section-title">Produtos</h2>
        </div>

        <div class="materials-grid products-five-grid">
          
          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">Capas para vestido de festas</h3>
            <p class="material-text">TNT gramatura 60</p>
          </div>

          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">Capas para vestidos de noivas</h3>
            <p class="material-text">TNT gramatura 60</p>
          </div>

          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">Capas para daminhas</h3>
            <p class="material-text">TNT gramatura 60</p>
          </div>

          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">Capas para ternos</h3>
            <p class="material-text">TNT gramatura 60</p>
          </div>

          <div class="material-card material-card--wide">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">Capa equipamentos</h3>
            <p class="material-text">Sob medida em TNT gramatura 60 e PVC Cristal ou Opaco 010mm</p>
          </div>

        </div>

      </div>
    </section>

    <!-- Section: Fotos Reais MAQCAPAS -->
    <section class="section section-alt" id="sobre">
      <div class="container">
        <div class="about-single-wrapper">
          <div class="about-media">
            <div class="about-photo-card">
              <div class="about-photo-stage">
                <img src="assets/images/capa_computador_real-800.webp?v=${ASSET_VER}" alt="Capas sob medida para equipamentos de informática fabricadas pela MAQCAPAS" id="aboutPhotoMain" class="about-photo" width="1600" height="1200" loading="lazy" decoding="async">
              </div>
              <div class="about-caption" id="aboutPhotoCaption">
                <strong id="aboutCaptionTitle">MAQCAPAS &bull; Equipamentos</strong>
                <span id="aboutCaptionDesc">Capas sob medida para equipamentos, monitores, gabinetes e teclados em TNT ou PVC Cristal ou Opaco</span>
              </div>
              <div class="about-thumbs" role="tablist" aria-label="Galeria de fotos MAQCAPAS">
                ${renderAboutThumb({
                  imgKey: 'capa_computador_real.jpg',
                  label: 'Informática',
                  alt: 'Capas sob medida para equipamentos de informática fabricadas pela MAQCAPAS',
                  title: 'MAQCAPAS • Equipamentos',
                  desc: 'Capas sob medida para equipamentos, monitores, gabinetes e teclados em TNT ou PVC Cristal ou Opaco',
                  active: true
                })}
                ${renderAboutThumb({
                  imgKey: 'capa_noiva_real.jpg',
                  label: 'Noiva',
                  alt: 'Capas para vestidos de noivas confeccionadas pela MAQCAPAS',
                  title: 'MAQCAPAS • Noivas e Festas',
                  desc: 'Capas para vestidos de noivas, vestido de festas e daminhas em TNT gramatura 60',
                  active: false
                })}
                ${renderAboutThumb({
                  imgKey: 'porta_terno_detalhe_real.jpg',
                  label: 'Porta-Terno',
                  alt: 'Capas para ternos em TNT confeccionadas pela MAQCAPAS',
                  title: 'MAQCAPAS • Ternos',
                  desc: 'Capas para ternos em TNT gramatura 60',
                  active: false
                })}
                ${renderAboutThumb({
                  imgKey: 'capa_industrial_real.jpg',
                  label: 'Equipamentos',
                  alt: 'Capa sob medida para equipamentos confeccionada pela MAQCAPAS',
                  title: 'MAQCAPAS • Equipamentos',
                  desc: 'Capa sob medida para equipamentos confeccionada com material impermeável e resistente',
                  active: false
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Section: Saiba Mais -->
    <section class="section" id="saiba-mais">
      <div class="container">
        <div class="saiba-mais-card text-center">
          <h2 class="section-title">Saiba Mais</h2>
          <p class="saiba-mais-text">
            Aceitamos orçamentos de capas sob medida para equipamentos e sugestões de outros materiais.
          </p>
          <div class="saiba-mais-actions">
            <a href="${mailtoQuoteUrl}" class="btn btn-dark btn-lg" data-tracking-placement="saiba_mais_email">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>Solicitar Orçamento por E-mail</span>
            </a>
            <a href="${mailtoQuoteUrl}" class="saiba-mais-email-link">${config.company.email}</a>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- Clean Footer -->
  <footer class="footer">
    <div class="container footer-grid">
      
      <div class="footer-col-main">
        <div class="footer-brand">
          <span class="footer-title">MAQCAPAS</span>
          <span class="footer-subtitle">CAPAS PARA PROTEÇÃO</span>
        </div>
        <p class="footer-copy">
          Fabricação de capas para proteção.
        </p>
        
        <!-- Bloco Oficial: E-mail e Telefone -->
        <div class="footer-contact-block">
          <p class="footer-contact-item"><strong>E-mail (Orçamentos):</strong> <a href="${mailtoQuoteUrl}" class="footer-link">${config.company.email}</a></p>
          <p class="footer-contact-item"><strong>Telefone / WhatsApp:</strong> <a href="tel:${config.company.telefoneRaw}" class="footer-link">${config.company.telefoneDisplay}</a></p>
          <p class="footer-contact-item">${config.company.cidade} &mdash; ${config.company.estado} &mdash; ${config.company.pais}</p>
        </div>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Produtos</h4>
        <ul class="footer-menu">
          <li><a href="#materiais">Capas para vestido de festas</a></li>
          <li><a href="#materiais">Capas para vestidos de noivas</a></li>
          <li><a href="#materiais">Capas para daminhas</a></li>
          <li><a href="#materiais">Capas para ternos</a></li>
          <li><a href="#materiais">Capa equipamentos</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Navegação</h4>
        <ul class="footer-menu">
          <li><a href="#hero">Início</a></li>
          <li><a href="#por-que-proteger">Por Que Proteger?</a></li>
          <li><a href="#materiais">Produtos</a></li>
          <li><a href="#saiba-mais">Saiba Mais</a></li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>&copy; <span id="currentYear">${currentYear}</span> MAQCAPAS &bull; Todos os direitos reservados.</p>
        <p>Curitiba &bull; Brasil</p>
      </div>
      <div class="container">
        <!-- ASSINATURA MARQ LAB -->
        <div class="marqlab-credit marqlab-credit--dark">
          <a href="https://wa.me/554187084183?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20MAQCAPAS%20e%20gostaria%20de%20um%20or%C3%A7amento%20com%20a%20Marq%20Lab."
             target="_blank" rel="noopener" class="marqlab-credit__link"
             title="Falar com a Marq Lab no WhatsApp (+55 41 8708-4183)"
             data-tracking-placement="footer_marqlab">
            <span class="marqlab-credit__text">Desenvolvido por</span>
            <picture>
              <source srcset="assets/images/marq-lab.webp?v=${ASSET_VER}" type="image/webp">
              <img src="assets/images/marq-lab.png?v=${ASSET_VER}" alt="Logo Marq Lab" class="marqlab-credit__logo" width="28" height="16" loading="lazy">
            </picture>
            <span class="marqlab-credit__brand">Marq Lab</span>
          </a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Discreet Floating Email Button (Orçamentos vão para luizmarnunes18@gmail.com) -->
  <a href="${mailtoQuoteUrl}" class="discreet-whatsapp" aria-label="Solicitar Orçamento por E-mail" data-tracking-placement="floating_button">
    <div class="discreet-tooltip">Orçamento por E-mail</div>
    <div class="discreet-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
    </div>
  </a>

  <!-- Toast -->
  <div class="toast-card" id="toastCard" role="status" aria-live="polite">
    <span id="toastMessage"></span>
  </div>

  <script src="script.js?v=${ASSET_VER}" defer></script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml, 'utf-8');
fs.writeFileSync(path.join(srcDir, 'index.html'), indexHtml, 'utf-8');
console.log('✓ index.html gerado com sucesso em public/ e src/');
console.log('--- Build concluído com sucesso ---');
