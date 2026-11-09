/**
 * MAQCAPAS - Script de Interatividade & Acessibilidade
 * Fabricação sob medida desde 1987.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDynamicYears();
  initScrollFilm();
  initHeader();
  initMobileMenu();
  initScrollReveal();
  initCatalogFilter();
  initAboutGallery();
  initSimulator();
  initFAQ();
  initWhatsAppTracking();
});

/* ============================================================
   0. CONTAGEM DINÂMICA DE ANOS E DATA
   ============================================================ */
function initDynamicYears() {
  const currentYear = new Date().getFullYear();
  const foundingYear = 1987;
  const years = currentYear - foundingYear;
  const yearsText = years > 35 ? `${years} Anos` : 'Mais de 35 anos';

  document.querySelectorAll('.calculated-years').forEach(el => {
    el.textContent = yearsText;
  });

  document.querySelectorAll('.calculated-years-number').forEach(el => {
    el.textContent = String(years);
  });

  const yrEl = document.getElementById('currentYear');
  if (yrEl) {
    yrEl.textContent = String(currentYear);
  }
}

/* ============================================================
   1. SCROLL FILM ENGINE — 4 Cenas de Produto com Controles
   ============================================================ */
function initScrollFilm() {
  const film = document.getElementById('scrollFilm');
  if (!film) return;

  const scenes = Array.from(film.querySelectorAll('.film-scene'));
  const hint = document.getElementById('filmScrollHint');
  const progressTrack = document.getElementById('filmProgressTrack');
  const pauseBtn = document.getElementById('filmPauseBtn');
  const prevBtn = document.getElementById('filmPrevBtn');
  const nextBtn = document.getElementById('filmNextBtn');

  const TOTAL = scenes.length;       // 4 cenas
  const SCENE_SPAN = 1 / TOTAL;
  const CROSSFADE = 0.12;

  let currentActive = 0;
  let isAutoAdvancing = false;
  let autoAdvanceTimer = null;

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function getScrollMetrics() {
    const filmH = film.offsetHeight;
    const viewH = window.innerHeight;
    const filmScroll = Math.max(1, filmH - viewH);
    return { filmH, viewH, filmScroll, filmTop: film.offsetTop };
  }

  function scrollToScene(index) {
    const clampedIndex = clamp(index, 0, TOTAL - 1);
    const { filmTop, filmScroll } = getScrollMetrics();
    const targetY = filmTop + (clampedIndex * SCENE_SPAN * filmScroll) + 10;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  function tick() {
    const { filmTop, filmScroll } = getScrollMetrics();
    const scrollY = window.scrollY;

    // Progresso normalizado dentro do filme [0..1]
    const raw = (scrollY - filmTop) / filmScroll;
    const p = clamp(raw, 0, 1);

    // Barra de progresso
    if (progressTrack) {
      const progressPercent = Math.min(100, Math.max(0, (p / 0.98) * 100));
      progressTrack.style.width = progressPercent.toFixed(1) + '%';
    }

    // Hint desaparece quando o usuário inicia a rolagem
    if (hint) {
      hint.style.opacity = clamp(1 - p / 0.06, 0, 1);
    }

    // Determina qual cena mostrar e opacidade correspondente
    scenes.forEach((scene, i) => {
      const start = i * SCENE_SPAN;
      const end = start + SCENE_SPAN;
      const fadeInEnd = start + CROSSFADE;
      const fadeOutStart = end - CROSSFADE;

      let opacity = 0;
      if (p >= start && p <= end) {
        if (i > 0 && p < fadeInEnd) {
          opacity = easeInOut((p - start) / CROSSFADE);
        } else if (p > fadeOutStart && i < TOTAL - 1) {
          opacity = easeInOut(1 - (p - fadeOutStart) / CROSSFADE);
        } else {
          opacity = 1;
        }
      }
      if (i === TOTAL - 1 && p >= start) {
        opacity = easeInOut(clamp((p - start) / CROSSFADE, 0, 1));
      }

      scene.style.opacity = opacity.toFixed(3);

      const isActive = opacity > 0.45;
      if (isActive && !scene.classList.contains('is-active')) {
        scene.classList.add('is-active');
        currentActive = i;
      } else if (!isActive && scene.classList.contains('is-active')) {
        scene.classList.remove('is-active');
      }
    });
  }

  // Throttle com requestAnimationFrame
  let rafId = null;
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => { tick(); rafId = null; });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  tick();

  // Controles de Pausa / Reprodução Automática
  function togglePause() {
    if (isAutoAdvancing) {
      isAutoAdvancing = false;
      if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
      if (pauseBtn) {
        pauseBtn.classList.add('is-paused');
        pauseBtn.setAttribute('aria-pressed', 'true');
        pauseBtn.setAttribute('aria-label', 'Reproduzir apresentação automática');
      }
      mostrarToast('Apresentação pausada');
    } else {
      isAutoAdvancing = true;
      if (pauseBtn) {
        pauseBtn.classList.remove('is-paused');
        pauseBtn.setAttribute('aria-pressed', 'false');
        pauseBtn.setAttribute('aria-label', 'Pausar apresentação automática');
      }
      mostrarToast('Avanço automático ativado');
      autoAdvanceTimer = setInterval(() => {
        const { filmTop, filmScroll } = getScrollMetrics();
        const scrollY = window.scrollY;
        if (scrollY < filmTop - 100 || scrollY > filmTop + filmScroll + 100) {
          return;
        }
        const nextScene = (currentActive + 1) % TOTAL;
        scrollToScene(nextScene);
      }, 4500);
    }
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      scrollToScene(currentActive - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      scrollToScene(currentActive + 1);
    });
  }

  // Controle por Teclado Acessível (ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Space, Home, End)
  window.addEventListener('keydown', (e) => {
    const { filmTop, filmScroll } = getScrollMetrics();
    const scrollY = window.scrollY;
    const isWithinFilm = scrollY >= filmTop - 50 && scrollY <= filmTop + filmScroll + 50;

    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (['input', 'textarea', 'select'].includes(activeTag)) return;

    if (isWithinFilm) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToScene(currentActive + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToScene(currentActive - 1);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        togglePause();
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToScene(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToScene(TOTAL - 1);
      }
    }
  });
}

