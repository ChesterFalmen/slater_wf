window.Webflow ||= [];
window.Webflow.push(() => {

  // ============================================
  // КОНФІГУРАЦІЯ
  // ============================================
  const CONFIG = {
    storageKey: 'cart_additional_products',
    addedFromAdditionalKey: 'cart_added_from_additional',
    debounceDelay: 300,
    removeDelay: 600,
    swiperScrollAmount: 0.5
  };

  // ============================================
  // СЕЛЕКТОРИ
  // ============================================
  const SELECTORS = {
    currentProductId: '[data-current-product-id]',
    additionalSection: '[data-additional-products]',
    additionalItem: '[data-additional-item]',
    additionalId: '[data-id]',
    additionalName: '[data-name]',
    additionalPrice: '[data-price]',
    addAdditionalBtn: '[data-add-additional]',
    finsweetAddBtn: '.fs-prod-add-to-cart-button',
    cartContainer: '.w-commerce-commercecartcontainer',
    cartList: '.w-commerce-commercecartlist',
    cartItem: '.w-commerce-commercecartitem',
    cartProductId: '[crm-id-in-order]',
    cartRemoveBtn: '[data-commerce-remove-item]',
    cartEmptyState: '.w-commerce-commercecartemptystate',
    additionalCartSection: '[data-cart-additional-section]',
    additionalCartItems: '[data-cart-additional-items]',
    removeAdditionalBtn: '[data-remove-additional]',
    swiperPrevBtn: '.cart-additional-nav--prev',
    swiperNextBtn: '.cart-additional-nav--next'
  };

  // ============================================
  // СТАН
  // ============================================
  let state = {
    updateTimeout: null,
    isProcessing: false,
    swiperInitialized: false
  };

  // ============================================
  // LOCALSTORAGE HELPER
  // ============================================
  const Storage = {
    get() {
      try {
        const data = localStorage.getItem(CONFIG.storageKey);
        return data ? JSON.parse(data) : {};
      } catch (error) {
        console.error('Error reading storage:', error);
        return {};
      }
    },
    set(data) {
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Error writing storage:', error);
      }
    },
    clear() {
      localStorage.removeItem(CONFIG.storageKey);
    }
  };

  // ============================================
  // ВІДСТЕЖЕННЯ ДОДАНИХ З ДОПІВ
  // ============================================
  const AddedFromAdditional = {
    get() {
      try {
        const data = localStorage.getItem(CONFIG.addedFromAdditionalKey);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Error reading added from additional:', error);
        return [];
      }
    },
    add(productId) {
      const added = this.get();
      if (!added.includes(productId)) {
        added.push(productId);
        localStorage.setItem(CONFIG.addedFromAdditionalKey, JSON.stringify(added));
        //console.log(`✓ Tracked product ${productId} as added from additional`);
      }
    },
    remove(productId) {
      const added = this.get();
      const filtered = added.filter(id => id !== productId);
      localStorage.setItem(CONFIG.addedFromAdditionalKey, JSON.stringify(filtered));
      //console.log(`✓ Removed product ${productId} from tracking`);
    },
    clear() {
      localStorage.removeItem(CONFIG.addedFromAdditionalKey);
    },
    getFormatted() {
      return this.get().join(',');
    }
  };

  // ============================================
  // SWIPER NAVIGATION
  // ============================================

  function createSwiperNavigation() {
    const navContainer = document.createElement('div');
    navContainer.className = 'cart-additional-nav-container';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'cart-additional-nav cart-additional-nav--prev';
    prevBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    prevBtn.setAttribute('aria-label', 'Попередні товари');

    const nextBtn = document.createElement('button');
    nextBtn.className = 'cart-additional-nav cart-additional-nav--next';
    nextBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    nextBtn.setAttribute('aria-label', 'Наступні товари');

    navContainer.appendChild(prevBtn);
    navContainer.appendChild(nextBtn);

    return { navContainer, prevBtn, nextBtn };
  }

  function initSwiperNavigation() {
    const section = document.querySelector(SELECTORS.additionalCartSection);
    const container = document.querySelector(SELECTORS.additionalCartItems);

    if (!section || !container) return;

    let wrapper = section.querySelector('.cart-additional-swiper-wrapper');

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'cart-additional-swiper-wrapper';

      container.parentNode.insertBefore(wrapper, container);
      wrapper.appendChild(container);

      const { navContainer, prevBtn, nextBtn } = createSwiperNavigation();
      const headerWrapper = section.querySelector('.wrapper_header_dop_block');
      if (headerWrapper) {
        headerWrapper.appendChild(navContainer);
      } else {
        section.insertBefore(navContainer, wrapper);
      }

      prevBtn.addEventListener('click', () => scrollSwiper('prev'));
      nextBtn.addEventListener('click', () => scrollSwiper('next'));

      container.addEventListener('scroll', updateNavButtons);

      //console.log('✅ Swiper navigation initialized');
    }

    updateNavButtons();
    state.swiperInitialized = true;
  }

  function scrollSwiper(direction) {
    const container = document.querySelector(SELECTORS.additionalCartItems);
    if (!container) return;

    const scrollAmount = container.clientWidth * CONFIG.swiperScrollAmount;
    const targetScroll = direction === 'next' ?
      container.scrollLeft + scrollAmount :
      container.scrollLeft - scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }

  function updateNavButtons() {
    const container = document.querySelector(SELECTORS.additionalCartItems);
    const prevBtn = document.querySelector(SELECTORS.swiperPrevBtn);
    const nextBtn = document.querySelector(SELECTORS.swiperNextBtn);

    if (!container || !prevBtn || !nextBtn) return;

    const canScrollLeft = container.scrollLeft > 0;
    prevBtn.disabled = !canScrollLeft;

    const canScrollRight = container.scrollLeft < (container.scrollWidth - container
      .clientWidth - 5);
    nextBtn.disabled = !canScrollRight;
  }

  // ============================================
  // ФУНКЦІЇ ДЛЯ СТОРІНКИ ТОВАРУ
  // ============================================

  function areAdditionalProductsReady() {
    const additionalItems = document.querySelectorAll(SELECTORS.additionalItem);
    if (additionalItems.length === 0) {
      //console.log('⏳ Additional products not loaded yet');
      return false;
    }
    const firstItem = additionalItems[0];
    const idEl = firstItem.querySelector(SELECTORS.additionalId);
    const nameEl = firstItem.querySelector(SELECTORS.additionalName);
    if (!idEl || !nameEl || !idEl.textContent.trim() || !nameEl.textContent.trim()) {
      //console.log('⏳ Additional products data not ready yet');
      return false;
    }
    //console.log('✅ Additional products ready');
    return true;
  }

  function waitForAdditionalProducts(maxAttempts = 10, interval = 100) {
    return new Promise((resolve) => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (areAdditionalProductsReady()) {
          clearInterval(checkInterval);
          //console.log(`✅ Additional products loaded after ${attempts} attempts`);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.warn('⚠️ Additional products failed to load within timeout');
          resolve(false);
        }
      }, interval);
    });
  }

  function getAdditionalItemData(itemElement) {
    const data = {
      id: null,
      name: null,
      price: null,
      priceFormatted: null,
      compareAtPrice: null,
      compareAtPriceFormatted: null,
      discount: null,
      image: null,
      formHTML: null,
      url: null
    };

    const idEl = itemElement.querySelector(SELECTORS.additionalId);
    const nameEl = itemElement.querySelector(SELECTORS.additionalName);
    const priceEl = itemElement.querySelector(SELECTORS.additionalPrice);

    if (idEl) data.id = idEl.textContent.trim();
    if (nameEl) data.name = nameEl.textContent.trim();

    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      data.price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
      data.priceFormatted = priceText;
    }

    const oldPriceEl = itemElement.querySelector('[discount="old_price"]');
    if (oldPriceEl) {
      const oldPriceText = oldPriceEl.textContent.trim();
      if (oldPriceText) {
        data.compareAtPrice = parseFloat(oldPriceText.replace(/[^\d.]/g, '')) || 0;
        data.compareAtPriceFormatted = oldPriceText;
      }
    }

    const discountEl = itemElement.querySelector('[discount="percent"]');
    if (discountEl) {
      const discountText = discountEl.textContent.trim();
      if (discountText) {
        data.discount = discountText;
      }
    }

    const mainImg = itemElement.querySelector('img.product-image.is-second');
    if (mainImg) {
      let imgSrc = mainImg.src || mainImg.getAttribute('src');
      if (!imgSrc || imgSrc === '' || imgSrc === window.location.href) {
        imgSrc = mainImg.getAttribute('data-src') ||
          mainImg.getAttribute('data-src-desktop') ||
          mainImg.getAttribute('data-src-mobile') || '';
      }
      data.image = imgSrc;
    } else {
      const anyImg = itemElement.querySelector('img');
      if (anyImg) {
        let imgSrc = anyImg.src || anyImg.getAttribute('src');
        if (!imgSrc || imgSrc === '' || imgSrc === window.location.href) {
          imgSrc = anyImg.getAttribute('data-src') ||
            anyImg.getAttribute('data-src-desktop') ||
            anyImg.getAttribute('data-src-mobile') || '';
        }
        data.image = imgSrc;
      }
    }

    const linkEl = itemElement.querySelector('a.leader-card-wrapper');
    if (linkEl) {
      data.url = linkEl.href || linkEl.getAttribute('href') || '';
    }

    const addToCartWrapper = itemElement.querySelector('.add-to-cart');
    if (addToCartWrapper) {
      data.formHTML = addToCartWrapper.innerHTML;
    }

    return data;
  }

  function collectAdditionalProductsData() {
    const currentProductIdEl = document.querySelector(SELECTORS.currentProductId);
    if (!currentProductIdEl) {
      //console.log('Current product ID not found');
      return null;
    }

    const currentProductId = currentProductIdEl.textContent.trim();
    if (!currentProductId) {
      //console.log('Current product ID is empty');
      return null;
    }

    const additionalItems = document.querySelectorAll(SELECTORS.additionalItem);
    if (additionalItems.length === 0) {
      //console.log('No additional products found');
      return null;
    }

    const additionalProducts = [];
    additionalItems.forEach(item => {
      const data = getAdditionalItemData(item);
      if (data.id && data.name && data.price && data.formHTML) {
        additionalProducts.push({
          id: data.id,
          name: data.name,
          price: data.price,
          priceFormatted: data.priceFormatted,
          compareAtPrice: data.compareAtPrice,
          compareAtPriceFormatted: data.compareAtPriceFormatted,
          discount: data.discount,
          image: data.image,
          formHTML: data.formHTML,
          url: data.url,
          parentId: currentProductId,
          quantity: 1
        });
      }
    });

    //console.log(`Collected ${additionalProducts.length} additional products for ${currentProductId}`);

    return {
      parentId: currentProductId,
      products: additionalProducts
    };
  }

  async function saveAdditionalProductsToStorage() {
    //console.log('🔄 Attempting to save additional products...');
    const isReady = await waitForAdditionalProducts(15, 100);
    if (!isReady) {
      console.warn('⚠️ Proceeding without additional products');
      return;
    }

    const data = collectAdditionalProductsData();
    if (!data) {
      //console.log('ℹ️ No additional products to save');
      return;
    }

    const storage = Storage.get();
    if (storage[data.parentId]) {
      //console.log(`ℹ️ Additional products for ${data.parentId} already saved`);
      return;
    }

    storage[data.parentId] = data.products;
    Storage.set(storage);
    //console.log(`✅ Saved ${data.products.length} additional products for ${data.parentId}`);
  }

  function handleAddAdditionalClick(event) {
    const button = event.target.closest(SELECTORS.addAdditionalBtn);
    if (!button) return;
    event.preventDefault();

    if (state.isProcessing) {
      //console.log('Already processing...');
      return;
    }

    const item = button.closest(SELECTORS.additionalItem);
    const currentProductIdEl = document.querySelector(SELECTORS.currentProductId);
    if (!item || !currentProductIdEl) return;

    const currentProductId = currentProductIdEl.textContent.trim();
    const productData = getAdditionalItemData(item);
    if (!productData.id || !currentProductId) return;

    //console.log('Adding additional product:', productData);
    state.isProcessing = true;

    const storage = Storage.get();
    if (!storage[currentProductId]) {
      storage[currentProductId] = [];
    }

    const alreadyAdded = storage[currentProductId].some(p => p.id === productData.id);
    if (alreadyAdded) {
      //console.log('Product already added');
      const originalText = button.textContent;
      button.textContent = 'Вже додано';
      setTimeout(() => {
        button.textContent = originalText;
        state.isProcessing = false;
      }, 2000);
      return;
    }

    storage[currentProductId].push({
      id: productData.id,
      name: productData.name,
      price: productData.price,
      priceFormatted: productData.priceFormatted,
      compareAtPrice: productData.compareAtPrice,
      compareAtPriceFormatted: productData.compareAtPriceFormatted,
      discount: productData.discount,
      image: productData.image,
      formHTML: productData.formHTML,
      url: productData.url,
      parentId: currentProductId,
      quantity: 1
    });

    Storage.set(storage);

    const originalText = button.textContent;
    button.textContent = '✓ Додано';
    button.disabled = true;
    button.style.opacity = '0.6';

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      button.style.opacity = '1';
      state.isProcessing = false;
    }, 2000);

    //console.log('Additional product added to storage');
    if (isCartOpen()) {
      renderAdditionalProductsInCart();
    }
  }

  function isCartOpen() {
    const cartContainer = document.querySelector(SELECTORS.cartContainer);
    if (!cartContainer) return false;
    const display = window.getComputedStyle(cartContainer).display;
    return display !== 'none';
  }

  // ============================================
  // ФУНКЦІЇ ДЛЯ КОШИКА
  // ============================================

  function getCartProductIds() {
    const cartItems = document.querySelectorAll(SELECTORS.cartItem);
    const ids = [];
    cartItems.forEach(item => {
      const idEl = item.querySelector(SELECTORS.cartProductId);
      if (idEl) {
        const id = idEl.textContent.trim();
        if (id) ids.push(id);
      }
    });
    //console.log('Cart contains products:', ids);
    return ids;
  }

  function removeAdditionalPermanently(productId, parentId) {
    //console.log(`Permanently removing product ${productId} from parent ${parentId}`);
    const storage = Storage.get();
    if (storage[parentId]) {
      storage[parentId] = storage[parentId].filter(p => p.id !== productId);
      if (storage[parentId].length === 0) {
        delete storage[parentId];
      }
      Storage.set(storage);
      //console.log('✓ Product permanently removed from storage');
    }
  }

  function createAdditionalProductCard(product) {
    const card = document.createElement('div');
    card.className = 'cart-additional-item';
    card.dataset.additionalId = product.id;
    card.dataset.parentId = product.parentId;

    const priceDisplay = product.priceFormatted || `${product.price} грн`;

    let priceHTML = '';
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      const oldPriceDisplay = product.compareAtPriceFormatted ||
        `${product.compareAtPrice} грн`;
      const discountDisplay = product.discount || '';

      priceHTML = `
        <div class="cart-additional-item__price-row">
          <span class="cart-additional-item__old-price">${oldPriceDisplay}</span>
          ${discountDisplay ? `<span class="cart-additional-item__discount">${discountDisplay}</span>` : ''}
        </div>
        <span class="cart-additional-item__price">${priceDisplay}</span>
      `;
    } else {
      priceHTML = `<span class="cart-additional-item__price">${priceDisplay}</span>`;
    }

    const productUrl = product.url || '#';

    card.innerHTML = `
      <a href="${productUrl}" class="cart-additional-item__image-link">
        <div class="cart-additional-item__image">
          <img src="${product.image || ''}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'">
        </div>
      </a>
      
      <div class="cart-additional-item__content">
        <div class="cart-additional-item__info">
          <a href="${productUrl}" class="cart-additional-item__name-link">
            <div class="cart-additional-item__name">${product.name}</div>
          </a>
          
          <div class="cart-additional-item__meta">
            <div class="cart-additional-item__prices">
              ${priceHTML}
            </div>
            
            <div class="cart-additional-item__actions">
              <div class="cart-additional-form-wrapper" 
                   data-product-id="${product.id}" 
                   data-parent-id="${product.parentId}">
                ${product.formHTML}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        class="cart-additional-item__remove" 
        data-remove-additional="${product.id}"
        data-parent-id="${product.parentId}"
        title="Видалити"
        aria-label="Видалити товар"
      >
        ×
      </button>
    `;

    return card;
  }

  function renderAdditionalProductsInCart() {
    const section = document.querySelector(SELECTORS.additionalCartSection);
    const container = document.querySelector(SELECTORS.additionalCartItems);

    if (!section || !container) {
      //console.log('Additional cart section not found');
      return;
    }

    const cartProductIds = getCartProductIds();
    const storage = Storage.get();

    const allAdditionalProducts = [];
    cartProductIds.forEach(productId => {
      const additionalProducts = storage[productId];
      if (additionalProducts && Array.isArray(additionalProducts)) {
        allAdditionalProducts.push(...additionalProducts);
      }
    });

    //console.log(`Found ${allAdditionalProducts.length} additional products (before filtering)`);

    // ФІЛЬТРАЦІЯ 1: Видаляємо товари що вже є в основному кошику
    const cartIdsSet = new Set(cartProductIds);
    const notInMainCart = allAdditionalProducts.filter(p => !cartIdsSet.has(p.id));

    // ФІЛЬТРАЦІЯ 2: Видаляємо дублікати по ID товару
    const seenIds = new Set();
    const uniqueProducts = [];
    notInMainCart.forEach(product => {
      if (!seenIds.has(product.id)) {
        seenIds.add(product.id);
        uniqueProducts.push(product);
      }
    });

    // ФІЛЬТРАЦІЯ 3: Видаляємо товари "не в наявності"
    const availableProducts = uniqueProducts.filter(product => {
      if (!product.formHTML) return false;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = product.formHTML;

      const outOfStock = tempDiv.querySelector('.w-commerce-commerceaddtocartoutofstock');
      const form = tempDiv.querySelector('.w-commerce-commerceaddtocartform');

      if (outOfStock) {
        const outOfStockStyle = outOfStock.getAttribute('style') || '';
        const formStyle = form ? form.getAttribute('style') || '' : '';

        const isOutOfStockVisible = !outOfStockStyle.includes('display:none') &&
          !outOfStockStyle.includes('display: none');
        const isFormHidden = formStyle.includes('display:none') ||
          formStyle.includes('display: none');

        if (isOutOfStockVisible || isFormHidden) {
          //console.log(`❌ Product ${product.id} (${product.name}) is out of stock - hiding`);
          return false;
        }
      }

      return true;
    });

    //console.log(`Showing ${availableProducts.length} available products (after all filters)`);

    if (availableProducts.length === 0) {
      section.style.display = 'none';
      state.swiperInitialized = false;
      return;
    }

    container.innerHTML = '';

    const fragment = document.createDocumentFragment();
    availableProducts.forEach(product => {
      const card = createAdditionalProductCard(product);
      fragment.appendChild(card);
    });

    container.appendChild(fragment);
    section.style.display = 'block';

    initSwiperNavigation();

    //console.log('Additional products rendered in cart');
  }

  function handleAddToCartClick(event) {
    const button = event.target;
    const wrapper = button.closest('.cart-additional-form-wrapper');
    if (!wrapper) return;

    const productId = wrapper.dataset.productId;
    const parentId = wrapper.dataset.parentId;
    if (!productId || !parentId) return;

    //console.log(`🔄 Adding product ${productId} to cart from additionals...`);

    // Відстежуємо що товар додано з допів
    AddedFromAdditional.add(productId);

    setTimeout(() => {
      renderAdditionalProductsInCart();
      //console.log('✓ Cart re-rendered, product hidden from additionals');
      //console.log('📦 Products added from additional:', AddedFromAdditional.get());
    }, CONFIG.removeDelay);
  }

  function handleRemoveAdditional(event) {
    const button = event.target.closest(SELECTORS.removeAdditionalBtn);
    if (!button) return;
    event.preventDefault();

    const productId = button.dataset.removeAdditional;
    const parentId = button.dataset.parentId;

    //console.log(`Permanently removing product ${productId}`);
    removeAdditionalPermanently(productId, parentId);

    const card = button.closest('.cart-additional-item');
    if (card) {
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';

      setTimeout(() => {
        card.remove();
        const remainingCards = document.querySelectorAll('.cart-additional-item');
        if (remainingCards.length === 0) {
          const section = document.querySelector(SELECTORS.additionalCartSection);
          if (section) {
            section.style.display = 'none';
          }
        } else {
          updateNavButtons();
        }
      }, 300);
    }

    //console.log('✓ Product permanently removed');
  }

  /**
   * Видалення товару з відстеження при видаленні з основного кошика
   */
  function handleMainCartItemRemove() {
    const cartItems = document.querySelectorAll(SELECTORS.cartItem);

    cartItems.forEach(item => {
      const removeBtn = item.querySelector(SELECTORS.cartRemoveBtn);
      if (!removeBtn) return;

      // Додаємо обробник тільки якщо його ще немає
      if (removeBtn.dataset.trackingListenerAdded) return;
      removeBtn.dataset.trackingListenerAdded = 'true';

      removeBtn.addEventListener('click', () => {
        const idEl = item.querySelector(SELECTORS.cartProductId);
        if (idEl) {
          const productId = idEl.textContent.trim();

          // Видаляємо з відстеження
          AddedFromAdditional.remove(productId);
          //console.log(`🗑️ Removed ${productId} from tracking`);
          //console.log('📦 Remaining tracked products:', AddedFromAdditional.get());
        }
      });
    });
  }

  function syncCartAdditionals() {
    const cartProductIds = new Set(getCartProductIds());
    const storage = Storage.get();
    let hasChanges = false;

    Object.keys(storage).forEach(parentId => {
      if (!cartProductIds.has(parentId)) {
        //console.log(`Parent ${parentId} not in cart anymore, removing additionals`);
        delete storage[parentId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      Storage.set(storage);
    }

    renderAdditionalProductsInCart();

    // Додаємо обробники для кнопок видалення
    handleMainCartItemRemove();
  }

  function clearAllAdditionals() {
    //console.log('Clearing all additional products');
    Storage.clear();
    AddedFromAdditional.clear();

    const section = document.querySelector(SELECTORS.additionalCartSection);
    if (section) {
      section.style.display = 'none';
    }
    state.swiperInitialized = false;
  }

  // ============================================
  // CHECKOUT & CRM INTEGRATION
  // ============================================

  /**
   * Додавання прихованого поля в форму checkout з ID товарів з допів
   */
  function injectAddedFromAdditionalToCheckout() {
    const checkoutForm = document.querySelector(
      'form[data-node-type="commerce-checkout-customer-info-wrapper"]');

    if (!checkoutForm) {
      //console.log('⚠️ Checkout form not found');
      return;
    }

    if (checkoutForm.querySelector('input[name="added_from_additional"]')) {
      //console.log('ℹ️ Field already exists');
      return;
    }

    const addedProducts = AddedFromAdditional.getFormatted();

    if (!addedProducts) {
      //console.log('ℹ️ No products added from additional');
      return;
    }

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'added_from_additional';
    hiddenInput.value = addedProducts;

    checkoutForm.appendChild(hiddenInput);

    //console.log(`✅ Added hidden field with value: ${addedProducts}`);
  }

  /**
   * Очищення після успішного оформлення замовлення
   */
  function clearAfterCheckout() {
    Storage.clear();
    AddedFromAdditional.clear();
    //console.log('✅ All cart data cleared after checkout');
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  document.addEventListener('click', async (event) => {
    const finsweetBtn = event.target.closest(SELECTORS.finsweetAddBtn);
    if (finsweetBtn) {
      //console.log('🛒 Main product add to cart clicked (Finsweet)');
      setTimeout(async () => {
        await saveAdditionalProductsToStorage();
      }, 700);
    }
  });

  const additionalSection = document.querySelector(SELECTORS.additionalSection);
  if (additionalSection) {
    additionalSection.addEventListener('click', handleAddAdditionalClick);
  }

  const additionalCartSection = document.querySelector(SELECTORS.additionalCartSection);
  if (additionalCartSection) {
    additionalCartSection.addEventListener('click', (event) => {
      handleRemoveAdditional(event);
      if (event.target.matches(
          '.cart-additional-form-wrapper .w-commerce-commerceaddtocartbutton')) {
        handleAddToCartClick(event);
      }
    });
  }

  const cartList = document.querySelector(SELECTORS.cartList);
  if (cartList) {
    const cartObserver = new MutationObserver((mutations) => {
      const hasSignificantChange = mutations.some(mutation => {
        return mutation.type === 'childList' &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0);
      });
      if (hasSignificantChange) {
        //console.log('Cart changed, syncing additionals...');
        clearTimeout(state.updateTimeout);
        state.updateTimeout = setTimeout(syncCartAdditionals, CONFIG.debounceDelay);
      }
    });
    cartObserver.observe(cartList, {
      childList: true,
      subtree: true
    });
  }

  const cartContainer = document.querySelector(SELECTORS.cartContainer);
  if (cartContainer) {
    const cartVisibilityObserver = new MutationObserver(() => {
      if (isCartOpen()) {
        //console.log('Cart opened, rendering additionals...');
        renderAdditionalProductsInCart();
      }
    });
    cartVisibilityObserver.observe(cartContainer, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  const emptyState = document.querySelector(SELECTORS.cartEmptyState);
  if (emptyState) {
    const emptyObserver = new MutationObserver(() => {
      const isEmpty = emptyState.style.display !== 'none';
      if (isEmpty) {
        //console.log('Cart is empty, clearing additionals');
        clearAllAdditionals();
      }
    });
    emptyObserver.observe(emptyState, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  if (cartContainer && isCartOpen()) {
    renderAdditionalProductsInCart();
  }

  // Викликати на сторінці checkout
  if (window.location.pathname.includes('/checkout')) {
    const checkoutObserver = new MutationObserver(() => {
      injectAddedFromAdditionalToCheckout();
    });

    checkoutObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(injectAddedFromAdditionalToCheckout, 1000);

    //console.log('📋 Checkout page detected - waiting for form...');
  }

  // Очищення на thank you сторінці
  if (window.location.pathname.includes('/order-confirmation') ||
    window.location.pathname.includes('/thank-you')) {
    clearAfterCheckout();
  }

  // ============================================
  // PUBLIC API
  // ============================================
  window.CartAdditionals = {
    render: renderAdditionalProductsInCart,
    sync: syncCartAdditionals,
    clear: clearAllAdditionals,
    getStorage: Storage.get,
    getAddedFromAdditional: AddedFromAdditional.get,
    getAddedFromAdditionalFormatted: AddedFromAdditional.getFormatted,
    initSwiper: initSwiperNavigation,
    // Методи для дебагу
    debug: () => {
      //console.log('📦 Storage:', Storage.get());
      //console.log('📋 Added from additional:', AddedFromAdditional.get());
      //console.log('📝 Formatted:', AddedFromAdditional.getFormatted());
    }
  };

  //console.log('✅ Cart Additional Products System with Swiper and CRM tracking initialized');
});
