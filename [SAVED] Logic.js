window.Webflow ||= [];
window.Webflow.push(() => {
  console.log('🚀 Logic.js: Початок ініціалізації');
  console.log('🔍 Шукаємо .favorite-main-wrapper...');

  // Простий тест для перевірки чи код запускається
  console.log('🧪 ТЕСТ: Код Logic.js запускається!');

  const LIST_WRAP = document.querySelector('.favorite-main-wrapper');
  console.log('🔍 LIST_WRAP знайдено:', LIST_WRAP);

  if (!LIST_WRAP) {
    console.error('❌ LIST_WRAP не знайдено! Перевірте чи існує .favorite-main-wrapper');
    console.log('🔍 Доступні елементи з класом favorite:', document.querySelectorAll(
      '[class*="favorite"]'));
    return;
  }

  console.log('✅ LIST_WRAP знайдено, продовжуємо...');

  // Константи для завантаження індексу товарів
  const INDEX_URL = 'https://zakupeace.biz.ua/webflow/search/search-index.php';
  const LS_KEY = 'search-index-v1';
  const LS_TTL = 2 * 60 * 60 * 1000; // 24 години

  const savedApi = window.LeaderSaved;

  const getSaved = () => {
    if (savedApi) return savedApi.getLocal();
    const saved = JSON.parse(localStorage.getItem('saved_products') || '[]');
    return saved;
  };
  const setSaved = (arr, silent) => {
    if (savedApi) {
      savedApi.setLocal(arr, silent);
      return;
    }
    localStorage.setItem('saved_products', JSON.stringify(arr));
  };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---- ЛОГІКА ЗАВАНТАЖЕННЯ ІНДЕКСУ ТОВАРІВ ----
  let INDEX = null;

  async function loadIndex() {
    console.log('📚 LoadIndex: Початок завантаження індексу');

    if (INDEX) {
      console.log('✅ Індекс вже завантажений з пам\'яті');
      return INDEX;
    }

    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.time < LS_TTL && cached.data?.items) {
          INDEX = cached.data;
          console.log('✅ Індекс завантажений з localStorage:', INDEX.items?.length,
            'товарів');
          return INDEX;
        }
      }
    } catch (e) {
      console.log('⚠️ Помилка читання з localStorage:', e);
    }

    try {
      console.log('🌐 Завантажуємо індекс з сервера:', INDEX_URL);
      const res = await fetch(INDEX_URL, { cache: 'force-cache' });
      INDEX = await res.json();
      console.log('✅ Індекс завантажений з сервера:', INDEX.items?.length, 'товарів');

      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ time: Date.now(), data: INDEX }));
        console.log('💾 Індекс збережено в localStorage');
      } catch (e) {
        console.log('⚠️ Помилка збереження в localStorage:', e);
      }

      return INDEX;
    } catch (error) {
      console.error('❌ Помилка завантаження індексу товарів:', error);
      return { items: [] };
    }
  }

  // Функція для отримання товарів за ID з збережених
  async function getProductsByIds(savedIds) {
    console.log('🔍 GetProductsByIds: Шукаємо товари за ID:', savedIds);

    if (!savedIds || savedIds.length === 0) {
      console.log('❌ Немає ID для пошуку');
      return [];
    }

    const index = await loadIndex();
    const allItems = index.items || [];
    console.log('📋 Всього товарів в індексі:', allItems.length);

    // Фільтруємо товари за збереженими ID
    const foundProducts = allItems.filter(item => savedIds.includes(item.id));
    console.log('🎯 Знайдено товарів:', foundProducts.length, foundProducts);

    return foundProducts;
  }

  // ---- ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ РЕНДЕРИНГУ ----
  const escapeHtml = (s = '') =>
    s.replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [m]));

  // Функція для створення HTML картки товару (стиль з search-page.js)
  function createProductCardHTML(product) {
    // беремо поточну та стару ціну (підтримує кілька назв поля на майбутнє)
    const priceStr = product.p || product.price || '';
    const oldStr = product.op || product.old || product.old_price || product.compare_at_price ||
      '';

    // Перевіряємо наявність товару
    const inStock = product.avaible === true || product.avaible === 'in stock';

    // Функція для парсингу ціни (з search-page.js)
    function priceNumber(s) {
      if (!s) return null;
      const m = String(s).match(/[-+]?[0-9][0-9\s.,]*/);
      if (!m) return null;
      let num = m[0].replace(/\s| /g, ''); // звич. і нерозривний пробіл
      if (num.includes(',') && num.includes('.')) num = num.replace(/,/g, '');
      else num = num.replace(',', '.');
      const n = parseFloat(num);
      return Number.isFinite(n) ? n : null;
    }

    const priceNum = priceNumber(priceStr);
    const oldNum = priceNumber(oldStr);
    const hasOld = oldNum && priceNum && oldNum > priceNum;
    const discount = hasOld ? Math.round(((oldNum - priceNum) / oldNum) * 100) : 0;

    return `
    <div data-item-id="${product.id}" role="listitem" class="favorite-ci w-dyn-item">
      <a href="${product.u}" class="leader-card-wrapper favorite w-inline-block">
        <div class="saved_item_wrapper absolute_wrapper">
          <div class="fs-prod-buy-add-button-wrapper">
            <img src="https://cdn.prod.website-files.com/6511ef558d67afe353cac882/67825c015821aa43225d1b6b_solar_heart-outline.svg" loading="lazy" data-unsave="${product.id}" alt="" class="fs-prod-buy-add-button-img liked" style="display: flex;">
          </div>
        </div>
        
        <div class="leader-card-img-wrapper">
          <div class="w-embed">
            <img class="product-image is-second" data-src="${product.img || ''}" loading="lazy" src="${product.img || ''}">
          </div>
          <div class="no-avalible-photo ${!inStock ? '' : 'w-condition-invisible'}"></div>
          <div class="wait_item_status text-block-14 ${!inStock ? '' : 'w-condition-invisible'}">Очікуємо надходження</div>
        
        </div>
        
        <div class="leader-card-info-wrapper">
          <div class="leader-card-top-wrapper">
            <div class="produc-link-sale">
              <div data-text="text-3-lines" class="t-text">${escapeHtml(product.t)}</div>
              <div identifier="card" class="t-text hide">${product.id}</div>
            </div>
            <div class="raiting_review_wrapper w-condition-invisible">
              <div class="starts_wraper product">
                <div class="prod-stars-wrapper product">
                  <img src="https://cdn.prod.website-files.com/6511ef558d67afe353cac882/673c97bf7117675eb761ed91_Star%202.svg" loading="lazy" width="20" height="20" alt="" class="star-icon product">
                  <div class="div-block-77 product">
                    <div class="count_reviews_text dyn_rate w-dyn-bind-empty"></div>
                  </div>
                </div>
                <div class="prod-rew-wrapper">
                  <img src="https://cdn.prod.website-files.com/6511ef558d67afe353cac882/6740764194839aa2ebc37155_lets-icons_comment-duotone.svg" loading="lazy" alt="" class="prod-rew-img product">
                  <div class="count_reviews_text dyn_reviews w-dyn-bind-empty"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="leader-card-bot-wrapper">
          <div class="mobile-cart">
            <div class="leader-card-price-wrapper">
              <div class="leader-card-price-sale ${hasOld ? '' : 'w-condition-invisible'}">
                ${hasOld ? `<div discount="old_price" class="t-text sale">${escapeHtml(oldStr)}</div>` : ''}
                ${hasOld ? `<div class="leader-card-discount-wrapper"><div discount="percent" class="xxs-text">-${discount}%</div></div>` : ''}
              </div>
              ${priceStr ? `<div discount="new_price" class="h5 leader">${escapeHtml(priceStr)}</div>` : ''}
            </div>
          </div>
        </div>
        
        <div class="add-to-cart-new">
          <div class="add-to-cart-new-button is-arrow"></div>
        </div>
      </a>
    </div>
    `;
  }

  // [ADD] waitForCmsAll()
  function waitForCmsAll(hostId = 'favorites') {
    return new Promise((resolve) => {
      const id = hostId.startsWith('#') ? hostId.slice(1) : hostId;
      const host = document.getElementById(id);
      if (!host) return resolve(false);

      let countEl = host.querySelector('[fs-cmsload-element="items-count"]');
      if (!countEl) {
        countEl = document.createElement('div');
        countEl.setAttribute('fs-cmsload-element', 'items-count');
        countEl.style.display = 'none';
        host.appendChild(countEl);
      }

      const onReady = (lists) => {
        const list = lists.find(l => host.contains(l.wrapper));
        if (!list) return resolve(false);

        let fired = false;
        const maybeAllDone = () => {
          const total = Number(list.itemsCount?.textContent || countEl.textContent ||
            0);
          const loaded = list.items.length;
          if (total && loaded >= total && !fired) {
            fired = true;
            requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
          }
        };

        list.on('additems', maybeAllDone);
        list.on('renderitems', maybeAllDone);
        maybeAllDone();
      };

      (window.fsAttributes = window.fsAttributes || []).push(['cmsload', onReady]);
    });
  }

  function sanitizeSaved(arr) {
    if (savedApi) return savedApi.sanitize(arr);
    // прибираємо плейсхолдери/порожні/дублі
    const bad = new Set(['id-crm', 'crm-card', 'crm_card', '']);
    const out = [];
    const seen = new Set();
    for (const raw of (arr || [])) {
      const id = String(raw || '').trim();
      if (!id || bad.has(id)) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }
  // усі id, що вже відрендерились у DOM (беремо з [identifier="card"])
  function renderedIds() {
    const itemsContainer = LIST_WRAP.querySelector('.favorite-cl.w-dyn-items');
    if (!itemsContainer) return [];

    return Array.from(itemsContainer.querySelectorAll('[identifier="card"]'))
      .map(el => (el.textContent || '').trim())
      .filter(Boolean);
  }

  // чи всі збережені вже присутні у DOM
  function hasAllSavedRendered() {
    const saved = getSaved();
    if (saved.length === 0) return true;
    const have = new Set(renderedIds());
    return saved.every(id => have.has(id));
  }

  // вивід числа на сторінці
  function setSavedCountPage() {
    const box = document.getElementById('saved_count_page');
    if (box) box.textContent = String(getSaved().length);
  }
  // за бажанням: бейджі в хедері
  function updateHeaderBadges() {
    const n = getSaved().length;
    document.querySelectorAll('[saved_count]').forEach(el => el.textContent = n > 9 ? '9+' : n);
  }

  // привʼязати кліки для конкретної картки
  function bindSavedHandlers(card, id) {
    const wrapper = card.querySelector('.fs-prod-buy-add-button-wrapper') || card;

    // первинний стан іконки
    renderSavedPairState(wrapper, id, getSaved());

    if (wrapper.__bound__) return;
    wrapper.__bound__ = true;

    wrapper.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-unsave]');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const btnId = btn.getAttribute('data-unsave')?.trim();
      if (!btnId) return;

      console.log('🗑️ Видаляємо товар з обраного:', btnId);

      if (savedApi) {
        savedApi.remove(btnId);
      } else {
        let list = sanitizeSaved(getSaved());
        list = list.filter(x => x !== btnId);
        setSaved(list);
      }

      // зняти зі сторінки "Вибране" одразу
      card.remove();

      setSavedCountPage();
      updateHeaderBadges();
    }, { passive: false });
  }

  // показати правильну іконку видалення
  function renderSavedPairState(wrapper, id, list) {
    const unsaveEl = wrapper.querySelector(`[data-unsave="${id}"]`);
    const inSaved = list.includes(id);
    if (unsaveEl) {
      unsaveEl.style.display = inSaved ? 'flex' : 'none';
    }
  }

  // коли всі картки мають заповнений identifier="card"
  function allReady() {
    console.log('🔍 AllReady: Перевіряємо готовність карток');
    const itemsContainer = LIST_WRAP.querySelector('.favorite-cl.w-dyn-items');
    console.log('📦 ItemsContainer знайдено:', itemsContainer);

    if (!itemsContainer) {
      console.log('❌ AllReady: ItemsContainer не знайдено');
      return false;
    }

    const cards = itemsContainer.querySelectorAll('[data-item-id]');
    console.log('🎴 Карток знайдено:', cards.length);

    if (!cards.length) {
      console.log('❌ AllReady: Карток немає');
      return false;
    }

    const allReady = Array.from(cards).every(c => {
      const t = c.querySelector('[identifier="card"]');
      const hasId = t && t.textContent.trim().length > 0;
      console.log('🔍 Картка готова:', hasId, c);
      return hasId;
    });

    console.log('✅ AllReady результат:', allReady);
    return allReady;
  }

  async function process() {
    console.log('🔄 Process: Початок обробки');

    if (savedApi && window.LeaderApi?.isAuthenticated()) {
      await savedApi.syncWithServer();
    }

    // 0) санітизація збережених
    const savedClean = sanitizeSaved(getSaved());
    console.log('💾 Збережені товари (після санітизації):', savedClean);
    setSaved(savedClean);

    const saved = savedClean;

    // Створюємо основну структуру всередині favorite-main-wrapper
    console.log('🏗️ Створюємо HTML структуру');
    LIST_WRAP.innerHTML = `
      <div id="favorites" data-collection="saved" class="favorite-clw w-dyn-list">
        <div fs-cmsload-mode="render-all" data-collection="saved" fs-cmsload-element="list" role="list" class="favorite-cl w-dyn-items">
        </div>
      </div>
    `;

    const favoritesContainer = LIST_WRAP.querySelector('#favorites');
    const itemsContainer = LIST_WRAP.querySelector('.favorite-cl.w-dyn-items');
    console.log('📦 Контейнери створено:', { favoritesContainer, itemsContainer });

    if (saved.length === 0) {
      console.log('📭 Немає збережених товарів, показуємо Empty State');
      // Якщо немає збережених товарів, показуємо Empty State
      itemsContainer.innerHTML = '<div class="empty-state">No items found.</div>';
      setSavedCountPage();
      updateHeaderBadges();
      return;
    }

    try {
      console.log('📥 Завантажуємо товари за збереженими ID:', saved);
      // Завантажуємо товари за збереженими ID
      const products = await getProductsByIds(saved);
      console.log('🛍️ Знайдено товарів:', products.length, products);

      if (products.length === 0) {
        console.log('❌ Товари не знайдені в індексі');
        itemsContainer.innerHTML = '<div class="empty-state">No items found.</div>';
        setSavedCountPage();
        updateHeaderBadges();
        return;
      }

      console.log('🎨 Рендеримо картки товарів');
      // Очищаємо контейнер та додаємо нові картки
      itemsContainer.innerHTML = '';

      products.forEach((product, index) => {
        console.log(`📦 Рендеримо картку ${index + 1}:`, product);
        const cardHTML = createProductCardHTML(product);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        const card = tempDiv.firstElementChild;

        itemsContainer.appendChild(card);

        // Прив'язуємо обробники подій
        bindSavedHandlers(card, product.id);
        console.log(`✅ Картка ${index + 1} додана та обробники прив'язані`);
      });

      // Показуємо контейнер з результатами
      console.log('👁️ Показуємо контейнер з результатами');
      favoritesContainer.style.display = 'flex';

    } catch (error) {
      console.error('❌ Помилка завантаження збережених товарів:', error);
      itemsContainer.innerHTML =
        '<div class="error-favorites">Помилка завантаження товарів</div>';
    }

    // оновити лічильник і показати список
    console.log('🔢 Оновлюємо лічильники');
    setSavedCountPage();
    updateHeaderBadges();
    console.log('✅ Process завершено');
  }

  let _processed = false;
  const processOnce = async () => {
    console.log('🔄 ProcessOnce: Спроба запуску process()');
    if (_processed) {
      console.log('⚠️ Process вже виконано, пропускаємо');
      return;
    }
    _processed = true;
    console.log('✅ ProcessOnce: Запускаємо process()');
    await process();
  };

  // --- додаємо управління станом "готовності" ---
  let cmsDone = false;
  const maybeProcess = async () => {
    if (cmsDone && allReady()) {
      obs.disconnect();
      await processOnce();
    }
  };
  // --- кінець вставки ---

  const tryRun = async () => {
    console.log('🔄 TryRun: Перевіряємо готовність');
    // allReady() каже, що кожна картка вже має [identifier="card"] з id
    const ready = allReady();
    console.log('🔍 AllReady результат:', ready);
    if (ready) {
      console.log('✅ TryRun: Запускаємо maybeProcess');
      await maybeProcess();
    } else {
      console.log('⏳ TryRun: Ще не готово, чекаємо...');
    }
  };
  const obs = new MutationObserver(tryRun);
  obs.observe(LIST_WRAP, { childList: true, subtree: true });

  // Додаємо CSS для відключення hover ефекту та стилізації кнопки
  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 992px) {
      .favorite-main-wrapper .product-image.is-second:hover {
        opacity: 1 !important;
      }
      
      /* Стилі для кнопки add-to-cart-new */
      .favorite-main-wrapper .add-to-cart-new {
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        transform: translateY(10px);
      }
      
      .favorite-main-wrapper .leader-card-wrapper:hover .add-to-cart-new {
        display: block;
        opacity: 1;
        transform: translateY(0);
      }
      
      /* Дебаг блок - можна приховати встановивши display: none */
      .favorite-main-wrapper .debug-stock-info {
        /* display: none; */ /* Розкоментуйте цей рядок щоб приховати дебаг інформацію */
      }
    }
  `;
  document.head.appendChild(style);
  console.log('🎨 CSS правила додано для hover ефектів');

  console.log('🔧 Ініціалізація завершена, запускаємо tryRun');
  setSavedCountPage();
  updateHeaderBadges();

  // Простий тест - запускаємо process одразу
  console.log('🧪 ТЕСТ: Запускаємо process() одразу для тесту');
  process().then(() => {
    console.log('✅ ТЕСТ: process() завершено');
  }).catch(error => {
    console.error('❌ ТЕСТ: Помилка в process():', error);
  });

  tryRun();

  (async () => {
    console.log('⏳ Чекаємо повного render-all блоку favorites');
    // чекаємо повного render-all саме цього блоку
    await waitForCmsAll('favorites');
    console.log('✅ CMS завантаження завершено');
    cmsDone = true;
    await maybeProcess(); // якщо DOM уже готовий, це одразу запустить processOnce()
  })();

  // синхронізація між вкладками та після входу в акаунт
  window.addEventListener('storage', (e) => {
    if (e.key === 'saved_products') {
      setSavedCountPage();
      updateHeaderBadges();
      _processed = false;
      process();
    }
  });

  document.addEventListener('leader:saved-changed', () => {
    setSavedCountPage();
    updateHeaderBadges();
  });

  document.addEventListener('leader:auth-state', async (e) => {
    if (!e.detail?.loggedIn) return;
    if (savedApi) await savedApi.syncWithServer();
    _processed = false;
    await process();
  });
});
