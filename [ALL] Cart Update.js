window.Webflow ||= [];
window.Webflow.push(() => {
  function updateCart() {
    const source = document.querySelectorAll(".w-commerce-commercecartordervalue")[2];
    const targetSumm = document.querySelector('[data-cart="summ"]');
    const targetCount = document.querySelector('[data-cart="count"]');
    const items = document.querySelectorAll(".w-commerce-commercecartitem");

    if (!targetSumm || !targetCount) return;

    if (!source || items.length === 0) {
      // Якщо немає елементів або товарів у кошику
      targetSumm.textContent = "0 грн";
      targetCount.textContent = "0";
      return;
    }

    // 1. Сума
    targetSumm.innerHTML = source.innerHTML;

    // 2. Кількість
    targetCount.textContent = items.length;
  }

  // 1. Після завантаження
  setTimeout(updateCart, 2000);

  // 2. Після кліку на кнопку "додати в кошик"
  document.querySelectorAll('.w-commerce-commerceaddtocartbutton').forEach(button => {
    button.addEventListener('click', () => {
      setTimeout(updateCart, 1000);
    });
  });

  // 3. Після кліку на кнопку "видалити товар"
  document.body.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-wf-cart-action="remove-item"]');
    if (removeBtn) {
      setTimeout(updateCart, 1000);
    }
  });
});
