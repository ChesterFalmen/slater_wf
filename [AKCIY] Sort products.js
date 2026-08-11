window.Webflow ||= [];
window.Webflow.push(() => {

  function sortAllDiscounts() {
    const sliders = document.querySelectorAll('.leader-clw.swiper.w-dyn-list');
    if (!sliders.length) return;

    sliders.forEach(slider => {
      const wrapper = slider.querySelector('.leader-cl.swiper-wrapper.w-dyn-items');
      if (!wrapper) return;

      const cards = Array.from(wrapper.querySelectorAll('[discount="card"]'));
      if (!cards.length) return;

      // Читаємо знижки
      cards.forEach(card => {
        const discountEl = card.querySelector('[discount="percent"]');
        const discountText = discountEl ? discountEl.textContent.trim() : '0';
        const discountValue = parseInt(discountText.replace(/\D/g, '')) || 0;
        card.dataset.discountValue = discountValue;
      });

      // Сортуємо за спаданням
      cards.sort((b, a) => b.dataset.discountValue - a.dataset.discountValue);

      // Акуратно оновлюємо DOM
      wrapper.style.opacity = '0';
      cards.forEach(card => wrapper.appendChild(card));
      setTimeout(() => { wrapper.style.opacity = '1'; }, 150);
    });
  }

  // Спостерігаємо, коли Webflow вставить картки
  function observeCMSLoad() {
    const observer = new MutationObserver((mutations, obs) => {
      const items = document.querySelectorAll(
        '.leader-cl.swiper-wrapper.w-dyn-items [discount="card"]');
      if (items.length > 0) {
        obs.disconnect(); // виконуємо лише раз
        // невелика пауза, щоб Swiper встиг ініціалізуватись
        setTimeout(sortAllDiscounts, 300);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Якщо елементи вже є — запускаємо відразу, інакше спостерігаємо
  if (document.querySelector('.leader-cl.swiper-wrapper.w-dyn-items [discount="card"]')) {
    setTimeout(sortAllDiscounts, 200);
  } else {
    observeCMSLoad();
  }

});
