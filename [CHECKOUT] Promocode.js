window.Webflow ||= [];
window.Webflow.push(() => {

  // Глобальна змінна для промокоду (зберігаємо оригінальну логіку)
  let promocode_str = '';

  // Функція для роботи з промокодом
  function assignPromocode() {
    const promocodeValue = returnInputValue('Promocode');
    promocode_str = promocodeValue;
    console.log(promocode_str);
  }

  // Функція генерації унікального ID транзакції
  function generateUniqueTransactionId() {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `T${timestamp}${randomSuffix}`;
  }

  // Функція для безпечного отримання елемента з логуванням помилок
  function getElement(selector, context = document) {
    const element = context.getElementById ? context.getElementById(selector) : context
      .querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  }

  // Ініціалізація ID організації
  function initializeOrganizationId() {
    const organizationEl = getElement('organizationId');
    if (organizationEl) {
      organizationEl.textContent = generateUniqueTransactionId();
    }
  }

  // Обробник показу форми промокоду
  function handleShowPromo() {
    const promoForm = getElement('promo-form');
    const showPromoBtn = getElement('show-promo');

    if (promoForm && showPromoBtn) {
      promoForm.style.display = 'block';
      showPromoBtn.style.display = 'none';
    }
  }

  // Обробник редагування замовлення
  function handleEditOrder() {
    const isDesktop = window.screen.availWidth > 479;
    const targetId = isDesktop ? 'new_cart_1' : 'second_cart';
    const targetElement = getElement(targetId);

    if (targetElement && typeof targetElement.click === 'function') {
      targetElement.click();
    }
  }

  // Обробник фокусу на поле імені клієнта
  function handleCustomerNameFocus() {
    const addInfoEl = document.querySelector('.customer__add-info');
    if (addInfoEl) {
      addInfoEl.style.height = 'auto';
    }
  }

  // Функція для додавання обробників подій з перевіркою існування елементів
  function addEventListeners() {
    // Показ промо форми
    const showPromoBtn = getElement('show-promo');
    if (showPromoBtn) {
      showPromoBtn.addEventListener('click', handleShowPromo);
    }

    // Редагування замовлення
    const editOrderBtn = getElement('Edit_order');
    if (editOrderBtn) {
      editOrderBtn.addEventListener('click', handleEditOrder);
    }

    // Фокус на поле імені клієнта
    const customerNameInput = document.querySelector('.customer__name-info.isfocused.w-input');
    if (customerNameInput) {
      customerNameInput.addEventListener('focusin', handleCustomerNameFocus);
    }
  }

  // Функція ініціалізації з затримкою для елементів, які можуть завантажуватись пізніше
  function initializeWithDelay() {
    // Спробуємо одразу
    initializeOrganizationId();
    addEventListeners();

    // Додаткова спроба через невелику затримку для елементів, що завантажуються динамічно
    setTimeout(() => {
      initializeOrganizationId();
      addEventListeners();
    }, 100);
  }

  // Експорт функції assignPromocode в глобальну область видимості (якщо потрібно для інших скриптів)
  window.assignPromocode = assignPromocode;

  // Запуск ініціалізації
  initializeWithDelay();

  // Додатковий observer для елементів, що можуть з'являтися динамічно
  const observer = new MutationObserver((mutations) => {
    let shouldRecheck = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Перевіряємо, чи додались потрібні нам елементи
            if (node.id === 'organizationId' ||
              node.id === 'show-promo' ||
              node.id === 'Edit_order' ||
              node.classList?.contains('customer__name-info')) {
              shouldRecheck = true;
            }
          }
        });
      }
    });

    if (shouldRecheck) {
      setTimeout(() => {
        initializeOrganizationId();
        addEventListeners();
      }, 50);
    }
  });

  // Спостерігаємо за змінами в DOM протягом перших 10 секунд
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Автоматично відключаємо observer через 10 секунд для оптимізації
  setTimeout(() => {
    observer.disconnect();
  }, 10000);

});