/* ============================================================
   2. HEADER & MENU MOBILE
   ============================================================ */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const links = document.querySelectorAll('.mobile-nav-item');

  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ============================================================
   3. SCROLL REVEAL - Revelação Suave ao Rolar a Página
   ============================================================ */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('reveal-init');

  const singleSelectors = [
    '.hero-pill',
    '.hero-title',
    '.hero-description',
    '.hero-actions',
    '.section-header',
    '.filter-group',
    '.simulator-card',
    '.about-content',
    '.about-media',
    '.footer-grid',
    '.footer-bottom'
  ];

  singleSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('reveal-item');
      if (sel === '.about-content') el.classList.add('reveal-left');
      if (sel === '.about-media') el.classList.add('reveal-right');
      if (sel === '.simulator-card') el.classList.add('reveal-scale');
    });
  });

  const groupConfigs = [
    { container: '.hero-showcase', items: '.showcase-card' },
    { container: '.trust-strip', items: '.trust-item' },
    { container: '.reasons-grid', items: '.reason-card' },
    { container: '.products-grid', items: '.product-item' },
    { container: '.materials-grid', items: '.material-card' },
    { container: '.faq-container', items: '.faq-row' }
  ];

  groupConfigs.forEach(cfg => {
    const parent = document.querySelector(cfg.container);
    if (!parent) return;
    const elements = parent.querySelectorAll(cfg.items);
    elements.forEach((el, index) => {
      el.classList.add('reveal-item');
      el.setAttribute('data-stagger', ((index % 6) + 1).toString());
    });
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.1
  });

  document.querySelectorAll('.reveal-item').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-revealed');
    } else {
      observer.observe(el);
    }
  });
}

/* ============================================================
   4. FILTRO DE CATÁLOGO & BOTÕES DE COTAÇÃO RÁPIDA
   ============================================================ */
