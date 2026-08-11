window.Webflow ||= [];
window.Webflow.push(() => {
  function convertPriceStringToNumber(priceString) {
    return Number(priceString.replace(/[^\d]/g, ''));
  }

  // Функція для відправки події view_item
  function pushViewItemToGTM(item_name, numericPrice, item_id, brand) {
    if (!item_name || !numericPrice || !item_id) return;

    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: "view_item",
      ecommerce: {
        items: [{
          item_name,
          price: numericPrice,
          item_id,
          item_brand: brand
        }]
      }
    });

    gtag('event', 'view_item', {
      send_to: 'AW-11280588801',
      value: numericPrice,
      items: [{
        id: item_id,
        google_business_vertical: 'retail'
      }]
    });
  }

  // Функція для витягування даних з карточки товару
  function extractProductData(card) {
    if (!card) return null;

    // Витягуємо назву товару
    const item_name = card.querySelector('[data-text="text-3-lines"]')?.textContent?.trim() ||
      card.querySelector('[text-2-lines]')?.textContent?.trim() ||
      card.querySelector('.text_with_dots_3')?.textContent?.trim() ||
      card.querySelector('.t-text.text_with_dots_1')?.textContent?.trim() ||
      card.querySelector('h5.interesting')?.textContent?.trim() ||
      card.querySelector('.name_top_sale')?.textContent?.trim() ||
      card.querySelector('.h2-4')?.textContent?.trim();

    // Витягуємо ID товару
    let item_id = card.querySelector('[data-id-item="crm_id"]')?.textContent?.trim() ||
      card.querySelector('.crm_d')?.textContent?.trim() ||
      card.querySelector('.crm_id_dop')?.textContent?.trim() ||
      card.querySelector('.crm_id_interesting')?.textContent?.trim() ||
      card.querySelector('.crm_id_top_sale')?.textContent?.trim() ||
      card.querySelector('.crm_id_learn_more')?.textContent?.trim();

    // Якщо ID не знайдено, використовуємо URL як ідентифікатор
    if (!item_id) {
      const link = card.querySelector('a[href]');
      if (link) {
        const url = link.getAttribute('href');
        // Витягуємо ID з URL (остання частина після останнього слешу)
        item_id = url ? url.split('/').pop() : null;
      }
    }

    // Витягуємо ціну (спочатку пробуємо нову ціну, потім стару)
    const priceElement = card.querySelector(
        '[discount="new_price"][fs-cmssort-field="price"]') ||
      card.querySelector('[discount="new_price"]') ||
      card.querySelector('.h5.leader.dop') ||
      card.querySelector('.leader-card-price-sale > div') ||
      card.querySelector('.m__text.interesting') ||
      card.querySelector('.price_top_sale') ||
      card.querySelector('.price');

    const priceText = priceElement?.textContent?.trim();
    const numericPrice = priceText ? convertPriceStringToNumber(priceText) : null;

    // Визначаємо бренд на основі структури карточки
    let brand = 'Leader';

    return { item_name, numericPrice, item_id, brand };
  }

  // Функція для додавання обробників кліків на посилання в карточці
  function addViewItemListeners(card) {
    if (!card) return;

    // Знаходимо всі посилання в карточці
    const links = card.querySelectorAll('a');

    links.forEach(link => {
      // Додаємо обробник тільки якщо його ще немає
      if (!link.hasAttribute('data-view-item-listener')) {
        link.setAttribute('data-view-item-listener', 'true');

        link.addEventListener('click', (e) => {
          const productData = extractProductData(card);
          if (productData && productData.item_name && productData.numericPrice &&
            productData.item_id) {
            pushViewItemToGTM(
              productData.item_name,
              productData.numericPrice,
              productData.item_id,
              productData.brand
            );
          }
        });
      }
    });
  }

  // Функція для ініціалізації відстеження view_item для всіх карточок
  function initializeViewItemTracking() {
    // Знаходимо всі карточки товарів
    const cardSelectors = [
      '.leader-ci',
      '.w-dyn-item',
      '.product-card.catalog',
      '.collection-item-8',
      '.interesting',
      '.w-tab-content > *',
      '.learn-more-popup'
    ];

    cardSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(card => {
        addViewItemListeners(card);
      });
    });
  }

  // Intersection Observer для динамічно підвантажуваних карточок
  function setupDynamicCardObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          addViewItemListeners(card);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Спостерігаємо за контейнерами, які можуть містити динамічні карточки
    const containerSelectors = [
      '.w-dyn-list',
      '.swiper-wrapper',
      '.w-tab-content',
      '.leader-cards-container'
    ];

    containerSelectors.forEach(selector => {
      const containers = document.querySelectorAll(selector);
      containers.forEach(container => {
        observer.observe(container);

        // Спостерігаємо за новими елементами в контейнері
        const mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                if (node.matches && node.matches(
                    '.leader-ci, .w-dyn-item, .product-card.catalog, .collection-item-8, .interesting'
                  )) {
                  addViewItemListeners(node);
                }
                // Перевіряємо дочірні елементи
                const cards = node.querySelectorAll && node
                  .querySelectorAll(
                    '.leader-ci, .w-dyn-item, .product-card.catalog, .collection-item-8, .interesting'
                  );
                if (cards) {
                  cards.forEach(card => addViewItemListeners(card));
                }
              }
            });
          });
        });

        mutationObserver.observe(container, {
          childList: true,
          subtree: true
        });
      });
    });
  }

  // Ініціалізація відстеження view_item
  initializeViewItemTracking();
  setupDynamicCardObserver();
});
