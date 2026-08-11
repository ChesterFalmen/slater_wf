window.Webflow ||= [];
window.Webflow.push(() => {
  // ===== helpers =====
  const getJSON = (k, fb = []) => {
    try {
      return JSON.parse(localStorage.getItem(k) ||
        '[]');
    } catch { return fb; }
  };
  const setJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const $all = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ===== бейджі =====
  function updateBadges() {
    const saved = getJSON('saved_products').length;
    const poriv = getJSON('poriv_products').length;
    /*$all('[saved_count]').forEach(el => el.textContent = saved > 9 ? '9+' : saved);
    $all('[poriv_count],[compare_count]').forEach(el => el.textContent = poriv > 9 ? '9+' :
      poriv);*/

    document.querySelector('[saved_count]').textContent = saved > 9 ? '9+' :
      saved;
    document.querySelector('[poriv-count]').textContent = poriv > 9 ? '9+' :
      poriv;
  }

  // ===== дістаємо CRM id на сторінці товару і розкладаємо у атрибути кнопок =====
  function getProductIdFrom(container) {
    // 1) <... identifier="card">id_XXXX</...>
    const byIdentifier = container?.querySelector('[identifier="card"]');
    if (byIdentifier?.textContent?.trim()) return byIdentifier.textContent.trim();

    // 2) data-id-item="crm_id"
    const byData = container?.querySelector('[data-id-item="crm_id"]');
    if (byData?.textContent?.trim()) return byData.textContent.trim();

    // 3) #crm_id
    const byId = container?.querySelector('#crm_id');
    if (byId?.textContent?.trim()) return byId.textContent.trim();

    return '';
  }

  function hydrateProductPageIds() {
    const page = document.getElementById('product_page');
    if (!page) return;
    const pid = getProductIdFrom(page);
    if (!pid) return;

    // зберегти/видалити
    $all('[data-save]', page).forEach(el => el.setAttribute('data-save', pid));
    $all('[data-unsave]', page).forEach(el => el.setAttribute('data-unsave', pid));

    // порівняння
    $all('[data-poriv-save]', page).forEach(el => el.setAttribute('data-poriv-save', pid));
    $all('[data-poriv-unsave]', page).forEach(el => el.setAttribute('data-poriv-unsave', pid));
  }

  // ===== рендер пари кнопок у межах одного блоку =====
  function renderPairState(wrapper, id, saveAttr, unsaveAttr, list) {
    const saveEl = wrapper.querySelector(`[${saveAttr}="${id}"]`) || wrapper.querySelector(
      `[${saveAttr}]`);
    const unsaveEl = wrapper.querySelector(`[${unsaveAttr}="${id}"]`) || wrapper.querySelector(
      `[${unsaveAttr}]`);
    const isIn = list.includes(id);

    if (saveEl) saveEl.style.display = isIn ? 'none' : 'flex';
    if (unsaveEl) unsaveEl.style.display = isIn ? 'flex' : 'none';
  }

  // ===== загальний ініціалізатор для списку (saved / poriv) =====
  function initToggleList(storageKey, saveAttr, unsaveAttr, max = Infinity) {
    let list = getJSON(storageKey);

    // первинний рендер для кожного блоку
    $all(`[${saveAttr}], [${unsaveAttr}]`).forEach(el => {
      const wrapper = el.closest('.fs-prod-buy-add-button-wrapper, [data-poriv="elem"]') ||
        el.parentElement;
      if (!wrapper) return;
      const id = el.getAttribute(saveAttr) || el.getAttribute(unsaveAttr);
      if (!id) return;
      renderPairState(wrapper, id, saveAttr, unsaveAttr, list);

      // click handler (по елементу)
      if (!el.__bound__) {
        el.__bound__ = true;
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const pid = id; // той самий id для пари

          // toggle в списку
          const i = list.indexOf(pid);
          if (i >= 0) { list.splice(i, 1); }
          else {
            if (list.length >= max) {
              alert(
                `Максимум ${max} товар(и) у цьому списку`);
              return;
            }
            list.push(pid);
          }
          setJSON(storageKey, list);

          // локальний рендер у межах блоку
          renderPairState(wrapper, pid, saveAttr, unsaveAttr, list);

          // бейджі
          updateBadges();
        }, { passive: false });
      }
    });
  }

  // ==== запуск ====
  hydrateProductPageIds(); // підставити CRM id у кнопки на сторінці товару
  initToggleList('saved_products', 'data-save', 'data-unsave'); // збережені
  initToggleList('poriv_products', 'data-poriv-save', 'data-poriv-unsave',
    3); // порівняння (ліміт 3)
  updateBadges();

  // крос-вкладки
  window.addEventListener('storage', (e) => {
    if (e.key === 'saved_products' || e.key === 'poriv_products') {
      updateBadges();
    }
  });
});