function initCatalogFilter() {
  const filterBtns = document.querySelectorAll('.filter-button');
  const productItems = document.querySelectorAll('.product-item');

  if (!filterBtns.length || !productItems.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      productItems.forEach(item => {
        const category = item.getAttribute('data-category') || '';
        const categories = category.split(' ');
        if (filter === 'all' || categories.includes(filter)) {
          item.style.display = 'flex';
          item.classList.add('is-revealed');
          item.style.opacity = '0';
          item.style.transform = 'translateY(14px)';
          setTimeout(() => {
            item.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, 10);
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  const quoteBtns = document.querySelectorAll('.btn-card-action');
  quoteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const itemTitle = btn.getAttribute('data-item');
      const materialCode = btn.getAttribute('data-material');
      carregarItemNoSimulador(itemTitle, materialCode);
    });
  });
}

/* ============================================================
   5. GALERIA INTERATIVA DA HISTÓRIA (FOTOS REAIS COM PICTURE/SRCSET)
   ============================================================ */
function initAboutGallery() {
  const mainPhoto = document.getElementById('aboutPhotoMain');
  const captionTitle = document.getElementById('aboutCaptionTitle');
  const captionDesc = document.getElementById('aboutCaptionDesc');
  const thumbs = document.querySelectorAll('.about-thumb');

  if (!mainPhoto || !thumbs.length) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
      });
      thumb.classList.add('active');
      thumb.setAttribute('aria-pressed', 'true');

      const newSrc = thumb.getAttribute('data-src');
      const newWidth = thumb.getAttribute('data-width');
      const newHeight = thumb.getAttribute('data-height');
      const newAlt = thumb.getAttribute('data-alt');
      const newTitle = thumb.getAttribute('data-title');
      const newDesc = thumb.getAttribute('data-desc');

      const picture = mainPhoto.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach(s => s.remove());
      }
      mainPhoto.removeAttribute('srcset');

      if (newSrc) mainPhoto.src = newSrc;
      if (newWidth) mainPhoto.setAttribute('width', newWidth);
      if (newHeight) mainPhoto.setAttribute('height', newHeight);
      if (newAlt) mainPhoto.setAttribute('alt', newAlt);

      if (captionTitle && newTitle) captionTitle.textContent = newTitle;
      if (captionDesc && newDesc) captionDesc.textContent = newDesc;

      if (typeof mainPhoto.animate === 'function') {
        mainPhoto.animate(
          [
            { opacity: 0.35, transform: 'scale(0.985)' },
            { opacity: 1, transform: 'scale(1)' }
          ],
          { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }
    });
  });
}

/* ============================================================
   6. SIMULADOR DE MEDIDAS & ORÇAMENTO RÁPIDO
   ============================================================ */
function initSimulator() {
  const form = document.getElementById('simulatorForm');
  const segmentSelect = document.getElementById('calcSegment');
  const materialRadios = document.querySelectorAll('input[name="calcMaterial"]');
  const widthInput = document.getElementById('inputWidth');
  const heightInput = document.getElementById('inputHeight');
  const depthInput = document.getElementById('inputDepth');
  const qtyInput = document.getElementById('inputQty');
  const notesInput = document.getElementById('inputNotes');
  const summaryContent = document.getElementById('liveSummaryText');
  const sendBtn = document.getElementById('btnSendQuote');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }

  if (!summaryContent) return;

  function atualizarResumo() {
    const segmento = segmentSelect ? segmentSelect.value : '';
    let material = 'PVC Cristal Transparente';
    materialRadios.forEach(radio => {
      if (radio.checked) material = radio.value;
    });

    const l = (widthInput && widthInput.value) ? `${widthInput.value} cm` : 'A definir';
    const a = (heightInput && heightInput.value) ? `${heightInput.value} cm` : 'A definir';
    const p = (depthInput && depthInput.value) ? `${depthInput.value} cm` : 'Padrão';
    const qtd = (qtyInput && qtyInput.value) ? qtyInput.value : 1;
    const obs = (notesInput && notesInput.value.trim()) ? notesInput.value.trim() : 'Sem observações extras';

    summaryContent.style.display = 'block';
    summaryContent.classList.remove('is-empty');
    summaryContent.innerHTML = `
      <strong>Aplicação:</strong> ${segmento}<br>
      <strong>Material:</strong> ${material}<br>
      <strong>Dimensões:</strong> ${l} (L) &times; ${a} (A) &times; ${p} (P)<br>
      <strong>Quantidade:</strong> ${qtd} unidade(s) | <strong>Obs:</strong> ${obs}
    `;
  }

  [segmentSelect, widthInput, heightInput, depthInput, qtyInput, notesInput].forEach(elem => {
    if (elem) {
      elem.addEventListener('input', atualizarResumo);
      elem.addEventListener('change', atualizarResumo);
    }
  });

  materialRadios.forEach(radio => {
    radio.addEventListener('change', atualizarResumo);
  });

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const segmento = segmentSelect ? segmentSelect.value : 'Geral';
      let material = 'PVC Cristal Transparente';
      materialRadios.forEach(radio => {
        if (radio.checked) material = radio.value;
      });

      const l = (widthInput && widthInput.value) ? `${widthInput.value} cm` : 'A combinar';
      const a = (heightInput && heightInput.value) ? `${heightInput.value} cm` : 'A combinar';
      const p = (depthInput && depthInput.value) ? `${depthInput.value} cm` : 'A combinar';
      const qtd = (qtyInput && qtyInput.value) ? qtyInput.value : 1;
      const obs = (notesInput && notesInput.value.trim()) ? notesInput.value.trim() : 'Não informado';

      const texto = 
