window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  const INPUT_SEL = '#search'; // інпут
  const HEADER_SEL = '.header-bottom'; // хедер
  const INDEX_URL = 'https://zakupeace.biz.ua/webflow/search/search-index.php';
  const MIN_CHARS = 2;
  const MAX_RESULTS = 20;
  const GAP = 6; // відступ під хедером
  const overlay = document.querySelector('.screen-overlay');

  // Змінні для блокування прокрутки
  let scrollPosition = 0;
  let isScrollLocked = false;

  const input = document.querySelector(INPUT_SEL);
  const header = document.querySelector(HEADER_SEL);
  if (!input || !header) return;

  function isMobile() { return window.innerWidth <= 767; }

  /* === ФУНКЦІЯ ДЛЯ РОЗРАХУНКУ ДОДАТКОВОГО ВІДСТУПУ === */
  function getScrollNowOffset() {
    const headerNavbar = document.querySelector('.header-navbar');
    if (!headerNavbar || !headerNavbar.classList.contains('scroll-now')) {
      return 0;
    }

    // Розраховуємо відступ на основі медіа-запитів
    if (window.innerWidth >= 992) {
      // Desktop: -4.8em
      const fontSize = parseFloat(getComputedStyle(headerNavbar).fontSize) || 16;
      return -4.8 * fontSize;
    } else if (window.innerWidth <= 991) {
      // Mobile: -6.2em
      const fontSize = parseFloat(getComputedStyle(headerNavbar).fontSize) || 16;
      return -6.2 * fontSize;
    }

    return 0;
  }

  /* === АНКОР ПІСЛЯ ХЕДЕРА === */
  const anchor = document.createElement('div');
  anchor.className = 'search-dd-anchor';
  header.insertAdjacentElement('afterend', anchor);

  // "4 730 UAH" -> 4730
  function priceNumber(s) {
    if (!s) return null;
    const m = String(s).match(/[-+]?[0-9][0-9\s.,]*/);
    if (!m) return null;
    let num = m[0].replace(/\s| /g, ''); // звич. і нерозривний пробіл
    if (num.includes(',') && num.includes('.')) num = num.replace(/,/g, '');
    else num = num.replace(',', '.');
    const n = parseFloat(num);
    return Number.isFinite(n) ? n : null;
  }

  /* === DROPDOWN === */
  const dd = document.createElement('div');
  dd.className = 'search-dd';
  anchor.appendChild(dd);

  /* мобільна шапка всередині дропдауна */
  let ddHeader = null;
  if (isMobile()) {
    ddHeader = document.createElement('div');
    ddHeader.className = 'sd-header';
    ddHeader.innerHTML = `
      <div class="sd-title">Результати: <span class="sd-count">0</span></div>
      <button type="button" class="sd-close" aria-label="Закрити">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    `;
    dd.appendChild(ddHeader);
  }

  /* контейнер для елементів, щоб не перезаписувати шапку */
  const ddList = document.createElement('div');
  ddList.className = 'sd-list';
  dd.appendChild(ddList);

  /* ---- Позиціювання: під інпутом, не перекриваючи його ---- */
  function positionDD() {
    const ir = input.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const headerMob = document.querySelector('.header-navbar')?.getBoundingClientRect();

    // Отримуємо додатковий відступ від класу scroll-now
    const scrollNowOffset = getScrollNowOffset();

    if (isMobile()) {
      // мобільна — на всю ширину з полями 8px
      // ТЕСТ: для absolute position не додаємо pageYOffset
      dd.style.top = document.querySelector('.wrapper').getBoundingClientRect().height + 'px';
      //dd.style.top = (ir.bottom + 2 + scrollNowOffset) + 'px'; // ТЕСТ: прибрали window.pageYOffset для absolute
      dd.style.left = '8px';
      dd.style.width = 'calc(100vw - 16px)';
    } else {
      // десктоп — одразу під інпутом з невеликим відступом
      // ТЕСТ: для absolute position не додаємо pageXOffset/pageYOffset
      // ORIGINAL: dd.style.top = (ir.bottom + window.pageYOffset + GAP + scrollNowOffset) + 'px';
      // ORIGINAL: dd.style.left = (ir.left + window.pageXOffset) + 'px';
      //dd.style.top = (ir.bottom + GAP + scrollNowOffset) + 'px'; // ТЕСТ: прибрали window.pageYOffset
      dd.style.left = ir.left + 'px'; // ТЕСТ: прибрали window.pageXOffset
      dd.style.width = ir.width + 'px';
    }
  }

  // оновлюємо при скролі/резайзі/фокусі
  let ticking = false;

  function schedule() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        positionDD();
        ticking = false;
      });
    }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  input.addEventListener('focus', schedule);
  new ResizeObserver(schedule).observe(header);
  new ResizeObserver(schedule).observe(input);

  // Спостерігач за змінами класу scroll-now у header-navbar
  const headerNavbar = document.querySelector('.header-navbar');
  if (headerNavbar) {
    const classObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Клас змінився, оновлюємо позицію dropdown
          schedule();
        }
      });
    });

    classObserver.observe(headerNavbar, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /* ==== Кеш індексу ==== */
  let INDEX = null;
  const LS_KEY = 'search-index-v1';
  const LS_TTL = 24 * 60 * 60 * 1000;

  // ОДНОРАЗОВЕ ОЧИЩЕННЯ localStorage - ВИДАЛИТИ ПІСЛЯ ОНОВЛЕННЯ!
  // localStorage.removeItem(LS_KEY);
  // localStorage.removeItem('search-page-index-v1');
  // console.log('LocalStorage очищено для оновлення даних');

  async function loadIndex() {
    if (INDEX) return INDEX;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.time < LS_TTL && cached.data && cached.data.items) {
          INDEX = cached.data;
          return INDEX;
        }
      }
    } catch (e) {}
    const res = await fetch(INDEX_URL, { cache: 'force-cache' });
    INDEX = await res.json();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        time: Date.now(),
        data: INDEX
      }));
    } catch (e) {}
    return INDEX;
  }

  /* ==== Пошук ==== */
  const norm = s => (s || '').toLowerCase().trim();

  function searchLocal(q, items) {
    q = norm(q);
    if (!q) return [];
    const out = [];
    for (const it of items) {
      if (norm(it.t).includes(q)) { out.push(it); }
    }
    return out;
  }

  function escapeHtml(s = '') {
    return s.replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [m]));
  }

  /* === Функції блокування прокрутки === */
  function lockScroll() {
    if (isScrollLocked) return;

    scrollPosition = window.pageYOffset;

    // Зберігаємо поточну позицію хедера
    const headerNavbar = document.querySelector('.header-navbar');
    if (headerNavbar) {
      headerNavbar.style.top = '0';
    }

    //document.body.style.top = `-${scrollPosition}px`;
    document.body.classList.add('search-open');
    isScrollLocked = true;
  }

  function unlockScroll() {
    if (!isScrollLocked) return;

    document.body.classList.remove('search-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
    isScrollLocked = false;
  }

  /* === Функції відкриття/закриття === */
  function openDD() {
    dd.classList.add('open');
    overlay?.classList.add('active');
    lockScroll(); // блокуємо прокрутку
    schedule(); // одразу виставляємо правильну позицію
  }

  function closeDD() {
    dd.classList.remove('open');
    overlay?.classList.remove('active');
    unlockScroll(); // розблоковуємо прокрутку
    ddList.innerHTML = '';
  }

  function render(results) {
    if (!results.length) {
      closeDD();
      return;
    }

    ddList.innerHTML = results.map(p => {
      // беремо поточну та стару ціну (підтримує кілька назв поля на майбутнє)
      const priceStr = p.p || p.price || '';
      const oldStr = p.op || p.old || p.old_price || p.compare_at_price || '';
      const priceNum = priceNumber(priceStr);
      const oldNum = priceNumber(oldStr);
      const hasOld = oldNum && priceNum && oldNum > priceNum;
      const discount = hasOld ? Math.round(((oldNum - priceNum) / oldNum) * 100) : 0;

      return `
      <a class="s-item" href="${p.u}">
        ${p.img ? `<img class="s-img" src="${p.img}" alt="">` : ''}
        <div class="s-info">
          <div class="s-title">${escapeHtml(p.t)}</div>

          <div class="s-price-row">
            <div class="s-price-wrap">
              ${hasOld ? `<div class="s-old">${escapeHtml(oldStr)}</div>` : ''}
              <div class="s-price">${escapeHtml(priceStr)}</div>
              ${hasOld ? `<div class="s-badge">-${discount}%</div>` : ''}
            </div>

            <img class="s-arrow" src="https://cdn.prod.website-files.com/6511ef558d67afe353cac882/68a30849b50267d026de02d9_arrow-up-right-svgrepo-com.svg" alt="">
          </div>
        </div>
      </a>
    `;
    }).join('');
    if (isMobile() && ddHeader) {
      // оновлюємо лічильник результатів
      const countEl = ddHeader.querySelector('.sd-count');
      if (countEl) countEl.textContent = results.length;
    }

    openDD();
  }

  /* ==== Ввід з debounce ==== */
  let timer;
  const debounced = (fn, ms = 250) => (...a) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...a), ms);
  };

  const onInput = debounced(async () => {
    const q = input.value.trim();
    if (q.length < MIN_CHARS) {
      closeDD(); // використовуємо closeDD() замість прямого маніпулювання
      return;
    }
    const data = await loadIndex();
    render(searchLocal(q, data.items || []));
  }, 200);

  input.addEventListener('input', onInput);
  input.addEventListener('focus', async () => {
    await loadIndex();
    if (input.value.trim()
      .length >= MIN_CHARS) onInput();
  });

  if (isMobile() && ddHeader) {
    // Обробник кнопки закриття
    const closeBtn = ddHeader.querySelector('.sd-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeDD();
        input.blur(); // ховаємо клавіатуру на мобільних
      });
    }
  }

  // Закриття по клавіші ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDD();
    }
  });

  // Блокування прокрутки колесом миші та тач-жестами (тільки поза дропдауном)
  document.addEventListener('wheel', (e) => {
    if (isScrollLocked && !dd.contains(e.target)) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (isScrollLocked && !dd.contains(e.target)) {
      e.preventDefault();
    }
  }, { passive: false });

  // Додаткова обробка для прокрутки всередині дропдауна
  dd.addEventListener('wheel', (e) => {
    // Дозволяємо прокрутку всередині дропдауна
    e.stopPropagation();
  }, { passive: true });

  dd.addEventListener('touchmove', (e) => {
    // Дозволяємо прокрутку всередині дропдауна
    e.stopPropagation();
  }, { passive: true });

  // Закриття поза дропдауном
  document.addEventListener('click', (e) => {
    if (e.target !== input && !dd.contains(e.target)) {
      closeDD();
    }
  });

  // Enter → стандартний сабміт (на /search?query=..)
  const form = input.closest('form');
  if (form) { form.addEventListener('submit', () => {}); }
});
