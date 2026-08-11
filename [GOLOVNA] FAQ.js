window.Webflow ||= [];
window.Webflow.push(() => {
  // Початково — всі height: 0 і обертання 0°
  document.querySelectorAll('.faq-bottom-wrapper, .faq-space').forEach(el => {
    gsap.set(el, { height: 0, overflow: 'hidden' });
  });
  document.querySelectorAll('.faq-top-close-wrapper').forEach(el => {
    gsap.set(el, { rotate: 0 });
  });

  document.querySelectorAll('.faq-top-wrapper').forEach(topWrapper => {
    topWrapper.addEventListener('click', () => {
      const currentItem = topWrapper.closest('.faq-item-wrapper');
      const bottom = currentItem.querySelector('.faq-bottom-wrapper');
      const space = currentItem.querySelector('.faq-space');
      const close = currentItem.querySelector('.faq-top-close-wrapper');

      const isActive = currentItem.classList.contains('active');

      // Закриваємо всі
      document.querySelectorAll('.faq-item-wrapper.active').forEach(item => {
        item.classList.remove('active');

        const b = item.querySelector('.faq-bottom-wrapper');
        const s = item.querySelector('.faq-space');
        const c = item.querySelector('.faq-top-close-wrapper');

        if (b) gsap.to(b, { height: 0, duration: 0.3, ease: 'power2.inOut' });
        if (s) gsap.to(s, { height: 0, duration: 0.3, ease: 'power2.inOut' });
        if (c) gsap.to(c, { rotate: 0, duration: 0.3, ease: 'power2.inOut' });
      });

      if (!isActive) {
        currentItem.classList.add('active');

        if (bottom) {
          const h = bottom.scrollHeight;
          gsap.to(bottom, { height: h, duration: 0.4, ease: 'power2.out' });
        }
        if (space) {
          const h = space.scrollHeight;
          gsap.to(space, { height: h, duration: 0.4, ease: 'power2.out' });
        }
        if (close) {
          gsap.to(close, { rotate: 45, duration: 0.4, ease: 'power2.out' });
        }
      }
    });
  });
});
