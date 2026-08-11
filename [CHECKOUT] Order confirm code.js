window.Webflow ||= [];
Webflow.push(function () {

  // ============================================================
  // ===== CONFIG =====
  // ============================================================
  const FORM_ID = "wf-form-order-form";
  const GOOGLE_ADS_ID = 'AW-11280588801';

  let isSubmitting = false;

  // ============================================================
  // ===== HELPERS =====
  // ============================================================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function txt(el) {
    if (!el) return '';
    if ('value' in el && el.value != null && String(el.value).trim() !== '') return String(el
      .value);
    return (el.textContent || '').trim();
  }

  function formatNameText(s) {
    if (s == null) return '';
    return String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')
      .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"').replace(/[\u2018\u2019]/g, "'").trim();
  }

  function ensureHiddenField(formId, name = 'formatedData') {
    const form = document.getElementById(formId);
    if (!form) return null;
    let inp = form.querySelector(`input[name="${name}"]`);
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = name;
      inp.classList.add('addedinput');
      form.appendChild(inp);
    }
    return inp;
  }

  function insertInputValue(formId, name, value, into) {
    const form = document.getElementById(formId);
    if (!form) return;
    const i = document.createElement('input');
    i.type = 'hidden';
    i.name = name;
    i.value = value;
    i.classList.add('addedinput');
    (into || form).appendChild(i);
  }

  function removeAdded() { $$('.addedinput').forEach(el => el.remove()); }

  function generateInputname(id, key) { return `products[${id}][${key}]`; }

  function convertPriceStringToNumber(priceString) {
    return parseFloat(String(priceString).replace(/[^\d.-]/g, '')) || 0;
  }

  // Парс UAH "1 299,00 грн", "-970", "−1 145.50 грн"
  function parseUAH(s) {
    if (s == null) return 0;
    let v = String(s).replace(/\u00A0/g, '');
    v = v.replace(/[^\d,.\-\u2212]+/g, '').replace(/\u2212/g, '-');
    if (v.includes(',') && v.includes('.')) v = v.replace(/,/g, '');
    else if (v.includes(',')) v = v.replace(',', '.');
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  // ============================================================
  // ===== ITEMS DATA (для GA4 / Google Ads / FB) =====
  // ============================================================
  function getItemsData() {
    const itemCards = $$('.item_card');
    const itemsList = [];
    let totalValue = 0;

    // Ті самі селектори, що й у buildAndSubmit — інакше purchase/begin_checkout
    // зникають при зміні розмітки (data-атрибути замість дубльованих id).
    itemCards.forEach(itemCard => {
      const nameEl = itemCard.querySelector('#name, [id="name"], [data-name]');
      const productIdEl = itemCard.querySelector(
        '#product_id, [id="product_id"], [data-product-id]');
      const priceEl = itemCard.querySelector('#price, [id="price"], [data-price]');
      const quantityEl = itemCard.querySelector('#quantity, [id="quantity"], [data-qty]');

      if (!nameEl || !productIdEl || !priceEl || !quantityEl) return;

      const name = txt(nameEl);
      const crmId = txt(productIdEl);
      const priceText = txt(priceEl);
      const quantityRaw = txt(quantityEl);
      const quantity = parseInt(String(quantityRaw).replace(/[^\d]/g, ''), 10) || 1;

      if (!name || !crmId || !priceText) return;

      const price = convertPriceStringToNumber(priceText);
      totalValue += price * quantity;

      itemsList.push({
        item_name: name,
        item_id: crmId,
        price: price,
        item_brand: 'Leader',
        quantity: quantity,
        item_category: 'product_type'
      });
    });

    return { itemsList, totalValue };
  }

  // ============================================================
  // ===== ANALYTICS: begin_checkout =====
  // ============================================================
  function sendBeginCheckoutEvent() {
    const { itemsList } = getItemsData();
    if (itemsList.length === 0) {
      console.error('❌ begin_checkout: empty item_card data');
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'begin_checkout',
      ecommerce: { currency: 'UAH', items: itemsList }
    });
    console.log('✅ begin_checkout відправлено');
  }

  // ============================================================
  // ===== ENHANCED CONVERSIONS =====
  // ============================================================
  function normalizePhoneE164(raw) {
    if (!raw) return '';
    let digits = String(raw).replace(/\D+/g, '');
    if (!digits) return '';
    if (digits.startsWith('380')) {
      // вже з кодом країни
    } else if (digits.startsWith('80') && digits.length === 11) {
      digits = '3' + digits;
    } else if (digits.startsWith('0') && digits.length === 10) {
      digits = '38' + digits;
    } else if (digits.length === 9) {
      digits = '380' + digits;
    }
    return '+' + digits;
  }

  function splitFullName(full) {
    if (!full) return { firstName: '', lastName: '' };
    const cleaned = String(full).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return { firstName: '', lastName: '' };
    const parts = cleaned.split(' ').filter(Boolean);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }

  function sendEnhancedConversionsUserData() {
    const phoneRaw = txt($('#phone_form'));
    const nameRaw = txt($('#name_form'));

    const phone = normalizePhoneE164(phoneRaw);
    const { firstName, lastName } = splitFullName(nameRaw);

    const userData = {};
    if (phone) userData.phone_number = phone;
    if (firstName || lastName) {
      userData.address = {};
      if (firstName) userData.address.first_name = firstName;
      if (lastName) userData.address.last_name = lastName;
    }

    if (Object.keys(userData).length === 0) {
      console.warn('⚠️ Enhanced Conversions: дані порожні');
      return;
    }

    // Завжди пушимо в dataLayer (резерв)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['set', 'user_data', userData]);

    // Якщо gtag готовий — викликаємо напряму
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('set', 'user_data', userData);
        console.log('✅ Enhanced Conversions через gtag:', userData);
      } catch (e) {
        console.error('❌ Помилка gtag set user_data:', e);
      }
    } else {
      console.log('ℹ️ gtag не готовий, дані тільки в dataLayer:', userData);
    }
  }

  // ============================================================
  // ===== ANALYTICS: purchase =====
  // ============================================================
  function sendPurchaseEvent() {
    const { itemsList, totalValue } = getItemsData();
    if (itemsList.length === 0) {
      console.error('❌ purchase: empty item_card data');
      return;
    }

    const promocodeEl = $('#Promocode');
    const organizationIdEl = $('#organizationId');
    const promocode = promocodeEl ? promocodeEl.textContent.trim() : '';
    const organizationId = organizationIdEl ? organizationIdEl.textContent.trim() : '';

    // GA4 / dataLayer (завжди ініціалізуємо чергу, як у Enhanced Conversions)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: organizationId,
        currency: 'UAH',
        coupon: promocode,
        value: totalValue,
        items: itemsList
      }
    });
    console.log('✅ purchase у dataLayer (GA4), value:', totalValue, 'items:', itemsList.length);

    // Google Ads — gtag
    if (typeof window.gtag === 'function') {
      const gtagItems = itemsList.map(item => ({
        id: item.item_id,
        google_business_vertical: 'retail'
      }));
      window.gtag('event', 'purchase', {
        send_to: GOOGLE_ADS_ID,
        value: totalValue,
        items: gtagItems
      });
      console.log('✅ gtag purchase відправлено, value:', totalValue);
    }
  }

  // ============================================================
  // ===== FB PIXEL =====
  // ============================================================
  function buildCartSummaryFromExtracted(extractedData) {
    let subtotal = 0,
      discount = 0,
      numItems = 0;
    const contents = [];
    const content_ids = [];

    extractedData.forEach(r => {
      const id = (r.productid || '').toString().toLowerCase();
      if (id === 'discount' || id === 'id_4668' || id === '4668') {
        discount += parseUAH(r.discount);
        return;
      }
      const qty = parseInt(String(r.quantity).replace(/[^\d]/g, '')) || 1;
      const line = parseUAH(r.price);
      subtotal += line;
      numItems += qty;

      const cid = r.productid || 'unknown';
      content_ids.push(cid);
      contents.push({ id: cid, quantity: qty, item_price: +(line / qty).toFixed(2) });
    });

    const total = Math.max(0, +(subtotal - discount).toFixed(2));
    return {
      subtotal: +subtotal.toFixed(2),
      discount: +discount.toFixed(2),
      total,
      numItems,
      contents,
      content_ids
    };
  }

  function fbqPurchase(totalUAH, details) {
    if (!window.fbq) return;
    try {
      fbq('track', 'Purchase', {
        value: totalUAH,
        currency: 'UAH',
        contents: details.contents,
        content_ids: details.content_ids,
        content_type: 'product',
        num_items: details.numItems
      });
    } catch (e) { /* no-op */ }
  }

  // ============================================================
  // ===== ESPUTNIK =====
  // ============================================================
  function sendEsputnikPurchase(data) {
    if (typeof window.eS !== 'function') {
      console.warn('⚠️ eSputnik: eS не завантажено — перевір скрипт у Webflow Custom Code');
      return;
    }

    const orderNumber = txt($('#organizationId'));
    if (!orderNumber) {
      console.warn('⚠️ eSputnik: orderNumber відсутній');
      return;
    }

    const phoneRaw = txt($('#phone_form'));
    const phone = normalizePhoneE164(phoneRaw).replace(/^\+/, '');

    const items = data
      .filter(r => (r.productid || '').toString().toLowerCase() !== 'discount')
      .map(r => {
        const qty = parseInt(String(r.quantity).replace(/[^\d]/g, ''), 10) || 1;
        const lineTotal = parseUAH(r.price);
        return {
          productKey: String(r.productid),
          price: String(+(lineTotal / qty).toFixed(2)),
          quantity: String(qty),
          currency: 'UAH'
        };
      });

    if (!items.length) {
      console.warn('⚠️ eSputnik: товари відсутні');
      return;
    }

    const payload = {
      OrderNumber: orderNumber,
      PurchasedItems: items
    };

    if (phone) payload.GeneralInfo = { user_phone: phone };

    // Якщо на сторінці кошика відправляли StatusCart — підтягуємо той самий GUID
    // (потрібно для тригерів "кинутий кошик")
    const cartGuid = sessionStorage.getItem('es_cart_guid');
    if (cartGuid) payload.GUID = cartGuid;

    try {
      eS('sendEvent', 'PurchasedItems', payload);
      console.log('✅ eSputnik PurchasedItems:', orderNumber, items.length + ' товарів');
    } catch (e) {
      console.error('❌ eSputnik помилка:', e);
    }
  }

  // ============================================================
  // ===== JSON FORM BUILDER =====
  // ============================================================
  function formatFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return '{}';
    const fd = new FormData(form);
    const products = {};
    const other = {};
    for (const [rawName, rawValue] of fd.entries()) {
      const name = String(rawName);
      if (name === 'formatedData') continue;
      const value = String(rawValue);
      const m = name.match(/^products\[(\d+)\]\[(id|amount|nameItem|priceItem|discount)\]$/);
      if (m) {
        const [, idx, field] = m;
        if (!products[idx]) products[idx] = {};
        products[idx][field] = (field === 'nameItem') ? formatNameText(value) : value;
      } else {
        const shouldNormalize = /name/i.test(name);
        other[name] = shouldNormalize ? formatNameText(value) : value;
      }
    }
    return JSON.stringify({ ...other, products: Object.values(products) });
  }

  // ============================================================
  // ===== STATE =====
  // ============================================================
  let deliveryOption = '';
  let PaymentMethod = '';
  let promocode_str = '';
  const extractedData = [];

  // ============================================================
  // ===== SHIPPING / PAYMENT =====
  // ============================================================
  function updateDeliveryOption() {
    const n = $('#NovaPoshta'),
      u = $('#UkrPoshta');
    deliveryOption = (n && n.checked) ? 'NovaPoshta' : (u && u.checked) ? 'UkrPoshta' : '';
  }

  function typeOfPayment() {
    const c = $('#cashondelivery');
    const p = $('#Prepayment');
    const iban = $('#id_120');
    if (c && c.checked) PaymentMethod = 'cashondelivery';
    else if (p && p.checked) PaymentMethod = 'Prepayment';
    else if (iban && iban.checked) PaymentMethod = 'id_120';
    else PaymentMethod = '';
  }

  function createAdress(city, branch) { return `Місто: ${city}, Відділення: ${branch}`; }

  function fillMainData() {
    insertInputValue(FORM_ID, 'fName', txt($('#name_form')));
    insertInputValue(FORM_ID, 'phone', txt($('#phone_form')));

    const city = txt($('#city_form'));
    const index = txt($('#index_form'));
    const parts = [];

    const commentField = $('#commentar');
    const commentText = commentField ? txt(commentField).trim() : '';
    if (commentText) parts.push('Коментар: ' + commentText);
    if (promocode_str) parts.push('Promocode: ' + promocode_str);

    // VIP-знижка залогіненого клієнта → SalesDrive koment
    if (window.LeaderOrderLoyalty && typeof window.LeaderOrderLoyalty.getKomentLine ===
      'function') {
      const { totalValue } = getItemsData();
      const loyaltyLine = window.LeaderOrderLoyalty.getKomentLine(totalValue);
      if (loyaltyLine) parts.push(loyaltyLine);
    }

    if (city || index) parts.push(createAdress(city, index));
    if (parts.length) insertInputValue(FORM_ID, 'koment', parts.join(', '));

    if (deliveryOption === 'NovaPoshta') insertInputValue(FORM_ID, 'shipping_method',
      'Нова Пошта');
    else if (deliveryOption === 'UkrPoshta') insertInputValue(FORM_ID, 'shipping_method',
      'Укр Пошта');

    if (PaymentMethod === 'cashondelivery') insertInputValue(FORM_ID, 'payment_method', 'cash');
    else if (PaymentMethod === 'Prepayment') insertInputValue(FORM_ID, 'payment_method',
      'wayforpay');
    else if (PaymentMethod === 'id_120') insertInputValue(FORM_ID, 'payment_method', 'id_120');

    const orgEl = $('#organizationId');
    if (orgEl) {
      const org = txt(orgEl);
      insertInputValue(FORM_ID, 'organizationId', org);
      insertInputValue(FORM_ID, 'zaavkaGTM', org);
    }
  }

  // ============================================================
  // ===== UTM =====
  // ============================================================
  function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function getUTM() {
    const S = getCookie('utmSource'),
      M = getCookie('utmMedium'),
      C = getCookie('utmCampaign'),
      K = getCookie('utmContent'),
      T = getCookie('utmTerm');
    if (S) insertInputValue(FORM_ID, 'prodex24source', S);
    if (M) insertInputValue(FORM_ID, 'prodex24medium', M);
    if (C) insertInputValue(FORM_ID, 'prodex24campaign', C);
    if (K) insertInputValue(FORM_ID, 'prodex24content', K);
    if (T) insertInputValue(FORM_ID, 'prodex24term', T);
    insertInputValue(FORM_ID, 'prodex24page', 'leader-tools.com.ua');
  }

  // ============================================================
  // ===== ДОДАТКОВІ ТОВАРИ =====
  // ============================================================
  function getAdditionalProducts() {
    try {
      const addedFromAdditional = localStorage.getItem('cart_added_from_additional');
      if (!addedFromAdditional) return '';
      const productsArray = JSON.parse(addedFromAdditional);
      if (!Array.isArray(productsArray) || productsArray.length === 0) return '';
      return productsArray.join(',');
    } catch (error) {
      console.error('Error reading additional products:', error);
      return '';
    }
  }

  // ============================================================
  // ===== DISCOUNT (промокод у формі замовлення) =====
  // ============================================================
  function getDiscount() {
    const wrap = $('.w-commerce-commercecheckoutordersummaryextraitemslistitem');
    if (!wrap || !wrap.children || wrap.children.length < 2) return;
    const label = txt(wrap.children[0]);
    const value = txt(wrap.children[1]);
    const cleanedValue = value.replace(/[^\d\-.,]/g, '').replace(',', '.');
    const discountPrice = Math.abs(parseFloat(cleanedValue));
    if (!isNaN(discountPrice) && discountPrice !== 0) {
      const i = extractedData.length;
      promocode_str = label + ': ' + value;
      const row = {
        quantity: 1,
        name: label,
        price: 0,
        productid: 'discount',
        discount: discountPrice,
        inputid: generateInputname(i, 'id'),
        inputAmount: generateInputname(i, 'amount'),
        inputName: generateInputname(i, 'nameItem'),
        inputPrice: generateInputname(i, 'priceItem'),
        inputDiscount: generateInputname(i, 'discount')
      };
      extractedData.push(row);
      insertInputValue(FORM_ID, row.inputid, row.productid);
      insertInputValue(FORM_ID, row.inputAmount, row.quantity);
      insertInputValue(FORM_ID, row.inputName, row.name);
      insertInputValue(FORM_ID, row.inputPrice, row.price);
      insertInputValue(FORM_ID, row.inputDiscount, row.discount);
    }
  }

  // ============================================================
  // ===== UPDATE TOTAL PRICE (UI) =====
  // ============================================================
  function updateTotalPrice() {
    let total = 0;
    $$('.div-block-10').forEach(productBlock => {
      $$('.div-block-9', productBlock).forEach(product => {
        const comparePriceEl = product.querySelector('#compare-price');
        const mainPriceEl = product.querySelector('#price');
        const quantityEl = productBlock.querySelector('#quantity');

        const comparePrice = comparePriceEl && comparePriceEl.textContent.trim() ?
          parseFloat(comparePriceEl.textContent.replace(/[^\d.-]/g, '')) :
          NaN;
        const mainPrice = mainPriceEl ?
          parseFloat(mainPriceEl.textContent.replace(/[^\d.-]/g, '')) :
          NaN;
        const quantity = quantityEl ?
          parseInt(quantityEl.textContent.replace(/[^\d]/g, ''), 10) :
          1;

        const priceToAdd = !isNaN(comparePrice) && comparePrice > 0 ? comparePrice :
          mainPrice;
        if (!isNaN(priceToAdd) && !isNaN(quantity)) total += priceToAdd * quantity;
      });
    });
    const totalPriceEl = $('#Price');
    if (totalPriceEl) totalPriceEl.textContent = `${total.toLocaleString('uk-UA')} грн`;
  }

  // ============================================================
  // ===== CART CLEANUP =====
  // ============================================================
  function emptyCart() {
    console.log('🛒 Спроба очищення корзини...');

    const allPossibleSelectors = [
      '.delete_cart-item',
      '.w-commerce-commercecartitemremovebutton',
      '[data-commerce-cart-item-remove]',
      '.w-commerce-commercecartitemremove',
      '.cart-item-remove',
      '.remove-item',
      '.delete-item',
      'button[data-remove]',
      'a[data-remove]'
    ];

    let foundButtons = [];
    allPossibleSelectors.forEach(selector => {
      const buttons = $$(selector);
      if (buttons.length > 0) foundButtons = foundButtons.concat(buttons);
    });
    foundButtons = [...new Set(foundButtons)];

    if (foundButtons.length === 0) {
      const cartContainer = $(
        '.w-commerce-commercecartlist, .cart-list, .w-commerce-commercecartwrapper');
      if (cartContainer) {
        const allButtons = $$('button, a', cartContainer);
        allButtons.forEach(btn => {
          const t = btn.textContent?.toLowerCase() || '';
          const c = btn.className || '';
          if (t.includes('remove') || t.includes('delete') || t.includes('видалити') ||
            c.includes('remove') || c.includes('delete')) {
            foundButtons.push(btn);
          }
        });
      }
    }

    foundButtons.forEach(btn => {
      if (btn && typeof btn.click === 'function') btn.click();
    });

    if (window.Webflow && window.Webflow.commerce && window.Webflow.commerce.cart) {
      try { window.Webflow.commerce.cart.clear(); } catch (e) { /* no-op */ }
    }

    try {
      Object.keys(localStorage)
        .filter(key => key.toLowerCase().includes('cart') || key.toLowerCase().includes(
          'commerce'))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) { /* no-op */ }

    console.log('🏁 Завершено очищення корзини');
  }

  function SubmitToCRM() {
    const sbmt = $('#submitToCRM_button');
    if (sbmt) {
      sbmt.click();
      setTimeout(emptyCart, 500);
    } else {
      setTimeout(emptyCart, 1000);
    }
  }

  // ============================================================
  // ===== FAIL-SAFE ON SUBMIT =====
  // ============================================================
  function wireFormattedData(formId, hiddenFieldName = 'formatedData') {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', () => {
      const json = formatFormData(formId);
      const hidden = ensureHiddenField(formId, hiddenFieldName);
      if (hidden) hidden.value = json;
    });
  }

  // ============================================================
  // ===== BUILD + SUBMIT (головна функція на клік) =====
  // ============================================================
  async function buildAndSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      const form = document.getElementById(FORM_ID);
      if (!form) { isSubmitting = false; return; }

      removeAdded();

      // Чекаємо VIP-% з API перед fillMainData / koment
      if (window.LeaderOrderLoyalty && window.LeaderOrderLoyalty.ready) {
        await window.LeaderOrderLoyalty.ready;
      }

      // Збираємо товари у форму
      const cards = $$('.item_card');
      const frag = document.createDocumentFragment();
      extractedData.length = 0;

      cards.forEach((card, i) => {
        const quantity = txt(card.querySelector(
          '#quantity, [id="quantity"], [data-qty]'));
        const name = txt(card.querySelector('#name, [id="name"], [data-name]'));
        const price = txt(card.querySelector('#price, [id="price"], [data-price]'));
        const productid = txt(card.querySelector(
          '#product_id, [id="product_id"], [data-product-id]'));
        const row = {
          quantity,
          name,
          price,
          productid,
          discount: 0,
          inputid: generateInputname(i, 'id'),
          inputAmount: generateInputname(i, 'amount'),
          inputName: generateInputname(i, 'nameItem'),
          inputPrice: generateInputname(i, 'priceItem'),
          inputDiscount: generateInputname(i, 'discount')
        };
        extractedData.push(row);
        insertInputValue(FORM_ID, row.inputid, row.productid, frag);
        insertInputValue(FORM_ID, row.inputAmount, row.quantity, frag);
        insertInputValue(FORM_ID, row.inputName, row.name, frag);
        insertInputValue(FORM_ID, row.inputPrice, row.price, frag);
        insertInputValue(FORM_ID, row.inputDiscount, row.discount, frag);
      });
      form.appendChild(frag);

      // Решта полів форми
      updateDeliveryOption();
      typeOfPayment();
      getDiscount();

      // Решта полів форми
      updateDeliveryOption();
      typeOfPayment();
      getDiscount(); // промокод → productid=discount

      // Персональна знижка → товар id_4668 з відʼємною ціною
      // (не додасться, якщо вже є промокод або mode=promo)
      if (window.LeaderOrderLoyalty) {
        LeaderOrderLoyalty.applyCrmDiscountRow(
          extractedData,
          function (name, value) { insertInputValue(FORM_ID, name, value); },
          generateInputname,
          getItemsData().totalValue
        );
      }

      fillMainData();
      getUTM();

      // Додаткові товари
      const dodProdazi = getAdditionalProducts();
      if (dodProdazi) {
        insertInputValue(FORM_ID, 'dodProdazi', dodProdazi);
        console.log('✅ dodProdazi:', dodProdazi);
      }

      // ===== АНАЛІТИКА — суворий порядок =====
      // 1) Enhanced Conversions ПЕРЕД будь-якою конверсією
      sendEnhancedConversionsUserData();

      // 2) GA4 + Google Ads purchase
      sendPurchaseEvent();

      // 3) FB Pixel Purchase (одноразово)
      if (!window.__purchaseTrackedOnce) {
        const summary = buildCartSummaryFromExtracted(extractedData);
        fbqPurchase(summary.total, summary);
        window.__purchaseTrackedOnce = true;
      }

      // 4) eSputnik PurchasedItems (одноразово)
      if (!window.__esPurchaseTrackedOnce) {
        sendEsputnikPurchase(extractedData);
        window.__esPurchaseTrackedOnce = true;
        // Очищуємо GUID кошика — він більше не потрібен
        if (typeof window.esStatusCartClearGUID === 'function') window
          .esStatusCartClearGUID();
        // Зберігаємо телефон для форми email на сторінці "дякуємо"
        const _phone = txt($('#phone_form'));
        const _order = txt($('#organizationId'));
        if (_phone) sessionStorage.setItem('es_order_phone', _phone);
        if (_order) sessionStorage.setItem('es_order_id', _order);
      }

      // JSON у hidden
      const json = formatFormData(FORM_ID);
      const hiddenFld = ensureHiddenField(FORM_ID, 'formatedData');
      if (hiddenFld) hiddenFld.value = json;

      // Відправити в CRM
      SubmitToCRM();

      // Додаткове очищення корзини
      setTimeout(emptyCart, 1500);

    } finally {
      setTimeout(() => { isSubmitting = false; }, 800);
    }
  }

  // ============================================================
  // ===== FORM VALIDATION =====
  // ============================================================
  function validateForm() {
    const form = document.getElementById('wf-form-');
    if (!form) return true;
    const requiredFields = form.querySelectorAll(
      'input[required], select[required], textarea[required]');
    let isValid = true;
    requiredFields.forEach(field => {
      if (!field.value || field.value.trim() === '') {
        isValid = false;
        field.reportValidity();
      }
    });
    return isValid;
  }

  // ============================================================
  // ===== ATTACH HANDLERS =====
  // ============================================================
  // 1) Пряме кріплення на існуючі кнопки
  $$('#order_confirm, [id="order_confirm"]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      if (!validateForm()) { e.preventDefault(); return; }
      e.preventDefault();
      buildAndSubmit();
    }, { passive: false });
  });

  // 2) Делегування — на випадок, якщо кнопка зʼявиться пізніше
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('#order_confirm, [id="order_confirm"]');
    if (!btn) return;
    if (!validateForm()) { e.preventDefault(); return; }
    e.preventDefault();
    buildAndSubmit();
  }, { passive: false });

  // Fail-safe: формат даних на submit
  wireFormattedData(FORM_ID);

  // Очищення корзини після успішної відправки форми
  const wfForm = document.getElementById('wf-form-');
  if (wfForm) {
    wfForm.addEventListener('submit', function () {
      setTimeout(emptyCart, 2000);
    });
  }

  // Промокод (опційно)
  const promocodeButton = $('#confirm_discount');
  if (promocodeButton && typeof assignPromocode === 'function') {
    promocodeButton.addEventListener('click', assignPromocode);
  }

  // Тестова функція
  window.testEmptyCart = emptyCart;

  // Edit_order — імітація кліку по кошику
  const editLink = $('#Edit_order');
  const cartBtn = $('.w-commerce-commercecartopenlink.header-bottom-cart.w-inline-block');
  if (editLink && cartBtn) {
    editLink.addEventListener('click', (e) => {
      e.preventDefault();
      cartBtn.click();
    });
  }

  // ============================================================
  // ===== INIT (begin_checkout + total price) =====
  // ============================================================
  function isDataReady() {
    const firstItemCard = $('.item_card');
    if (!firstItemCard) return false;
    const nameEl = firstItemCard.querySelector('#name');
    return nameEl && nameEl.textContent.trim() !== '';
  }

  function initializeWhenReady() {
    if (!isDataReady()) return false;
    sendBeginCheckoutEvent();
    updateTotalPrice();
    return true;
  }

  if (!initializeWhenReady()) {
    const observer = new MutationObserver(() => {
      if (initializeWhenReady()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  console.log('🚀 Checkout script loaded (unified)');
});
