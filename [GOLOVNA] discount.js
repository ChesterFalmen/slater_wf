window.Webflow ||= [];
window.Webflow.push(() => {
  function calculateDiscount(card) {
    const oldPriceElement = card.querySelector('[discount="old_price"]');
    const newPriceElement = card.querySelector('[discount="new_price"]');
    const percentElements = card.querySelectorAll('[discount="percent"]');

    if (oldPriceElement && newPriceElement && percentElements.length > 0) {
      const oldPrice = parseFloat(oldPriceElement.textContent.replace(/[^\d.-]/g, '').trim());
      const newPrice = parseFloat(newPriceElement.textContent.replace(/[^\d.-]/g, '').trim());

      if (!isNaN(oldPrice) && !isNaN(newPrice) && oldPrice > newPrice) {
        const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
        percentElements.forEach(percentElement => {
          percentElement.textContent = `-${discountPercent}%`;
        });
      }
    }
  }

  const observer = new MutationObserver(() => {
    const cards = document.querySelectorAll('[discount="card"]');

    if (cards.length > 0) {
      let allCardsLoaded = true;

      cards.forEach(card => {
        const textElement = card.querySelector('#text_with_dotsSS');
        if (!textElement || !textElement.textContent.trim()) {
          allCardsLoaded = false;
        }
      });

      if (allCardsLoaded) {
        console.log("Усі карточки завантажені!");
        cards.forEach(calculateDiscount);
        observer.disconnect();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
