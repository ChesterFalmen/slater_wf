// /assets/search/search-page.js
window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  const INDEX_URL = 'https://zakupeace.biz.ua/webflow/search/search-index.php';
  const MAX_RESULTS = 240; // скільки максимум показуємо (за потреби змінюй)

  // Знаходимо елементи Webflow
  const searchResultList = document.querySelector('.search-result-list.search-result-items');
  const searchResultWrapper = document.querySelector('.search-result-wrapper');
  const searchInput = document.querySelector('input[name="query"]');
  const searchForm = document.querySelector('form[action*="search"]');

  if (!searchResultList) {
    console.log('Search result list not found');
    return;
  }

  // Створюємо новий контейнер для результатів
  const grid = document.createElement('div');
  grid.id = 'search-grid';
  grid.className = 'products__collection-list catalog';

  // Створюємо повідомлення про порожній результат
  const empty = document.createElement('div');
  empty.id = 'search-empty';
  empty.className = 'm-text-new search';
  empty.innerHTML = '<strong>Таких товарів не знайдено</strong>';

  // Замінюємо старий контент новим
  searchResultList.innerHTML = '';
  searchResultList.appendChild(empty);
  searchResultList.appendChild(grid);

  // Ініціалізуємо стилі для плавних переходів
  if (searchResultWrapper) {
    // Встановлюємо стилі одразу, щоб уникнути мигання
    searchResultWrapper.style.display = 'none';
    searchResultWrapper.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    searchResultWrapper.style.opacity = '0';
    searchResultWrapper.style.visibility = 'hidden';
  }

  // ---- helpers
  const norm = s => (s || '').toLowerCase().trim();
  const escapeHtml = (s = '') =>
    s.replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [m]));

  // Функція для управління видимістю блоку результатів
  function toggleResultsVisibility(show) {
    if (!searchResultWrapper) return;

    if (show) {
      // Встановлюємо display: block перед анімацією
      searchResultWrapper.style.display = 'block';
      // Невелика затримка для уникнення мигання
      setTimeout(() => {
        searchResultWrapper.style.opacity = '1';
        searchResultWrapper.style.visibility = 'visible';
      }, 50);
    } else {
      searchResultWrapper.style.opacity = '0';
      searchResultWrapper.style.visibility = 'hidden';
      // Ховаємо після анімації
      setTimeout(() => {
        searchResultWrapper.style.display = 'none';
      }, 300);
    }
  }

  // Сортування/бальна модель: ближче до початку + префікс
  function scoreItem(it, q) {
    const t = norm(it.t);
    const i = t.indexOf(q);
    if (i < 0) return -1;
    let s = 1000 - i;
    if (t.startsWith(q)) s += 500;
    s -= Math.abs(t.length - q.length);
    return s;
  }

  function searchItems(q, items) {
    q = norm(q);
    if (!q) return items.slice(0, MAX_RESULTS);
    const arr = [];
    for (const it of items) {
      const s = scoreItem(it, q);
      if (s >= 0) arr.push([s, it]);
    }
    arr.sort((a, b) => b[0] - a[0]);
    return arr.map(x => x[1]).slice(0, MAX_RESULTS);
  }

  // ---- LOAD INDEX (з кешем у памʼяті + optional localStorage)
  let INDEX = null;
  const LS_KEY = 'search-page-index-v1';
  const LS_TTL = 24 * 60 * 60 * 1000;

  // ОДНОРАЗОВЕ ОЧИЩЕННЯ localStorage - ВИДАЛИТИ ПІСЛЯ ОНОВЛЕННЯ!
  // localStorage.removeItem(LS_KEY);
  // localStorage.removeItem('search-page-index-v1');
  // console.log('LocalStorage очищено для оновлення даних');

  async function loadIndex() {
    if (INDEX) return INDEX;

    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.time < LS_TTL && cached.data?.items) {
          INDEX = cached.data;
          return INDEX;
        }
      }
    } catch (_) {}

    const res = await fetch(INDEX_URL, { cache: 'force-cache' });
    INDEX = await res.json();

    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ time: Date.now(), data: INDEX }));
    } catch (_) {}

    return INDEX;
  }

  // ---- TEMPLATE CARD (стиль Webflow)
  function cardHTML(p) {
    // показувати стару ціну/знижку лише якщо вони є
    const oldPrice = p.op ?
      `<div discount="old_price" class="t-text sale">${escapeHtml(p.op)}</div>` : '';
    const discWrap = p.d > 0 ?
      `<div class="leader-card-discount-wrapper"><div discount="percent" class="xxs-text">-${p.d}%</div></div>` :
      `<div class="leader-card-discount-wrapper no_availible_discount"><div class="xxs-text"></div></div>`;

    return `
    <div discount="card" role="listitem" class="product-card catalog new w-dyn-item">
      <a href="${p.u}" class="leader-card-wrapper w-inline-block">
        <div class="leader-card-img-wrapper">
          <div class="w-embed">
            ${p.img ? `<img class="product-image" src="${p.img}" alt="${escapeHtml(p.t)}">` : ''}
          </div>
        </div>

        <div class="leader-card-info-wrapper">
          <div class="leader-card-top-wrapper">
            <div class="produc-link-sale">
              <div class="t-text text_with_dots_1 colored">${escapeHtml(p.t)}</div>
            </div>
          </div>
        </div>

        <div class="leader-card-bot-wrapper">
          <div class="mobile-cart">
            <div class="leader-card-price-wrapper">
              <div class="leader-card-price-sale">
                ${oldPrice}
                ${discWrap}
              </div>
            </div>
            ${p.p ? `<div discount="new_price" class="h5 leader">${escapeHtml(p.p)}</div>` : ''}
          </div>
        </div>
      </a>

      <a href="${p.u}" class="add-to-cart-new w-inline-block" aria-label="Перейти до товару">
        <div class="add-to-cart-new-button is-arrow"></div>
      </a>
    </div>
    `;
  }

  function render(list) {
    grid.innerHTML = list.map(cardHTML).join('');
    empty.style.display = list.length > 0 ? 'none' : 'block';

    // Показуємо/ховаємо блок з результатами
    toggleResultsVisibility(list.length > 0);
  }

  // ---- пошук + оновлення URL
  let tmr;
  const debounce = (fn, ms = 250) => (...a) => {
    clearTimeout(tmr);
    tmr = setTimeout(() => fn(...a), ms);
  };

  const performSearch = debounce(async (q) => {
    const data = await loadIndex();
    const results = searchItems(q, data.items || []);
    render(results);

    const url = new URL(location.href);
    if (q) url.searchParams.set('query', q);
    else url.searchParams.delete('query');
    history.replaceState(null, '', url);
  }, 180);

  // ---- init з URL
  const params = new URLSearchParams(location.search);
  const initialQ = params.get('query') || '';
  if (searchInput) {
    searchInput.value = initialQ;
  }

  // Виконуємо пошук (функція render сама покаже блок якщо є результати)
  performSearch(initialQ);

  // live input
  if (searchInput) {
    searchInput.addEventListener('input', e => performSearch(e.target.value));
  }

  // submit Webflow-форми — не перезавантажуємо, лише оновлюємо
  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const query = searchInput ? searchInput.value.trim() : '';
      performSearch(query);
    });
  }
});
