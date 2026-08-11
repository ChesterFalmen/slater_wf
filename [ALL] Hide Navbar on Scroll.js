window.Webflow ||= [];
window.Webflow.push(() => {
  if (window.innerWidth < 768) return;

  const header = document.querySelector(".header-navbar");
  if (!header) return;

  let lastScroll = window.scrollY;
  let scrollNowActive = false;
  let scrollDownStart = null;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    const scrollDiff = currentScroll - lastScroll;

    // Скролимо вниз
    if (scrollDiff > 0) {
      if (!scrollDownStart) scrollDownStart = lastScroll;

      if (!scrollNowActive && currentScroll - scrollDownStart >= 100) {
        header.classList.add("scroll-now");
        scrollNowActive = true;
        scrollDownStart = null;
      }
    }

    // Скролимо вгору — але не прибираємо scroll-now, лише якщо дійшли до верху
    if (scrollNowActive && currentScroll === 0) {
      header.classList.remove("scroll-now");
      scrollNowActive = false;
      scrollDownStart = null;
    }

    lastScroll = currentScroll;
  });
});
