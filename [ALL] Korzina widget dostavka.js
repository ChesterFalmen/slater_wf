/**
 * Free Shipping Widget for Webflow
 * @version 2.1.0
 */

window.Webflow ||= [];
window.Webflow.push(() => {

  const CONFIG = {
    threshold: 5000,
    updateDelay: 100,
    initDelay: 100,
    loadDelay: 200,
    insertAfter: '.w-commerce-commercecartlineitem',
    widget: '#freeShippingWidget',
    orderTotal: '[priceAll]',
    cartContainer: '.w-commerce-commercecartcontainer',
    cartFooter: '.w-commerce-commercecartfooter',
    shippingText: '#shippingText',
    progressBar: '#progressBar',
    achievement: '#achievementMessage',
  };

  // ── HTML ────────────────────────────────────────────────────────────────────

  const WIDGET_HTML = `
    <div id="freeShippingWidget" class="free-shipping-widget">
      <div class="shipping-message">
        <div class="shipping-text">
          <span id="shippingText">
            Додайте ще на <span class="shipping-amount" id="remainingAmount">0 ₴</span> для безкоштовної доставки
          </span>
        </div>
        <div class="shipping-icon">
          <svg width="32" height="32" viewBox="0 0 423.543 423.543">
            <g>
              <rect x="11.273" y="109.308" fill="#999999" width="250.254" height="208.024"/>
              <rect y="109.308" fill="#CCCCCC" width="272.8" height="49.01"/>
              <path fill="#FF6B6B" d="M200.458,45.25c-6.798-6.798-16.17-11.002-26.528-11.002s-19.73,4.203-26.528,11.002 S136.4,61.42,136.4,71.778c0-10.359-4.203-19.73-11.002-26.528c-6.798-6.798-16.17-11.002-26.528-11.002S79.14,38.451,72.341,45.25 C65.543,52.048,61.34,61.42,61.34,71.778c0,20.716,16.813,37.53,37.53,37.53h13.943V317.33h47.18V109.308h13.937 c20.717,0,37.53-16.814,37.53-37.53C211.46,61.42,207.257,52.048,200.458,45.25z"/>
              <path fill="#666666" d="M112.683,355.73c0,0.73-0.024,1.46-0.071,2.182c-1.122,17.52-15.683,31.382-33.486,31.382 c-17.81,0-32.371-13.862-33.494-31.382c-0.047-0.722-0.071-1.452-0.071-2.182c0-5.275,1.217-10.267,3.399-14.71 c5.44-11.162,16.908-18.847,30.165-18.847C97.66,322.174,112.683,337.198,112.683,355.73z"/>
              <path fill="#FF5555" d="M415.123,243.231v97.79h-20.78c-0.4-1.06-0.86-2.09-1.36-3.11c-6.87-14.06-20.86-22.8-36.51-22.8 c-17.22,0-31.97,10.75-37.88,25.91c-1.76,4.56-2.74,9.52-2.74,14.71c0,0.73,0.02,1.47,0.06,2.19h-31.84V157.318 c0-4.218,3.419-7.637,7.637-7.637h86.283c11.12,0,20.14,9.02,20.14,20.13v48.28c0,7.1,4.36,13.19,10.55,15.73 C412.543,235.4,415.123,239.071,415.123,243.231z"/>
              <path fill="#666666" d="M322.986,357.913c-0.047-0.722-0.071-1.452-0.071-2.182c0-18.533,15.024-33.556,33.556-33.556 c13.258,0,24.718,7.685,30.165,18.839c2.174,4.443,3.399,9.443,3.399,14.718c0,0.73-0.024,1.46-0.071,2.174 c-1.122,17.528-15.683,31.39-33.494,31.39C338.669,389.295,324.109,375.433,322.986,357.913z"/>
            </g>
          </svg>
        </div>
      </div>

      <div class="progress-container">
        <div id="progressBar" class="progress-bar" style="width:0%"></div>
      </div>

      <div id="achievementMessage" class="achievement-message">
        🎉 Вітаємо! Ви отримали безкоштовну доставку!
      </div>
    </div>

    <div class="bonus-line">
      <span class="bonus-line-icon">🎁</span>
      <span>Сертифікат <strong>500 грн</strong> у подарунок при замовленні від <strong style="white-space:nowrap">7 000 грн</strong></span>
    </div>
  `;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const $ = (sel) => document.querySelector(sel);
  const parsePrice = (text) => parseInt((text || '').replace(/[^\d]/g, ''), 10) || 0;
  const formatPrice = (val) => `${val.toLocaleString('uk-UA')} ₴`;

  // ── Core ────────────────────────────────────────────────────────────────────

  const getTotal = () => parsePrice($(`${CONFIG.orderTotal}`)?.textContent);

  const update = () => {
    const widget = $(CONFIG.widget);
    if (!widget) return;

    const total = getTotal();
    const remaining = Math.max(0, CONFIG.threshold - total);
    const progress = Math.min(100, (total / CONFIG.threshold) * 100);
    const achieved = remaining === 0;

    // Text
    $(CONFIG.shippingText).innerHTML = achieved ?
      `<span class="shipping-amount achieved">Безкоштовна доставка активована!</span>` :
      `Додайте ще на <span class="shipping-amount">${formatPrice(remaining)}</span> для безкоштовної доставки`;

    // Progress bar
    const bar = $(CONFIG.progressBar);
    bar.style.width = `${progress}%`;
    bar.classList.toggle('complete', achieved);

    // Achievement
    $(CONFIG.achievement).classList.toggle('show', achieved);

    // Intro animation (once)
    if (!widget.classList.contains('initialized')) {
      Object.assign(widget.style, { opacity: '0', transform: 'translateY(-10px)' });
      setTimeout(() => {
        Object.assign(widget.style, {
          transition: 'all 0.4s ease-out',
          opacity: '1',
          transform: 'translateY(0)'
        });
        widget.classList.add('initialized');
      }, CONFIG.initDelay);
    }
  };

  const inject = () => {
    if ($(CONFIG.widget)) return true;

    const anchor = $(CONFIG.insertAfter);
    const footer = $(CONFIG.cartFooter);
    if (!anchor || !footer) return false;

    anchor.insertAdjacentHTML('afterend', WIDGET_HTML);
    return true;
  };

  // ── Init ────────────────────────────────────────────────────────────────────

  const init = () => {
    if (!inject()) return;

    update();

    // MutationObserver
    const cart = $(CONFIG.cartContainer);
    if (cart) {
      new MutationObserver((mutations) => {
        const relevant = mutations.some(m =>
          m.target.matches?.(CONFIG.orderTotal) ||
          m.target.classList?.contains('w-commerce-commercecartlist')
        );
        if (relevant) setTimeout(update, CONFIG.updateDelay);
      }).observe(cart, { childList: true, subtree: true, characterData: true });
    }

    // Events
    document.addEventListener('cart:updated', update);
    document.addEventListener('cart:change', update);
    window.addEventListener('load', () => setTimeout(update, CONFIG.loadDelay));
  };

  init();

});
