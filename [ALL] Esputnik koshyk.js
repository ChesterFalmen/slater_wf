(function () {

  // ============================================================
  // ===== CONFIG =====
  // ============================================================

  // Селектор обгортки кошика (Webflow стандарт)
  const CART_WRAPPER_SEL = '.w-commerce-commercecartwrapper';

  // Селектор одного товару в кошику
  const CART_ITEM_SEL = '.w-commerce-commercecartitem';

  // CRM ID — елемент <div crm-id-in-order="" class="text-block-71">id_XXXX</div>
  const PRODUCT_ID_SEL = '[crm-id-in-order]';
  // Кількість — <input class="w-commerce-commercecartquantity" value="2">
  const PRODUCT_QTY_SEL = '.w-commerce-commercecartquantity';
  // Ціна за одиницю — <div class="text-block-75">2 990 грн</div>
  const PRODUCT_PRICE_SEL = '.text-block-75';
  // Назва товару
  const PRODUCT_NAME_SEL = '.w-commerce-commercecartproductname';

  // ============================================================
  // ===== HELPERS =====
  // ============================================================

  function readText(el) {
    if (!el) return '';
    if ('value' in el && String(el.value).trim()) return String(el.value).trim();
    return (el.textContent || '').trim();
  }

  function parsePrice(s) {
    if (!s) return 0;
    let v = String(s).replace(/\u00A0/g, '').replace(/[^\d,.\-\u2212]+/g, '').replace(/\u2212/g,
      '-');
    if (v.includes(',') && v.includes('.')) v = v.replace(/,/g, '');
    else if (v.includes(',')) v = v.replace(',', '.');
    return parseFloat(v) || 0;
  }

  function generateGUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getOrCreateGUID() {
    let guid = sessionStorage.getItem('es_cart_guid');
    if (!guid) {
      guid = generateGUID();
      sessionStorage.setItem('es_cart_guid', guid);
    }
    return guid;
  }

  function clearGUID() {
    sessionStorage.removeItem('es_cart_guid');
  }

  // ============================================================
  // ===== ЧИТАННЯ ТОВАРІВ З КОШИКА =====
  // ============================================================

  function readCartItems() {
    const wrapper = document.querySelector(CART_WRAPPER_SEL);
    if (!wrapper) return [];

    const items = [];
    wrapper.querySelectorAll(CART_ITEM_SEL).forEach(item => {
      const idEl = item.querySelector(PRODUCT_ID_SEL);
      const qtyEl = item.querySelector(PRODUCT_QTY_SEL);
      const priceEl = item.querySelector(PRODUCT_PRICE_SEL);
      const nameEl = item.querySelector(PRODUCT_NAME_SEL);

      const productKey = readText(idEl);
      const qty = parseInt(readText(qtyEl).replace(/\D/g, ''), 10) || 1;
      const lineTotal = parsePrice(readText(priceEl));
      const name = readText(nameEl);

      if (!productKey) {
        // ID не знайдено — логуємо для діагностики
        console.warn('⚠️ eSputnik StatusCart: productKey не знайдено для', name || 'товар');
        return;
      }

      items.push({
        productKey: productKey,
        price: String(+(lineTotal / qty).toFixed(2)),
        quantity: String(qty),
        currency: 'UAH'
      });
    });

    return items;
  }

  // ============================================================
  // ===== ВІДПРАВКА STATUSCART =====
  // ============================================================

  let _lastSentItemsHash = '';

  function sendStatusCart() {
    if (typeof window.eS !== 'function') return;

    const items = readCartItems();

    // Не відправляємо порожній кошик
    if (items.length === 0) return;

    // Уникаємо повторної відправки якщо склад не змінився
    const hash = JSON.stringify(items);
    if (hash === _lastSentItemsHash) return;
    _lastSentItemsHash = hash;

    const guid = getOrCreateGUID();

    try {
      eS('sendEvent', 'StatusCart', {
        'GUID': guid,
        'StatusCart': items
      });
      console.log('✅ eSputnik StatusCart: GUID', guid, items.length + ' товарів');
    } catch (e) {
      console.error('❌ eSputnik StatusCart помилка:', e);
    }
  }

  // ============================================================
  // ===== СЛУХАЄМО ВІДКРИТТЯ КОШИКА =====
  // ============================================================

  function isCartOpen(wrapper) {
    return wrapper.hasAttribute('data-cart-open');
  }

  function watchCartVisibility() {
    const wrapper = document.querySelector(CART_WRAPPER_SEL);
    if (!wrapper) return;

    let wasOpen = isCartOpen(wrapper);

    const observer = new MutationObserver(() => {
      const nowOpen = isCartOpen(wrapper);
      if (nowOpen && !wasOpen) {
        // data-cart-open щойно з'явився — кошик відкрився
        setTimeout(sendStatusCart, 300);
      }
      wasOpen = nowOpen;
    });

    observer.observe(wrapper, {
      attributes: true,
      attributeFilter: ['data-cart-open']
    });

    // Якщо кошик вже відкритий при завантаженні сторінки
    if (wasOpen) setTimeout(sendStatusCart, 300);
  }

  // Слухаємо кліки по кнопці відкриття кошика (додатковий тригер)
  function watchCartOpenButton() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.w-commerce-commercecartopenlink');
      if (!btn) return;
      // Дамо Webflow час оновити кошик
      setTimeout(sendStatusCart, 600);
    });
  }

  // ============================================================
  // ===== ОЧИЩЕННЯ GUID ПІСЛЯ ПОКУПКИ =====
  // Викликається з checkout-скрипта після успішної відправки
  // (або можна підписатись на подію)
  // ============================================================
  window.esStatusCartClearGUID = clearGUID;

  // ============================================================
  // ===== INIT =====
  // ============================================================
  function init() {
    watchCartVisibility();
    watchCartOpenButton();
  }

  init();

  console.log('🛒 eSputnik StatusCart script loaded');

})();
