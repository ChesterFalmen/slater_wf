// Slater: UTM → hidden inputs на сторінці товару
window.Webflow = window.Webflow || [];
window.Webflow.push(() => {

  // Якщо потрібно заповнювати лише конкретну форму — вкажіть селектор, напр. '#wf-form-rozsrochka'
  const FORM_SELECTOR = 'form'; // або '#wf-form-rozsrochka'

  // ---- утиліти ----
  const getCookie = (name) => {
    const pair = document.cookie.split('; ').find(r => r.startsWith(name + '='));
    return pair ? decodeURIComponent(pair.split('=').slice(1).join('=')) : '';
  };

  const ensureHiddenInput = (form, name, value) => {
    if (!value) return; // не створюємо поле, якщо немає значення
    let input = form.querySelector(`input[name="${name}"]`) || document.getElementById(name);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.id = name;
      input.setAttribute('data-name', name);
      form.appendChild(input);
    }
    input.value = value;
  };

  const fillForms = () => {
    const utmMap = {
      prodex24source: getCookie('utm_source'),
      prodex24medium: getCookie('utm_sedium'),
      prodex24campaign: getCookie('utm_campaign'),
      prodex24content: getCookie('utm_content'),
      prodex24term: getCookie('utm_term'),
    };

    document.querySelectorAll(FORM_SELECTOR).forEach(form => {
      Object.entries(utmMap).forEach(([name, val]) => ensureHiddenInput(form, name, val));
    });
  };

  // первинне заповнення
  try { fillForms(); } catch (e) { console.warn('UTM fill error:', e); }

  // якщо форми/блоки підвантажуються пізніше — добиваємося повторним заповненням
  const mo = new MutationObserver(() => fillForms());
  mo.observe(document.body, { childList: true, subtree: true });
  // щоб не тримати observer безкінечно:
  setTimeout(() => mo.disconnect(), 8000);
});
