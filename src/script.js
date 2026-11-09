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
  initPhotoToggles();
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
        if (p < fadeInEnd) {
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

      const photo = scene.querySelector('.film-scene-photo');
      if (photo && opacity > 0) {
        const localP = clamp((p - start) / SCENE_SPAN, 0, 1);
        const py = (localP * -25).toFixed(1);
        photo.style.backgroundPositionY = `calc(50% + ${py}px)`;
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
      // Pausar
      isAutoAdvancing = false;
      if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
      if (pauseBtn) {
        pauseBtn.classList.add('is-paused');
        pauseBtn.setAttribute('aria-pressed', 'true');
        pauseBtn.setAttribute('aria-label', 'Reproduzir apresentação automática');
      }
      mostrarToast('Apresentação pausada');
    } else {
      // Reproduzir
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
          // Usuário saiu da seção do filme
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

    // Não intercepta se o foco estiver dentro de um campo de formulário
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
   5. ALTERNADOR: FOTO REAL (PADRÃO) vs IMAGEM ILUSTRATIVA (IA)
   ============================================================ */
function initPhotoToggles() {
  // Toggle nos cards do Showcase e Catálogo
  const toggleBtns = document.querySelectorAll('.btn-photo-toggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetImg = document.getElementById(targetId);
      const altSrc = btn.getAttribute('data-alt-src');    // Imagem IA
      const origSrc = btn.getAttribute('data-orig-src');  // Foto Real (Padrão)
      const labelSpan = btn.querySelector('span');

      if (!targetImg) return;

      const currentSrc = targetImg.getAttribute('src');
      const isCurrentlyOrig = currentSrc.includes(origSrc) || (!currentSrc.includes(altSrc));
      const nextSrc = isCurrentlyOrig ? altSrc : origSrc;

      targetImg.style.transition = 'opacity 0.2s ease';
      targetImg.style.opacity = '0.3';

      setTimeout(() => {
        const isNowReal = nextSrc === origSrc || nextSrc.includes('real') || nextSrc.includes('sapatos') || nextSrc.includes('sacola');

        const picture = targetImg.closest('picture');
        if (picture) {
          const sources = picture.querySelectorAll('source');
          sources.forEach(s => {
            const type = s.getAttribute('type') || '';
            const baseNext = nextSrc.replace(/\.[a-zA-Z0-9]+$/, '');
            if (type.includes('avif')) {
              s.srcset = `${baseNext}.avif`;
            } else if (type.includes('webp')) {
              s.srcset = `${baseNext}.webp`;
            } else {
              s.srcset = nextSrc;
            }
          });
        }
        targetImg.src = nextSrc;

        const card = btn.closest('.showcase-card') || btn.closest('.product-item');
        if (card) {
          const badge = card.querySelector('.showcase-badge') || card.querySelector('.product-pill');
          if (badge) {
            if (isNowReal) {
              badge.textContent = 'Foto Real da Oficina';
              badge.classList.add('showcase-badge--real');
            } else {
              badge.textContent = 'Imagem ilustrativa (IA)';
              badge.classList.remove('showcase-badge--real');
            }
          }
        }

        if (isNowReal) {
          btn.classList.add('is-original');
          if (labelSpan) labelSpan.textContent = 'Ver Imagem ilustrativa (IA)';
          mostrarToast('Exibindo foto real de confecção');
        } else {
          btn.classList.remove('is-original');
          if (labelSpan) labelSpan.textContent = 'Ver Foto Real';
          mostrarToast('Exibindo imagem ilustrativa (IA)');
        }
        targetImg.style.opacity = '1';
      }, 150);
    });
  });

  // Toggle nas Cenas do Scroll Film
  const filmToggleBtns = document.querySelectorAll('.btn-film-toggle');
  filmToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sceneId = btn.getAttribute('data-scene');
      const sceneEl = document.getElementById(sceneId);
      if (!sceneEl) return;
      const photoEl = sceneEl.querySelector('.film-scene-photo');
      const tagEl = sceneEl.querySelector('.film-scene-tag');
      const labelSpan = btn.querySelector('span');

      const altBg = btn.getAttribute('data-alt-bg');    // IA
      const origBg = btn.getAttribute('data-orig-bg');  // Real

      const bgStyle = photoEl.style.backgroundImage || '';
      const isAlt = bgStyle.includes(altBg);
      const nextBg = isAlt ? origBg : altBg;

      photoEl.style.transition = 'opacity 0.25s ease';
      photoEl.style.opacity = '0.35';

      setTimeout(() => {
        photoEl.style.backgroundImage = `url('${nextBg}')`;
        const isNowReal = !isAlt;

        if (isNowReal) {
          btn.classList.add('is-original');
          if (labelSpan) labelSpan.textContent = 'Ver Imagem ilustrativa (IA)';
          if (tagEl) {
            tagEl.classList.add('film-scene-tag--real');
            const segName = tagEl.textContent.split('•')[0].trim();
            tagEl.innerHTML = `${segName} &bull; Foto Real de Fabricação`;
          }
          mostrarToast('Exibindo foto real de fabricação');
        } else {
          btn.classList.remove('is-original');
          if (labelSpan) labelSpan.textContent = 'Ver Foto Real';
          if (tagEl) {
            tagEl.classList.remove('film-scene-tag--real');
            const segName = tagEl.textContent.split('•')[0].trim();
            tagEl.innerHTML = `${segName} &bull; Imagem ilustrativa (IA)`;
          }
          mostrarToast('Exibindo imagem ilustrativa (IA)');
        }
        photoEl.style.opacity = '1';
      }, 160);
    });
  });
}

