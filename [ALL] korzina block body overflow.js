// Блокування scroll при відкритті кошика
function initCartScrollLock() {
  const cartWrapper = document.querySelector('[data-wf-cart-type="modal"]');

  if (!cartWrapper) {
    console.log('Cart wrapper not found');
    return;
  }

  // Спостерігач за атрибутом data-cart-open
  const observer = new MutationObserver(() => {
    const isOpen = cartWrapper.hasAttribute('data-cart-open');

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('✓ Cart opened - scroll locked');
    } else {
      document.body.style.overflow = '';
      console.log('✓ Cart closed - scroll unlocked');
    }
  });

  observer.observe(cartWrapper, {
    attributes: true,
    attributeFilter: ['data-cart-open']
  });

  //console.log('✅ Cart scroll lock initialized');
}

// Запуск
window.Webflow ||= [];
window.Webflow.push(() => {
  setTimeout(initCartScrollLock, 100);
});
