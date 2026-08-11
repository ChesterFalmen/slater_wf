window.Webflow ||= [];
window.Webflow.push(() => {
  function convertPriceStringToNumber(priceString) {
    return Number(priceString.replace(/[^\d]/g, ''));
  }

  // Функція для відправки події add_to_cart
  function pushAddToCartToGTM(item_name, numericPrice, item_id, brand, category_name) {
    if (!item_name || !numericPrice || !item_id) return;

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        items: [{
          item_name,
          price: numericPrice,
          item_id,
          item_brand: brand,
          item_category: category_name
        }]
      }
    });

    gtag('event', 'add_to_cart', {
      send_to: 'AW-11280588801',
      value: numericPrice,
      items: [{
        id: item_id,
        google_business_vertical: 'retail'
      }]
    });
  }

  // Функція для витягування даних товару з новими селекторами для add_to_cart
  function extractAddToCartProductData(container) {
    if (!container) return null;

    // Витягуємо назву товару з #product_heading
    const item_name = container.querySelector('#product_heading')?.textContent?.trim();

    // Витягуємо ID товару з #crm_id
    const item_id = container.querySelector('#crm_id')?.textContent?.trim();
    const category_name = container.querySelector('#category_name')?.textContent?.trim();

    // Витягуємо ціну з discount="new_price"
    const priceElement = container.querySelector('[discount="new_price"]');
    const priceText = priceElement?.textContent?.trim();
    const numericPrice = priceText ? convertPriceStringToNumber(priceText) : null;

    // Бренд за замовчуванням Leader
    const brand = 'Leader';

    return { item_name, numericPrice, item_id, brand, category_name };
  }

  // Функція для додавання обробників кнопок "Додати до кошика"
  function addAddToCartListeners() {
    // Знаходимо всі кнопки "Додати до кошика"
    const addToCartButtons = document.querySelectorAll('.w-commerce-commerceaddtocartbutton');

    addToCartButtons.forEach(button => {
      // Додаємо обробник тільки якщо його ще немає
      if (!button.hasAttribute('data-add-to-cart-listener')) {
        button.setAttribute('data-add-to-cart-listener', 'true');

        button.addEventListener('click', (e) => {
          // Знаходимо найближчий контейнер з даними товару
          const productContainer = button.closest('.w-commerce-commerceaddtocartform')
            ?.closest('.fs-prod-add-to-cart')?.closest('body') || document.body;

          const productData = extractAddToCartProductData(productContainer);
          if (productData && productData.item_name && productData.numericPrice &&
            productData.item_id) {
            pushAddToCartToGTM(
              productData.item_name,
              productData.numericPrice,
              productData.item_id,
              productData.brand,
              productData.category_name
            );
          }
        });
      }
    });
  }

  // Функція для ініціалізації відстеження add_to_cart
  function initializeAddToCartTracking() {
    // Спочатку додаємо обробники для існуючих кнопок
    addAddToCartListeners();

    // MutationObserver для динамічно додаваних кнопок
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Перевіряємо чи це кнопка або контейнер з кнопкою
            if (node.matches && node.matches(
                '.w-commerce-commerceaddtocartbutton')) {
              addAddToCartListeners();
            }
            // Перевіряємо дочірні елементи
            const buttons = node.querySelectorAll && node.querySelectorAll(
              '.w-commerce-commerceaddtocartbutton');
            if (buttons && buttons.length > 0) {
              addAddToCartListeners();
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Ініціалізація відстеження add_to_cart
  initializeAddToCartTracking();
});