`SOLICITACAO DE ORCAMENTO - MAQCAPAS
Ola. Gostaria de solicitar um orcamento sob medida:

Aplicacao: ${segmento}
Material Preferencial: ${material}
Dimensoes: Largura: ${l} | Altura: ${a} | Profundidade: ${p}
Quantidade: ${qtd} unidade(s)
Observacoes / Modelo: ${obs}

Poderiam informar o valor estimado e prazo de confeccao?`;

      const link = `https://wa.me/554199343814?text=${encodeURIComponent(texto)}`;
      window.open(link, '_blank');
    });
  }

  // Inicializa o resumo com os valores padrão
  atualizarResumo();
}

function carregarItemNoSimulador(nomeItem, materialCode) {
  const notesInput = document.getElementById('inputNotes');
  const segmentSelect = document.getElementById('calcSegment');
  const materialRadios = document.querySelectorAll('input[name="calcMaterial"]');

  if (notesInput) {
    notesInput.value = nomeItem;
  }

  if (segmentSelect) {
    const n = nomeItem.toLowerCase();
    if (n.includes('computador') || n.includes('monitor') || n.includes('teclado')) {
      segmentSelect.value = 'Informática (Monitor / Gabinete / Teclado)';
    } else if (n.includes('noiva') || n.includes('terno') || n.includes('festa') || n.includes('acervo') || n.includes('ateli')) {
      segmentSelect.value = 'Vestuário (Vestido de Noiva / Festa / Terno)';
    } else if (n.includes('industrial') || n.includes('máquina')) {
      segmentSelect.value = 'Máquinas Industriais / Fábrica';
    } else if (n.includes('sacola') || n.includes('embalag')) {
      segmentSelect.value = 'Sacolas & Embalagens Promocionais em TNT';
    } else {
      segmentSelect.value = 'Outros Sob Medida (Móveis / Eletros)';
    }
  }

  if (materialCode && materialRadios.length) {
    materialRadios.forEach(radio => {
      if (materialCode === 'pvc' && radio.value.includes('PVC')) radio.checked = true;
      if (materialCode === 'tnt' && radio.value.includes('TNT')) radio.checked = true;
      if (materialCode === 'bagum' && radio.value.includes('Bagum')) radio.checked = true;
    });
  }

  if (notesInput) {
    notesInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const simulador = document.getElementById('simulador');
  if (simulador) {
    simulador.scrollIntoView({ behavior: 'smooth' });
  }

  mostrarToast(`Item "${nomeItem}" selecionado`);
}

/* ============================================================
   7. ACCORDIONS DE FAQ
   ============================================================ */
function initFAQ() {
  const rows = document.querySelectorAll('.faq-row');

  rows.forEach(row => {
    const btn = row.querySelector('.faq-toggle');
    const pane = row.querySelector('.faq-pane');

    if (!btn || !pane) return;

    btn.addEventListener('click', () => {
      const estaAtivo = row.classList.contains('active');

      rows.forEach(outra => {
        outra.classList.remove('active');
        const outroBtn = outra.querySelector('.faq-toggle');
        const outroPane = outra.querySelector('.faq-pane');
        if (outroBtn) outroBtn.setAttribute('aria-expanded', 'false');
        if (outroPane) outroPane.style.maxHeight = null;
      });

      if (!estaAtivo) {
        row.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        pane.style.maxHeight = pane.scrollHeight + 'px';
      }
    });
  });
}

/* ============================================================
   8. RASTREAMENTO SEGURO DE CLIQUES NO WHATSAPP (SEM PII)
   ============================================================ */
function initWhatsAppTracking() {
  const links = document.querySelectorAll('a[href*="wa.me"]');
  links.forEach(link => {
    link.addEventListener('click', () => {
      const placement = link.getAttribute('data-tracking-placement') || 
                        link.id || 
                        link.className.split(' ')[0] || 
                        'link_whatsapp';
      const eventData = {
        event: 'whatsapp_click',
        placement: placement,
        timestamp: new Date().toISOString()
      };

      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(eventData);
      }

      if (window.__DEBUG_ANALYTICS__ || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.info('[Analytics] WhatsApp Click:', eventData);
      }
    });
  });

  const sendBtn = document.getElementById('btnSendQuote');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const eventData = {
        event: 'whatsapp_click',
        placement: 'simulator_submit',
        timestamp: new Date().toISOString()
      };
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push(eventData);
      }
      if (window.__DEBUG_ANALYTICS__ || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.info('[Analytics] WhatsApp Click:', eventData);
      }
    });
  }
}

/* ============================================================
   9. TOAST DISCRETO & ACESSÍVEL
   ============================================================ */
function mostrarToast(mensagem) {
  const toast = document.getElementById('toastCard');
  const text = document.getElementById('toastMessage');

  if (!toast || !text) return;

  text.textContent = mensagem;
  toast.style.display = 'flex';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (!toast.classList.contains('show')) {
        toast.style.display = 'none';
      }
    }, 300);
  }, 3000);
}
