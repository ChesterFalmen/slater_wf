window.Webflow ||= [];
window.Webflow.push(() => {
  const C = window.PORIV_CORE;
  if (!C) return;
  const { qs, qsa, getSaved, setSaved, getCompare, setCompare, MAX_COMPARE } = C;

  const productEl = qs('[data-item-id]');
  if (!productEl) return; // safety
  const id = productEl.getAttribute('data-item-id');

  const btnSave = qs('[data-save-toggle]');
  const btnCompare = qs('[data-compare-toggle]');

  // hydrate кнопки станами
  function syncButtons() {
    const saved = getSaved();
    const compare = getCompare();
    if (btnSave) btnSave.classList.toggle('is-active', saved.includes(id));
    if (btnCompare) btnCompare.classList.toggle('is-active', compare.includes(id));
  }
  syncButtons();

  // ЗБЕРЕГТИ
  if (btnSave) {
    btnSave.addEventListener('click', (e) => {
      e.preventDefault();
      let list = getSaved();
      if (list.includes(id)) list = list.filter(x => x !== id);
      else list.push(id);
      setSaved(list);
      syncButtons();
    });
  }

  // ПОРІВНЯТИ
  if (btnCompare) {
    btnCompare.addEventListener('click', (e) => {
      e.preventDefault();
      let list = getCompare();
      if (list.includes(id)) {
        list = list.filter(x => x !== id);
      } else {
        if (list.length >= MAX_COMPARE) {
          alert(`Максимум ${MAX_COMPARE} товари для порівняння`);
          return;
        }
        list.push(id);
      }
      setCompare(list);
      syncButtons();
    });
  }

  // коли зміни з інших вкладок
  window.addEventListener('compare:changed', syncButtons);
});
