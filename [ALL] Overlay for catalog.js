window.Webflow ||= [];
window.Webflow.push(() => {
  // 1) Знаходимо елементи Webflow dropdown
  const dropdown = document.querySelector('.header-bottom-catalog-button.w-dropdown');
  if (!dropdown) return;

  const toggle = dropdown.querySelector('.w-dropdown-toggle');
  const list = dropdown.querySelector('.w-dropdown-list');
  if (!toggle || !list) return;

  // 2) Створюємо overlay (один раз)
  let overlay = document.querySelector('.screen-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'screen-overlay';
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      .screen-overlay{
        position:fixed; inset:0; background:rgba(0,0,0,.6);
        opacity:0; visibility:hidden;
        transition:opacity .25s ease, visibility 0s linear .25s;
        z-index: 901; /* вище контенту, але нижче самого меню */
      }
      .screen-overlay.active{
        opacity:1; visibility:visible; transition:opacity .25s ease;
      }
      /* коли оверлей активний — блокуємо фон від прокрутки (за бажанням) */
      /* body.overlay-lock { overflow:hidden; } */
    `;
    document.head.appendChild(style);
  }

  // 3) Функція: відкрито чи ні (Webflow ставить w--open)
  const isOpen = () =>
    toggle.classList.contains('w--open') ||
    list.classList.contains('w--open') ||
    getComputedStyle(list).display !== 'none';

  // 4) Синхронізуємо стан оверлея з меню
  const sync = () => {
    const open = isOpen();
    overlay.classList.toggle('active', open);
    //document.body.classList.toggle('overlay-lock', open);
  };

  // 5) Слідкуємо за змінами, які роблять Webflow Interactions
  const mo = new MutationObserver(sync);
  mo.observe(toggle, { attributes: true, attributeFilter: ['class', 'style', 'data-ix'] });
  mo.observe(list, { attributes: true, attributeFilter: ['class', 'style', 'data-ix'] });

  // 6) Клік по оверлею = клік по тій же кнопці (надійне закриття)
  overlay.addEventListener('click', () => {
    if (isOpen()) toggle.click();
  }, { passive: true });

  // 7) Закриття по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) toggle.click();
  });

  // 8) Початковий sync (раптом меню вже відкрите)
  sync();
});
