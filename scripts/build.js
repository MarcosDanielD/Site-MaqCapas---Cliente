/**
 * scripts/build.js
 * Compilação e geração dos arquivos estáticos em ./public
 * Implementa srcset responsivo (480, 800, 1200, 1600 px), AVIF, WebP, JPG,
 * preload de hero, enquadramento inteligente e dados oficiais do cliente.
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

console.log('--- Iniciando build do MaqCapas ---');
console.log(`Domínio configurado: ${config.domain}`);
console.log(`Telefone: ${config.company.telefoneDisplay} | E-mail: ${config.company.email}`);

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
  <link rel="stylesheet" href="style.css">
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
          <span class="brand-sub">COMÉRCIO DE CAPAS &bull; DESDE 1987</span>
        </div>
      </a>
      <div class="header-action">
        <a href="https://wa.me/${config.company.whatsappNumber}" target="_blank" rel="noopener" class="btn btn-header-cta">
          <span>Atendimento WhatsApp</span>
        </a>
      </div>
    </div>
  </header>

  <main id="main-content" class="container text-center" style="padding: 6rem 1.5rem; min-height: 60vh;">
    <h1 class="hero-title" style="font-size: 3rem; margin-bottom: 1rem;">404</h1>
    <h2 class="section-title" style="margin-bottom: 1.5rem;">Página Não Encontrada</h2>
    <p class="hero-description" style="max-width: 520px; margin: 0 auto 2rem;">
      O endereço solicitado não existe ou foi transferido. Retorne à página inicial para conhecer nosso catálogo de capas de proteção sob medida.
    </p>
    <a href="/" class="btn btn-dark btn-lg">Voltar à Página Inicial</a>
  </main>

  <footer class="footer">
    <div class="container footer-bottom-inner" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 2rem;">
      <p>&copy; 1987 &mdash; ${new Date().getFullYear()} MaqCapas &bull; Curitiba &bull; Brasil</p>
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
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://wa.me;
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
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
`;
fs.writeFileSync(path.join(publicDir, '_headers'), headersTxt, 'utf-8');

// 7. _redirects
fs.writeFileSync(path.join(publicDir, '_redirects'), `/index.html / 301\n`, 'utf-8');

// 8. JSON-LD Schemas
const jsonLdLocalBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "MaqCapas",
  "alternateName": "MAQCAPAS - Comércio de Capas Sob Medida",
  "image": `${config.domain}/assets/images/og-image.jpg`,
  "telephone": config.company.telefoneRaw,
  "email": config.company.email,
  "url": `${config.domain}/`,
  "foundingDate": "1987",
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

const faqItems = [
  {
    q: "Vocês confeccionam capas para medidas não padronizadas?",
    a: "Sim. Essa é a essência do nosso trabalho desde 1987. Produzimos capas com as dimensões exatas de qualquer monitor, impressora, painel de comando ou vestido de noiva longo. Basta informar largura, altura e profundidade."
  },
  {
    q: "Existe quantidade mínima para fazer o pedido?",
    a: "Não. Atendemos clientes particulares a partir de 1 peça única sob medida para uso pessoal, assim como confecções e empresas com pedidos em grandes lotes no atacado."
  },
  {
    q: "Como é realizado o envio para outras regiões do país?",
    a: "Despachamos para todo o território nacional através dos Correios (SEDEX e PAC) ou transportadoras com rastreamento. Para Curitiba e Região Metropolitana, também é possível combinar retirada."
  },
  {
    q: "É possível personalizar as capas com a marca da minha empresa?",
    a: "Sim. Executamos aplicação em serigrafia de alta resolução do logotipo da sua marca nas capas e porta-ternos em TNT para pedidos comerciais."
  }
];

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(item => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.a
    }
  }))
};

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
  const data = manifest[imgKey];
  const baseName = path.parse(imgKey).name;
  const idAttr = id ? ` id="${id}"` : '';
  const fpAttr = fetchpriority ? ` fetchpriority="${fetchpriority}"` : '';

  if (!data || !data.sizes) {
    return `<picture><source srcset="assets/images/${baseName}.webp" type="image/webp"><img src="assets/images/${baseName}.jpg" alt="${alt}" class="${className}"${idAttr} width="800" height="600" loading="${loading}" decoding="${decoding}"${fpAttr}></picture>`;
  }

  const widths = Object.keys(data.sizes).map(Number).sort((a, b) => a - b);
  const avifSrcset = widths.map(w => `assets/images/${baseName}-${w}.avif ${w}w`).join(', ');
  const webpSrcset = widths.map(w => `assets/images/${baseName}-${w}.webp ${w}w`).join(', ');
  const jpgSrcset = widths.map(w => `assets/images/${baseName}-${w}.jpg ${w}w`).join(', ');
  const defaultSrc = `assets/images/${baseName}-${widths[widths.length - 1]}.jpg`;

  return `<picture>
    <source type="image/avif" srcset="${avifSrcset}" sizes="${sizes}">
    <source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">
    <img src="${defaultSrc}" srcset="${jpgSrcset}" sizes="${sizes}" alt="${alt}" class="${className}"${idAttr} width="${data.width}" height="${data.height}" loading="${loading}" decoding="${decoding}"${fpAttr}>
  </picture>`;
}

const currentYear = new Date().getFullYear();
const yearsCalculated = currentYear - config.company.foundingYear;
const yearsText = yearsCalculated > 35 ? `${yearsCalculated} Anos` : 'Mais de 35 anos';

// 9. Gera index.html completo
const indexHtml = `<!DOCTYPE html>
<html lang="${config.meta.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MaqCapas | Capas de Proteção Sob Medida Desde 1987</title>
  <meta name="description" content="${config.company.description}">
  <meta name="theme-color" content="${config.meta.themeColor}">
  <link rel="canonical" href="${config.domain}/">

  <!-- Preload da maior imagem acima da dobra (Hero / Film Scene 0) -->
  <link rel="preload" as="image" href="assets/images/porta_terno_real-960.webp" type="image/webp" fetchpriority="high">

  <!-- Favicons -->
  <link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/icons/favicon-32x32.png">
  <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${config.meta.locale}">
  <meta property="og:site_name" content="${config.company.name}">
  <meta property="og:title" content="MaqCapas | Capas de Proteção Sob Medida Desde 1987">
  <meta property="og:description" content="${config.company.description}">
  <meta property="og:url" content="${config.domain}/">
  <meta property="og:image" content="${config.domain}/assets/images/og-image.jpg">
  <meta property="og:image:width" content="${config.meta.ogImageWidth}">
  <meta property="og:image:height" content="${config.meta.ogImageHeight}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${config.meta.twitterCard}">
  <meta name="twitter:title" content="MaqCapas | Capas de Proteção Sob Medida Desde 1987">
  <meta name="twitter:description" content="${config.company.description}">
  <meta name="twitter:image" content="${config.domain}/assets/images/og-image.jpg">

  <!-- Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="style.css">

  <!-- JSON-LD Structured Data: LocalBusiness -->
  <script type="application/ld+json">
${JSON.stringify(jsonLdLocalBusiness, null, 2)}
  </script>

  <!-- JSON-LD Structured Data: FAQPage -->
  <script type="application/ld+json">
${JSON.stringify(jsonLdFAQ, null, 2)}
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
        <span class="top-tradition">Desde ${config.company.foundingYear}</span>
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
          <span class="brand-sub">COMÉRCIO DE CAPAS &bull; DESDE 1987</span>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="nav-menu" aria-label="Menu principal">
        <a href="#produtos" class="nav-link">Produtos</a>
        <a href="#por-que-proteger" class="nav-link">Por Que Proteger?</a>
        <a href="#materiais" class="nav-link">Materiais</a>
        <a href="#simulador" class="nav-link">Simulador</a>
        <a href="#sobre" class="nav-link">História</a>
        <a href="#faq" class="nav-link">Dúvidas</a>
      </nav>

      <!-- Botão do WhatsApp no Header -->
      <div class="header-action">
        <a href="https://wa.me/${config.company.whatsappNumber}?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20de%20capa%20sob%20medida." target="_blank" rel="noopener" class="btn btn-header-cta" id="headerCtaBtn" data-tracking-placement="header_cta">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="whatsapp-icon" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.199.534 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.044.072.044.419-.1.824z"/></svg>
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
        <a href="#produtos" class="mobile-nav-item">Produtos</a>
        <a href="#por-que-proteger" class="mobile-nav-item">Por Que Proteger?</a>
        <a href="#materiais" class="mobile-nav-item">Materiais</a>
        <a href="#simulador" class="mobile-nav-item">Simulador de Medidas</a>
        <a href="#sobre" class="mobile-nav-item">Quem Somos</a>
        <a href="#faq" class="mobile-nav-item">Dúvidas Frequentes</a>
        <a href="https://wa.me/${config.company.whatsappNumber}" target="_blank" rel="noopener" class="btn btn-dark w-full" data-tracking-placement="mobile_drawer_whatsapp">Falar no WhatsApp ${config.company.telefoneDisplay}</a>
      </nav>
    </div>
  </header>

  <!-- Conteúdo Principal -->
  <main id="main-content">

    <!-- PRIMEIRO TÍTULO DA PÁGINA (H1 estrito para acessibilidade e semântica SEO) -->
    <h1 class="sr-only">MaqCapas &mdash; Fabricação Sob Medida de Capas de Proteção Desde 1987</h1>

    <!-- ════════════════════════════════════════════
         SCROLL FILM / CARROSSEL COM CONTROLES E TECLADO
         ════════════════════════════════════════════ -->
    <div class="scroll-film" id="scrollFilm" role="region" aria-roledescription="carousel" aria-label="Apresentação de produtos em destaque">

      <div class="film-sticky" id="filmSticky">

        <!-- ── Cena 1: Porta-Ternos (PADRÃO: FOTO REAL) ── -->
        <div class="film-scene" id="scene0" role="group" aria-roledescription="slide" aria-label="Cena 1 de 4: Porta-Ternos Executivos">
          <div class="film-scene-photo film-photo-scene0" aria-label="Porta-ternos em TNT com visor transparente de produção real"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">01</span>
              <span class="film-scene-tag film-scene-tag--real">Vestuário &bull; Foto Real de Fabricação</span>
              <h2 class="film-scene-title">O seu terno merece mais<br>do que uma arara.</h2>
              <p class="film-scene-desc">Porta-ternos executivos em TNT respirável com visor em PVC cristal — confeccionados sob medida para proteger o caimento, a gola e a estrutura do tecido.</p>
              <button type="button" class="btn-film-toggle is-original" data-scene="scene0" data-alt-bg="assets/images/porta_terno.webp" data-orig-bg="assets/images/porta_terno_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── Cena 2: Informática (PADRÃO: FOTO REAL) ── -->
        <div class="film-scene" id="scene1" role="group" aria-roledescription="slide" aria-label="Cena 2 de 4: Informática e TI">
          <div class="film-scene-photo film-photo-scene1" aria-label="Conjunto de capas para monitores, gabinete e teclado de fabricação real"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">02</span>
              <span class="film-scene-tag film-scene-tag--real">Informática &bull; Foto Real de Fabricação</span>
              <h2 class="film-scene-title">Poeira e umidade não<br>têm acesso aqui.</h2>
              <p class="film-scene-desc">Capas para monitores, gabinetes e teclados sob medida em TNT técnico ou cristal — corte e acabamento artesanal confeccionados em nossa oficina desde 1987.</p>
              <button type="button" class="btn-film-toggle is-original" data-scene="scene1" data-alt-bg="assets/images/capa_computador.webp" data-orig-bg="assets/images/capa_computador_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── Cena 3: Vestido de Noiva (PADRÃO: FOTO REAL) ── -->
        <div class="film-scene" id="scene2" role="group" aria-roledescription="slide" aria-label="Cena 3 de 4: Vestidos de Noiva e Ateliês">
          <div class="film-scene-photo film-photo-scene2" aria-label="Capa protetora para vestido de noiva confeccionada em TNT respirável"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">03</span>
              <span class="film-scene-tag film-scene-tag--real">Noivas &amp; Alta Costura &bull; Foto Real de Fabricação</span>
              <h2 class="film-scene-title">Cada ponto de renda,<br>guardado para sempre.</h2>
              <p class="film-scene-desc">Capas longas para vestidos de noiva com visor em PVC cristal e fechamento por zíper — preservando a textura e o brilho sem amarelar tecidos finos.</p>
              <button type="button" class="btn-film-toggle is-original" data-scene="scene2" data-alt-bg="assets/images/capa_noiva_terno.webp" data-orig-bg="assets/images/capa_noiva_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── Cena 4: Industrial (PADRÃO: FOTO REAL) ── -->
        <div class="film-scene" id="scene3" role="group" aria-roledescription="slide" aria-label="Cena 4 de 4: Maquinário Industrial">
          <div class="film-scene-photo film-photo-scene3" aria-label="Capa industrial resistente sob medida para maquinário pesado"></div>
          <div class="film-scene-panel">
            <div class="film-scene-content">
              <span class="film-scene-num">04</span>
              <span class="film-scene-tag film-scene-tag--real">Maquinário Industrial &bull; Produção Real</span>
              <h2 class="film-scene-title">Do torno mecânico ao<br>painel de comando.</h2>
              <p class="film-scene-desc">Capas industriais sob medida em lona reforçada — confeccionadas para proteger equipamentos contra poeira abrasiva, cavacos e respingos de operação.</p>
              <button type="button" class="btn-film-toggle is-original" data-scene="scene3" data-alt-bg="assets/images/capa_industrial.webp" data-orig-bg="assets/images/capa_industrial_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
          </div>
          <!-- CTA final apontando para #produtos -->
          <div class="film-final-cta">
            <a href="#produtos" class="film-cta-btn">Ver todos os produtos &nbsp;→</a>
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
        
        <div class="hero-pill">Confecção Técnica e Têxtil Desde 1987</div>

        <h2 class="hero-title">
          Capas de Proteção Sob Medida para Equipamentos, Vestuário e Indústria
        </h2>

        <p class="hero-description">
          Preserve seus bens contra a ação contínua da poeira e da umidade. Desenvolvemos capas sob medida em PVC Cristal transparente e TNT respirável, com confecção própria em Curitiba e envio para todo o território nacional.
        </p>

        <div class="hero-actions">
          <a href="https://wa.me/${config.company.whatsappNumber}?text=Olá!%20Gostaria%20de%20um%20orçamento%20de%20capa%20sob%20medida." target="_blank" rel="noopener" class="btn btn-dark btn-lg" data-tracking-placement="hero_cta">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="whatsapp-icon" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.199.534 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.044.072.044.419-.1.824z"/></svg>
            <span>Solicitar Orçamento</span>
          </a>
          <a href="#produtos" class="btn btn-outline btn-lg">Ver Produtos</a>
        </div>

        <!-- Showcase: FOTOS REAIS COM PICTURE RESPONSIVO -->
        <div class="hero-showcase">
          
          <!-- Card 1: Informática (FOTO REAL ESCOLHIDA) -->
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
              <button type="button" class="btn-photo-toggle is-original" data-target="showcasePhoto0" data-alt-src="assets/images/capa_computador.webp" data-orig-src="assets/images/capa_computador_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Informática &amp; TI</span>
              <h3 class="showcase-heading">Capas para Monitores, Gabinetes e Teclados</h3>
              <p class="showcase-copy">Corte sob medida em TNT estruturado ou PVC Cristal transparente.</p>
            </div>
          </div>

          <!-- Card 2: Vestuário & Noivas (FOTO REAL ESCOLHIDA) -->
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
              <button type="button" class="btn-photo-toggle is-original" data-target="showcasePhoto1" data-alt-src="assets/images/capa_noiva_terno.webp" data-orig-src="assets/images/capa_noiva_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Alta Costura &amp; Ateliês</span>
              <h3 class="showcase-heading">Capas para Noivas e Porta-Ternos</h3>
              <p class="showcase-copy">TNT respirável que protege rendas, sedas e armações contra mofo e poeira.</p>
            </div>
          </div>

          <!-- Card 3: Indústria (FOTO REAL ESCOLHIDA) -->
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
              <button type="button" class="btn-photo-toggle is-original" data-target="showcasePhoto2" data-alt-src="assets/images/capa_industrial.webp" data-orig-src="assets/images/capa_industrial_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
            <div class="showcase-info">
              <span class="showcase-category">Indústria &amp; Oficinas</span>
              <h3 class="showcase-heading">Capas para Máquinas Industriais</h3>
              <p class="showcase-copy">Proteção pesada reforçada contra fuligem, pó abrasivo e respingos de óleos.</p>
            </div>
          </div>

        </div>

        <!-- Trust Strip -->
        <div class="trust-strip">
          <div class="trust-item">
            <strong class="calculated-years" data-base-year="${config.company.foundingYear}">${yearsText}</strong>
            <span>De tradição ininterrupta</span>
          </div>
          <div class="trust-divider"></div>
          <div class="trust-item">
            <strong>Sob Medida</strong>
            <span>Corte para qualquer dimensão</span>
          </div>
          <div class="trust-divider"></div>
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
          
          <div class="reason-card">
            <span class="reason-index">01</span>
            <h3 class="reason-title">Acidez Residual de Poeira e Umidade</h3>
            <p class="reason-text">
              Partículas em suspensão no ar acumulam umidade ambiente, formando uma camada que acelera a oxidação de contatos metálicos, fiações e conectores desprotegidos.
            </p>
          </div>

          <div class="reason-card">
            <span class="reason-index">02</span>
            <h3 class="reason-title">Atrito e Travamento Mecânico</h3>
            <p class="reason-text">
              O depósito de pó abrasivo em eixos de impressoras, engrenagens e teclados eleva o atrito operacional, acelerando o desgaste precoce de componentes móveis.
            </p>
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

    <!-- Section: Produtos -->
    <section class="section" id="produtos">
      <div class="container">

        <div class="section-header text-center">
          <span class="section-tag">Portfólio de Fabricação</span>
          <h2 class="section-title">Catálogo de Capas Sob Encomenda</h2>
          <p class="section-subtitle">
            Cada produto pode ser solicitado em dimensões padronizadas ou confeccionado de acordo com o seu desenho e necessidade específica.
          </p>
        </div>

        <!-- Filter Buttons -->
        <div class="filter-group">
          <button class="filter-button active" data-filter="all">Todos os Modelos</button>
          <button class="filter-button" data-filter="tech">Informática &amp; TI</button>
          <button class="filter-button" data-filter="couture">Vestuário &amp; Noivas</button>
          <button class="filter-button" data-filter="industrial">Indústria &amp; Acessórios</button>
        </div>

        <!-- Products Grid: FOTOS REAIS COMO PADRÃO COM SRCSET COMPLETO -->
        <div class="products-grid">
          
          <!-- Produto 1: Informática -->
          <article class="product-item" data-category="tech">
            <div class="product-frame">
              ${renderPictureTag({
                imgKey: 'capa_computador_real.jpg',
                alt: 'Capas para gabinetes e monitores sob medida',
                id: 'photoTech',
                className: 'product-photo',
                loading: 'lazy',
                sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
              })}
              <span class="product-pill">Informática &bull; Foto Real</span>
              <button type="button" class="btn-photo-toggle is-original" data-target="photoTech" data-alt-src="assets/images/capa_computador.webp" data-orig-src="assets/images/capa_computador_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)" aria-label="Alternar para imagem ilustrativa IA">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
            <div class="product-details">
              <h3 class="product-name">Capas para Monitores, Gabinetes e Teclados</h3>
              <p class="product-description">
                Proteção para computadores de mesa, telas ultra-wide e periféricos. Fabricadas em TNT técnico estruturado ou PVC Cristal impermeável.
              </p>
              <ul class="product-points">
                <li>Passagens traseiras livres para cabos conectados</li>
                <li>Limpeza prática com pano levemente umedecido</li>
                <li>Ajuste exato para telas de 14 a 65 polegadas</li>
              </ul>
              <div class="product-action">
                <button type="button" class="btn btn-card-action" data-item="Capas para Computadores e Monitores" data-material="pvc">
                  <span>Cotar Este Modelo</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Produto 2: Noivas -->
          <article class="product-item" data-category="couture">
            <div class="product-frame">
              ${renderPictureTag({
                imgKey: 'capa_noiva_real.jpg',
                alt: 'Capas longas para vestidos de noiva confeccionadas em TNT respirável',
                id: 'photoBridal',
                className: 'product-photo',
                loading: 'lazy',
                sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
              })}
              <span class="product-pill">Ateliê &amp; Noivas &bull; Foto Real</span>
              <button type="button" class="btn-photo-toggle is-original" data-target="photoBridal" data-alt-src="assets/images/capa_noiva_terno.webp" data-orig-src="assets/images/capa_noiva_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)" aria-label="Alternar para imagem ilustrativa IA">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
            <div class="product-details">
              <h3 class="product-name">Capas Longas para Vestidos de Noiva e Festa</h3>
              <p class="product-description">
                Estruturadas com fole lateral expansivo para acomodar tules, armações volumosas e caudas sem comprimir o tecido.
              </p>
              <ul class="product-points">
                <li>TNT respirável que reduz a retenção de umidade</li>
                <li>Visor frontal transparente para rápida identificação</li>
                <li>Zíper frontal reforçado com cursores suaves</li>
              </ul>
              <div class="product-action">
                <button type="button" class="btn btn-card-action" data-item="Capas para Vestidos de Noiva e Festa" data-material="tnt">
                  <span>Cotar Este Modelo</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Produto 3: Porta-Ternos -->
          <article class="product-item" data-category="couture">
            <div class="product-frame">
              ${renderPictureTag({
                imgKey: 'porta_terno_real.jpg',
                alt: 'Porta-ternos executivos com visor transparente',
                id: 'photoSuit',
                className: 'product-photo',
                loading: 'lazy',
                sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
              })}
              <span class="product-pill">Alfaiataria &bull; Foto Real</span>
              <button type="button" class="btn-photo-toggle is-original" data-target="photoSuit" data-alt-src="assets/images/porta_terno.webp" data-orig-src="assets/images/porta_terno_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)" aria-label="Alternar para imagem ilustrativa IA">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
            <div class="product-details">
              <h3 class="product-name">Porta-Ternos Executivos com Visor</h3>
              <p class="product-description">
                Cuidado para trajes formais, blazers e smokings. Abertura central por zíper e visor em cristal para conferência rápida.
              </p>
              <ul class="product-points">
                <li>Passador reforçado anti-rasgo para cabide</li>
                <li>Opção de estampa serigráfica com a marca da sua alfaiataria</li>
                <li>Alças na base para transporte dobrado em viagens</li>
              </ul>
              <div class="product-action">
                <button type="button" class="btn btn-card-action" data-item="Porta-Ternos Executivos com Visor" data-material="tnt">
                  <span>Cotar Este Modelo</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Produto 4: Industrial -->
          <article class="product-item" data-category="industrial">
            <div class="product-frame">
              ${renderPictureTag({
                imgKey: 'capa_industrial_real.jpg',
                alt: 'Capas para máquinas industriais sob medida',
                id: 'photoInd',
                className: 'product-photo',
                loading: 'lazy',
                sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
              })}
              <span class="product-pill">Indústria &bull; Foto Real</span>
              <button type="button" class="btn-photo-toggle is-original" data-target="photoInd" data-alt-src="assets/images/capa_industrial.webp" data-orig-src="assets/images/capa_industrial_real.webp" title="Alternar entre foto real e imagem ilustrativa (IA)" aria-label="Alternar para imagem ilustrativa IA">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Ver Imagem ilustrativa (IA)</span>
              </button>
            </div>
            <div class="product-details">
              <h3 class="product-name">Capas para Máquinas Industriais e Equipamentos</h3>
              <p class="product-description">
                Confeccionadas em materiais de alta densidade como lona bagum reforçada para proteção de centros de usinagem, tornos e painéis elétricos.
              </p>
              <ul class="product-points">
                <li>Barreira de alta resistência contra cavacos, poeira pesada e óleos</li>
                <li>Costura com linha de nylon de alta tenacidade</li>
                <li>Opção de ilhoses ou fechos de velcro para amarração firme</li>
              </ul>
              <div class="product-action">
                <button type="button" class="btn btn-card-action" data-item="Capas para Máquinas Industriais" data-material="bagum">
                  <span>Cotar Este Modelo</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Produto 5: Embalagens para Calçados -->
          <article class="product-item" data-category="industrial couture">
            <div class="product-frame">
              ${renderPictureTag({
                imgKey: 'embalagem_sapatos.png',
                alt: 'Embalagens protetoras para calçados e artigos finos com visor transparente',
                id: 'photoShoes',
                className: 'product-photo',
                loading: 'lazy',
                sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
              })}
              <span class="product-pill">Acessórios &bull; Foto Real</span>
            </div>
            <div class="product-details">
              <h3 class="product-name">Embalagens Protetoras para Calçados e Artigos Finos</h3>
              <p class="product-description">
                Sacos organizadores sob medida em TNT respirável com visor em PVC cristal e cordão duplo ajustável. Proteção contra atrito, poeira e arranhões para calçados, bolsas e itens finos.
              </p>
              <ul class="product-points">
                <li>Visor frontal em cristal para identificação sem abrir o saco</li>
                <li>Cordão duplo ajustável com fechamento suave e seguro</li>
                <li>Material respirável que auxilia na conservação de couros e tecidos</li>
              </ul>
              <div class="product-action">
                <button type="button" class="btn btn-card-action" data-item="Embalagens para Calçados e Artigos Finos" data-material="tnt">
                  <span>Cotar Este Modelo</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </article>

          <!-- Produto 6: Sacolas TNT -->
          <article class="product-item" data-category="industrial">
            <div class="product-frame">
              ${renderPictureTag({
                imgKey: 'sacola_tnt.jpg',
                alt: 'Sacolas promocionais e ecobags em TNT sob encomenda',
                id: 'photoBags',
                className: 'product-photo',
                loading: 'lazy',
                sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
              })}
              <span class="product-pill">Institucional &bull; Foto Real</span>
            </div>
            <div class="product-details">
              <h3 class="product-name">Sacolas Promocionais e Ecobags em TNT</h3>
              <p class="product-description">
                Sacolas ecológicas resistentes para marcas, eventos corporativos, feiras e ateliês. Acabamento reforçado em costura e possibilidade de estampa da sua logomarca.
              </p>
              <ul class="product-points">
                <li>Alças reforçadas com costura em cruz para maior capacidade de carga</li>
                <li>Opção de estampa serigráfica personalizada</li>
                <li>Material reutilizável, sustentável e de fácil higienização</li>
              </ul>
              <div class="product-action">
                <button type="button" class="btn btn-card-action" data-item="Sacolas Promocionais em TNT" data-material="tnt">
                  <span>Cotar Este Modelo</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </article>

        </div>

      </div>
    </section>

    <!-- Section: Simulador de Medidas -->
    <section class="section section-alt" id="simulador">
      <div class="container">
        
        <div class="section-header text-center">
          <span class="section-tag">Orçamento rápido</span>
          <h2 class="section-title">Simulador de Medidas Sob Demanda</h2>
          <p class="section-subtitle">
            Informe as dimensões do seu equipamento ou vestuário. O sistema monta a ordem técnica para envio direto ao WhatsApp da fábrica.
          </p>
        </div>

        <div class="simulator-card">
          <form id="simulatorForm" class="simulator-form">
            
            <div class="form-grid">
              <div class="form-group">
                <label for="calcSegment" class="form-label">Aplicação Principal:</label>
                <select id="calcSegment" class="form-control">
                  <option value="Informática (Monitor / Gabinete / Teclado)">Informática (Monitor, CPU, Teclado)</option>
                  <option value="Vestuário (Vestido de Noiva / Festa / Terno)">Vestuário (Vestido de Noiva, Festa, Terno)</option>
                  <option value="Máquinas Industriais / Fábrica">Máquinas Industriais e Equipamentos</option>
                  <option value="Embalagens &amp; Acessórios (Sapatos / Bolsas / Sacolas)">Embalagens e Acessórios em TNT</option>
                  <option value="Outros Sob Medida (Móveis / Eletros)">Outros Modelos Sob Medida</option>
                </select>
              </div>

              <div class="form-group">
                <span class="form-label">Material Desejado:</span>
                <div class="radio-selector">
                  <label class="radio-option">
                    <input type="radio" name="calcMaterial" value="PVC Cristal Transparente" checked>
                    <span>PVC Cristal (Impermeável)</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" name="calcMaterial" value="TNT Respirável Técnico">
                    <span>TNT Respirável (Anti-Mofo)</span>
                  </label>
                  <label class="radio-option">
                    <input type="radio" name="calcMaterial" value="Lona Bagum Industrial">
                    <span>Lona Bagum (Uso Pesado)</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <span class="form-label">Dimensões em Centímetros (Aproximadas):</span>
              <div class="dimensions-grid">
                <div class="dim-box">
                  <label for="inputWidth" class="dim-caption">Largura (cm)</label>
                  <input type="number" id="inputWidth" class="form-control" placeholder="Ex: 60" min="1" max="1000">
                </div>
                <div class="dim-box">
                  <label for="inputHeight" class="dim-caption">Altura (cm)</label>
                  <input type="number" id="inputHeight" class="form-control" placeholder="Ex: 45" min="1" max="1000">
                </div>
                <div class="dim-box">
                  <label for="inputDepth" class="dim-caption">Profundidade (cm)</label>
                  <input type="number" id="inputDepth" class="form-control" placeholder="Ex: 20" min="0" max="1000">
                </div>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="inputQty" class="form-label">Quantidade de Peças:</label>
                <input type="number" id="inputQty" class="form-control" value="1" min="1" max="10000">
              </div>
              <div class="form-group">
                <label for="inputNotes" class="form-label">Marca, Modelo ou Observações:</label>
                <input type="text" id="inputNotes" class="form-control" placeholder="Ex: Monitor Dell 27 pol / Zíper frontal">
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-title">Resumo das Especificações:</div>
              <div id="liveSummaryText" class="summary-content" aria-live="polite"></div>
            </div>

            <button type="button" id="btnSendQuote" class="btn btn-dark btn-submit w-full" data-tracking-placement="simulator_submit">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" class="whatsapp-icon" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.199.534 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.044.072.044.419-.1.824z"/></svg>
              <span>Enviar Especificações para o WhatsApp ${config.company.telefoneDisplay}</span>
            </button>

            <p class="form-note">
              Atendimento direto com os modelistas da MaqCapas. Respondemos com orçamento e prazo de confecção.
            </p>

          </form>
        </div>

      </div>
    </section>

    <!-- Section: Materiais -->
    <section class="section" id="materiais">
      <div class="container">
        
        <div class="section-header text-center">
          <span class="section-tag">Engenharia de Fabricação</span>
          <h2 class="section-title">Materiais Selecionados</h2>
          <p class="section-subtitle">
            Selecionamos matérias-primas estruturadas para resistência mecânica, flexibilidade e barreira protetora para o uso contínuo.
          </p>
        </div>

        <div class="materials-grid">
          
          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">PVC Cristal Calandrado</h3>
            <p class="material-text">
              Material flexível de alta transparência com plastificantes que evitam o ressecamento precoce. Proporciona barreira protetora contra respingos, sujidades e poeira ambiente.
            </p>
          </div>

          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">TNT Técnico Respirável</h3>
            <p class="material-text">
              Estrutura não-tecida em 100% polipropileno de gramatura encorpada. Permite aeração natural dos tecidos finos, minimizando a retenção de umidade e odores.
            </p>
          </div>

          <div class="material-card">
            <div class="material-marker" aria-hidden="true">&mdash;</div>
            <h3 class="material-name">Solda Eletrônica de Alta Frequência</h3>
            <p class="material-text">
              União molecular contínua entre as lâminas de plástico que reforça as junções das bordas, sem linhas aparentes sujeitas a desfiamento.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- Section: Sobre a Empresa -->
    <section class="section section-alt" id="sobre">
      <div class="container">
        
        <div class="about-grid">
          
          <div class="about-content">
            <span class="section-tag">História e Compromisso</span>
            <h2 class="section-title">Protegendo o Patrimônio de Clientes Desde 1987</h2>
            <p class="about-text">
              Fundada em 1987 na cidade de Curitiba, a <strong>MaqCapas</strong> iniciou sua trajetória atendendo os primeiros polos de processamento de dados e oficinas de alta costura que precisavam de soluções personalizadas de proteção.
            </p>
            <p class="about-text">
              Mais de <span class="calculated-years-number" data-base-year="${config.company.foundingYear}">${yearsCalculated}</span> anos depois, mantemos a confecção artesanal própria com cortes precisos, atendendo desde pedidos unitários de clientes domésticos e ateliês de noivas até indústrias automotivas e têxteis em todo o Brasil.
            </p>
            <div class="about-action">
              <a href="https://wa.me/${config.company.whatsappNumber}" target="_blank" rel="noopener" class="btn btn-dark" data-tracking-placement="about_whatsapp">
                <span>Falar Conosco no WhatsApp</span>
              </a>
            </div>
          </div>

          <div class="about-media">
            <div class="about-photo-card">
              <div class="about-photo-badge">Registro Original de Fabricação</div>
              ${renderPictureTag({
                imgKey: 'capa_computador_real.jpg',
                alt: 'Foto original de capas para informática fabricadas sob medida pela MaqCapas',
                id: 'aboutPhotoMain',
                className: 'about-photo',
                loading: 'lazy',
                sizes: '(max-width: 768px) 100vw, 540px'
              })}
              <div class="about-caption" id="aboutPhotoCaption">
                <strong id="aboutCaptionTitle">Oficina MaqCapas &bull; Curitiba / PR</strong>
                <span id="aboutCaptionDesc">Registro autêntico de confecção sob medida para informática (monitor, gabinete e teclado)</span>
              </div>
              <div class="about-thumbs" aria-label="Galeria de fotos originais de confecção">
                <button type="button" class="about-thumb active" data-src="assets/images/capa_computador_real.webp" data-alt="Conjunto de informática na oficina" data-title="Oficina MaqCapas &bull; Curitiba / PR" data-desc="Registro autêntico de confecção sob medida para informática (monitor, gabinete e teclado)">
                  <img src="assets/images/capa_computador_real-480.webp" alt="Informática" width="480" height="360" loading="lazy">
                  <span>Informática</span>
                </button>
                <button type="button" class="about-thumb" data-src="assets/images/capa_noiva_real.webp" data-alt="Capa para vestido de noiva confeccionada na oficina" data-title="Vestidos de Noiva &bull; MaqCapas" data-desc="Capa sob medida para vestido de noiva com fole expansivo e visor em PVC cristal">
                  <img src="assets/images/capa_noiva_real-480.webp" alt="Noiva Real" width="480" height="790" loading="lazy">
                  <span>Noiva</span>
                </button>
                <button type="button" class="about-thumb" data-src="assets/images/porta_terno_detalhe_real.webp" data-alt="Detalhe de confecção de porta-ternos executivos" data-title="Alfaiataria &bull; Detalhe de Acabamento" data-desc="Acabamento refinado de porta-ternos em TNT estruturado e visor em cristal">
                  <img src="assets/images/porta_terno_detalhe_real-480.webp" alt="Porta-Terno Detalhe" width="480" height="640" loading="lazy">
                  <span>Porta-Terno</span>
                </button>
                <button type="button" class="about-thumb" data-src="assets/images/embalagem_sapatos.webp" data-alt="Embalagens para calçados com visor" data-title="Acessórios &bull; Embalagens TNT" data-desc="Sacos protetores para calçados com visor transparente em PVC cristal">
                  <img src="assets/images/embalagem_sapatos-473.webp" alt="Embalagens" width="473" height="324" loading="lazy">
                  <span>Embalagens</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- Section: FAQ -->
    <section class="section" id="faq">
      <div class="container">

        <div class="section-header text-center">
          <span class="section-tag">Dúvidas Frequentes</span>
          <h2 class="section-title">Perguntas Comuns</h2>
          <p class="section-subtitle">
            Esclarecimentos sobre confecção sob medida, prazos e entrega nacional.
          </p>
        </div>

        <div class="faq-container">
          
          <div class="faq-row">
            <button class="faq-toggle" aria-expanded="false">
              <span>Vocês confeccionam capas para medidas não padronizadas?</span>
              <span class="faq-indicator" aria-hidden="true">+</span>
            </button>
            <div class="faq-pane">
              <p>Sim. Essa é a essência do nosso trabalho desde 1987. Produzimos capas com as dimensões exatas de qualquer monitor, impressora, painel de comando ou vestido de noiva longo. Basta informar largura, altura e profundidade.</p>
            </div>
          </div>

          <div class="faq-row">
            <button class="faq-toggle" aria-expanded="false">
              <span>Existe quantidade mínima para fazer o pedido?</span>
              <span class="faq-indicator" aria-hidden="true">+</span>
            </button>
            <div class="faq-pane">
              <p>Não. Atendemos clientes particulares a partir de 1 peça única sob medida para uso pessoal, assim como confecções e empresas com pedidos em grandes lotes no atacado.</p>
            </div>
          </div>

          <div class="faq-row">
            <button class="faq-toggle" aria-expanded="false">
              <span>Como é realizado o envio para outras regiões do país?</span>
              <span class="faq-indicator" aria-hidden="true">+</span>
            </button>
            <div class="faq-pane">
              <p>Despachamos para todo o território nacional através dos Correios (SEDEX e PAC) ou transportadoras com rastreamento. Para Curitiba e Região Metropolitana, também é possível combinar retirada.</p>
            </div>
          </div>

          <div class="faq-row">
            <button class="faq-toggle" aria-expanded="false">
              <span>É possível personalizar as capas com a marca da minha empresa?</span>
              <span class="faq-indicator" aria-hidden="true">+</span>
            </button>
            <div class="faq-pane">
              <p>Sim. Executamos aplicação em serigrafia de alta resolução do logotipo da sua marca nas capas e porta-ternos em TNT para pedidos comerciais.</p>
            </div>
          </div>

        </div>

      </div>
    </section>

  </main>

  <!-- Clean Footer com Apenas os 2 Dados Oficiais Solicitados: Telefone e E-mail -->
  <footer class="footer">
    <div class="container footer-grid">
      
      <div class="footer-col-main">
        <div class="footer-brand">
          <span class="footer-title">MAQCAPAS</span>
          <span class="footer-subtitle">COMÉRCIO DE CAPAS SOB MEDIDA</span>
        </div>
        <p class="footer-copy">
          Fabricação sob medida de capas de proteção técnica e têxtil. Preservando maquinários, informática e alfaiataria fina desde 1987.
        </p>
        
        <!-- Bloco Oficial: Apenas Telefone e E-mail -->
        <div class="footer-contact-block">
          <p class="footer-contact-item"><strong>Telefone / WhatsApp:</strong> <a href="tel:${config.company.telefoneRaw}" class="footer-link">${config.company.telefoneDisplay}</a></p>
          <p class="footer-contact-item"><strong>E-mail:</strong> <a href="mailto:${config.company.email}" class="footer-link">${config.company.email}</a></p>
          <p class="footer-contact-item">${config.company.cidade} &mdash; ${config.company.estado} &mdash; ${config.company.pais}</p>
        </div>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Linhas</h4>
        <ul class="footer-menu">
          <li><a href="#produtos">Informática &amp; Monitores</a></li>
          <li><a href="#produtos">Vestidos de Noiva</a></li>
          <li><a href="#produtos">Porta-Ternos Executivos</a></li>
          <li><a href="#produtos">Capas Industriais</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Navegação</h4>
        <ul class="footer-menu">
          <li><a href="#hero">Início</a></li>
          <li><a href="#por-que-proteger">Por Que Proteger?</a></li>
          <li><a href="#produtos">Catálogo</a></li>
          <li><a href="#simulador">Simulador</a></li>
          <li><a href="#sobre">História</a></li>
          <li><a href="#faq">Dúvidas</a></li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>&copy; 1987 &mdash; <span id="currentYear">${currentYear}</span> MaqCapas &bull; Todos os direitos reservados.</p>
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
              <source srcset="assets/images/marq-lab.webp" type="image/webp">
              <img src="assets/images/marq-lab.png" alt="Logo Marq Lab" class="marqlab-credit__logo" width="28" height="16" loading="lazy">
            </picture>
            <span class="marqlab-credit__brand">Marq Lab</span>
          </a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Discreet Floating WhatsApp -->
  <a href="https://wa.me/${config.company.whatsappNumber}?text=Olá!%20Gostaria%20de%20um%20orçamento%20de%20capa%20sob%20medida." target="_blank" rel="noopener" class="discreet-whatsapp" aria-label="Atendimento no WhatsApp" data-tracking-placement="floating_button">
    <div class="discreet-tooltip">Orçamento no WhatsApp</div>
    <div class="discreet-icon">
      <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor" class="whatsapp-icon" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.199.534 1.286.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.044.072.044.419-.1.824z"/></svg>
    </div>
  </a>

  <!-- Toast -->
  <div class="toast-card" id="toastCard" role="status" aria-live="polite">
    <span id="toastMessage"></span>
  </div>

  <script src="script.js" defer></script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml, 'utf-8');
fs.writeFileSync(path.join(srcDir, 'index.html'), indexHtml, 'utf-8');
console.log('✓ index.html gerado com sucesso em public/ e src/');
console.log('--- Build concluído com sucesso ---');