/* ============================================================
   6. GALERIA INTERATIVA DA HISTÓRIA (FOTOS REAIS)
   ============================================================ */
function initAboutGallery() {
  const mainPhoto = document.getElementById('aboutPhotoMain');
  const captionTitle = document.getElementById('aboutCaptionTitle');
  const captionDesc = document.getElementById('aboutCaptionDesc');
  const thumbs = document.querySelectorAll('.about-thumb');

  if (!mainPhoto || !thumbs.length) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      if (thumb.classList.contains('active')) return;

      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      const newSrc = thumb.getAttribute('data-src');
      const newAlt = thumb.getAttribute('data-alt');
      const newTitle = thumb.getAttribute('data-title');
      const newDesc = thumb.getAttribute('data-desc');

      mainPhoto.style.transition = 'opacity 0.22s ease';
      mainPhoto.style.opacity = '0.25';

      setTimeout(() => {
        mainPhoto.src = newSrc;
        if (newAlt) mainPhoto.alt = newAlt;
        if (captionTitle && newTitle) captionTitle.innerHTML = newTitle;
        if (captionDesc && newDesc) captionDesc.innerHTML = newDesc;
        mainPhoto.style.opacity = '1';
      }, 180);
    });
  });
}

/* ============================================================
   7. SIMULADOR DE MEDIDAS & ORÇAMENTO RÁPIDO
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

    const hasDimensions = (widthInput && widthInput.value) || (heightInput && heightInput.value);
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
    } else if (n.includes('noiva') || n.includes('terno') || n.includes('festa')) {
      segmentSelect.value = 'Vestuário (Vestido de Noiva / Festa / Terno)';
    } else if (n.includes('industrial') || n.includes('máquina')) {
      segmentSelect.value = 'Máquinas Industriais / Fábrica';
    } else if (n.includes('sapato') || n.includes('calçado') || n.includes('embalag') || n.includes('sacola') || n.includes('bolsa')) {
      segmentSelect.value = 'Embalagens & Acessórios (Sapatos / Bolsas / Sacolas)';
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
   8. ACCORDIONS DE FAQ
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
   9. RASTREAMENTO SEGURO DE CLIQUES NO WHATSAPP (SEM PII)
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
   10. TOAST DISCRETO & ACESSÍVEL
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
