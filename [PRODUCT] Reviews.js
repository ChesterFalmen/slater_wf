/**
 * Система відгуків для Webflow — Leader Tools
 * @version 2.0.0
 */

window.Webflow ||= [];
window.Webflow.push(() => {
  'use strict';

  class ReviewsSystem {
    constructor(options = {}) {
      this.apiUrl = options.apiUrl ||
        'https://zakupeace.biz.ua/webflow/handlers/reviews/reviews-api.php';
      this.productId = options.productId || null;
      this.containerSelector = options.containerSelector || '.reviews-container';
      this._mediaCache = {};
      this._lbOpen = false;
      this.selectedMediaFiles = [];

      this.init();
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    async init() {
      if (!this.productId) {
        this.productId = await this.getProductIdFromWebflow();
      }
      if (!this.productId) {
        console.warn('ReviewsSystem: Не вдалося отримати product-id');
        return;
      }

      this.renderShell();
      this.bindPopup();
      this.bindFormEvents();
      this.bindReplyEvents();
      this._buildLightbox();
      this.loadReviews();
    }

    // ── Product ID ────────────────────────────────────────────────────────────

    async getProductIdFromWebflow() {
      const el = document.querySelector('#crm_id');
      const fromDOM = el?.textContent?.trim();
      if (fromDOM) return fromDOM;

      try {
        const collectionId = '652684aee6624fed3a52ee6b';
        const headers = {
          'Authorization': 'Bearer 47af6f4816d7f4e248f11c31f62c8e5056abdd17b6fc18b24d8638d46bf0597a',
          'accept-version': '1.0.0',
        };
        let allItems = [],
          offset = 0;
        do {
          const r = await fetch(
            `https://api.webflow.com/v2/collections/${collectionId}/items?limit=100&offset=${offset}`, { headers }
          );
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const d = await r.json();
          allItems = allItems.concat(d.items || []);
          if ((d.items || []).length < 100) break;
          offset += 100;
        } while (true);

        const slug = window.location.pathname.split('/').pop() || '';
        const item = allItems.find(i =>
          i.fieldData?.slug === slug ||
          String(i.fieldData?.['crm-id'] || '') === slug
        );
        return item?.fieldData?.['crm-id'] ? String(item.fieldData['crm-id']).trim() : null;
      } catch (e) {
        console.error('ReviewsSystem API error:', e);
        return null;
      }
    }

    // ── Shell (статична частина — заголовок, рейтинг, список) ─────────────────

    renderShell() {
      const container = document.querySelector(this.containerSelector);
      if (!container) return;

      container.innerHTML = `
        <div class="ltr-wrap">

          <!-- Заголовок -->
          <div class="ltr-head">
            <span class="ltr-title">Відгуки покупців</span>
            <span class="ltr-count" id="ltr-count"></span>
            <button class="ltr-btn-write" id="ltr-open-popup">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Написати відгук
            </button>
          </div>

          <!-- Рейтинг-блок -->
          <div class="ltr-rating-summary" id="ltr-rating-summary" style="display:none">
            <div class="ltr-rating-left">
              <div class="ltr-rating-big" id="ltr-rating-big">0.0</div>
            </div>
            <div class="ltr-rating-right">
              <div class="ltr-stars-row" id="ltr-stars-row"></div>
              <div class="ltr-rating-label" id="ltr-rating-label"></div>
            </div>
            <div class="ltr-bars" id="ltr-bars"></div>
          </div>

          <!-- Повідомлення -->
          <div id="ltr-message" style="display:none"></div>

          <!-- Список відгуків -->
          <div class="ltr-list" id="ltr-list">
            <div class="ltr-loading">Завантаження відгуків...</div>
          </div>

        </div>

        <!-- Попап з формою -->
        <div class="ltr-popup-overlay" id="ltr-popup">
          <div class="ltr-popup-box">
            <button class="ltr-popup-close" id="ltr-close-popup" aria-label="Закрити">✕</button>

            <div class="ltr-form-title">Залишити відгук</div>
            <div class="ltr-form-subtitle">Ваша думка допомагає іншим покупцям</div>

            <form id="ltr-review-form" novalidate>
              <!-- Зірки -->
              <div class="ltr-stars-select">
                <button type="button" class="ltr-star-btn" data-v="1">★</button>
                <button type="button" class="ltr-star-btn" data-v="2">★</button>
                <button type="button" class="ltr-star-btn" data-v="3">★</button>
                <button type="button" class="ltr-star-btn" data-v="4">★</button>
                <button type="button" class="ltr-star-btn" data-v="5">★</button>
              </div>
              <input type="hidden" id="ltr-rating-input" value="0">

              <!-- Ім'я + Email -->
              <div class="ltr-form-row">
                <div class="ltr-form-field">
                  <label>Ім'я</label>
                  <input type="text" id="ltr-name" placeholder="Іван Петренко" required>
                </div>
                <div class="ltr-form-field">
                  <label>Email</label>
                  <input type="email" id="ltr-email" placeholder="ivan@example.com" required>
                </div>
              </div>

              <!-- Текст відгуку -->
              <div class="ltr-form-field">
                <label>Відгук</label>
                <textarea id="ltr-text" placeholder="Розкажіть про свій досвід використання товару..." required></textarea>
              </div>

              <!-- Медіа -->
              <div class="ltr-media-zone" id="ltr-media-zone">
                <div class="ltr-media-label" id="ltr-media-label" role="button" tabindex="0" aria-label="Додати фото або відео">
                  <span class="ltr-media-icon" id="ltr-media-icon">📎</span>
                  <span class="ltr-media-body">
                    <span id="ltr-media-text">Додати фото або відео (до 5 файлів)</span>
                    <span class="ltr-media-hint">фото до 8 МБ · відео до 50 МБ</span>
                  </span>
                </div>
                <input type="file" id="ltr-media-input" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple style="display:none">
                <div class="ltr-media-preview" id="ltr-media-preview"></div>
              </div>

              <button type="submit" class="ltr-btn-submit" id="ltr-submit">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M22 2L11 13" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>
                </svg>
                Надіслати відгук
              </button>
            </form>
          </div>
        </div>
      `;
    }

    // ── Попап ─────────────────────────────────────────────────────────────────

    bindPopup() {
      const popup = document.getElementById('ltr-popup');
      const openBtn = document.getElementById('ltr-open-popup');
      const closeBtn = document.getElementById('ltr-close-popup');
      if (!popup) return;

      const open = () => {
        popup.classList.add('open');
        document.body.style.overflow = 'hidden';
      };
      const close = () => {
        popup.classList.remove('open');
        document.body.style.overflow = '';
      };

      openBtn?.addEventListener('click', open);
      closeBtn?.addEventListener('click', close);
      popup.addEventListener('click', (e) => { if (e.target === popup) close(); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popup.classList
          .contains('open')) close();
      });
    }

    // ── Форма відгуку ─────────────────────────────────────────────────────────

    bindFormEvents() {
      // Зірки
      const starBtns = document.querySelectorAll('.ltr-star-btn');
      let selected = 0;

      starBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          const v = +btn.dataset.v;
          starBtns.forEach(b => b.classList.toggle('on', +b.dataset.v <= v));
        });
        btn.addEventListener('click', () => {
          selected = +btn.dataset.v;
          document.getElementById('ltr-rating-input').value = selected;
          starBtns.forEach(b => b.classList.toggle('on', +b.dataset.v <= selected));
        });
      });

      document.querySelector('.ltr-stars-select')?.addEventListener('mouseleave', () => {
        starBtns.forEach(b => b.classList.toggle('on', +b.dataset.v <= selected));
      });

      // Сабміт форми
      document.getElementById('ltr-review-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitReview();
      });

      // Медіа
      const mediaInput = document.getElementById('ltr-media-input');
      const mediaLabel = document.getElementById('ltr-media-label');

      mediaLabel?.addEventListener('click', () => mediaInput?.click());
      mediaLabel?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          mediaInput?.click();
        }
      });
      mediaInput?.addEventListener('change', () => this.handleMediaSelect(mediaInput));
      this._bindDropZone(document.getElementById('ltr-media-zone'), mediaInput);
    }

    // ── Drag & Drop ───────────────────────────────────────────────────────────

    _bindDropZone(zone, input) {
      if (!zone || !input) return;

      document.addEventListener('dragover', e => e.preventDefault(), false);
      document.addEventListener('drop', e => e.preventDefault(), false);

      let depth = 0;
      const icon = document.getElementById('ltr-media-icon');
      const text = document.getElementById('ltr-media-text');

      const setActive = (on) => {
        zone.classList.toggle('drag-active', on);
        if (icon) icon.textContent = on ? '⬇️' : '📎';
        if (text) text.textContent = on ? 'Відпустіть файли тут' :
          'Додати фото або відео (до 5 файлів)';
      };

      zone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          depth++;
          if (depth ===
            1) setActive(true);
        }
      });
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
      });
      zone.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        depth--;
        if (depth <= 0) {
          depth = 0;
          setActive(false);
        }
      });
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        depth = 0;
        setActive(false);
        if (e.dataTransfer.files?.length) this.handleMediaSelect({
          files: e.dataTransfer
            .files
        });
      });
    }

    // ── Медіа: вибір і прев'ю ─────────────────────────────────────────────────

    handleMediaSelect(input) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4',
        'video/webm', 'video/quicktime'
      ];
      const files = Array.from(input.files).filter(f => {
        if (!allowed.includes(f.type)) {
          this.showMessage(
            `Непідтримуваний тип: ${f.name}`, 'error');
          return false;
        }
        const limit = f.type.startsWith('video') ? 50 : 8;
        if (f.size > limit * 1024 * 1024) {
          this.showMessage(
            `${f.name} завеликий (ліміт ${limit} МБ)`, 'error');
          return false;
        }
        return true;
      });

      for (const f of files) {
        if (this.selectedMediaFiles.length >= 5) {
          this.showMessage('Максимум 5 файлів',
            'error');
          break;
        }
        this.selectedMediaFiles.push(f);
      }
      this.renderMediaPreview();
    }

    renderMediaPreview() {
      const preview = document.getElementById('ltr-media-preview');
      if (!preview) return;

      if (!this.selectedMediaFiles.length) { preview.innerHTML = ''; return; }

      preview.innerHTML = this.selectedMediaFiles.map((f, i) => {
        const url = URL.createObjectURL(f);
        const isVideo = f.type.startsWith('video');
        const thumb = isVideo ?
          `<video src="${url}" class="ltr-thumb-media" muted playsinline></video><span class="ltr-thumb-play">▶</span>` :
          `<img src="${url}" class="ltr-thumb-media" alt="">`;
        return `<div class="ltr-thumb-wrap" data-index="${i}">${thumb}<button type="button" class="ltr-thumb-remove" data-index="${i}" title="Видалити">×</button></div>`;
      }).join('');

      preview.querySelectorAll('.ltr-thumb-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.selectedMediaFiles.splice(+e.currentTarget.dataset.index, 1);
          this.renderMediaPreview();
        });
      });
    }

    async uploadMediaForReview(reviewId) {
      if (!this.selectedMediaFiles.length) return;
      const fd = new FormData();
      fd.append('action', 'upload_media');
      fd.append('review_id', reviewId);
      for (const f of this.selectedMediaFiles) fd.append('media[]', f);
      try {
        const r = await fetch(this.apiUrl, { method: 'POST', body: fd });
        const result = await r.json();
        if (!result.success) console.error('Media upload error:', result.error);
      } catch (e) { console.error('Media upload failed:', e); }
      this.selectedMediaFiles = [];
      this.renderMediaPreview();
    }

    // ── Сабміт відгуку ────────────────────────────────────────────────────────

    async submitReview() {
      if (!this.validateForm()) return;

      const form = document.getElementById('ltr-review-form');
      const submitBtn = document.getElementById('ltr-submit');
      const fd = new FormData();

      fd.append('action', 'create_review');
      fd.append('product_id', this.productId);
      fd.append('product_url', window.location.href);
      fd.append('product_name', this.getProductName());
      fd.append('name', document.getElementById('ltr-name').value.trim());
      fd.append('email', document.getElementById('ltr-email').value.trim());
      fd.append('review_text', document.getElementById('ltr-text').value.trim());
      fd.append('rating', document.getElementById('ltr-rating-input').value);

      const orig = submitBtn.innerHTML;
      submitBtn.textContent = 'Відправка...';
      submitBtn.disabled = true;

      let response;
      try {
        response = await fetch(this.apiUrl, { method: 'POST', body: fd });
        const result = await response.json();

        if (result.success) {
          if (result.data?.review_id) await this.uploadMediaForReview(result.data.review_id);
          this.showMessage('Відгук успішно створено! Він буде опублікований після модерації.',
            'success');
          form.reset();
          this.resetStars();
          this.selectedMediaFiles = [];
          this.renderMediaPreview();
          document.getElementById('ltr-popup')?.classList.remove('open');
          document.body.style.overflow = '';
        } else {
          this.showMessage(result.error || 'Помилка при створенні відгука', 'error');
        }
      } catch (e) {
        console.error('Submit error:', e);
        this.showMessage('Помилка з\'єднання з сервером', 'error');
      } finally {
        submitBtn.innerHTML = orig;
        submitBtn.disabled = false;
      }
    }

    validateForm() {
      const name = document.getElementById('ltr-name')?.value.trim();
      const email = document.getElementById('ltr-email')?.value.trim();
      const text = document.getElementById('ltr-text')?.value.trim();
      const rating = document.getElementById('ltr-rating-input')?.value;
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

      if (!name) { this.showMessage('Введіть ваше ім\'я', 'error'); return false; }
      if (!emailOk) { this.showMessage('Введіть коректний email', 'error'); return false; }
      if (!text) { this.showMessage('Напишіть відгук', 'error'); return false; }
      if (rating === '0') { this.showMessage('Оцініть товар', 'error'); return false; }
      return true;
    }

    resetStars() {
      document.querySelectorAll('.ltr-star-btn').forEach(b => b.classList.remove('on'));
      const inp = document.getElementById('ltr-rating-input');
      if (inp) inp.value = '0';
    }

    getProductName() {
      return document.getElementById('product_heading')?.textContent.trim() ||
        document.querySelector('h1')?.textContent.trim() ||
        '';
    }

    // ── Завантаження і відображення відгуків ──────────────────────────────────

    async loadReviews() {
      const list = document.getElementById('ltr-list');
      if (!list) return;
      try {
        const r = await fetch(`${this.apiUrl}?product_id=${this.productId}`);
        const result = await r.json();
        if (result.success) {
          this.displayReviews(result.data);
          this.updateRatingSummary(result.data);
        } else {
          list.innerHTML = '<div class="ltr-no-reviews">Помилка завантаження відгуків</div>';
        }
      } catch {
        list.innerHTML = '<div class="ltr-no-reviews">Помилка з\'єднання з сервером</div>';
      }
    }

    displayReviews(reviews) {
      const list = document.getElementById('ltr-list');
      if (!reviews?.length) {
        list.innerHTML =
          '<div class="ltr-no-reviews">Поки що немає відгуків. Будьте першим!</div>';
        return;
      }
      list.innerHTML = reviews.map(r => this.createReviewHTML(r)).join('');
    }

    createReviewHTML(review) {
      const initials = review.name.trim().split(' ').map(w => w[0]).join('').toUpperCase()
        .slice(0, 2);
      const date = new Date(review.created_at).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const starsHtml = '★'.repeat(review.rating) + '<span style="color:#ccc">' + '★'.repeat(
        5 - review.rating) + '</span>';

      // Медіа галерея
      let mediaHTML = '';
      if (review.media?.length) {
        this._mediaCache[review.id] = review.media;
        mediaHTML = `<div class="ltr-gallery" data-review-id="${review.id}">` +
          review.media.map((m, idx) => m.media_type === 'video' ?
            `<button type="button" class="ltr-gallery-thumb ltr-gallery-video" data-lightbox-review="${review.id}" data-lightbox-index="${idx}" aria-label="Відео ${idx+1}"><span class="ltr-thumb-play-icon">▶</span></button>` :
            `<button type="button" class="ltr-gallery-thumb" data-lightbox-review="${review.id}" data-lightbox-index="${idx}" aria-label="Фото ${idx+1}"><img src="${m.url}" alt="" loading="lazy"></button>`
          ).join('') + `</div>`;
      }

      // Відповіді
      let repliesHTML = '';
      if (review.replies?.length) {
        repliesHTML = '<div class="ltr-replies">' + review.replies.map(rep => {
          const repDate = new Date(rep.created_at).toLocaleString(
            'uk-UA', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          return `<div class="ltr-reply-card">
            <div class="ltr-reply-top">
              <div class="ltr-reply-avatar">L</div>
              <span class="ltr-reply-name">${this.escapeHtml(rep.name)}</span>
              <span class="ltr-reply-badge">Продавець</span>
              <span class="ltr-reply-date">${repDate}</span>
            </div>
            <div class="ltr-reply-body">${this.escapeHtml(rep.reply_text)}</div>
          </div>`;
        }).join('') + '</div>';
      }

      return `<div class="ltr-review-card" data-review-id="${review.id}">
        <div class="ltr-review-top">
          <div class="ltr-avatar">${initials}</div>
          <div class="ltr-review-meta">
            <span class="ltr-reviewer-name">${this.escapeHtml(review.name)}</span>
            <span class="ltr-review-date">${date}</span>
          </div>
          <div class="ltr-review-stars">${starsHtml}</div>
        </div>
        <div class="ltr-review-body">${this.escapeHtml(review.review_text)}</div>
        ${mediaHTML}
        <div class="ltr-review-actions">
          <button class="ltr-btn-reply" data-review-id="${review.id}">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M9 15L3 9l6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 9h13a5 5 0 010 10h-1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
            Відповісти
          </button>
        </div>
        ${repliesHTML}
      </div>`;
    }

    // ── Рейтинг-блок ──────────────────────────────────────────────────────────

    updateRatingSummary(reviews) {
      const countEl = document.getElementById('ltr-count');
      const summaryEl = document.getElementById('ltr-rating-summary');
      if (!reviews?.length) {
        if (countEl) countEl.textContent = '0 відгуків';
        return;
      }

      const n = reviews.length;
      const avg = (reviews.reduce((s, r) => s + Number(r.rating), 0) / n).toFixed(1);
      const dist = [5, 4, 3, 2, 1].map(star => reviews.filter(r => Number(r.rating) === star)
        .length);

      if (countEl) countEl.textContent =
        `${n} ${this._plural(n, 'відгук','відгуки','відгуків')}`;

      document.getElementById('ltr-rating-big').textContent = avg;
      const sublabelText =
        `на основі ${n} ${this._plural(n,'відгуку','відгуків','відгуків')}`;
      const sublabel = document.getElementById('ltr-rating-sublabel');
      if (sublabel) sublabel.textContent = sublabelText;
      const labelEl = document.getElementById('ltr-rating-label');
      if (labelEl) labelEl.textContent = sublabelText;

      const starsRow = document.getElementById('ltr-stars-row');
      if (starsRow) {
        const full = Math.round(+avg);
        starsRow.innerHTML = [1, 2, 3, 4, 5].map(i =>
          `<span class="ltr-star-icon${i <= full ? '' : ' empty'}">★</span>`).join('');
      }

      const barsEl = document.getElementById('ltr-bars');
      if (barsEl) {
        barsEl.innerHTML = [5, 4, 3, 2, 1].map((star, i) => {
          const pct = n ? Math.round((dist[i] / n) * 100) : 0;
          return `<div class="ltr-bar-row">
            <span class="ltr-bar-label">${star}</span>
            <div class="ltr-bar-track"><div class="ltr-bar-fill" style="width:${pct}%"></div></div>
            <span class="ltr-bar-cnt">${dist[i]}</span>
          </div>`;
        }).join('');
      }

      if (summaryEl) summaryEl.style.display = 'flex';
    }

    _plural(n, one, few, many) {
      const mod10 = n % 10,
        mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return one;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
      return many;
    }

    // ── Відповіді ─────────────────────────────────────────────────────────────

    bindReplyEvents() {
      document.addEventListener('click', (e) => {
        // Кнопка "Відповісти"
        const replyBtn = e.target.closest('.ltr-btn-reply');
        if (replyBtn) {
          this.showReplyForm(replyBtn.dataset.reviewId);
          return;
        }
        // Lightbox
        const thumb = e.target.closest('[data-lightbox-review]');
        if (thumb) {
          this.openLightbox(+thumb.dataset.lightboxReview, +thumb.dataset.lightboxIndex);
        }
      });
    }

    showReplyForm(reviewId) {
      const card = document.querySelector(`.ltr-review-card[data-review-id="${reviewId}"]`);
      if (!card) return;

      const existing = card.querySelector('.ltr-reply-form');
      if (existing) { existing.remove(); return; }

      const actions = card.querySelector('.ltr-review-actions');
      const html = `<div class="ltr-reply-form">
        <form class="ltr-reply-form-inner">
          <div class="ltr-form-field">
            <textarea name="reply_text" placeholder="Напишіть відповідь..." required rows="3"></textarea>
          </div>
          <div class="ltr-form-row">
            <div class="ltr-form-field">
              <input type="text" name="name" placeholder="Ваше ім'я" required>
            </div>
            <div class="ltr-form-field">
              <input type="email" name="email" placeholder="Електронна адреса" required>
            </div>
          </div>
          <div class="ltr-reply-actions">
            <button type="submit" class="ltr-btn-submit-reply">Відповісти</button>
            <button type="button" class="ltr-btn-cancel-reply">Скасувати</button>
          </div>
        </form>
      </div>`;

      actions.insertAdjacentHTML('afterend', html);

      card.querySelector('.ltr-reply-form-inner').addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitReply(reviewId, e.target);
      });
      card.querySelector('.ltr-btn-cancel-reply').addEventListener('click', () => {
        card.querySelector('.ltr-reply-form').remove();
      });
    }

    async submitReply(reviewId, form) {
      const fd = new FormData(form);
      fd.append('action', 'create_reply');
      fd.append('review_id', reviewId);
      fd.append('product_url', window.location.href);
      fd.append('product_name', this.getProductName());

      const btn = form.querySelector('.ltr-btn-submit-reply');
      const orig = btn.textContent;
      btn.textContent = 'Відправка...';
      btn.disabled = true;

      try {
        const r = await fetch(this.apiUrl, { method: 'POST', body: fd });
        const result = await r.json();
        if (result.success) {
          this.showMessage('Відповідь успішно додана!', 'success');
          form.closest('.ltr-reply-form').remove();
          this.loadReviews();
        } else {
          this.showMessage(result.error || 'Помилка', 'error');
        }
      } catch {
        this.showMessage('Помилка з\'єднання', 'error');
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    }

    // ── Lightbox ──────────────────────────────────────────────────────────────

    _buildLightbox() {
      if (document.getElementById('ltr-lightbox')) return;
      const el = document.createElement('div');
      el.id = 'ltr-lightbox';
      el.className = 'ltr-lb-overlay';
      el.innerHTML = `
        <div class="ltr-lb-backdrop"></div>
        <div class="ltr-lb-wrap">
          <button class="ltr-lb-close" aria-label="Закрити">✕</button>
          <button class="ltr-lb-arrow ltr-lb-prev" aria-label="Попереднє">&#8249;</button>
          <div class="ltr-lb-content"></div>
          <button class="ltr-lb-arrow ltr-lb-next" aria-label="Наступне">&#8250;</button>
          <div class="ltr-lb-counter"></div>
        </div>`;
      document.body.appendChild(el);

      el.querySelector('.ltr-lb-backdrop').addEventListener('click', () => this
        .closeLightbox());
      el.querySelector('.ltr-lb-close').addEventListener('click', () => this.closeLightbox());
      el.querySelector('.ltr-lb-prev').addEventListener('click', () => this._lbStep(-1));
      el.querySelector('.ltr-lb-next').addEventListener('click', () => this._lbStep(1));

      document.addEventListener('keydown', (e) => {
        if (!this._lbOpen) return;
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowLeft') this._lbStep(-1);
        if (e.key === 'ArrowRight') this._lbStep(1);
      });

      let touchX = 0;
      const wrap = el.querySelector('.ltr-lb-wrap');
      wrap.addEventListener('touchstart', e => {
        touchX = e.touches[0]
          .clientX;
      }, { passive: true });
      wrap.addEventListener('touchend', e => {
        const diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) this._lbStep(diff > 0 ? 1 : -1);
      });
    }

    openLightbox(reviewId, index) {
      this._lbReviewId = reviewId;
      this._lbIndex = index;
      this._lbOpen = true;
      const lb = document.getElementById('ltr-lightbox');
      lb.classList.add('ltr-lb-visible');
      document.body.style.overflow = 'hidden';
      this._renderLbSlide();
    }

    closeLightbox() {
      this._lbOpen = false;
      const lb = document.getElementById('ltr-lightbox');
      if (!lb) return;
      lb.classList.remove('ltr-lb-visible');
      document.body.style.overflow = '';
      lb.querySelectorAll('video').forEach(v => v.pause());
    }

    _lbStep(dir) {
      const media = this._mediaCache[this._lbReviewId] || [];
      if (media.length <= 1) return;
      this._lbIndex = (this._lbIndex + dir + media.length) % media.length;
      document.getElementById('ltr-lightbox')?.querySelectorAll('video').forEach(v => v
        .pause());
      this._renderLbSlide();
    }

    _renderLbSlide() {
      const media = this._mediaCache[this._lbReviewId] || [];
      const item = media[this._lbIndex];
      if (!item) return;

      const lb = document.getElementById('ltr-lightbox');
      const content = lb.querySelector('.ltr-lb-content');
      const counter = lb.querySelector('.ltr-lb-counter');
      const prev = lb.querySelector('.ltr-lb-prev');
      const next = lb.querySelector('.ltr-lb-next');

      prev.style.display = next.style.display = media.length > 1 ? '' : 'none';
      counter.textContent = media.length > 1 ? `${this._lbIndex + 1} / ${media.length}` : '';

      content.innerHTML = item.media_type === 'video' ?
        `<video class="ltr-lb-video" src="${item.url}" controls autoplay playsinline></video>` :
        `<img class="ltr-lb-img" src="${item.url}" alt="">`;
    }

    // ── Повідомлення ──────────────────────────────────────────────────────────

    showMessage(msg, type = 'info') {
      const el = document.getElementById('ltr-message');
      if (!el) return;
      el.className = `ltr-message ltr-message-${type}`;
      el.textContent = msg;
      el.style.display = 'block';
      if (type !== 'connection-error') {
        setTimeout(() => { el.style.display = 'none'; }, 5000);
      }
    }

    escapeHtml(text) {
      const d = document.createElement('div');
      d.textContent = text;
      return d.innerHTML;
    }
  }

  // ── Ініціалізація ──────────────────────────────────────────────────────────

  async function initReviews(selector = '.reviews-block') {
    const target = document.querySelector(selector);
    if (!target) return;

    // Отримуємо ID з DOM
    const crmEl = document.querySelector('#crm_id');
    let productId = crmEl?.textContent?.trim() || null;

    // Якщо нема — шукаємо через API (клас сам це робить)
    const container = document.createElement('div');
    container.className = 'reviews-container';
    container.id = 'ltr-reviews';
    target.appendChild(container);

    window.slatterReviews = new ReviewsSystem({
      productId,
      containerSelector: '#ltr-reviews',
      apiUrl: 'https://zakupeace.biz.ua/webflow/handlers/reviews/reviews-api.php',
    });
  }

  setTimeout(() => initReviews('.reviews-block'), 1000);
  window.addReviewsBlock = initReviews;
});
