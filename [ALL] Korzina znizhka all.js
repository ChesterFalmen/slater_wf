/**
 * Cart Discount Calculator for Webflow
 * 
 * @description Автоматичний підрахунок знижки та суми без знижок
 * @version 2.0.0
 */

window.Webflow ||= [];
window.Webflow.push(function () {
  const SELECTORS = {
    cartList: '[data-cart-items]',
    cartItem: '[data-cart-item]',
    comparePrice: '.compare_price_in_card_popup',
    currentPrice: '.text-block-75',
    quantity: '.cart-quantity',
    discountRow: '.compare_all',
    discountValue: '.compare_all .w-commerce-commercecartordervalue',
    totalOldRow: '.sumarna_znishka',
    totalOldValue: '#sumarna_znizhka_text'
  };

  let observer = null;
  let rafId = null;
  let isCalculating = false;

  const parsePrice = (el) => {
    if (!el?.textContent) return 0;
    return parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
  };

  const formatPrice = (num) => num.toLocaleString('uk-UA').replace(',', ' ') + ' грн';

  const calcDiscount = () => {
    if (isCalculating) return;
    isCalculating = true;

    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      const cartList = document.querySelector(SELECTORS.cartList);
      const discountRow = document.querySelector(SELECTORS.discountRow);
      const discountValue = document.querySelector(SELECTORS.discountValue);
      const totalOldRow = document.querySelector(SELECTORS.totalOldRow);
      const totalOldValue = document.querySelector(SELECTORS.totalOldValue);

      if (!cartList) {
        isCalculating = false;
        return;
      }

      let totalDiscount = 0;
      let totalOldPrice = 0;
      const items = cartList.querySelectorAll(SELECTORS.cartItem);

      items.forEach((item) => {
        const comparePrice = parsePrice(item.querySelector(SELECTORS.comparePrice));
        const currentPrice = parsePrice(item.querySelector(SELECTORS.currentPrice));
        const qty = parseInt(item.querySelector(SELECTORS.quantity)?.value, 10) || 1;

        // Якщо є стара ціна - використовуємо її, інакше поточну
        const oldPrice = comparePrice > 0 ? comparePrice : currentPrice;
        totalOldPrice += oldPrice * qty;

        if (comparePrice > currentPrice && comparePrice > 0) {
          totalDiscount += (comparePrice - currentPrice) * qty;
        }
      });

      const hasDiscount = totalDiscount > 0;

      // Оновлення блоку знижки
      if (discountRow && discountValue) {
        if (hasDiscount) {
          discountValue.textContent = formatPrice(totalDiscount);
          discountRow.style.display = 'flex';
        } else {
          discountRow.style.display = 'none';
        }
      }

      // Оновлення блоку старої ціни
      if (totalOldRow && totalOldValue) {
        if (hasDiscount) {
          totalOldValue.textContent = formatPrice(totalOldPrice);
          totalOldRow.style.display = 'flex';
        } else {
          totalOldRow.style.display = 'none';
        }
      }

      isCalculating = false;
    });
  };

  const initObserver = () => {
    const cartList = document.querySelector(SELECTORS.cartList);
    if (!cartList || observer) return false;

    observer = new MutationObserver(() => {
      if (!isCalculating) calcDiscount();
    });

    observer.observe(cartList, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['value']
    });

    cartList.addEventListener('input', (e) => {
      if (e.target.matches(SELECTORS.quantity)) calcDiscount();
    }, { passive: true });

    calcDiscount();
    return true;
  };

  const waitForCart = () => {
    if (initObserver()) return;

    const bodyObserver = new MutationObserver(() => {
      if (initObserver()) bodyObserver.disconnect();
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      bodyObserver.disconnect();
      initObserver();
    }, 10000);
  };

  // Start async
  if ('requestIdleCallback' in window) {
    requestIdleCallback(waitForCart, { timeout: 1000 });
  } else {
    setTimeout(waitForCart, 0);
  }
});
