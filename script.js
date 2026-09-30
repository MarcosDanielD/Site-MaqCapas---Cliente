/**
 * MAQCAPAS - Script de Interatividade Minimalista & Editorial
 * Inclui motor de Scroll Film cinematográfico (parallax + text reveals).
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollFilm();
  initHeader();
  initMobileMenu();
  initCatalogFilter();
  initSimulator();
  initFAQ();
});

/* ============================================================
   SCROLL FILM ENGINE — 4 Cenas de Produto
   Crossfade entre cenas guiado pelo scrollY, sem bibliotecas.
   ============================================================ */
function initScrollFilm() {
  const film = document.getElementById('scrollFilm');
  if (!film) return;

  const scenes       = Array.from(film.querySelectorAll('.film-scene'));
  const hint         = document.getElementById('filmScrollHint');
  const progressTrack = document.getElementById('filmProgressTrack');
  const TOTAL        = scenes.length;       // 4 cenas
  const FILM_H       = film.offsetHeight;   // 650vh em px
  const VIEW_H       = window.innerHeight;
  const FILM_SCROLL  = FILM_H - VIEW_H;     // espaço útil de scroll

  // Cada cena ocupa 1/TOTAL do espaço de scroll,
  // com 15% de overlap/crossfade entre elas
  const SCENE_SPAN   = 1 / TOTAL;
  const CROSSFADE    = 0.12; // fração do span p/ dissolve

  let currentActive = -1;

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function tick() {
    const scrollY  = window.scrollY;
    const filmTop  = film.offsetTop;

    // Progresso normalizado dentro do filme [0..1]
    const raw = (scrollY - filmTop) / FILM_SCROLL;
    const p   = clamp(raw, 0, 1);

    // Barra de progresso (vai de 0% até 100% de toda a largura da tela)
    if (progressTrack) {
      const progressPercent = Math.min(100, Math.max(0, (p / 0.98) * 100));
      progressTrack.style.width = progressPercent.toFixed(1) + '%';
    }

    // Hint some logo que o usuário começa a rolar
    if (hint) {
      hint.style.opacity = clamp(1 - p / 0.06, 0, 1);
    }

    // Determina qual cena mostrar e com qual opacidade
    scenes.forEach((scene, i) => {
      const start = i * SCENE_SPAN;
      const end   = start + SCENE_SPAN;
      const fadeInEnd   = start + CROSSFADE;
      const fadeOutStart = end - CROSSFADE;

      let opacity = 0;
      if (p >= start && p <= end) {
        if (p < fadeInEnd) {
          // Fade in
          opacity = easeInOut((p - start) / CROSSFADE);
        } else if (p > fadeOutStart && i < TOTAL - 1) {
          // Fade out (exceto última cena)
          opacity = easeInOut(1 - (p - fadeOutStart) / CROSSFADE);
        } else {
          opacity = 1;
        }
      }
      // Última cena permanece 100% até o fim
      if (i === TOTAL - 1 && p >= start) {
        opacity = easeInOut(clamp((p - start) / CROSSFADE, 0, 1));
      }

      scene.style.opacity = opacity.toFixed(3);

      // Ativa/desativa classe para animar o texto via CSS transition
      const isActive = opacity > 0.5;
      if (isActive && !scene.classList.contains('is-active')) {
        scene.classList.add('is-active');
        currentActive = i;
      } else if (!isActive && scene.classList.contains('is-active')) {
        scene.classList.remove('is-active');
      }

      // Parallax sutil na foto: sobe levemente conforme a cena progride
      const photo = scene.querySelector('.film-scene-photo');
      if (photo && opacity > 0) {
        const localP = clamp((p - start) / SCENE_SPAN, 0, 1);
        const py = (localP * -30).toFixed(1);
        photo.style.backgroundPositionY = `calc(50% + ${py}px)`;
      }
    });
  }

  // rAF throttle
  let rafId = null;
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => { tick(); rafId = null; });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  tick(); // estado inicial
}


/* --- Header Sombra no Scroll --- */
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

