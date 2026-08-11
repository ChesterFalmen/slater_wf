/**
 * LEADER — кнопки «сердечко» на картках товарів (додати / прибрати з обраного).
 *
 * ═══ КУДИ ПІДКЛЮЧИТИ ═══
 * Webflow → Project Settings → Custom Code → Before </body>
 * (на ВСІХ сторінках з картками товарів, ПІСЛЯ leader-saved.js)
 *
 * Розмітка:
 *   data-save="{product_id}"   — додати в обране (порожнє серце)
 *   data-unsave="{product_id}" — прибрати з обраного (заповнене серце)
 */
(function () {
  'use strict';

  var saved = window.LeaderSaved;
  if (!saved) {
    console.warn('[Leader saved-hearts] leader-saved.js не підключено');
    return;
  }

  function resolveProductId(target) {
    var saveBtn = target.closest('[data-save]');
    if (saveBtn) return saveBtn.getAttribute('data-save')?.trim() || '';

    var unsaveBtn = target.closest('[data-unsave]');
    if (unsaveBtn) return unsaveBtn.getAttribute('data-unsave')?.trim() || '';

    var wrapper = target.closest('.fs-prod-buy-add-button-wrapper');
    if (wrapper) {
      var el =
        wrapper.querySelector('[data-save]') ||
        wrapper.querySelector('[data-unsave]');
      if (el) {
        return (
          el.getAttribute('data-save') || el.getAttribute('data-unsave') || ''
        ).trim();
      }
    }

    var card = target.closest('[data-item-id]');
    if (card) {
      var idEl = card.querySelector('[identifier="card"]');
      if (idEl) return (idEl.textContent || '').trim();
      return (card.getAttribute('data-item-id') || '').trim();
    }

    return '';
  }

  document.addEventListener(
    'click',
    function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var inHeart =
        target.closest('[data-save]') ||
        target.closest('[data-unsave]') ||
        target.closest('.fs-prod-buy-add-button-wrapper');
      if (!inHeart) return;

      var productId = resolveProductId(target);
      if (!productId) return;

      event.preventDefault();
      event.stopPropagation();

      saved.toggle(productId);

      var card = inHeart.closest('[data-item-id]');
      if (card) {
        saved.refreshHeartStates(card);
      } else {
        saved.refreshHeartStates(inHeart.closest('.leader-card-wrapper') || inHeart);
      }
    }, { passive: false }
  );

  document.addEventListener('leader:saved-changed', function () {
    saved.refreshHeartStates();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      saved.refreshHeartStates();
    });
  } else {
    saved.refreshHeartStates();
  }
})();
