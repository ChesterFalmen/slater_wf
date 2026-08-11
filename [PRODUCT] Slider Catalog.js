window.Webflow ||= [];
window.Webflow.push(() => {
  const scopes = [...document.querySelectorAll('[catalog-list="features"]')];
  if (!scopes.length) return;

  // --- Lazy reveal: перший слайдер одразу, решта — при скролі ---
  scopes.forEach((s, idx) => {
    s.style.display = idx === 0 ? 'block' : 'none';
  });

  let i = scopes.length > 1 ? 1 : scopes.length;
  let base = window.scrollY;
  let rafId;

  const scheduleSetupVisible = () => {
    requestAnimationFrame(() => requestAnimationFrame(setupVisible));
  };

  const updateAll = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      document.querySelectorAll('[catalog-list="features"] .leader-cl').forEach(el => {
        // НОВА ПЕРЕВІРКА: .leader-cl має лежати всередині .leader-clw
        if (!el.closest('.leader-clw')) return;

        el.style.marginLeft = el.style.marginRight = el.style.paddingLeft = "";
        const left = Math.max(0, Math.round(el.getBoundingClientRect().left));
        el.style.marginLeft = el.style.marginRight = `-${left}px`;
        el.style.paddingLeft = `${left}px`;
      });

      document.querySelectorAll('[catalog-list="features"]').forEach(scope => {
        if (getComputedStyle(scope).display !== 'none') refreshArrows(scope);
      });
    });
  };

  const alignToWrapper = (scroller, card, wrap) => {
    if (!scroller || !card || !wrap) return;
    const dx = card.getBoundingClientRect().left - wrap.getBoundingClientRect().left;
    if (Math.abs(dx) > 0.5) scroller.scrollBy({ left: dx, behavior: 'smooth' });
  };

  function refreshArrows(scope) {
    const scroller = scope.querySelector('.leader-cl');
    if (!scroller) return;

    const btnL = scope.querySelector('[swiper="left"]');
    const btnR = scope.querySelector('[swiper="right"]');

    const EPS = 1;
    const canScroll = scroller.scrollWidth - scroller.clientWidth > EPS;
    const canLeft = canScroll && scroller.scrollLeft > EPS;
    const canRight = canScroll && (scroller.scrollLeft + scroller.clientWidth < scroller
      .scrollWidth - EPS);

    if (btnL) btnL.style.display = canLeft ? '' : 'none';
    if (btnR) btnR.style.display = canRight ? '' : 'none';
  }

  const bindControls = (scope) => {
    const scroller = scope.querySelector('.leader-cl');
    if (!scroller) return;

    // нативний горизонтальний скрол
    scroller.style.overflowX = 'auto';
    scroller.style.overflowY = scroller.style.overflowY || 'hidden';

    const wrap = scope.querySelector('.leader-clw') || scope;
    const cards = () => [...scroller.querySelectorAll('.leader-ci')];

    // --- Кнопки з “магнітом” ---
    const btnL = scope.querySelector('[swiper="left"]');
    const btnR = scope.querySelector('[swiper="right"]');

    const click = (dir) => (e) => {
      e.preventDefault();
      const list = cards();
      if (!list.length) return;

      const wLeft = wrap.getBoundingClientRect().left;
      let cur = 0,
        best = Infinity;
      list.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - wLeft);
        if (d < best) {
          best = d;
          cur = i;
        }
      });

      const t = Math.max(0, Math.min(list.length - 1, cur + (dir > 0 ? 1 : -1)));
      alignToWrapper(scroller, list[t], wrap);
      setTimeout(() => refreshArrows(scope), 200);
    };

    if (btnL) btnL.onclick = click(-1);
    if (btnR) btnR.onclick = click(+1);

    scroller.addEventListener('scroll', () => refreshArrows(scope), { passive: true });

    // --- Drag-to-scroll (тільки ≥ 992px) ---
    if (window.innerWidth >= 992) {
      let isDown = false,
        startX = 0,
        startLeft = 0,
        moved = false;
      scroller.style.cursor = 'grab';

      const onDown = (e) => {
        if (e.button !== 0) return;
        isDown = true;
        moved = false;
        startX = e.clientX;
        startLeft = scroller.scrollLeft;
        scroller.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      };

      const onMove = (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 3) moved = true;
        scroller.scrollLeft = startLeft - dx;
        e.preventDefault();
      };

      const onUp = () => {
        if (!isDown) return;
        isDown = false;
        scroller.style.cursor = 'grab';
        document.body.style.userSelect = '';
      };

      const killClick = (ev) => {
        if (moved) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      };

      scroller.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp);
      scroller.addEventListener('click', killClick, true);
    }
    // --- Кінець drag-to-scroll ---

    refreshArrows(scope);
  };

  const setupVisible = () => {
    document.querySelectorAll('[catalog-list="features"]').forEach(scope => {
      if (getComputedStyle(scope).display !== 'none') bindControls(scope);
    });
    updateAll();
  };

  const reveal = () => {
    while (i < scopes.length && (window.scrollY - base) >= 200) {
      scopes[i++].style.display = 'block';
      base += 200;
      scheduleSetupVisible();
    }
  };

  scheduleSetupVisible();
  reveal();

  window.addEventListener('scroll', reveal, { passive: true });

  window.addEventListener('resize', () => {
    updateAll();
    document.querySelectorAll('[catalog-list="features"]').forEach(scope => {
      if (getComputedStyle(scope).display !== 'none') refreshArrows(scope);
    });
  }, { passive: true });

  window.addEventListener('orientationchange', updateAll, { passive: true });

  window.addEventListener('load', () => {
    updateAll();
    document.querySelectorAll('[catalog-list="features"]').forEach(scope => refreshArrows(
      scope));
  });

  document.fonts?.ready?.then(() => {
    updateAll();
    document.querySelectorAll('[catalog-list="features"]').forEach(scope => refreshArrows(
      scope));
  }).catch(() => {});
  document.querySelectorAll('[swiper-slider="shapka"]').forEach(host => {
    const container = host.querySelector('.collection-list-wrapper-13.swiper');
    if (!container) return;

    new Swiper(container, {
      slidesPerView: 'auto', // ширину слайдів беремо з CSS
      spaceBetween: 10, // твій відступ між картками
      speed: 400,
      grabCursor: true,
      observer: true,
      observeParents: true, // щоб працювало з CMS/Webflow reveal
      navigation: {
        nextEl: host.querySelector('[data-nav="shapka-next"]'),
        prevEl: host.querySelector('[data-nav="shapka-prev"]'),
        disabledClass: 'swiper-button-disabled',
      },
      scrollbar: {
        el: host.querySelector('[swiper="scrollbar"]'), // твій кастомний трек
        draggable: true,
        dragClass: 'scroll-bar-thumb', // твій кастомний “thumb”
        hide: false,
      },
    });
  });
});
