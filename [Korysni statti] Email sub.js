const form = document.querySelector('#wf-form-newsletter');

if (form) {
  const formBlock = form.closest('.w-form');
  const successMsg = formBlock.querySelector('.w-form-done');
  const errorMsg = formBlock.querySelector('.w-form-fail');
  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = form.querySelector('[name="email"]')?.value.trim();
    const phone = form.querySelector('[name="phone"]')?.value.trim() || '';
    const order = form.querySelector('[name="order"]')?.value.trim() || '';

    if (!email) return;

    const originalText = submitBtn.value;
    submitBtn.value = 'Відправка...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(
        'https://zakupeace.biz.ua/webflow/handlers/subscribe_email/subscribe.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone, order })
        });

      const data = await response.json();

      if (data.success) {
        form.style.display = 'none';
        successMsg.style.display = 'block';
      } else {
        errorMsg.querySelector('div').textContent = data.message || 'Сталася помилка';
        errorMsg.style.display = 'block';
      }
    } catch (err) {
      errorMsg.querySelector('div').textContent = "Помилка з'єднання. Спробуйте пізніше.";
      errorMsg.style.display = 'block';
    } finally {
      submitBtn.value = originalText;
      submitBtn.disabled = false;
    }
  });
}
