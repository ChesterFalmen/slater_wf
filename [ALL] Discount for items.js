window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  // ==== CONFIG ====
  // ==== CONFIG (лише селектори) ====
  const CFG = {
    card: '[discount="card"]',
    oldSelectors: ['[discount="old_price"]', '#compare-price', '[data-compare-price]'],
    newSelectors: ['[discount="new_price"]', '#price', '[data-price]'],
    percentSel: '[discount="percent"]',
    autoHide: false, // сховати бейдж, якщо знижка <= 0 або даних нема
    roundMode: 'round', // round | floor | ceil
    throttleMs: 80 // дебаунс оновлень від MutationObserver
  };

  // ==== UTILS ====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const once = (fn, ms = 0) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  function getText(el) {
    if (!el) return '';
    if ('value' in el && el.value != null && String(el.value).trim() !== '') return String(el
      .value);
    return (el.textContent || '').trim();
  }

  // Парс будь-якої гривневої строки -> число
  function parseUAH(s) {
    if (s == null) return NaN;
    let v = String(s).replace(/\u00A0/g, ''); // NBSP
    v = v.replace(/[^\d,.\-]+/g, ''); // лишаємо цифри/.,-
    if (v.includes(',') && v.includes('.')) v = v.replace(/,/g, ''); // кома як тисячі
    else if (v.includes(',')) v = v.replace(',', '.'); // кома як дробова
    const n = parseFloat(v);
    return isNaN(n) ? NaN : n;
  }

  function firstExisting(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el && getText(el)) return el;
    }
    // як фолбек — навіть порожній елемент (може пізніше заповниться)
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function roundPct(x, mode) {
    if (mode === 'floor') return Math.floor(x);
    if (mode === 'ceil') return Math.ceil(x);
    return Math.round(x);
  }

  // ==== CORE ====
  function computeDiscountForCard(card) {
    // знайти елементи з цінами (з фолбеками)
    const oldEl = firstExisting(card, CFG.oldSelectors);
    const newEl = firstExisting(card, CFG.newSelectors);
    if (!newEl) return null;

    const oldPrice = parseUAH(getText(oldEl));
    const newPrice = parseUAH(getText(newEl));

    if (!isFinite(oldPrice) || !isFinite(newPrice) || oldPrice <= newPrice) {
      return { percent: 0, oldPrice, newPrice };
    }
    const pct = roundPct(((oldPrice - newPrice) / oldPrice) * 100, CFG.roundMode);
    return { percent: pct, oldPrice, newPrice };
  }

  function renderPercent(card, result) {
    const targets = $$(CFG.percentSel, card);
    if (!targets.length) return;

    const show = result && result.percent > 0;
    // встановити текст
    targets.forEach(el => {
      el.textContent = show ? `-${result.percent}%` : '';
    });

    if (CFG.autoHide) {
      // пробуємо сховати/показати обгортачі бейджа, не ламаючи стилі Webflow
      targets.forEach(el => {
        const wrap = el.closest('.leader-card-discount-wrapper') || el;
        if (show) {
          wrap.classList.remove('w-condition-invisible');
          wrap.style.display = '';
          wrap.hidden = false;
        } else {
          wrap.classList.add('w-condition-invisible');
          wrap.style.display = 'none';
          wrap.hidden = true;
        }
      });
    }

    // (необов'язково) якщо є numeric-сортування — запишемо число для плагіна
    $$(CFG.percentSel + '[fs-cmssort-type="number"]', card).forEach(el => {
      // Якщо треба саме число без знаку:
      // el.textContent = String(result ? result.percent : 0);
    });
  }

  function processCard(card) {
    const res = computeDiscountForCard(card);
    renderPercent(card, res);
  }

  const processAll = () => $$(CFG.card).forEach(processCard);
  const processAllThrottled = once(processAll, CFG.throttleMs);

  // ==== INIT ====
  window.Webflow = window.Webflow || [];
  window.Webflow.push(() => {
    // перший прохід
    processAll();

    // слідкуємо за динамічними зміннами (CMS, lazy, варіанти)
    const obs = new MutationObserver(muts => {
      let needs = false;
      for (const m of muts) {
        // якщо додали/змінили щось у картці або в ціні — перерахувати
        if (m.type === 'childList' || m.type === 'characterData') {
          const el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
          if (!el) continue;
          if (el.closest && (el.closest(CFG.card) || el.closest(CFG.oldSelectors.join(
              ',')) || el.closest(CFG.newSelectors.join(',')))) {
            needs = true;
            break;
          }
        }
      }
      if (needs) processAllThrottled();
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true });

    // ручний тригер на випадок, якщо треба ззовні:
    window.recalcAllDiscounts = processAll;
  });
});
