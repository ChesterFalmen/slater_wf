window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  const SECTION_SEL = 'section[catalog-list="features"]';
  const CARD_SEL = '[discount="card"]';
  const BLUR_ATTR = 'pos';
  const VISIBLE_COUNT = 5;

  // ✅ Рання перевірка: якщо немає жодної секції з атрибутом pos — виходимо
  const activeSections = Array.from(document.querySelectorAll(SECTION_SEL))
    .filter(s => s.hasAttribute(BLUR_ATTR) && s.getAttribute(BLUR_ATTR).trim() !== '');

  if (!activeSections.length) return;

  function sanitizeLink(link) {
    if (!link) return '#';
    const trimmed = link.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  function getRealCards(section) {
    return Array.from(section.querySelectorAll(CARD_SEL)).filter(
      card =>
      !card.closest('.swiper-slide-duplicate') &&
      card.getAttribute('aria-hidden') !== 'true'
    );
  }

  function applyBlurToSection(section) {
    const link = sanitizeLink(section.getAttribute(BLUR_ATTR));
    if (link === '#') return;
    const cards = getRealCards(section);
    if (cards.length <= VISIBLE_COUNT) return;
    cards.slice(VISIBLE_COUNT + 1).forEach(card => {
      card.style.display = 'none';
    });
    const sixthCard = cards[VISIBLE_COUNT];
    if (sixthCard.querySelector('.blur-overlay')) return;
    sixthCard.style.position = 'relative';
    sixthCard.style.overflow = 'hidden';
    sixthCard.style.pointerEvents = 'none';
    const overlay = document.createElement('div');
    overlay.className = 'blur-overlay';
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      background: rgba(255,255,255,0.35);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      box-sizing: border-box;
      border-radius: inherit;
    `;
    const btn = document.createElement('a');
    btn.href = link;
    btn.style.cssText = `
      pointer-events: all;
      background: #fff;
      color: #111;
      font-weight: 600;
      font-family: inherit;
      font-size: clamp(10px, 1.8vw, 14px);
      padding: clamp(6px, 1.2vw, 10px) clamp(8px, 1.8vw, 18px);
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 2px 12px rgba(0,0,0,0.13);
      white-space: normal;
      word-break: break-word;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      line-height: 1.3;
      max-width: 90%;
      transition: background 0.2s;
    `;
    btn.innerHTML =
      'Показати більше товарів <span style="display:inline-block; flex-shrink:0;">→</span>';
    btn.addEventListener('mouseenter', () => btn.style.background = '#f5f5f5');
    btn.addEventListener('mouseleave', () => btn.style.background = '#fff');
    overlay.appendChild(btn);
    sixthCard.appendChild(overlay);
  }

  function init() {
    activeSections.forEach(applyBlurToSection);
  }
  init();
  const obs = new MutationObserver(() => {
    activeSections.forEach(section => {
      const cards = getRealCards(section);
      if (cards.length > VISIBLE_COUNT) applyBlurToSection(section);
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });
});
