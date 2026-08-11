/**
 * Безпечне підвантаження CMS-колекцій на головній (заміна Slater 44845.js).
 *
 * 1. Блокує нативний перехід на ?{collectionId}_page=N (reload).
 * 2. Після ініціалізації Finsweet CMS Load підвантажує товари, коли секція
 *    [catalog-list="features"] стає видимою (display:block + у viewport).
 *
 * У Slater: вимкнути / замінити скрипт 44845.js цим файлом.
 */
window.Webflow ||= [];
window.Webflow.push(() => {
  const PAGE_HREF_RE = /_page=\d+/;
  const PAGINATION_SELECTOR =
    'a.w-pagination-next, a.w-pagination-previous, a[fs-cmsload-pagination]';
  const SCOPE_SELECTOR = '[catalog-list="features"]';

  const isPaginationLink = (link) => {
    if (!link?.closest?.('.w-dyn-list, .w-pagination-wrapper')) return false;
    const href = link.getAttribute('href') || '';
    return PAGE_HREF_RE.test(href);
  };

  const blockNativePaginationNav = (e) => {
    const link = e.target.closest?.(PAGINATION_SELECTOR);
    if (!link || !isPaginationLink(link)) return;
    e.preventDefault();
  };

  document.addEventListener('click', blockNativePaginationNav, true);
  document.addEventListener('auxclick', (e) => {
    if (e.button !== 1) return;
    blockNativePaginationNav(e);
  }, true);

  const listInstances = [];
  const pendingScopes = new Set();
  const completedScopes = new WeakSet();
  const loadingScopes = new WeakMap();
  const observedScopes = new WeakSet();

  const isScopeVisible = (el) => {
    if (!el || el.nodeType !== 1) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return el.getClientRects().length > 0;
  };

  const findListForScope = (scope) => {
    const byWrapper = listInstances.find(
      (inst) => inst.wrapper && scope.contains(inst.wrapper)
    );
    if (byWrapper) return byWrapper;

    const listEl = scope.querySelector('[fs-cmsload-element^="list"]');
    if (!listEl) return undefined;

    return listInstances.find(
      (inst) => inst.list === listEl || inst.wrapper?.contains(listEl)
    );
  };

  const hasMorePages = (inst) => {
    const next = inst.paginationNext;
    if (!next) return false;
    if (next.style.display === 'none') return false;
    const href = next.getAttribute('href') || '';
    return PAGE_HREF_RE.test(href);
  };

  const triggerLoadNext = (inst) => {
    if (!inst?.paginationNext || !hasMorePages(inst)) return false;
    inst.paginationNext.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );
    return true;
  };

  const waitForMoreItems = (inst, countBefore, maxMs = 8000) =>
    new Promise((resolve) => {
      const started = Date.now();

      const onItems = () => {
        if ((inst.items?.length ?? 0) > countBefore) cleanup(true);
      };

      const cleanup = (ok) => {
        inst.off?.('renderitems', onItems);
        inst.off?.('additems', onItems);
        resolve(ok);
      };

      inst.on?.('renderitems', onItems);
      inst.on?.('additems', onItems);

      const tick = () => {
        if ((inst.items?.length ?? 0) > countBefore) return cleanup(true);
        if (Date.now() - started >= maxMs) return cleanup(false);
        setTimeout(tick, 100);
      };

      tick();
    });

  const pumpScope = async (scope) => {
    if (!scope || completedScopes.has(scope) || loadingScopes.get(scope)) return;
    if (!isScopeVisible(scope)) return;

    const inst = findListForScope(scope);
    if (!inst) {
      pendingScopes.add(scope);
      return;
    }

    pendingScopes.delete(scope);
    if (!hasMorePages(inst)) {
      completedScopes.add(scope);
      return;
    }

    loadingScopes.set(scope, true);

    try {
      let guard = 0;
      const maxPages = 50;

      while (hasMorePages(inst) && guard++ < maxPages) {
        const countBefore = inst.items?.length ?? 0;
        if (!triggerLoadNext(inst)) break;

        const loaded = await waitForMoreItems(inst, countBefore);
        if (!loaded) break;

        if (typeof window.recalcAllDiscounts === 'function') {
          window.recalcAllDiscounts();
        }

        await new Promise((r) => setTimeout(r, 100));
      }
    } finally {
      loadingScopes.delete(scope);
      if (!hasMorePages(inst)) completedScopes.add(scope);
    }
  };

  const scanScopes = () => {
    document.querySelectorAll(SCOPE_SELECTOR).forEach(pumpScope);
  };

  const scopeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) pumpScope(entry.target);
      });
    }, { rootMargin: '120px 0px', threshold: 0 }
  );

  const watchScopes = () => {
    document.querySelectorAll(SCOPE_SELECTOR).forEach((scope) => {
      if (observedScopes.has(scope)) return;
      observedScopes.add(scope);
      scopeObserver.observe(scope);
    });
  };

  let scrollRaf = 0;
  window.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(scanScopes);
    }, { passive: true }
  );

  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push(['cmsload', (instances) => {
    listInstances.length = 0;
    listInstances.push(...instances);

    pendingScopes.forEach(pumpScope);
    pendingScopes.clear();
    watchScopes();
    scanScopes();
  }]);

  watchScopes();
  scanScopes();

  new MutationObserver((mutations) => {
    let needsWatch = false;

    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.(SCOPE_SELECTOR)) pumpScope(node);
        else if (node.querySelector?.(SCOPE_SELECTOR)) needsWatch = true;
      });

      if (mutation.type === 'attributes' && mutation.target.matches?.(SCOPE_SELECTOR)) {
        pumpScope(mutation.target);
      }
    }

    if (needsWatch) {
      watchScopes();
      scanScopes();
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });
});