/* --- Menu Mobile Drawer --- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const links = document.querySelectorAll('.mobile-nav-item');

  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    drawer.classList.toggle('open');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
    });
  });
}

/* --- Filtro por Abas do Catálogo --- */
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
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.display = 'flex';
          item.style.opacity = '0';
          setTimeout(() => {
            item.style.transition = 'opacity 0.25s ease';
            item.style.opacity = '1';
          }, 10);
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Botões de Cotação Rápida dentro dos cards
  const quoteBtns = document.querySelectorAll('.btn-card-action');
  quoteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const itemTitle = btn.getAttribute('data-item');
      const materialCode = btn.getAttribute('data-material');
      carregarItemNoSimulador(itemTitle, materialCode);
    });
  });
}

/* --- Simulador de Medidas & WhatsApp --- */
function initSimulator() {
  const segmentSelect = document.getElementById('calcSegment');
  const materialRadios = document.querySelectorAll('input[name="calcMaterial"]');
  const widthInput = document.getElementById('inputWidth');
  const heightInput = document.getElementById('inputHeight');
  const depthInput = document.getElementById('inputDepth');
  const qtyInput = document.getElementById('inputQty');
  const notesInput = document.getElementById('inputNotes');
  const summaryContent = document.getElementById('liveSummaryText');
  const sendBtn = document.getElementById('btnSendQuote');

  if (!summaryContent) return;

  function atualizarResumo() {
    const segmento = segmentSelect.value;
    let material = 'PVC Cristal Transparente';
    materialRadios.forEach(radio => {
      if (radio.checked) material = radio.value;
    });

    const l = widthInput.value ? `${widthInput.value} cm` : 'A definir';
    const a = heightInput.value ? `${heightInput.value} cm` : 'A definir';
    const p = depthInput.value ? `${depthInput.value} cm` : 'Padrao';
    const qtd = qtyInput.value || 1;
    const obs = notesInput.value.trim() ? notesInput.value.trim() : 'Sem observacoes extras';

    summaryContent.innerHTML = `
      <strong>Aplicacao:</strong> ${segmento}<br>
      <strong>Material:</strong> ${material}<br>
      <strong>Dimensoes:</strong> ${l} (L) &times; ${a} (A) &times; ${p} (P)<br>
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
      const segmento = segmentSelect.value;
      let material = 'PVC Cristal Transparente';
      materialRadios.forEach(radio => {
        if (radio.checked) material = radio.value;
      });

      const l = widthInput.value ? `${widthInput.value} cm` : 'A combinar';
      const a = heightInput.value ? `${heightInput.value} cm` : 'A combinar';
      const p = depthInput.value ? `${depthInput.value} cm` : 'A combinar';
      const qtd = qtyInput.value || 1;
      const obs = notesInput.value.trim() ? notesInput.value.trim() : 'Nao informado';

      // Mensagem clean e profissional, sem emojis
      const texto = 
`SOLICITACAO DE ORCAMENTO - MAQCAPAS
Ola. Gostaria de solicitar um orcamento sob medida:

Aplicacao: ${segmento}
Material Preferencial: ${material}
Dimensoes: Largura: ${l} | Altura: ${a} | Profundidade: ${p}
Quantidade: ${qtd} unidade(s)
Observacoes / Modelo: ${obs}

Poderiam informar o valor estimado e prazo de confeccao?`;

      const link = `https://wa.me/5541999343814?text=${encodeURIComponent(texto)}`;
      window.open(link, '_blank');
    });
  }

  atualizarResumo();
}

/* --- Carrega item do catálogo no simulador --- */
function carregarItemNoSimulador(nomeItem, materialCode) {
  const notesInput = document.getElementById('inputNotes');
  const segmentSelect = document.getElementById('calcSegment');
  const materialRadios = document.querySelectorAll('input[name="calcMaterial"]');

  if (notesInput) {
    notesInput.value = nomeItem;
  }

  if (segmentSelect) {
    const n = nomeItem.toLowerCase();
    if (n.includes('computador') || n.includes('monitor')) {
      segmentSelect.value = 'Informática (Monitor / Gabinete / Teclado)';
    } else if (n.includes('noiva') || n.includes('terno') || n.includes('festa')) {
      segmentSelect.value = 'Vestuário (Vestido de Noiva / Festa / Terno)';
    } else if (n.includes('industrial') || n.includes('máquina')) {
      segmentSelect.value = 'Máquinas Industriais / Fábrica';
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

/* --- Accordions de FAQ --- */
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

/* --- Toast Discreto --- */
function mostrarToast(mensagem) {
  const toast = document.getElementById('toastCard');
  const text = document.getElementById('toastMessage');

  if (!toast || !text) return;

  text.textContent = mensagem;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
