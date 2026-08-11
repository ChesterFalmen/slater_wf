window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  // ===== НАЛАШТУВАННЯ =====
  const HEADER_SEL = '.header-section'; // селектор твоєї шапки
  const LINK_PREFIX = '#sec'; // якірні лінки типу #sec1, #sec2...
  const LINK_SELECTOR = `a[href^="${LINK_PREFIX}"]`;
  const SMOOTH = true; // плавний скрол

  // ===== УТИЛІТИ =====

  function animateScrollTo(to, duration = 800) {
    const start = window.pageYOffset;
    const change = to - start;
    const startTime = performance.now();

    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);

      window.scrollTo(0, start + change * eased);

      if (elapsed < duration) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function getHeaderH() {
    let offset = 0;

    const h = document.querySelector('.header-section');
    if (h) offset += h.getBoundingClientRect().height + 10;

    // 👉 додаткова умова для мобільних
    if (window.innerWidth < 480) {
      const extra = document.querySelector('.right-static-container');
      if (extra) offset += (extra.getBoundingClientRect().height - 10);
    }

    return offset;
  }

  const scrollToTarget = (id, updateHash = true) => {
    const target = document.getElementById(id);
    if (!target) {
      console.log('[scrollToTarget] not found:', id);
      return;
    }

    const headerH = getHeaderH();
    const y = target.getBoundingClientRect().top + window.pageYOffset - headerH;

    console.log('[scrollToTarget]', { id, headerH, y });
    animateScrollTo(y, 800);

    if (updateHash) history.pushState(null, '', `#${id}`);
  };

  // (опційно) якщо деякі посилання створюються динамічно — делегування на весь документ
  const delegatedClick = (e) => {
    const a = e.target.closest(LINK_SELECTOR);
    if (!a) return;

    const href = a.getAttribute('href') || '';
    if (!href.startsWith(LINK_PREFIX)) return;

    const id = decodeURIComponent(href.slice(1));
    if (!document.getElementById(id)) return;

    // блокуємо дефолтний webflow-скрол
    e.preventDefault();
    e.stopImmediatePropagation();

    console.log('[click]', id);
    scrollToTarget(id, true);
  };

  // 1) вішаємо делегований хендлер (покриває і CMS-рендери)
  document.addEventListener('click', delegatedClick, { passive: false });

  // 2) на всяк випадок — пряме підключення до вже наявних лінків
  document.querySelectorAll(LINK_SELECTOR).forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      console.log('[click direct]', id);
      scrollToTarget(id, true);
    }, { passive: false });
  });

  // 3) якщо сторінка відкрилась уже з хешем — докручуємо з відступом
  if (location.hash && location.hash.startsWith(LINK_PREFIX)) {
    const id = decodeURIComponent(location.hash.slice(1));
    requestAnimationFrame(() => scrollToTarget(id, false));
  }

  // 4) підтримка назад/вперед у браузері
  window.addEventListener('hashchange', () => {
    const hash = location.hash;
    if (!hash.startsWith(LINK_PREFIX)) return;
    const id = decodeURIComponent(hash.slice(1));
    scrollToTarget(id, false);
  });
});
