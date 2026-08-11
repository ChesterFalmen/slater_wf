// ====================================================================
// PORIV UNIFIED SYSTEM - Об'єднана система порівняння товарів для Slater
// ====================================================================

window.Webflow = window.Webflow || [];
window.Webflow.push(() => {

  // Глобальні константи
  const CONFIG = {
    INDEX_URL: 'https://zakupeace.biz.ua/webflow/search/search-index.php',
    PHP_URL: 'https://zakupeace.biz.ua/webflow/handlers/kharakteristiki.php',
    LS_KEY: 'search-index-v1',
    LS_TTL: 24 * 60 * 60 * 1000,
    MAX_COMPARE_ITEMS: 3
  };

  // Глобальні змінні
  let INDEX = null;
  let CHARACTERISTICS = null;

  // Утиліти
  const escapeHtml = (s = '') => s.replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [m]));

  // ====================================================================
  // CORE SYSTEM (Part 1)
  // ====================================================================

  function initCore() {
    // Створюємо PORIV_CORE з базовими функціями
    window.PORIV_CORE = {
      qs: (selector) => document.querySelector(selector),
      qsa: (selector) => document.querySelectorAll(selector),
      getCompare: () => {
        try {
          const stored = localStorage.getItem('poriv_products');
          return stored ? JSON.parse(stored) : [];
        } catch {
          return [];
        }
      },
      setCompare: (ids) => {
        try {
          localStorage.setItem('poriv_products', JSON.stringify(ids));
          window.dispatchEvent(new CustomEvent('compare:changed', { detail: { ids } }));
        } catch (err) {
          // Помилка збереження порівняння
        }
      }
    };

    // Експортуємо функції оптимізації
    window.AsyncLoadingOptimizations = {
      debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func(...args), wait);
        };
      },
      throttle: (func, limit) => {
        let inThrottle;
        return function () {
          const args = arguments;
          const context = this;
          if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      },
      lazyLoadImages: () => {
        const images = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
              }
            });
          });
          images.forEach(img => imageObserver.observe(img));
        } else {
          images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          });
        }
      }
    };
  }

  // ====================================================================
  // DATA LOADING SYSTEM (Part 2a)
  // ====================================================================

  // Create table preloader
  function createTablePreloader() {
    const preloader = document.createElement('div');
    preloader.className = 'poriv-table-preloader';

    preloader.innerHTML = `
    <div class="preloader-spinner"></div>
    <div class="preloader-text">Завантаження характеристик товарів...</div>
    <div class="preloader-subtext">Будь ласка, зачекайте</div>
  `;

    return preloader;
  }

  // Show table preloader
  function showTablePreloader() {
    const { qs } = window.PORIV_CORE;
    const tableWrapper = qs('.comparison-main-wrapper');
    if (!tableWrapper) return null;

    // Clear existing content
    tableWrapper.innerHTML = '';

    // Add preloader
    const preloader = createTablePreloader();
    tableWrapper.appendChild(preloader);

    return preloader;
  }

  // Hide table preloader with smooth transition
  function hideTablePreloader(callback) {
    const preloader = document.querySelector('.poriv-table-preloader');
    if (!preloader) {
      if (callback) callback();
      return;
    }

    // Add fade out class
    preloader.classList.add('poriv-table-fade-out');

    // Wait for animation to complete (0.5s transition), then remove and call callback
    setTimeout(() => {
      if (preloader.parentNode) {
        preloader.remove();
      }
      if (callback) callback();
    }, 500);
  }

  // Loading indicator
  function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'poriv-loading-indicator';
    indicator.className = 'poriv-loading-indicator';

    indicator.innerHTML = `
    <div class="poriv-loading-spinner"></div>
    <span>Завантаження порівняння товарів...</span>
  `;

    document.body.appendChild(indicator);
    return indicator;
  }

  function hideLoadingIndicator() {
    const indicator = document.getElementById('poriv-loading-indicator');
    if (indicator) indicator.remove();
  }

  // Load index data
  async function loadIndex() {
    if (INDEX) return INDEX;

    try {
      const raw = localStorage.getItem(CONFIG.LS_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        const cacheAge = Date.now() - cached.time;
        if (cacheAge < CONFIG.LS_TTL && cached.data?.items) {
          INDEX = cached.data;
          return INDEX;
        }
      }

      const res = await fetch(CONFIG.INDEX_URL, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      INDEX = await res.json();

      try {
        localStorage.setItem(CONFIG.LS_KEY, JSON.stringify({
          time: Date.now(),
          data: INDEX
        }));
      } catch (storageErr) {
        // Помилка збереження в localStorage
      }
    } catch (err) {
      // Помилка завантаження індексу
      throw err;
    }

    return INDEX;
  }

  // Load characteristics
  async function loadCharacteristics() {
    if (CHARACTERISTICS) return CHARACTERISTICS;

    try {
      const res = await fetch(CONFIG.PHP_URL, { cache: "no-store", credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      CHARACTERISTICS = await res.json();
      return CHARACTERISTICS;
    } catch (err) {
      // Помилка завантаження характеристик
      return {};
    }
  }

  // Universal table row height synchronization
  function syncAllTableRowHeights() {
    const { qs, qsa } = window.PORIV_CORE;

    // Get all characteristic names (left column)
    const characteristicNames = qsa('.comparsion_table_name_cell');

    if (characteristicNames.length === 0) return;

    // Reset all heights first
    characteristicNames.forEach(nameCell => {
      nameCell.style.height = 'auto';
      nameCell.classList.add('poriv-sync-height');
    });

    // Reset all value cells heights
    const allValueCells = qsa('.comparsion_table_key_cell');
    allValueCells.forEach(cell => {
      cell.style.height = 'auto';
      cell.classList.add('poriv-sync-height');
    });

    setTimeout(() => {
      // Sync each row individually
      characteristicNames.forEach((nameCell, index) => {
        // Find corresponding value cells for this row
        let rowCells = [];

        if (nameCell.classList.contains('characteristics-header')) {
          // Header row - sync with product titles
          rowCells = qsa('.comparsion_table_key_cell.product-title');
        } else {
          // Regular characteristic row - find cells by index
          const characteristicIndex = nameCell.dataset.characteristicIndex;
          if (characteristicIndex !== undefined) {
            rowCells = qsa(
              `.comparsion_table_key_cell[data-characteristic-name]:nth-child(${parseInt(characteristicIndex) + 2})`
            );
          } else {
            // For price row (first characteristic)
            if (index === 1) { // First after header
              rowCells = qsa('.comparsion_table_key_cell.price-cell');
            } else {
              // Find cells in the same position
              const allProductColumns = qsa('[characteristic_names]');
              rowCells = [];
              allProductColumns.forEach(column => {
                const cellInRow = column.children[index];
                if (cellInRow) rowCells.push(cellInRow);
              });
            }
          }
        }

        if (rowCells.length > 0) {
          // Calculate max height for this row
          let maxHeight = nameCell.offsetHeight;
          rowCells.forEach(cell => {
            maxHeight = Math.max(maxHeight, cell.offsetHeight);
          });

          // Apply max height to all cells in this row
          nameCell.style.height = `${maxHeight}px`;
          rowCells.forEach(cell => {
            cell.style.height = `${maxHeight}px`;
          });
        }
      });
    }, 50);
  }

  // Legacy functions for backward compatibility
  function syncFirstRowHeight() {
    syncAllTableRowHeights();
  }

  function syncPriceRowHeight() {
    // This is now handled by syncAllTableRowHeights
  }

  // Create price block for product
  function createPriceBlock(product) {
    if (!product)
      return '<div class="poriv-price-block no-discount"><div class="poriv-current-price">Ціна не вказана</div></div>';

    const currentPrice = product.p || 'Ціна не вказана';
    const oldPrice = product.op;
    const discount = product.d;

    // Якщо є стара ціна та знижка
    if (oldPrice && discount && discount > 0) {
      return `
      <div class="poriv-price-block">
        <div class="poriv-current-price">${escapeHtml(currentPrice)}</div>
        <div class="poriv-price-details">
          <span class="poriv-old-price">${escapeHtml(oldPrice)}</span>
          <span class="poriv-discount-badge">-${discount}%</span>
        </div>
      </div>
    `;
    }

    // Якщо є тільки стара ціна (без знижки)
    if (oldPrice) {
      return `
      <div class="poriv-price-block">
        <div class="poriv-current-price">${escapeHtml(currentPrice)}</div>
        <div class="poriv-price-details">
          <span class="poriv-old-price">${escapeHtml(oldPrice)}</span>
        </div>
      </div>
    `;
    }

    // Тільки поточна ціна
    return `
    <div class="poriv-price-block no-discount">
      <div class="poriv-current-price">${escapeHtml(currentPrice)}</div>
    </div>
  `;
  }

  // Create comparison table
  function createComparisonTable(characteristics, selectedIds) {
    const { qs } = window.PORIV_CORE;
    const activeCards = JSON.parse(localStorage.getItem('activeCards') || '[]');
    const activeProductIds = selectedIds.filter(id => activeCards.includes(id)).slice(0, CONFIG
      .MAX_COMPARE_ITEMS);

    // Clear if no active products
    if (activeProductIds.length === 0) {
      const nameWrapper = qs('.comparsion_Table_Key_wrapper');
      if (nameWrapper) {
        nameWrapper.innerHTML =
          '<div class="no-active-products">Оберіть товари для порівняння характеристик</div>';
      }
      return;
    }

    // Collect characteristics
    const allCharacteristics = new Set();
    const productCharacteristics = {};

    activeProductIds.forEach(id => {
      const productData = characteristics[id];
      if (productData && productData.characteristics) {
        productCharacteristics[id] = productData.characteristics;
        Object.keys(productData.characteristics).forEach(key => allCharacteristics.add(
          key));
      }
    });

    const characteristicNames = Array.from(allCharacteristics).sort((a, b) =>
      a.localeCompare(b, 'uk', { sensitivity: 'base' })
    );

    // Додаємо "Ціна" як першу характеристику
    characteristicNames.unshift('Ціна');

    // Create names
    const nameWrapper = qs('.comparsion_Table_Key_wrapper');
    if (nameWrapper) {
      nameWrapper.innerHTML = '';

      // Header
      const headerCell = document.createElement('div');
      headerCell.className = 'comparsion_table_name_cell characteristics-header';
      headerCell.textContent = 'Характеристики';
      nameWrapper.appendChild(headerCell);

      // Characteristics
      characteristicNames.forEach((name, index) => {
        const cell = document.createElement('div');
        cell.className = 'comparsion_table_name_cell';
        cell.textContent = name;
        cell.dataset.characteristicIndex = index;
        nameWrapper.appendChild(cell);
      });
    }

    // Create values for active products
    activeProductIds.forEach(id => {
      const valueWrapper = qs(`[characteristic_names="${id}"]`);
      if (!valueWrapper) return;

      valueWrapper.innerHTML = '';

      // Get product title
      const indexData = JSON.parse(localStorage.getItem(CONFIG.LS_KEY) || '{}');
      const allProducts = indexData.data?.items || [];
      const product = allProducts.find(p => p.id === id);
      const productTitle = product ? product.t : `Товар ${id}`;

      // Title cell
      const titleCell = document.createElement('div');
      titleCell.className = 'comparsion_table_key_cell product-title';
      titleCell.textContent = productTitle;
      titleCell.dataset.productId = id;
      valueWrapper.appendChild(titleCell);

      // Characteristic values
      characteristicNames.forEach(name => {
        const cell = document.createElement('div');
        cell.className = 'comparsion_table_key_cell';
        cell.dataset.characteristicName = name;
        cell.dataset.productId = id;

        // Спеціальна обробка для ціни
        if (name === 'Ціна') {
          cell.innerHTML = createPriceBlock(product);
          cell.classList.add('price-cell');
        } else {
          let value = productCharacteristics[id]?.[name];
          if (!value || value.trim() === '') value = '-';

          cell.textContent = value;

          if (value === '-') cell.classList.add('missing-value');
        }

        valueWrapper.appendChild(cell);
      });
    });

    setTimeout(() => {
      syncAllTableRowHeights();
    }, 100);
  }

  // Create table HTML structure
  function createTableHTMLStructure(selectedIds) {
    const { qs } = window.PORIV_CORE;
    const tableWrapper = qs('.comparison-main-wrapper');
    if (!tableWrapper) return false;

    const activeCards = JSON.parse(localStorage.getItem('activeCards') || '[]');
    const activeProductIds = selectedIds.filter(id => activeCards.includes(id)).slice(0, CONFIG
      .MAX_COMPARE_ITEMS);

    const tableHTML = `
    <div class="poriv-table-fade-in">    
      <div class="comparison-table-content poriv-table-content">
        <div class="comparison-table-characteristics">
          <div class="comparsion_Table_Key_wrapper"></div>
          <div class="comparison-values-grid">
            ${activeProductIds.map(id => `
              <div class="comparison-product-values" data-product-id="${id}">
                <div class="comparsion_table_key_wrapper" characteristic_names="${id}"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

    tableWrapper.innerHTML = tableHTML;
    return true;
  }

  // Update comparison table
  async function updateComparisonTable() {
    const { qs } = window.PORIV_CORE;
    const activeIds = window.PORIV_CORE.getCompare();

    const tableWrapper = qs('.comparison-main-wrapper');
    if (tableWrapper) {
      tableWrapper.style.display = activeIds.length > 0 ? 'flex' : 'none';
    }

    if (!activeIds.length) return;

    try {
      // Show preloader while loading
      showTablePreloader();

      // Load characteristics (this might take time)
      const characteristics = await loadCharacteristics();

      // Hide preloader and show table with smooth transition
      hideTablePreloader(() => {
        // Create table structure
        const structureCreated = createTableHTMLStructure(activeIds);
        if (structureCreated) {
          // Fill table with data
          createComparisonTable(characteristics, activeIds);
        }
      });

    } catch (error) {
      // Hide preloader even on error
      hideTablePreloader(() => {
        const tableWrapper = qs('.comparison-main-wrapper');
        if (tableWrapper) {
          tableWrapper.innerHTML = `
          <div class="poriv-error-container">
            <div class="poriv-error-title">⚠️ Помилка завантаження</div>
            <div class="poriv-error-message">Не вдалося завантажити характеристики товарів</div>
          </div>
        `;
        }
      });
    }
  }

  // ====================================================================
  // PRODUCT RENDERING SYSTEM (Part 2b)
  // ====================================================================

  // Get comparison products
  function getComparisonProducts() {
    if (window.ComparisonHelper) {
      return window.ComparisonHelper.getComparisonProducts();
    }

    try {
      const stored = localStorage.getItem('poriv_products');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      return [];
    }
  }

  // Create product card HTML
  function createProductCardHTML(product) {
    const activeCards = JSON.parse(localStorage.getItem('activeCards') || '[]');
    const isActive = activeCards.includes(product.id);
    const activeClass = isActive ? ' active' : '';

    // Формуємо discount value (числове значення знижки)
    const discountValue = product.d || 0;

    // Формуємо стару ціну
    const oldPriceHTML = product.op ?
      `<div discount="old_price" data-wf-sku-bindings="%5B%7B%22from%22%3A%22f_compare_at_price_7dr10dr%22%2C%22to%22%3A%22innerHTML%22%7D%5D" class="t-text sale">${escapeHtml(product.op)}</div>` :
      '';

    // Формуємо блок знижки (для недоступних товарів)
    const discountNoAvailableHTML = product.d > 0 ?
      `<div data-wf-sku-conditions="%7B%22condition%22%3A%7B%22fields%22%3A%7B%22default-sku%3AecSkuInventoryQuantity%22%3A%7B%22eq%22%3A0%2C%22type%22%3A%22Number%22%7D%7D%7D%2C%22timezone%22%3A%22Europe%2FKiev%22%7D" class="leader-card-discount-wrapper no_availible_discount w-condition-invisible"><div fs-cmssort-type="number" discount="percent" fs-cmssort-field="disc" class="xxs-text">-${product.d}%</div></div>` :
      '';

    // Формуємо блок знижки (для доступних товарів)
    const discountAvailableHTML = product.d > 0 ?
      `<div data-wf-sku-conditions="%7B%22condition%22%3A%7B%22fields%22%3A%7B%22default-sku%3AecSkuInventoryQuantity%22%3A%7B%22gt%22%3A0%2C%22type%22%3A%22Number%22%7D%7D%7D%2C%22timezone%22%3A%22Europe%2FKiev%22%7D" class="leader-card-discount-wrapper"><div discount="percent" class="xxs-text">-${product.d}%</div></div>` :
      '';

    // Формуємо зображення
    const mainImage = product.img ?
      `<img class="product-image" data-src-desktop="${product.img}" data-src-mobile="${product.img}" alt="${escapeHtml(product.t)}" data-src="${product.img}?w=960&amp;auto=compress" loading="lazy" src="${product.img}?w=960&amp;auto=compress">` :
      '';

    // Друге зображення (якщо є)
    const secondImage = product.img2 ?
      `<img class="product-image is-second" data-src-desktop="${product.img2}" data-src-mobile="${product.img2}" alt="${escapeHtml(product.t)}" data-src="${product.img2}?w=960&amp;auto=compress" loading="lazy" src="${product.img2}?w=960&amp;auto=compress">` :
      '';

    return `
<div discount="card" role="group" class="poriv-card leader-ci swiper-slide w-dyn-item${activeClass}" data-item-id="${product.id}" data-discount-value="${discountValue}"><div class="poriv-saved-wrapper saved_item_wrapper absolute_wrapper"><div class="poriv-remove-btn fs-prod-buy-add-button-wrapper"><img src="data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:none;stroke:%23B3191D;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;%7D%3C/style%3E%3C/defs%3E%3Ctitle/%3E%3Cg id='cross'%3E%3Cline class='cls-1' x1='7' x2='25' y1='7' y2='25'/%3E%3Cline class='cls-1' x1='7' x2='25' y1='25' y2='7'/%3E%3C/g%3E%3C/svg%3E" loading="lazy" data-poriv-unsave="${product.id}" alt="Видалити з порівняння" class="poriv-remove-icon fs-prod-buy-add-button-img liked poriv-remove-button" title="Видалити з порівняння"></div></div><a href="${product.u}" class="poriv-card-link leader-card-wrapper w-inline-block"><div class="poriv-img-wrap leader-card-img-wrapper"><div class="poriv-embed w-embed">${mainImage}

${secondImage}</div><div data-wf-sku-conditions="%7B%22condition%22%3A%7B%22fields%22%3A%7B%22default-sku%3AecSkuInventoryQuantity%22%3A%7B%22eq%22%3A0%2C%22type%22%3A%22Number%22%7D%7D%7D%2C%22timezone%22%3A%22Europe%2FKiev%22%7D" class="poriv-no-photo no-avalible-photo w-condition-invisible"></div><div data-wf-sku-conditions="%7B%22condition%22%3A%7B%22fields%22%3A%7B%22default-sku%3AecSkuInventoryQuantity%22%3A%7B%22eq%22%3A0%2C%22type%22%3A%22Number%22%7D%7D%7D%2C%22timezone%22%3A%22Europe%2FKiev%22%7D" class="poriv-wait-status wait_item_status text-block-14 w-condition-invisible">Очікуємо надходження</div></div><div class="poriv-info-wrap leader-card-info-wrapper"><div class="poriv-top-wrap leader-card-top-wrapper"><div class="poriv-title-wrap produc-link-sale"><div data-text="text-3-lines" class="poriv-title t-text text_with_dots_1 colored">${escapeHtml(product.t)}</div><div data-id-item="crm_id" class="poriv-id t-text hide">${product.id}</div></div><div class="poriv-rating raiting_review_wrapper w-condition-invisible"><div class="poriv-stars starts_wraper product"><div class="poriv-stars-inner prod-stars-wrapper product"><img src="https://cdn.prod.website-files.com/6511ef558d67afe353cac882/673c97bf7117675eb761ed91_Star%202.svg" loading="lazy" width="20" height="20" alt="" class="poriv-star-icon star-icon product"><div class="poriv-rate-block div-block-77 product"><div class="poriv-rate-text count_reviews_text dyn_rate w-dyn-bind-empty"></div></div></div><div class="poriv-reviews prod-rew-wrapper"><img src="https://cdn.prod.website-files.com/6511ef558d67afe353cac882/6740764194839aa2ebc37155_lets-icons_comment-duotone.svg" loading="lazy" alt="" class="poriv-review-icon prod-rew-img product"><div class="poriv-review-text count_reviews_text dyn_reviews w-dyn-bind-empty"></div></div></div></div></div></div><div class="poriv-bot-wrap leader-card-bot-wrapper"><div class="poriv-cart mobile-cart"><div class="poriv-price-wrap leader-card-price-wrapper"><div data-wf-sku-conditions="%7B%22condition%22%3A%7B%22fields%22%3A%7B%22default-sku%3Acompare-at-price%22%3A%7B%22exists%22%3A%22yes%22%2C%22type%22%3A%22CommercePrice%22%7D%7D%7D%2C%22timezone%22%3A%22Europe%2FKiev%22%7D" class="poriv-price-sale leader-card-price-sale">${oldPriceHTML}${discountNoAvailableHTML}${discountAvailableHTML}</div><div discount="new_price" data-wf-sku-bindings="%5B%7B%22from%22%3A%22f_price_%22%2C%22to%22%3A%22innerHTML%22%7D%5D" data-wf-sku-conditions="%7B%22condition%22%3A%7B%22fields%22%3A%7B%22default-sku%3AecSkuInventoryQuantity%22%3A%7B%22gt%22%3A0%2C%22type%22%3A%22Number%22%7D%7D%7D%2C%22timezone%22%3A%22Europe%2FKiev%22%7D" class="poriv-new-price h5 leader">${product.p ? escapeHtml(product.p) : ''}</div><div discount="new_price" data-wf-sku-bindings="%5B%7B%22from%22%3A%22f_price_%22%2C%22to%22%3A%22innerHTML%22%7D%5D" data-wf-sku-conditions="%7B%22condition%22%3A%7B%22fields%22%3A%7B%22default-sku%3AecSkuInventoryQuantity%22%3A%7B%22eq%22%3A0%2C%22type%22%3A%22Number%22%7D%7D%7D%2C%22timezone%22%3A%22Europe%2FKiev%22%7D" class="poriv-new-price-na h5 leader no_availible_price w-condition-invisible">${product.p ? escapeHtml(product.p) : ''}</div></div></div></div><div class="poriv-tag card_tag w-condition-invisible"><div class="poriv-tag-text card_tag_text w-dyn-bind-empty"></div></div></a><a href="${product.u}" class="poriv-arrow-btn add-to-cart-new w-inline-block"><div class="poriv-arrow-icon add-to-cart-new-button is-arrow"></div></a></div>
  `;
  }

  // Render comparison products
  async function renderComparisonProducts() {
    const { qs } = window.PORIV_CORE;
    let container = qs('.comparison-fs-main-wrapper') ||
      qs('.comparison-fs-main.wrapper') ||
      qs('.comparison-fs-main-wrapper.slider') ||
      qs('[class*="comparison-fs-main"]');

    if (!container) return;

    const productIds = JSON.parse(localStorage.getItem('poriv_products') || '[]');
    if (productIds.length === 0) {
      container.innerHTML = '<div class="no-products">Немає товарів для порівняння</div>';
      return;
    }

    // Показуємо прелоадер поки завантажуються дані
    container.innerHTML =
      '<div class="poriv-cards-loading"><div class="preloader-spinner"></div><div class="preloader-text">Завантаження товарів...</div></div>';

    // Спробуємо отримати дані з localStorage
    let indexData = JSON.parse(localStorage.getItem(CONFIG.LS_KEY) || '{}');
    let allProducts = indexData.data?.items || [];

    // Якщо даних немає - завантажуємо з сервера
    if (allProducts.length === 0) {
      try {
        await loadIndex();
        // Після завантаження знову читаємо з localStorage
        indexData = JSON.parse(localStorage.getItem(CONFIG.LS_KEY) || '{}');
        allProducts = indexData.data?.items || [];
      } catch (err) {
        // Помилка завантаження індексу
      }
    }

    // Якщо після завантаження все ще немає даних - показуємо помилку
    if (allProducts.length === 0) {
      container.innerHTML =
        '<div class="no-products">Не вдалося завантажити дані товарів. Спробуйте оновити сторінку.</div>';
      return;
    }

    const comparisonProducts = productIds.map(id =>
      allProducts.find(product => product.id === id)
    ).filter(product => product);

    if (comparisonProducts.length === 0) {
      container.innerHTML = '<div class="no-products">Товари не знайдені</div>';
      return;
    }

    const html = comparisonProducts.map(createProductCardHTML).join('');
    container.innerHTML = html;
  }

  // Toggle product active
  function toggleProductActive(productId) {
    const productCard = document.querySelector(`[data-item-id="${productId}"]`);
    if (!productCard) return;

    const isCurrentlyActive = productCard.classList.contains('active');

    if (isCurrentlyActive) {
      productCard.classList.remove('active');
      const activeCards = JSON.parse(localStorage.getItem('activeCards') || '[]');
      const newActiveCards = activeCards.filter(id => id !== productId);
      localStorage.setItem('activeCards', JSON.stringify(newActiveCards));
    } else {
      const activeCards = JSON.parse(localStorage.getItem('activeCards') || '[]');
      if (activeCards.length >= CONFIG.MAX_COMPARE_ITEMS) {
        alert('Не можна більше 3 одночасно');
        return;
      }

      productCard.classList.add('active');
      if (!activeCards.includes(productId)) {
        activeCards.push(productId);
        localStorage.setItem('activeCards', JSON.stringify(activeCards));
      }
    }

    updateComparisonTableIfAvailable();
  }

  // Update comparison table if available
  function updateComparisonTableIfAvailable() {
    setTimeout(() => {
      if (window.updateComparisonTable && typeof window.updateComparisonTable ===
        'function') {
        window.updateComparisonTable().catch(error => {
          // Помилка оновлення таблиці
        });
      } else if (window.updateManual && typeof window.updateManual === 'function') {
        window.updateManual().catch(error => {
          // Помилка оновлення ручної таблиці
        });
      }
    }, 100);
  }

  // Remove from comparison
  function removeFromComparison(productId) {
    try {
      const productCard = document.querySelector(`[data-item-id="${productId}"]`);
      if (productCard) productCard.remove();

      // Remove from poriv_products
      const porivProducts = JSON.parse(localStorage.getItem('poriv_products') || '[]');
      const filteredProducts = porivProducts.filter(product => product.id !== productId);
      localStorage.setItem('poriv_products', JSON.stringify(filteredProducts));

      // Remove from activeCards
      const activeCards = JSON.parse(localStorage.getItem('activeCards') || '[]');
      const filteredActiveCards = activeCards.filter(id => id !== productId);
      localStorage.setItem('activeCards', JSON.stringify(filteredActiveCards));

      // Update through PORIV_CORE
      if (window.PORIV_CORE && window.PORIV_CORE.setCompare) {
        const currentIds = window.PORIV_CORE.getCompare();
        const newIds = currentIds.filter(id => id !== productId);
        window.PORIV_CORE.setCompare(newIds);
      }

      // Trigger event
      window.dispatchEvent(new CustomEvent('compare:changed', {
        detail: { productId, action: 'removed' }
      }));

      updateComparisonTableIfAvailable();
    } catch (error) {
      // Помилка видалення товару
    }
  }

  // ====================================================================
  // MANUAL SYSTEM (Part 3)
  // ====================================================================

  function createManualTable(characteristics, selectedIds) {
    const { qs } = window.PORIV_CORE;

    let tableContainer = qs('.comparison-main-wrapper');
    if (!tableContainer) {
      tableContainer = document.createElement('div');
      tableContainer.className = 'comparison-main-wrapper poriv-manual-table-container';

      const insertPoint = qs('.comparison-fs-main-wrapper') || document.body;
      insertPoint.appendChild(tableContainer);
    }

    tableContainer.innerHTML = '';
    tableContainer.classList.add('poriv-table-fade-in');

    const title = document.createElement('h3');
    title.textContent = 'Порівняння товарів (ручна версія)';
    title.className = 'poriv-manual-table-title';
    tableContainer.appendChild(title);

    selectedIds.forEach((id, index) => {
      const productData = characteristics[id];
      const productDiv = document.createElement('div');
      productDiv.className = 'poriv-manual-product-item';

      productDiv.innerHTML = `
      <strong>${productData?.title || `Товар ${index + 1}`}</strong><br>
      <small>ID: ${id}</small><br>
      <span class="poriv-manual-product-price">${productData?.price || 'Ціна не вказана'}</span>
    `;

      tableContainer.appendChild(productDiv);
    });

    return true;
  }

  async function updateManual() {
    try {
      const comparisonProducts = window.getComparisonProducts ? window
        .getComparisonProducts() : [];
      const activeIds = comparisonProducts.map(p => p.id);

      if (!activeIds.length) return false;

      // Show preloader for manual table
      showTablePreloader();

      const characteristics = await loadCharacteristics();

      // Hide preloader and show manual table with smooth transition
      hideTablePreloader(() => {
        const success = createManualTable(characteristics, activeIds);
        return success;
      });

      return true;
    } catch (err) {
      // Hide preloader on error
      hideTablePreloader();
      return false;
    }
  }

  // ====================================================================
  // INITIALIZATION & EXPORTS
  // ====================================================================

  function initPorivSystem() {
    // Initialize core
    initCore();

    // Export all functions
    window.loadIndex = loadIndex;
    window.loadCharacteristics = loadCharacteristics;
    window.createComparisonTable = createComparisonTable;
    window.createTableHTMLStructure = createTableHTMLStructure;
    window.updateComparisonTable = updateComparisonTable;
    window.syncAllTableRowHeights = syncAllTableRowHeights;
    window.syncFirstRowHeight = syncFirstRowHeight;
    window.syncPriceRowHeight = syncPriceRowHeight;
    window.showTablePreloader = showTablePreloader;
    window.hideTablePreloader = hideTablePreloader;
    window.createPriceBlock = createPriceBlock;
    window.getComparisonProducts = getComparisonProducts;
    window.createProductCardHTML = createProductCardHTML;
    window.renderComparisonProducts = renderComparisonProducts;
    window.toggleProductActive = toggleProductActive;
    window.removeFromComparison = removeFromComparison;
    window.updateComparisonTableIfAvailable = updateComparisonTableIfAvailable;
    window.createManualTable = createManualTable;
    window.updateManual = updateManual;

    // Auto-update table
    setTimeout(async () => {
      try {
        await updateComparisonTable();
      } catch (error) {
        // Помилка автоматичного оновлення
      }
    }, 1000);

    // Event listeners
    window.addEventListener('compare:changed', async () => {
      try {
        await updateComparisonTable();
      } catch (error) {
        // Помилка оновлення через подію
      }
    });

    window.addEventListener('activeCards:changed', async () => {
      try {
        await updateComparisonTable();
      } catch (error) {
        // Помилка оновлення через activeCards
      }
    });

    // Click handlers
    if (!window.PORIV_CLICK_HANDLER_ADDED) {
      window.PORIV_CLICK_HANDLER_ADDED = true;

      document.addEventListener('click', (e) => {
        // Перевіряємо чи це кнопка видалення
        if (e.target.hasAttribute('data-poriv-unsave')) {
          e.preventDefault();
          e.stopPropagation();
          const productId = e.target.getAttribute('data-poriv-unsave');
          removeFromComparison(productId);
          return;
        }

        // Перевіряємо чи це кнопка-стрілка (посилання на товар)
        if (e.target.closest('.add-to-cart-new')) {
          // Дозволяємо перехід за посиланням
          return;
        }

        // Перевіряємо чи це клік по карточці товару
        const productCard = e.target.closest('[data-item-id]');
        if (productCard && !e.target.hasAttribute('data-poriv-unsave') && !e.target.closest(
            '.add-to-cart-new')) {
          e.preventDefault();
          e.stopPropagation();
          const productId = productCard.getAttribute('data-item-id');
          toggleProductActive(productId);
          return;
        }
      });
    }

    // Initial render
    renderComparisonProducts().catch(err => {
      // Помилка рендерингу карточок
    });
  }

  // Initialize when DOM is ready
  initPorivSystem();

}); // End of Webflow.push
