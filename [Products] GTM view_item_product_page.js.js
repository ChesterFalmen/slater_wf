// Оптимізовано для сторінок товарів - view_item tracking
window.Webflow ||= [];
window.Webflow.push(() => {

  // Функція для конвертації ціни в число
  function convertPriceStringToNumber(priceString) {
    if (!priceString) return null;
    const cleaned = priceString.replace(/[^\d]/g, '');
    const result = Number(cleaned);
    return isNaN(result) ? null : result;
  }

  // Функція для відправки події view_item
  function pushViewItemToGTM(item_name, numericPrice, item_id, item_category, brand) {
    if (!item_name || !numericPrice || !item_id) return;

    try {
      if (typeof dataLayer === 'undefined') return;

      dataLayer.push({ ecommerce: null });
      dataLayer.push({
        event: "view_item",
        ecommerce: {
          items: [{
            item_name,
            price: numericPrice,
            item_id,
            item_category,
            item_brand: brand
          }]
        }
      });

      if (typeof gtag !== 'undefined') {
        gtag('event', 'view_item', {
          send_to: 'AW-11280588801',
          value: numericPrice,
          items: [{
            id: item_id,
            google_business_vertical: 'retail'
          }]
        });
      }
    } catch (error) {
      // Мовчки ігноруємо помилки
    }
  }

  // Функція для витягування даних товару зі сторінки товару
  function extractProductPageData() {
    const item_name = document.querySelector('#product_heading')?.textContent?.trim();
    const item_id = document.querySelector('#crm_id')?.textContent?.trim();
    const item_category = document.querySelector('#category_name')?.textContent?.trim();

    const priceElement = document.querySelector('[discount="new_price"]');
    const priceText = priceElement?.textContent?.trim();
    const numericPrice = priceText ? convertPriceStringToNumber(priceText) : null;

    const brand = 'Leader';

    return { item_name, numericPrice, item_id, item_category, brand };
  }

  // Основна функція ініціалізації
  function initializeViewItemTracking() {
    const requiredElements = ['#product_heading', '#crm_id', '[discount="new_price"]'];

    const hasAllElements = requiredElements.every(selector =>
      document.querySelector(selector) !== null
    );

    if (hasAllElements) {
      sendViewItem();
      return;
    }

    // Якщо елементи ще не завантажені, чекаємо
    const checkElements = () => {
      const currentCheck = requiredElements.every(selector =>
        document.querySelector(selector) !== null
      );
      if (currentCheck) {
        sendViewItem();
      }
    };

    setTimeout(checkElements, 100);
    setTimeout(checkElements, 300);
    setTimeout(checkElements, 500);
    setTimeout(checkElements, 1000);

    // MutationObserver для відстеження динамічно завантажених елементів
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const currentCheck = requiredElements.every(selector =>
            document.querySelector(selector) !== null
          );
          if (currentCheck && !viewItemSent) {
            sendViewItem();
            observer.disconnect();
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Зупиняємо спостереження через 5 секунд
    setTimeout(() => {
      observer.disconnect();
    }, 5000);
  }

  // Функція відправки події з захистом від дублювання
  let viewItemSent = false;

  function sendViewItem() {
    if (viewItemSent) return;

    const productData = extractProductPageData();

    if (productData && productData.item_name && productData.numericPrice && productData
      .item_id) {
      pushViewItemToGTM(
        productData.item_name,
        productData.numericPrice,
        productData.item_id,
        productData.item_category,
        productData.brand
      );
      viewItemSent = true;
    }
  }

  // Ініціалізація відстеження view_item
  initializeViewItemTracking();

});
