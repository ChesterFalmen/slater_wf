window.Webflow ||= [];
Webflow.push(function () {
  console.log('✅ Webflow push started');
  const container = document.querySelector('.customer__add-info');
  console.log('🔍 Looking for .customer__add-info:', container);
  if (!container) {
    console.error('❌ Container .customer__add-info not found!');
    return;
  }
  console.log('✅ Container found, creating comment block...');
  // Створюємо HTML структуру
  const commentBlock = document.createElement('div');
  commentBlock.className =
    'w-commerce-commercecheckoutblockcontent checkout__customer-content no__margin';
  commentBlock.innerHTML = `
    <label class="comment-checkbox-wrapper" style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 12px;">
      <input type="checkbox" id="comment-toggle" style="width: 18px; height: 18px; cursor: pointer;">
      <span style="font-size: 18px;font-weight:400;">Додати коментар до замовлення</span>
    </label>
    <div id="comment-field-wrapper" style="display: none;">
      <textarea id="commentar" maxlength="400" placeholder="" style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical; font-family: inherit;"></textarea>
      <div id="comment-counter" style="font-size: 12px; color: #888; margin-top: 6px;">Допустима кількість символів: 0 / 400</div>
    </div>
  `;

  // Вставляємо ПІСЛЯ container, а не всередину
  container.insertAdjacentElement('afterend', commentBlock);

  console.log('✅ Comment block inserted after container');
  // Логіка показу/приховування поля
  const checkbox = document.getElementById('comment-toggle');
  const fieldWrapper = document.getElementById('comment-field-wrapper');
  const textarea = document.getElementById('commentar');
  const counter = document.getElementById('comment-counter');
  console.log('🔍 Elements found:', { checkbox, fieldWrapper, textarea, counter });
  checkbox.addEventListener('change', function () {
    console.log('🔄 Checkbox changed:', this.checked);
    fieldWrapper.style.display = this.checked ? 'block' : 'none';
    if (!this.checked) {
      textarea.value = '';
      counter.textContent = 'Допустима кількість символів: 0 / 400';
    }
  });
  // Лічильник символів
  textarea.addEventListener('input', function () {
    const count = this.value.length;
    console.log('✏️ Textarea input, length:', count);
    counter.textContent = `Допустима кількість символів: ${count} / 400`;
  });
  console.log('✅ All event listeners attached');
});
