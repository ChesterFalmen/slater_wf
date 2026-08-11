window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  const DAYS = 30;
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  // опціонально додай кліки для платних мереж:
  const clickIds = ["gclid", "fbclid", "wbraid", "gbraid", "msclkid", "ttclid"];

  const secure = location.protocol === "https:" ? "; Secure" : "";
  const sameSite = "; SameSite=Lax";
  const path = "; path=/";
  // Якщо треба на всіх піддоменах — розкоментуй:
  // const domain = "; domain=.leader-tools.com.ua";

  const toCamel = (k) => k.replace(/_([a-z])/g, (_, ch) => ch
    .toUpperCase()); // utm_source -> utmSource

  function setCookie(name, value, days) {
    if (!value) return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie =
      `${name}=${encodeURIComponent(value)}; expires=${expires}${path}${sameSite}${secure}`; // ${domain}
  }

  function saveFromSearch(search) {
    const params = new URLSearchParams(search || "");
    // нічого не робимо, якщо жодної utm/клік-метки нема
    const hasAny =
      utmKeys.some(k => params.has(k) && params.get(k)) ||
      clickIds.some(k => params.has(k) && params.get(k));
    if (!hasAny) return;

    // UTM
    utmKeys.forEach(k => {
      const v = params.get(k);
      if (!v) return;
      setCookie(k, v, DAYS); // underscore-версія
      setCookie(toCamel(k), v, DAYS); // camelCase-дзеркало (utmSource, utmMedium, ...)
    });

    // Клік-ідентифікатори (без camelCase — зазвичай не потрібно)
    clickIds.forEach(k => {
      const v = params.get(k);
      if (!v) return;
      setCookie(k, v, DAYS);
    });

    // Позначимо час останнього апдейту (для дебагу)
    setCookie('utm_updated_at', new Date().toISOString(), DAYS);
  }

  // --- polyfill для відстеження SPA-навігації ---
  const _pushState = history.pushState;
  const _replaceState = history.replaceState;
  history.pushState = function (state, title, url) {
    const ret = _pushState.apply(this, arguments);
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  };
  history.replaceState = function (state, title, url) {
    const ret = _replaceState.apply(this, arguments);
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  };
  window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));

  // --- обробники ---
  // початкове завантаження
  saveFromSearch(location.search);
  // кожна зміна URL в межах SPA
  window.addEventListener('locationchange', () => {
    saveFromSearch(location.search);
  });
});
