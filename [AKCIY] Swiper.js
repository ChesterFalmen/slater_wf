window.Webflow ||= [];
window.Webflow.push(() => {
  document.querySelectorAll('[swiper-slider]').forEach(section => {
    const swiperContainer = section.querySelector('.leader-clw.swiper');
    if (!swiperContainer) return;

    // захист від повторної ініціалізації
    if (swiperContainer.__inited) return;
    swiperContainer.__inited = true;

    new Swiper(swiperContainer, {
      slidesPerView: 'auto',
      spaceBetween: 10,
      watchOverflow: true,
      navigation: {
        nextEl: section.querySelector('[swiper="right"]'),
        prevEl: section.querySelector('[swiper="left"]'),
      },

      // 🧩 Breakpoints — тільки >768px вмикаємо freeMode
      breakpoints: {
        768: {
          freeMode: {
            enabled: true,
            momentum: true, // плавна інерція як у macOS
          },
        },
      },

      mousewheel: {
        forceToAxis: true,
        releaseOnEdges: true,
        sensitivity: 1,
      },
    });
  });
});
