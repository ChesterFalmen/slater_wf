window.Webflow ||= [];
window.Webflow.push(() => {
  // --- Google Tag Manager ---
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const f = d.getElementsByTagName(s)[0];
    const j = d.createElement(s);
    const dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-PQVRS6CR'); // 🔹 заміни на свій GTM ID

  // --- Google tag (gtag.js) ---
  window.dataLayer = window.dataLayer || [];

  function gtag() { dataLayer.push(arguments); }

  const gtagScript = document.createElement("script");
  gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=AW-11280588801";
  gtagScript.async = true;
  gtagScript.onload = function () {
    gtag("js", new Date());
    gtag("config", "AW-11280588801"); // 🔹 заміни на свій AW ID
  };
  document.head.appendChild(gtagScript);
});
