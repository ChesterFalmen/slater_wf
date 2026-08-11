window.Webflow ||= [];
window.Webflow.push(() => {
  const PIXELS = [
    '24197104113315061',
    '953583923145702',
  ];

  window.addEventListener('load', function () {
    if (!window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ?
            n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    window.__META_PIXELS_INITED__ ||= new Set();

    PIXELS.forEach(id => {
      if (!window.__META_PIXELS_INITED__.has(id)) {
        fbq('init', id);
        window.__META_PIXELS_INITED__.add(id);
      }
    });

    fbq('track', 'PageView');
  });
});
