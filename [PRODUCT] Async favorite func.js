// ===== favorites-sync.js  (підключай на всіх сторінках) =====
(() => {
  const KEY = 'saved_products';
  const SEP = ','; // на випадок if needed
  const TAB_ID = (() => {
    try { return crypto.randomUUID(); } catch { return String(Math.random()).slice(2); }
  })();

  // ------- helpers -------
  const parse = (raw) => {
    try {
      const v = JSON.parse(raw ?? '[]');
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };
  const readSet = () => new Set(parse(localStorage.getItem(KEY)));
  const writeSet = (set) => localStorage.setItem(KEY, JSON.stringify([...set]));

  // атомне оновлення з union + невеличкий retry
  async function atomicUpdate(mutator, { retries = 3, backoff = 25 } = {}) {
    for (let i = 0; i <= retries; i++) {
      const current = readSet();
      const next = new Set(mutator(new Set(current)));

      // якщо не змінилось — просто синхронізуємо UI і виходимо
      if (sameSets(current, next)) { publish('sync', [...next]); return [...next]; }

      writeSet(next);

      // невелика перевірка через мить — чи не «перебили» інша вкладка
      await sleep(backoff);
      const now = readSet();

      // якщо наші зміни збереглись або стали надмножиною (ок!) — готово
      if (isSuperset(now, next)) { publish('sync', [...now]); return [...now]; }
      // інакше — повторюємо цикл із новою базою
    }
    // остання спроба: жорстко зливаємо
    const merged = new Set(mutator(readSet()));
    writeSet(merged);
    publish('sync', [...merged]);
    return [...merged];
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const sameSets = (a, b) => (a.size === b.size) && [...a].every(x => b.has(x));
  const isSuperset = (a, b) => [...b].every(x => a.has(x));

  // ------- API -------
  async function addFavorite(id) {
    return atomicUpdate(set => { set.add(id); return set; }).then(notifyUI);
  }
  async function removeFavorite(id) {
    return atomicUpdate(set => { set.delete(id); return set; }).then(notifyUI);
  }

  function getFavorites() { return [...readSet()]; }

  // ------- cross-tab sync -------
  const bc = ('BroadcastChannel' in window) ? new BroadcastChannel('saved_products') : null;

  function publish(type, payload) {
    if (bc) bc.postMessage({ src: TAB_ID, type, payload });
  }

  // отримуємо зміни з інших вкладок — просто оновлюємо UI, не перезаписуємо storage
  if (bc) {
    bc.onmessage = (e) => {
      if (!e?.data || e.data.src === TAB_ID) return;
      if (e.data.type === 'sync') notifyUI(e.data.payload);
    };
  }

  // fallback: подія storage працює між вкладками
  window.addEventListener('storage', (ev) => {
    if (ev.key !== KEY) return;
    notifyUI(parse(ev.newValue));
  });

  // ------- UI glue (приклад) -------
  function notifyUI(list) {
    const n = list.length;
    // бейдж у шапці
    document.querySelectorAll('[saved_count], #saved_count_page').forEach(el => {
      el.textContent = n > 99 ? '99+' : String(n);
    });
    // перемикаємо пари кнопок в DOM, якщо є
    document.querySelectorAll('[data-item-id]').forEach(card => {
      const id = card.getAttribute('data-item-id') || card.querySelector(
        '[identifier="card"]')?.textContent?.trim();
      if (!id) return;
      const wrap = card.querySelector('.fs-prod-buy-add-button-wrapper') || card;
      renderPair(wrap, id, list);
    });
  }

  function renderPair(wrapper, id, list) {
    const show = (el, on) => { if (el) el.style.display = on ? 'flex' : 'none'; };
    const inSaved = list.includes(id);
    const saveEl = wrapper.querySelector(
      `[data-save="${id}"], [data-save="id-crm"], [data-save="crm-card"]`);
    const unsaveEl = wrapper.querySelector(
      `[data-unsave="${id}"], [data-unsave="id-crm"], [data-unsave="crm-card"]`);
    show(saveEl, !inSaved);
    show(unsaveEl, inSaved);
  }

  // ------- експортуємо у window для твоїх хендлерів -------
  window.Favs = { addFavorite, removeFavorite, getFavorites };
})();
