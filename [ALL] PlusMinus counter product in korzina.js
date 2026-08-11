window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  // Функція для програмного оновлення інпуту з кількістю
  function updateQuantityInput(input, newValue) {
    // Встановлюємо нове значення
    input.value = newValue;

    // Створюємо та диспатчимо події для trigger'у Webflow commerce
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });

    input.dispatchEvent(inputEvent);
    input.dispatchEvent(changeEvent);
  }

  // Обробник для кнопок плюс
  document.addEventListener('click', function (e) {
    const plusButton = e.target.closest('[plus_count_item]');

    if (plusButton) {
      e.preventDefault();

      // Знаходимо батьківський блок товару
      const cartItem = plusButton.closest('[data-cart-item]');

      if (cartItem) {
        // Знаходимо інпут з кількістю в цьому товарі
        const quantityInput = cartItem.querySelector(
          '.cart-quantity[data-wf-cart-action="update-item-quantity"]');

        if (quantityInput) {
          const currentValue = parseInt(quantityInput.value) || 0;
          const newValue = currentValue + 1;

          updateQuantityInput(quantityInput, newValue);
        }
      }
    }
  });

  // Обробник для кнопок мінус
  document.addEventListener('click', function (e) {
    const minusButton = e.target.closest('[minus_count_item]');

    if (minusButton) {
      e.preventDefault();

      // Знаходимо батьківський блок товару
      const cartItem = minusButton.closest('[data-cart-item]');

      if (cartItem) {
        // Знаходимо інпут з кількістю в цьому товарі
        const quantityInput = cartItem.querySelector(
          '.cart-quantity[data-wf-cart-action="update-item-quantity"]');

        if (quantityInput) {
          const currentValue = parseInt(quantityInput.value) || 0;
          const newValue = Math.max(1, currentValue - 1); // Мінімум 1

          updateQuantityInput(quantityInput, newValue);
        }
      }
    }
  });
});
