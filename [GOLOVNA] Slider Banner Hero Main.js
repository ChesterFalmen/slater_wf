window.Webflow ||= [];
window.Webflow.push(() => {
  // Видаляємо десктопну картинку при мобільній ширині
  if (window.innerWidth <= 767) {
    document.querySelectorAll('.hero-slider-image.is-desktop').forEach(el => {
      el.remove();
    });
  }

  // Ініціалізація Swiper
  const swiper = new Swiper("#slider-main-hero", {
    lazy: true,
    loop: true,
    navigation: {
      nextEl: "#slider-main-hero-next",
      prevEl: "#slider-main-hero-prev",
    },
    pagination: {
      el: "#slider-main-hero-pagination",
    },
  });
});
