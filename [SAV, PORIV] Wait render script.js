/**
 * Чекає, поки FS CMS Load (render-all) повністю завантажить і відрендерить усі айтеми
 * у вказаному блоці. Повертає Promise<boolean>.
 *
 * @param {string} hostId - id wrapper'а блоку (без або з #)
 * @returns {Promise<boolean>} resolves(true) коли все завантажено, false якщо блок/лист не знайдено
 */
function waitForCmsAll(hostId) {
  return new Promise((resolve) => {
    const id = hostId.startsWith('#') ? hostId.slice(1) : hostId;
    const host = document.getElementById(id);
    if (!host) {
      console.warn('waitForCmsAll: host not found:', hostId);
      return resolve(
        false);
    }

    // гарантуємо, що є items-count (якщо забули додати у розмітці)
    let countEl = host.querySelector('[fs-cmsload-element="items-count"]');
    if (!countEl) {
      countEl = document.createElement('div');
      countEl.setAttribute('fs-cmsload-element', 'items-count');
      countEl.style.display = 'none';
      host.appendChild(countEl);
    }

    // колбек, який отримає всі інстанси списків на сторінці
    const onCmsLoadReady = (lists) => {
      // знаходимо саме той список, що лежить усередині нашого host
      const list = lists.find(l => host.contains(l.wrapper));
      if (!list) {
        console.warn('waitForCmsAll: CMS List not found in host:',
          hostId);
        return resolve(false);
      }

      let fired = false;
      const maybeAllDone = () => {
        const total = Number(list.itemsCount?.textContent || countEl.textContent || 0);
        const loaded = list.items.length; // скільки вже докачано у пам'ять
        if (total && loaded >= total && !fired) {
          fired = true;
          // даємо DOM відмалюватись
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
        }
      };

      // реагуємо на додавання/рендер айтемів
      list.on('additems', maybeAllDone);
      list.on('renderitems', maybeAllDone);

      // одразу пробуємо (раптом все вже готово)
      maybeAllDone();
    };

    // черга FS Attributes — викликається і якщо вже ініціалізовано
    (window.fsAttributes = window.fsAttributes || []).push(['cmsload', onCmsLoadReady]);
  });
}
