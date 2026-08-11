window.Webflow ||= [];
window.Webflow.push(() => {
  // Newsletter Subscription Block

  const targetSection = document.querySelector('.section.fs-new');
  if (!targetSection) return;

  // Styles
  const styles = document.createElement('style');
  styles.textContent = `
    .nl-section {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 60px 20px;
      font-family: Inter, Arial, sans-serif;
    }
    .nl-container {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
    }
    .nl-content {
      display: flex;
      align-items: center;
      gap: 20px;
      text-align: center;
      flex-direction: column;
    }
    @media (min-width: 768px) {
      .nl-content {
        flex-direction: row;
        text-align: left;
      }
    }
    .nl-icon { color: #e31e24; flex-shrink: 0; }
    .nl-title {
      font-family: Inter, Arial, sans-serif;
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #fff;
      line-height: 24px;
    }
    .nl-desc {
      font-family: Inter, Arial, sans-serif;
      font-size: 16px;
      color: #b0b0b0;
      margin: 0;
      line-height: 24px;
    }
    .nl-form { width: 100%; max-width: 500px; }
    .nl-form-group {
      display: flex;
      gap: 12px;
      flex-direction: column;
    }
    @media (min-width: 480px) {
      .nl-form-group { flex-direction: row; }
      .nl-section { margin-top:20px; }
    }
    .nl-input {
      flex: 1;
      padding: 16px 20px;
      font-family: Inter, Arial, sans-serif;
      font-size: 16px;
      border: 2px solid #404040;
      border-radius: 8px;
      background: #fff;
      color: #1a1a1a;
      transition: border-color 0.3s, box-shadow 0.3s;
      outline: none;
      line-height: 24px;
    }
    .nl-input:focus {
      border-color: #e31e24;
      box-shadow: 0 0 0 3px rgba(227, 30, 36, 0.15);
    }
    .nl-input::placeholder { color: #999; }
    .nl-btn {
      padding: 16px 32px;
      font-family: Inter, Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      background: #e31e24;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
      white-space: nowrap;
      min-width: 150px;
      line-height: 24px;
    }
    .nl-btn:hover { background: #c91920; transform: translateY(-2px); }
    .nl-btn:active { transform: translateY(0); }
    .nl-btn:disabled { background: #666; cursor: not-allowed; transform: none; }
    .nl-message {
      margin-top: 12px;
      font-family: Inter, Arial, sans-serif;
      font-size: 14px;
      text-align: center;
      min-height: 20px;
      line-height: 24px;
    }
    .nl-message.success { color: #4ade80; }
    .nl-message.error { color: #ff6b6b; }
    .nl-privacy {
      font-family: Inter, Arial, sans-serif;
      font-size: 12px;
      color: #808080;
      margin: 16px 0 0 0;
      text-align: center;
      line-height: 24px;
    }
    .nl-privacy a { color: #e31e24; text-decoration: none; }
    .nl-privacy a:hover { text-decoration: underline; }
    .nl-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: nl-spin 0.8s linear infinite;
    }
    @keyframes nl-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(styles);

  // HTML
  const section = document.createElement('section');
  section.className = 'nl-section';
  section.innerHTML = `
    <div class="nl-container">
      <div class="nl-content">
        <div class="nl-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="nl-text">
          <h3 class="nl-title">Підпишіться на новинки LEADER</h3>
          <p class="nl-desc">Отримуйте першими інформацію про акції, нові товари та ексклюзивні пропозиції</p>
        </div>
      </div>
      <form class="nl-form" id="nlForm">
        <div class="nl-form-group">
          <input type="email" class="nl-input" id="nlEmail" placeholder="Введіть ваш email" required>
          <button type="submit" class="nl-btn" id="nlBtn">Підписатися</button>
        </div>
        <div class="nl-message" id="nlMessage"></div>
        <p class="nl-privacy">Натискаючи "Підписатися", ви погоджуєтесь з <a href="/pages/politika-konfidenciynosti">політикою конфіденційності</a></p>
      </form>
    </div>
  `;

  targetSection.insertAdjacentElement('afterend', section);

  // Form handler
  const form = document.getElementById('nlForm');
  const input = document.getElementById('nlEmail');
  const btn = document.getElementById('nlBtn');
  const message = document.getElementById('nlMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = input.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.textContent = 'Будь ласка, введіть коректний email';
      message.className = 'nl-message error';
      return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="nl-spinner"></span>';
    message.textContent = '';
    message.className = 'nl-message';

    // Підтягуємо телефон і номер замовлення зі сторінки підтвердження
    const phone = sessionStorage.getItem('es_order_phone') || '';
    const order = sessionStorage.getItem('es_order_id') || '';

    try {
      const response = await fetch(
        'https://zakupeace.biz.ua/webflow/handlers/subscribe_email/subscribe.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone, order })
        });

      const data = await response.json();

      if (data.success) {
        message.textContent = 'Дякуємо за підписку!';
        message.className = 'nl-message success';
        input.value = '';
        sessionStorage.removeItem('es_order_phone');
        sessionStorage.removeItem('es_order_id');
      } else {
        message.textContent = data.message || 'Помилка. Спробуйте пізніше.';
        message.className = 'nl-message error';
      }
    } catch {
      message.textContent = 'Помилка з\'єднання. Спробуйте пізніше.';
      message.className = 'nl-message error';
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});
