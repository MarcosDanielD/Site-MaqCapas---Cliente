/**
 * scripts/build.js
 * Compilação e geração dos arquivos estáticos em ./public
 * Implementa srcset responsivo (480, 800, 1200, 1600 px), AVIF, WebP, JPG,
 * preload de hero, enquadramento 4:3 centralizado (somente fotos reais) e dados oficiais do cliente.
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
const ASSET_VER = '20261116v3';

const currentYear = new Date().getFullYear();
const mailtoQuoteUrl = `mailto:${config.company.email}?subject=${encodeURIComponent('Solicitação de Orçamento - MaqCapas')}&body=${encodeURIComponent('Olá! Gostaria de solicitar um orçamento de capa sob medida.')}`;

console.log('--- Iniciando build do MaqCapas ---');
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

// 3. 404.html
const html404 = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página Não Encontrada | MaqCapas</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32x32.png">
  <link rel="stylesheet" href="style.css?v=${ASSET_VER}">
</head>
<body class="error-page">
  <div class="top-bar">
    <div class="top-bar-inner">
      <span>Fabricação própria em Curitiba/PR &bull; Envio para todo o Brasil</span>
      <div class="top-bar-links">
        <a href="tel:${config.company.telefoneRaw}" class="top-phone">${config.company.telefoneDisplay}</a>
      </div>
    </div>
  </div>

  <header class="header">
    <div class="header-container">
      <a href="/" class="brand" aria-label="MaqCapas Início">
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
          <span class="brand-sub">COMÉRCIO DE CAPAS SOB MEDIDA</span>
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
      O endereço solicitado não existe ou foi transferido. Retorne à página inicial para conhecer nossas capas de proteção sob medida.
    </p>
    <a href="/" class="btn btn-dark btn-lg">Voltar à Página Inicial</a>
  </main>

  <footer class="footer">
    <div class="container footer-bottom-inner" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 2rem;">
      <p>&copy; ${currentYear} MaqCapas &bull; Curitiba &bull; Brasil</p>
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

// 7. _redirects
fs.writeFileSync(path.join(publicDir, '_redirects'), `/index.html / 301\n`, 'utf-8');

// 8. JSON-LD Schema: LocalBusiness
const jsonLdLocalBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "MaqCapas",
  "alternateName": "MAQCAPAS - Comércio de Capas Sob Medida",
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
  <title>MaqCapas | Capas de Proteção Sob Medida</title>
  <meta name="description" content="${config.company.description}">
  <meta name="theme-color" content="${config.meta.themeColor}">
  <link rel="canonical" href="${config.domain}/">

  <!-- Preload da maior imagem acima da dobra (Hero / Film Scene 0) -->
  <link rel="preload" as="image" href="assets/images/porta_terno_real-960.webp?v=${ASSET_VER}" type="image/webp" fetchpriority="high">

  <!-- Favicons -->
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32x32.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${config.meta.locale}">
  <meta property="og:site_name" content="${config.company.name}">
  <meta property="og:title" content="MaqCapas | Capas de Proteção Sob Medida">
  <meta property="og:description" content="${config.company.description}">
  <meta property="og:url" content="${config.domain}/">
  <meta property="og:image" content="${config.domain}/assets/images/og-image.jpg">
  <meta property="og:image:width" content="${config.meta.ogImageWidth}">
  <meta property="og:image:height" content="${config.meta.ogImageHeight}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${config.meta.twitterCard}">
  <meta name="twitter:title" content="MaqCapas | Capas de Proteção Sob Medida">
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
      <span>Fabricação própria em Curitiba/PR &bull; Atendimento sob medida com envio para todo o Brasil</span>
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
      <a href="#hero" class="brand" aria-label="MaqCapas - Página Inicial">
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
          <span class="brand-sub">COMÉRCIO DE CAPAS SOB MEDIDA</span>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="nav-menu" aria-label="Menu principal">
        <a href="#hero" class="nav-link">Início</a>
        <a href="#por-que-proteger" class="nav-link">Por Que Proteger?</a>
        <a href="#materiais" class="nav-link">Materiais</a>
        <a href="#sobre" class="nav-link">Oficina</a>
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
        <a href="#materiais" class="mobile-nav-item">Materiais</a>
        <a href="#sobre" class="mobile-nav-item">Oficina MaqCapas</a>
        <a href="#saiba-mais" class="mobile-nav-item">Saiba Mais</a>
        <a href="${mailtoQuoteUrl}" class="btn btn-dark w-full" data-tracking-placement="mobile_drawer_email">Orçamento por E-mail (${config.company.email})</a>
      </nav>
    </div>
  </header>

  <!-- Conteúdo Principal -->
  <main id="main-content">

    <!-- PRIMEIRO TÍTULO DA PÁGINA (H1 estrito para acessibilidade e semântica SEO) -->
    <h1 class="sr-only">MaqCapas &mdash; Fabricação de Capas para Proteção Sob Medida</h1>

    <!-- ════════════════════════════════════════════
         SCROLL FILM / CARROSSEL COM FOTOS REAIS
         ════════════════════════════════════════════ -->
    <div class="scroll-film" id="scrollFilm" role="region" aria-roledescription="carousel" aria-label="Apresentação de produtos em destaque">

      <div class="film-sticky" id="filmSticky">

        <!-- ── Cena 1: Porta-Ternos (FOTO REAL) ── -->
        <div class="film-scene is-active" id="scene0" role="group" aria-roledescription="slide" aria-label="Cena 1 de 4: Porta-Ternos Executivos">
          <div class="film-scene-photo film-photo-scene0" aria-label="Porta-ternos em TNT com visor transparente de produção real"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">01</span>
              <span class="film-scene-tag film-scene-tag--real">Vestuário &bull; Foto Real de Fabricação</span>
              <h2 class="film-scene-title">O seu terno merece mais<br>do que uma arara.</h2>
              <p class="film-scene-desc">Porta-ternos executivos em TNT respirável com visor em PVC cristal — confeccionados sob medida para proteger o caimento, a gola e a estrutura do tecido.</p>
            </div>
          </div>
        </div>

        <!-- ── Cena 2: Informática (FOTO REAL) ── -->
        <div class="film-scene" id="scene1" role="group" aria-roledescription="slide" aria-label="Cena 2 de 4: Informática e TI">
          <div class="film-scene-photo film-photo-scene1" aria-label="Conjunto de capas para monitores, gabinete e teclado de fabricação real"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">02</span>
              <span class="film-scene-tag film-scene-tag--real">Informática &bull; Foto Real de Fabricação</span>
              <h2 class="film-scene-title">Poeira e umidade não<br>têm acesso aqui.</h2>
              <p class="film-scene-desc">Capas para monitores, gabinetes e teclados sob medida em TNT técnico ou cristal — corte e acabamento artesanal confeccionados em nossa oficina.</p>
            </div>
          </div>
        </div>

        <!-- ── Cena 3: Vestido de Noiva (FOTO REAL) ── -->
        <div class="film-scene" id="scene2" role="group" aria-roledescription="slide" aria-label="Cena 3 de 4: Vestidos de Noiva e Ateliês">
          <div class="film-scene-photo film-photo-scene2" aria-label="Capa protetora para vestido de noiva confeccionada em TNT respirável"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">03</span>
              <span class="film-scene-tag film-scene-tag--real">Noivas &amp; Alta Costura &bull; Foto Real de Fabricação</span>
              <h2 class="film-scene-title">Cada ponto de renda,<br>guardado para sempre.</h2>
              <p class="film-scene-desc">Capas longas para vestidos de noiva com visor em PVC cristal e fechamento por zíper — preservando a textura e o brilho sem amarelar tecidos finos.</p>
            </div>
          </div>
        </div>

        <!-- ── Cena 4: Contato (E-mail, Telefone e WhatsApp) ── -->
        <div class="film-scene" id="scene3" role="group" aria-roledescription="slide" aria-label="Cena 4 de 4: Contato MaqCapas">
          <div class="film-scene-photo film-photo-scene3" aria-label="Capa industrial resistente sob medida fabricada pela MaqCapas"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">04</span>
              <span class="film-scene-tag film-scene-tag--real">Atendimento &bull; Contato Direto</span>
              <h2 class="film-scene-title">Entre em Contato<br>com a MaqCapas.</h2>
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
            </div>
          </div>
          <!-- CTA final apontando para #saiba-mais -->
          <div class="film-final-cta">
            <a href="#saiba-mais" class="film-cta-btn">Saiba mais &nbsp;→</a>
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
        
        <div class="hero-pill">Confecção Técnica e Têxtil</div>

        <h2 class="hero-title">
          Capas de Proteção Sob Medida para Equipamentos, Vestuário e Indústria
        </h2>

        <p class="hero-description">
          Preserve seus bens contra a ação contínua da poeira e da umidade. Desenvolvemos capas sob medida em PVC Cristal ou Opaco e TNT respirável, com confecção própria em Curitiba e envio para todo o território nacional.
        </p>

        <!-- Showcase: FOTOS REAIS COM PICTURE RESPONSIVO -->
        <div class="hero-showcase">
          
          <!-- Card 1: Informática -->
          <div class="showcase-card">
            <div class="showcase-media">
              ${renderPictureTag({
                imgKey: 'capa_computador_real.jpg',
                alt: 'Conjunto de capas para informática fabricadas sob medida na oficina MaqCapas',
                id: 'showcasePhoto0',
                className: 'showcase-img',
                loading: 'eager',
                sizes: '(max-width: 768px) 100vw, 380px'
              })}
              <span class="showcase-badge showcase-badge--real">Foto Real de Oficina</span>
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Informática &amp; TI</span>
              <h3 class="showcase-heading">Capas para Informática</h3>
              <p class="showcase-copy">TNT gramatura 60 e PVC Cristal ou Opaco 010mm</p>
            </div>
          </div>

          <!-- Card 2: Vestuário & Noivas -->
          <div class="showcase-card">
            <div class="showcase-media">
              ${renderPictureTag({
                imgKey: 'capa_noiva_real.jpg',
                alt: 'Capa protetora para vestido de noiva confeccionada em TNT respirável na oficina',
                id: 'showcasePhoto1',
                className: 'showcase-img',
                loading: 'eager',
                sizes: '(max-width: 768px) 100vw, 380px'
              })}
              <span class="showcase-badge showcase-badge--real">Foto Real de Oficina</span>
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Alta Costura &amp; Ateliês</span>
              <h3 class="showcase-heading">Capa para Terno, Daminhas, Noivas e Festas</h3>
              <p class="showcase-copy">TNT respirável que protege rendas, sedas e armações contra mofo e poeira.</p>
            </div>
          </div>

          <!-- Card 3: Indústria -->
          <div class="showcase-card">
            <div class="showcase-media">
              ${renderPictureTag({
                imgKey: 'capa_industrial_real.jpg',
                alt: 'Capa técnica industrial fabricada sob medida para maquinário pesado',
                id: 'showcasePhoto2',
                className: 'showcase-img',
                loading: 'eager',
                sizes: '(max-width: 768px) 100vw, 380px'
              })}
              <span class="showcase-badge showcase-badge--real">Produção Real</span>
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Indústria &amp; Oficinas</span>
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
          <span class="section-tag">Fundamento Técnico</span>
          <h2 class="section-title">Por Que Utilizar Capas Protetoras?</h2>
          <p class="section-subtitle">
            A poeira comum aliada à umidade do ar age silenciosamente, provocando reações químicas e atritos mecânicos que degradam equipamentos e tecidos.
          </p>
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
              Vestidos de noiva e trajes finos fechados em plásticos comuns condensam umidade e amarelam. Capas em TNT respirável favorecem a troca de ar e protegem contra sujidades.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- Section: Materiais (Apenas PVC Cristal ou Opaco e TNT Técnico Respirável) -->
    <section class="section" id="materiais">
      <div class="container">
        
        <div class="section-header text-center">
          <span class="section-tag">Engenharia de Fabricação</span>
          <h2 class="section-title">Materiais Selecionados</h2>
          <p class="section-subtitle">
            Selecionamos matérias-primas estruturadas para resistência mecânica, flexibilidade e barreira protetora para o uso contínuo.
          </p>
        </div>

        <div class="materials-grid materials-grid--two">
          
          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">PVC Cristal ou Opaco</h3>
            <p class="material-text">
              Material flexível com plastificantes que evitam o ressecamento precoce. Proporciona barreira protetora contra respingos, sujidades e poeira ambiente.
            </p>
          </div>

          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">TNT Técnico Respirável</h3>
            <p class="material-text">
              Estrutura não-tecida em 100% polipropileno de gramatura encorpada. Permite aeração natural dos tecidos finos, minimizando a retenção de umidade e odores.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- Section: Oficina MaqCapas (Somente o bloco de fotos reais da oficina) -->
    <section class="section section-alt" id="sobre">
      <div class="container">
        <div class="section-header text-center">
          <span class="section-tag">Oficina MaqCapas</span>
          <h2 class="section-title">Registros Reais de Fabricação</h2>
        </div>
        <div class="about-single-wrapper">
          <div class="about-media">
            <div class="about-photo-card">
              <div class="about-photo-stage">
                <div class="about-photo-badge">Registro Original de Fabricação</div>
                <img src="assets/images/capa_computador_real-800.webp?v=${ASSET_VER}" alt="Foto original de capas para informática fabricadas sob medida pela MaqCapas" id="aboutPhotoMain" class="about-photo" width="1600" height="1200" loading="lazy" decoding="async">
              </div>
              <div class="about-caption" id="aboutPhotoCaption">
                <strong id="aboutCaptionTitle">Oficina MaqCapas &bull; Curitiba / PR</strong>
                <span id="aboutCaptionDesc">Registro autêntico de confecção sob medida para informática (monitor, gabinete e teclado)</span>
              </div>
              <div class="about-thumbs" role="tablist" aria-label="Galeria de fotos originais de confecção">
                ${renderAboutThumb({
                  imgKey: 'capa_computador_real.jpg',
                  label: 'Informática',
                  alt: 'Foto original de capas para informática fabricadas sob medida pela MaqCapas',
                  title: 'Oficina MaqCapas • Curitiba / PR',
                  desc: 'Registro autêntico de confecção sob medida para informática (monitor, gabinete e teclado)',
                  active: true
                })}
                ${renderAboutThumb({
                  imgKey: 'capa_noiva_real.jpg',
                  label: 'Noiva',
                  alt: 'Capa protetora para vestido de noiva confeccionada na oficina MaqCapas',
                  title: 'Alta Costura & Noivas • MaqCapas',
                  desc: 'Capa sob medida em TNT respirável com visor em PVC cristal e fechamento por zíper',
                  active: false
                })}
                ${renderAboutThumb({
                  imgKey: 'porta_terno_detalhe_real.jpg',
                  label: 'Porta-Terno',
                  alt: 'Detalhe de acabamento de porta-terno executivo com visor cristal',
                  title: 'Alfaiataria • Detalhe de Acabamento',
                  desc: 'Acabamento refinado de porta-ternos em TNT estruturado com visor transparente e zíper reforçado',
                  active: false
                })}
                ${renderAboutThumb({
                  imgKey: 'capa_industrial_real.jpg',
                  label: 'Industrial',
                  alt: 'Capa técnica industrial confeccionada sob medida para maquinário',
                  title: 'Linha Industrial • Produção Própria',
                  desc: 'Capas técnicas sob medida de alta resistência para proteção de máquinas e painéis operacionais',
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
          <span class="section-tag">Saiba Mais</span>
          <h2 class="section-title">Orçamentos Sob Medida e Outros Materiais</h2>
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
          <span class="footer-subtitle">COMÉRCIO DE CAPAS SOB MEDIDA</span>
        </div>
        <p class="footer-copy">
          Fabricação de capas para proteção sob medida.
        </p>
        
        <!-- Bloco Oficial: E-mail e Telefone -->
        <div class="footer-contact-block">
          <p class="footer-contact-item"><strong>E-mail (Orçamentos):</strong> <a href="${mailtoQuoteUrl}" class="footer-link">${config.company.email}</a></p>
          <p class="footer-contact-item"><strong>Telefone / WhatsApp:</strong> <a href="tel:${config.company.telefoneRaw}" class="footer-link">${config.company.telefoneDisplay}</a></p>
          <p class="footer-contact-item">${config.company.cidade} &mdash; ${config.company.estado} &mdash; ${config.company.pais}</p>
        </div>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Linhas</h4>
        <ul class="footer-menu">
          <li><a href="#hero">Informática</a></li>
          <li><a href="#hero">Vestidos, noivas e festas</a></li>
          <li><a href="#hero">Capas Industriais</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Navegação</h4>
        <ul class="footer-menu">
          <li><a href="#hero">Início</a></li>
          <li><a href="#por-que-proteger">Por Que Proteger?</a></li>
          <li><a href="#materiais">Materiais</a></li>
          <li><a href="#sobre">Oficina MaqCapas</a></li>
          <li><a href="#saiba-mais">Saiba Mais</a></li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>&copy; <span id="currentYear">${currentYear}</span> MaqCapas &bull; Todos os direitos reservados.</p>
        <p>Curitiba &bull; Brasil</p>
      </div>
      <div class="container">
        <!-- ASSINATURA MARQ LAB -->
        <div class="marqlab-credit marqlab-credit--dark">
          <a href="https://wa.me/554187084183?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20MaqCapas%20e%20gostaria%20de%20um%20or%C3%A7amento%20com%20a%20Marq%20Lab."
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
