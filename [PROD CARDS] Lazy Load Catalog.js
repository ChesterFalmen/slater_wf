window.Webflow ||= [];
window.Webflow.push(() => {
  const MOBILE_QUERY = '(max-width: 767px)';
  const mql = window.matchMedia(MOBILE_QUERY);
  let lazyObserver = null;

  const withTransform = (url, w) => {
    if (!url) return '';
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'w=' + w + '&auto=compress';
  };

  function loadImg(img) {
    const src = img.dataset.src;
    if (!src || img.src === src) return;
    img.src = src;
    img.classList.remove('lazy-load');
    if (lazyObserver) lazyObserver.unobserve(img);
  }

  function applyVisibilityAndDataSrc() {
    const isMobile = mql.matches;
    const width = isMobile ? 480 : 960;

    document.querySelectorAll('img.product-image').forEach(img => {
      const isSecond = img.classList.contains('is-second');
      if (isMobile) {
        if (isSecond) {
          img.style.removeProperty('display');
          const mob = img.getAttribute('data-src-mobile');
          const desk = img.getAttribute('data-src-desktop') || img.getAttribute('data-src');
          const chosen = mob || desk;
          if (chosen) {
            img.setAttribute('data-src', withTransform(chosen, width));
            img.loading = 'lazy';
          }
        } else {
          img.style.display = 'none';
          img.removeAttribute('data-src');
          if (!img.getAttribute('src')) img.removeAttribute('src');
          img.removeAttribute('srcset');
        }
      } else {
        img.style.removeProperty('display');
        if (img.classList.contains('lazy-load')) {
          const desk = img.getAttribute('data-src-desktop') || img.getAttribute('data-src');
          const mob = img.getAttribute('data-src-mobile');
          const chosen = desk || mob;
          if (chosen) {
            img.setAttribute('data-src', withTransform(chosen, width));
            img.loading = 'lazy';
          }
        }
      }
    });

    document.querySelectorAll('img.image-cover.lazy-load').forEach(img => {
      const mob = img.getAttribute('data-src-mobile');
      const desk = img.getAttribute('data-src-desktop') || img.getAttribute('data-src');
      const chosen = isMobile ? (mob || desk) : (desk || mob);
      if (chosen) {
        img.setAttribute('data-src', withTransform(chosen, width));
        img.loading = 'lazy';
      }
      img.style.removeProperty('display');
    });
  }

  function observeImg(img) {
    if (!img.dataset.src) return;

    // ✅ Якщо вже у viewport — грузимо одразу, без очікування колбеку
    const rect = img.getBoundingClientRect();
    const inViewport =
      rect.top < window.innerHeight + 200 &&
      rect.bottom > -200 &&
      rect.left < window.innerWidth &&
      rect.right > 0;

    if (inViewport) {
      loadImg(img);
      return;
    }

    if (lazyObserver) lazyObserver.observe(img);
  }

  function initLazyObserver() {
    // ✅ Створюємо observer один раз — singleton
    if (!lazyObserver) {
      lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          loadImg(e.target);
        });
      }, {
        root: null,
        rootMargin: '200px',
        threshold: 0
      });
    }

    applyVisibilityAndDataSrc();

    // ✅ Обробляємо тільки ті, що ще не завантажені
    document.querySelectorAll('img.lazy-load[data-src]').forEach(observeImg);
  }

  // ✅ MutationObserver щоб підхоплювати нові картки від пагінації надійніше ніж setTimeout
  const domObserver = new MutationObserver(() => {
    const newImgs = document.querySelectorAll('img.lazy-load[data-src]');
    if (!newImgs.length) return;
    applyVisibilityAndDataSrc();
    newImgs.forEach(observeImg);
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  // ✅ Лишаємо click як запасний варіант з більшим таймаутом
  document.querySelectorAll('[fs-cmsload-pagination="next"]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => initLazyObserver(), 600);
    });
  });

  const rerun = () => initLazyObserver();
  if (mql.addEventListener) mql.addEventListener('change', rerun);
  else mql.addListener(rerun);

  initLazyObserver();
});
