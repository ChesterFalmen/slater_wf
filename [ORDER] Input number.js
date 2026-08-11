(function () {
  const input = document.getElementById('phone_form');
  if (!input) return;

  const PREFIX = '+38 ';
  const MASK = '___ ___ __ __';
  const P = PREFIX.length;

  const digits = () => input.value.slice(P).replace(/[\s_\D]/g, '');

  const applyMask = (d) => {
    if (d.length > 10) return d;
    let i = 0;
    return MASK.replace(/_/g, () => i < d.length ? d[i++] : '_');
  };

  const digitToPos = (di, d) => {
    if (d.length > 10) return P + di;
    let count = 0;
    for (let i = 0; i < MASK.length; i++) {
      if (MASK[i] === '_' && count++ === di) return P + i;
    }
    return P + MASK.length;
  };

  const posToDigit = (pos, d) => {
    if (d.length > 10) return Math.max(0, pos - P);
    const mp = pos - P;
    let count = 0;
    for (let i = 0; i < Math.min(mp, MASK.length); i++) {
      if (MASK[i] === '_') count++;
    }
    return count;
  };

  const render = (d, di) => {
    input.value = PREFIX + applyMask(d);
    const pos = digitToPos(Math.min(di, d.length), d);
    input.setSelectionRange(pos, pos);
  };

  const init = () => render(digits(), digits().length);

  input.addEventListener('focus', () => {
    init();
    setTimeout(() => render(digits(), digits().length), 0);
  });
  input.addEventListener('click', () => {
    if (input.selectionStart < P) input.setSelectionRange(P,
      P);
  });

  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Home', 'End']
      .includes(e.key)) return;
    e.preventDefault();

    let d = digits();
    const ss = Math.max(input.selectionStart, P);
    const se = Math.max(input.selectionEnd, P);
    const hasSel = ss !== se;
    const ds = posToDigit(ss, d);
    const de = posToDigit(se, d);

    if (e.key === 'Backspace') {
      if (input.selectionStart <= P && !hasSel) return;
      hasSel
        ?
        render(d.slice(0, ds) + d.slice(de), ds) :
        render(d.slice(0, ds - 1) + d.slice(ds), ds - 1);
    } else if (e.key === 'Delete') {
      hasSel
        ?
        render(d.slice(0, ds) + d.slice(de), ds) :
        render(d.slice(0, ds) + d.slice(ds + 1), ds);
    } else if (/^\d$/.test(e.key)) {
      const base = hasSel ? d.slice(0, ds) + d.slice(de) : d;
      const idx = hasSel ? ds : ds;
      render(base.slice(0, idx) + e.key + base.slice(idx), idx + 1);
    }
  });

  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,
      '');
    let d = digits();
    const ss = Math.max(input.selectionStart, P);
    const se = Math.max(input.selectionEnd, P);
    const ds = posToDigit(ss, d);
    const de = posToDigit(se, d);
    d = d.slice(0, ds) + pasted + d.slice(de);
    render(d, ds + pasted.length);
  });

  init();
  input.removeAttribute('maxlength');
})();
