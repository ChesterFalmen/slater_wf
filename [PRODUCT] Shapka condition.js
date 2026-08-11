var Webflow = window.Webflow || [];
window.Webflow = Webflow;

Webflow.push(function () {
  // Знаходимо всі блоки з слайдером "шапка"
  const wrappers = document.querySelectorAll('.wrapper_shapka[swiper-slider="shapka"]');

  wrappers.forEach(function (wrapper) {
    // 1) Видаляємо всі слайди, де товар неактивний (має w-condition-invisible на <a.card_dop_tovar>)
    const slides = wrapper.querySelectorAll('.collection-item-8.swiper-slide');

    slides.forEach(function (slide) {
      const cardLink = slide.querySelector('.card_dop_tovar');

      // Якщо <a> має клас w-condition-invisible — видаляємо весь слайд з DOM
      if (cardLink && cardLink.classList.contains('w-condition-invisible')) {
        slide.remove();
      }
    });

    // 2) Після чистки перевіряємо, чи лишився хоч один активний товар
    const availableItem = wrapper.querySelector(
      '.card_dop_tovar:not(.w-condition-invisible)');

    if (availableItem) {
      // Якщо є хоч один активний товар — показуємо wrapper
      wrapper.classList.remove('w-condition-invisible');
      wrapper.style.display = 'block';
    } else {
      // Якщо товарів немає, або всі були неактивні — ховаємо wrapper
      wrapper.style.display = 'none';
    }
  });
});
