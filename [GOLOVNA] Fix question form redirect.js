window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  // знайдіть саме той form елемент у вашому блоці (за потреби підставте свій селектор)
  const form = document.querySelector('.faq-form-main-block form');
  if (!form) return;

  const wForm = form.closest('.w-form');
  const done = wForm?.querySelector('.w-form-done');
  const fail = wForm?.querySelector('.w-form-fail');
  const submitBtn = form.querySelector('[type="submit"]');

  const ENDPOINT_URL = 'https://zakupeace.biz.ua/webflow/handlers/handler_question.php';

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // важливо: не даємо браузеру піти на action
    fail?.style && (fail.style.display = 'none');
    submitBtn && (submitBtn.disabled = true);

    try {
      const fd = new FormData(form);
      const res = await fetch(ENDPOINT_URL, {
        method: 'POST',
        body: fd,
        credentials: 'omit' // якщо крос-домен
      });

      const text = (await res.text()).trim();

      if (res.ok && text === 'ok') {
        // показуємо Success
        form.style.display = 'none';
        if (done) done.style.display = 'block';
        form.reset();
      } else {
        // показуємо Error
        if (fail) fail.style.display = 'block';
        console.warn('Form error:', text);
      }
    } catch (err) {
      if (fail) fail.style.display = 'block';
      console.error(err);
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });
});
