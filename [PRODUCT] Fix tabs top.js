(function () {
  function updateTabsTop() {
    var navbar = document.querySelector('.header-section');
    if (!navbar) return;
    var navbarHeight = navbar.getBoundingClientRect().height;
    document.querySelectorAll('.ss-product-tabs-menu').forEach(function (tabs) {
      tabs.style.top = navbarHeight + 'px';
    });
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateTabsTop, 150);
  });

  document.addEventListener('DOMContentLoaded', updateTabsTop);
})();
