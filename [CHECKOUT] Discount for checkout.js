  // ✅ ПАРСИНГ ЦІНИ (підтримує "1 299,00" / "1,299.00" тощо)
  const parsePrice = (el) => {
    if (!el) return NaN;
    const raw = el.textContent.trim().replace(/[^\d.,-]/g, "");
    // заміна коми на крапку для parseFloat
    return parseFloat(raw.replace(",", "."));
  };

  function calculateDiscount(card) {
    // Використовуємо селектори в межах card (ID повторюються в item-картках у Webflow — це ок)
    const oldPriceElement = card.querySelector('#compare-price, [id="compare-price"]');
    const newPriceElement = card.querySelector('#price, [id="price"]');
    const percentElement = card.querySelector('[discount="percentage"]');

    if (!oldPriceElement || !newPriceElement || !percentElement) return;

    const oldPrice = parsePrice(oldPriceElement);
    const newPrice = parsePrice(newPriceElement);

    if (!Number.isNaN(oldPrice) && !Number.isNaN(newPrice) && oldPrice > newPrice) {
      const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      percentElement.textContent = `-${discountPercent}%`;
    }
  }

  // Спроба порахувати з урахуванням готовності даних картки
  function tryCompute(card) {
    if (!card || card.dataset.discountDone === "1") return;

    // Перевірка "готовності" картки (аналог твоєї перевірки name)
    const nameEl = card.querySelector('#name, [id="name"]');
    if (!nameEl || !nameEl.textContent.trim()) return;

    calculateDiscount(card);
    // Позначаємо, щоб не перераховувати на кожну мутацію
    card.dataset.discountDone = "1";
  }

  // 1) Початковий прохід по вже наявних картках (після ініціалізації Webflow)
  Webflow.push(function () {
    const initialCards = document.querySelectorAll(".item_card");
    initialCards.forEach(tryCompute);

    // 2) Легковаговий MutationObserver: обробляє лише ДОДАНІ вузли
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // Швидкий вихід, якщо немає доданих елементів
        if (!m.addedNodes || m.addedNodes.length === 0) continue;

        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue; // тільки ELEMENT_NODE

          // Якщо сам доданий вузол — картка
          if (node.matches && node.matches(".item_card")) {
            tryCompute(node);
          }

          // Якщо картки з'явилися всередині доданого фрагмента
          if (node.querySelectorAll) {
            node.querySelectorAll(".item_card").forEach(tryCompute);
          }
        }
      }
    });

    // Спостерігаємо лише за додаванням дітей (без attrs/characterData) — дешевше
    observer.observe(document.body, { childList: true, subtree: true });
  });
