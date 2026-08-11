window.Webflow ||= [];
window.Webflow.push(() => {
  if (window.innerWidth < 768) return; // Працює тільки від 768px і вище

  const container = document.querySelector('#for-catalog');
  const place = container?.querySelector('[place="catalog"]');
  const nav = document.querySelector('[navigation="catalog"]');
  const headerList = document.querySelector('.header-bottom-catalog-list');

  if (!container || !place || !nav || !headerList) return;

  // Запам’ятовуємо початкове місце
  const originalParent = nav.parentNode;
  const originalNext = nav.nextSibling;

  function moveToPlace() {
    if (!place.contains(nav)) {
      place.appendChild(nav);
    }
  }

  function moveBack() {
    if (nav.parentNode !== originalParent) {
      if (originalNext) {
        originalParent.insertBefore(nav, originalNext);
      } else {
        originalParent.appendChild(nav);
      }
    }
  }

  // Відслідковуємо зміни класів на .header-bottom-catalog-list
  const observer = new MutationObserver(() => {
    if (headerList.classList.contains('w--open')) {
      moveBack();
    } else {
      moveToPlace();
    }
  });

  observer.observe(headerList, {
    attributes: true,
    attributeFilter: ['class']
  });

  // Початкове переміщення
  moveToPlace();
});
