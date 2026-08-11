window.Webflow ||= [];
window.Webflow.push(() => {
  // Берём все контейнеры по атрибуту, напр. [swiper-slider="second"]
  const roots = document.querySelectorAll('[swiper-slider]');

  roots.forEach((root) => {
    // защита от повторной инициализации
    if (root.__swiperInited) return;

    // внутри должен быть контейнер-обёртка со слайдами
    const wrapper = root.querySelector('.comparison-fs-main-wrapper');
    if (!wrapper) return;

    // кнопки навигации (не обязательны)
    const nextEl = root.querySelector('[swiper="right"]');
    const prevEl = root.querySelector('[swiper="left"]');

    root.__swiperInited = true;

    // Инициализация
    const swiper = new Swiper(root, {
      // Сообщаем Swiper-у, какие классы использовать в твоей разметке
      wrapperClass: 'comparison-fs-main-wrapper',
      slideClass: 'swiper-slide',

      // Базовые настройки каталога
      slidesPerView: 'auto', // карточки сами задают ширину (flex/grid)
      spaceBetween: 10,
      speed: 400,
      watchOverflow: true, // если слайдов мало — отключит управление
      observeParents: true,
      observer: true, // если Webflow/CMS что-то перерисует — обновится
      resizeObserver: true,

      // Навигация (подключается, только если кнопки найдены)
      ...(nextEl && prevEl ? {
        navigation: { nextEl, prevEl }
      } : {}),

      // Адаптив (можно править по вкусу)
      breakpoints: {
        576: { spaceBetween: 12 },
        992: { spaceBetween: 16 },
        1200: { spaceBetween: 20 }
      },

      // Улучшения UX (по желанию можно выключить)
      keyboard: { enabled: true },
      a11y: { enabled: true },
    });

    // На всякий случай пересчёт после Webflow анимаций/ленивых картинок
    const reflow = () => swiper.update && swiper.update();
    ['load', 'resize'].forEach(evt => window.addEventListener(evt, reflow));
    setTimeout(reflow, 0);
  });
});
