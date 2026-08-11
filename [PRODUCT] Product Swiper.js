window.Webflow ||= [];
window.Webflow.push(() => {
  const root = document.querySelector("#slider-for-product");
  if (!root) return; // нема контейнера — стоп

  // є всередині .swiper-wrapper?
  const wrapper = root.querySelector(".swiper-wrapper");
  if (!wrapper) return; // нема структури — стоп

  // захист від повторної ініціалізації
  if (root.__swiperInited) return;
  root.__swiperInited = true;

  new Swiper(root, {
    slidesPerView: "auto",
    spaceBetween: 10,
    watchOverflow: true,
    navigation: {
      nextEl: '[swiper="right"]',
      prevEl: '[swiper="left"]',
    },
  });
});
