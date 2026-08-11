/**
 * Leader-tools AI Consultant Widget
 * Підключення: <script src="https://zakupeace.biz.ua/webflow/bot/static/chat-widget.js?v=20260526"></script>
 * Деплой: php/static/README-DEPLOY.md
 */
(function () {
  "use strict";

  // ════════════════════════════════════════════════════════
  //  КОНФІГУРАЦІЯ
  // ════════════════════════════════════════════════════════
  var API = {
    chat: "https://zakupeace.biz.ua/webflow/bot/api/chat.php",
    history: "https://zakupeace.biz.ua/webflow/bot/api/history.php",
    callback: "https://zakupeace.biz.ua/webflow/bot/api/callback.php",
  };

  // Змінюйте при деплої — перевірка в консолі: [LeaderAI] widget v…
  var WIDGET_VERSION = "2026-05-27-console-errors";

  var CFG = {
    name: "Leader AI",
    greeting: "Привіт! 👋 Я консультант Leader-tools. Допоможу підібрати інструмент, розповім про ціни та наявність. Як можу допомогти?",
    hint: "Напишіть запитання...",
    color: "#E53E2B",
    colorDark: "#C0392B",
    // Ключ у localStorage (також використовується для cookie)
    key: "lt_sid",
    // Cookie, що читається корзиною сайту для прив'язки замовлення до чату
    cookieKey: "leader_chat_sid",
    // Відступ знизу для FAB на мобайлі (висота нижнього бару сайту + відступ)
    mobileOffset: 78,
  };

  // ════════════════════════════════════════════════════════
  //  SESSION ID
  //  Зберігається у localStorage (для самого чату) та
  //  у cookie на головному домені (щоб корзина сайту
  //  могла підчепити номер чату до замовлення).
  // ════════════════════════════════════════════════════════
  function setCookie(name, value, days) {
    try {
      var d = new Date();
      d.setTime(d.getTime() + days * 864e5);
      // Визначаємо кореневий домен (щоб cookie було доступне корзині)
      var host = location.hostname;
      var parts = host.split(".");
      var domain = parts.length >= 2 ? "." + parts.slice(-2).join(".") : host;
      document.cookie = name + "=" + encodeURIComponent(value) +
        ";expires=" + d.toUTCString() +
        ";path=/;domain=" + domain + ";SameSite=Lax";
    } catch (_) {}
  }

  function sid() {
    var s = localStorage.getItem(CFG.key);
    if (!s) {
      s = "ltc_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(CFG.key, s);
    }
    // Оновлюємо cookie на кожному завантаженні (продовжуємо термін)
    setCookie(CFG.cookieKey, s, 365);
    return s;
  }

  // ════════════════════════════════════════════════════════
  //  СТИЛІ
  // ════════════════════════════════════════════════════════
  var CSS = [
    /* Ізоляція */
    "#ltw *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}",

    /* ── FAB ── */
    "#ltw-fab{",
    "position:fixed;bottom:28px;right:28px;",
    "width:60px;height:60px;border-radius:50%;",
    "background:" + CFG.color + ";",
    "box-shadow:0 4px 24px rgba(229,62,43,.5);",
    "border:none;outline:none;cursor:pointer;",
    "display:flex;align-items:center;justify-content:center;",
    "z-index:2147483646;",
    "animation:ltpulse 3s ease-in-out infinite;",
    "transition:transform .18s,box-shadow .18s;",
    "}",
    "#ltw-fab:hover{transform:scale(1.08);box-shadow:0 6px 30px rgba(229,62,43,.65);animation:none}",
    "#ltw-fab.is-open{animation:none}",
    "#ltw-fab svg{width:26px;height:26px;fill:#fff;transition:opacity .15s,transform .15s}",
    "#ltw-fab .ic-open{display:block}",
    "#ltw-fab .ic-close{display:none}",
    "#ltw-fab.is-open .ic-open{display:none}",
    "#ltw-fab.is-open .ic-close{display:block}",
    "@keyframes ltpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.11)}}",

    /* ── Badge ── */
    "#ltw-badge{",
    "position:absolute;top:-4px;right:-4px;",
    "background:#ff3b30;color:#fff;border:2px solid #fff;",
    "border-radius:50%;width:20px;height:20px;",
    "font-size:11px;font-weight:700;",
    "display:none;align-items:center;justify-content:center;",
    "pointer-events:none;",
    "}",
    "#ltw-badge.on{display:flex}",

    /* ── Вікно ── */
    "#ltw-win{",
    "position:fixed;right:28px;bottom:100px;",
    "width:420px;height:620px;",
    "max-width:calc(100vw - 32px);",
    "max-height:calc(100dvh - 140px);",
    "background:#fff;border-radius:20px;",
    "box-shadow:0 16px 56px rgba(0,0,0,.18);",
    "display:flex;flex-direction:column;overflow:hidden;",
    "z-index:2147483645;",
    "opacity:0;pointer-events:none;",
    "transform:translateY(18px) scale(.95);",
    "transition:opacity .22s ease,transform .22s ease;",
    "}",
    "#ltw-win.is-open{opacity:1;pointer-events:all;transform:translateY(0) scale(1)}",

    /* ── Header ── */
    "#ltw-head{",
    "background:" + CFG.color + ";",
    "padding:12px 14px;flex-shrink:0;",
    "display:flex;align-items:center;gap:10px;",
    "}",
    "#ltw-av{",
    "width:38px;height:38px;border-radius:50%;flex-shrink:0;",
    "background:rgba(255,255,255,.2);",
    "display:flex;align-items:center;justify-content:center;font-size:19px;",
    "}",
    "#ltw-meta{flex:1;min-width:0}",
    "#ltw-name{color:#fff;font-size:15px;font-weight:700;line-height:1.2}",
    "#ltw-status{color:rgba(255,255,255,.82);font-size:12px;display:flex;align-items:center;gap:5px;margin-top:2px}",
    "#ltw-status::before{content:'';width:7px;height:7px;border-radius:50%;background:#4ade80;display:inline-block;transition:background .3s}",
    /* Статус "друкує" — крапка змінює колір і пульсує */
    "#ltw-status.is-typing::before{background:#fbbf24;animation:ltstatuspulse 1s ease-in-out infinite}",
    "@keyframes ltstatuspulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.6}}",
    /* Анімовані крапки: ширина росте від 0 до трьох крапок через steps */
    ".lt-st-dots{display:inline-block;overflow:hidden;vertical-align:bottom;",
    "width:0;animation:ltdotsw 1.4s steps(4,end) infinite}",
    "@keyframes ltdotsw{0%{width:0}25%{width:.38em}50%{width:.76em}75%,100%{width:1.14em}}",

    /* Кнопка закриття в header (видима тільки на fullscreen <=768px) */
    "#ltw-close{",
    "display:none;align-items:center;justify-content:center;",
    "width:36px;height:36px;flex-shrink:0;",
    "background:rgba(255,255,255,.14);border:none;border-radius:10px;",
    "color:#fff;cursor:pointer;padding:0;outline:none;",
    "transition:background .15s;",
    "}",
    "#ltw-close:hover{background:rgba(255,255,255,.24)}",
    "#ltw-close:active{background:rgba(255,255,255,.32)}",
    "#ltw-close svg{width:20px;height:20px;fill:#fff}",

    /* ── Повідомлення ── */
    "#ltw-msgs-wrap{position:relative;flex:1;min-height:0;display:flex}",
    "#ltw-msgs{",
    "flex:1;overflow-y:auto;padding:14px 14px 46px;",
    "display:flex;flex-direction:column;gap:12px;",
    "scroll-behavior:smooth;",
    "}",
    "#ltw-msgs::-webkit-scrollbar{width:3px}",
    "#ltw-msgs::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}",

    /* ── Кнопка "прокрутити вниз" ── */
    "#ltw-scroll{",
    "position:absolute;right:12px;bottom:10px;",
    "width:34px;height:34px;border-radius:50%;",
    "background:#fff;border:1px solid #e2e8f0;",
    "box-shadow:0 4px 14px rgba(15,23,42,.12);",
    "cursor:pointer;padding:0;",
    "display:flex;align-items:center;justify-content:center;",
    "opacity:0;pointer-events:none;transform:translateY(6px) scale(.92);",
    "transition:opacity .18s ease,transform .18s ease,background .15s;",
    "z-index:2;",
    "}",
    "#ltw-scroll.on{opacity:1;pointer-events:auto;transform:translateY(0) scale(1)}",
    "#ltw-scroll:hover{background:#f8fafc}",
    "#ltw-scroll svg{width:16px;height:16px;fill:#475569}",
    "#ltw-scroll .lt-sb-badge{",
    "position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;",
    "padding:0 5px;border-radius:9px;",
    "background:" + CFG.color + ";color:#fff;",
    "font-size:10px;font-weight:700;line-height:18px;text-align:center;",
    "border:2px solid #fff;box-sizing:content-box;",
    "display:none;",
    "}",
    "#ltw-scroll.has-new .lt-sb-badge{display:block}",

    /* ── Bubble ── */
    ".lt-row{display:flex;gap:8px;align-items:flex-end}",
    ".lt-row.u{flex-direction:row-reverse}",
    ".lt-ava{",
    "width:28px;height:28px;border-radius:50%;flex-shrink:0;font-size:13px;",
    "display:flex;align-items:center;justify-content:center;",
    "background:" + CFG.color + ";color:#fff;",
    "}",
    ".lt-row.u .lt-ava{background:#64748b}",
    ".lt-bub{",
    "max-width:78%;padding:10px 13px;border-radius:18px;",
    "font-size:14px;line-height:1.55;word-break:break-word;",
    "}",
    ".lt-row.b .lt-bub{background:#f1f5f9;color:#1e293b;border-bottom-left-radius:4px}",
    ".lt-row.b .lt-bub a{color:" + CFG.color + ";text-decoration:underline;font-weight:600}",
    ".lt-row.b .lt-bub a:hover{color:" + CFG.colorDark + "}",
    ".lt-row.u .lt-bub{background:" + CFG.color + ";color:#fff;border-bottom-right-radius:4px}",

    /* ── Typing ── */
    ".lt-typing .lt-bub{background:#f1f5f9;padding:12px 16px}",
    ".lt-dots{display:flex;gap:4px}",
    ".lt-dot{width:7px;height:7px;border-radius:50%;background:#94a3b8;animation:ltdot 1.2s ease-in-out infinite}",
    ".lt-dot:nth-child(2){animation-delay:.2s}",
    ".lt-dot:nth-child(3){animation-delay:.4s}",
    "@keyframes ltdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}",

    /* ── Картки товарів ── */
    ".lt-cards{display:flex;flex-direction:column;gap:8px;margin-top:4px;width:100%;max-width:100%;min-width:0}",
    ".lt-card{",
    "display:flex;gap:10px;padding:10px;",
    "background:#fff;border:1.5px solid #e8edf2;border-radius:14px;",
    "text-decoration:none;color:inherit;min-width:0;",
    "transition:border-color .18s,box-shadow .18s;",
    "}",
    ".lt-card:hover{border-color:" + CFG.color + ";box-shadow:0 4px 18px rgba(0,0,0,.09)}",
    ".lt-cimg{width:72px;height:72px;object-fit:contain;border-radius:9px;background:#f7f9fc;flex-shrink:0}",
    ".lt-cno{width:72px;height:72px;border-radius:9px;background:#f1f5f9;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px}",
    ".lt-cbody{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between}",
    ".lt-cn{font-size:12.5px;font-weight:600;color:#1e293b;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:3px}",
    ".lt-cd{font-size:11px;color:#64748b;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:5px}",
    ".lt-cf{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height: 30px;}",
    ".lt-cp{font-size:15px;font-weight:700;color:" + CFG.color + "}",
    ".lt-cop{font-size:12px;color:#94a3b8;text-decoration:line-through}",
    ".lt-cdis{font-size:11px;font-weight:700;color:#dc2626;background:#fef2f2;padding:2px 6px;border-radius:5px}",
    ".lt-cs{font-size:11px}",
    ".lt-cs.y{color:#16a34a}",
    ".lt-cs.n{color:#dc2626}",

    /* ── Кнопки картки ── */
    /* Обидві кнопки (button + <a>) мають виглядати однаково, тож рендеримо
       як inline-flex з центруванням — інакше <a> вирівнює текст як inline
       і напис з'їжджає вгору. */
    ".lt-cbtns{display:flex;gap:5px;margin-top:8px;min-width:0}",
    ".lt-cbtn-sel,.lt-cbtn-link{",
    "flex:1;min-width:0;height:30px;padding:0 6px;",
    "display:inline-flex;align-items:center;justify-content:center;",
    "font-size:11px;font-weight:600;line-height:1;font-family:inherit;",
    "border-radius:8px;background:transparent;cursor:pointer;",
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
    "text-decoration:none;box-sizing:border-box;",
    "}",
    ".lt-cbtn-sel{",
    "border:1.5px solid " + CFG.color + ";color:" + CFG.color + ";",
    "transition:background .15s,color .15s;",
    "}",
    ".lt-cbtn-sel:hover,.lt-cbtn-sel.lt-sel{background:" + CFG.color + ";color:#fff}",
    ".lt-cbtn-link{",
    "border:1.5px solid #e2e8f0;color:#64748b;",
    "transition:border-color .15s,color .15s;",
    "}",
    ".lt-cbtn-link:hover{border-color:#94a3b8;color:#334155}",

    /* ── Бейдж "Комплект" ── */
    ".lt-ckit{",
    "display:inline-block;font-size:10px;font-weight:700;",
    "background:#fef3c7;color:#92400e;",
    "padding:2px 7px;border-radius:5px;margin-bottom:5px;",
    "}",

    /* ── Картка: немає в наявності ── */
    ".lt-card-out .lt-cimg,.lt-card-out .lt-cno{opacity:.5;filter:grayscale(50%)}",
    ".lt-card-out .lt-cn{color:#94a3b8}",
    ".lt-card-out .lt-cp{color:#94a3b8}",

    /* ── Reply bar (вибраний товар) ── */
    "#ltw-reply-bar{",
    "display:none;align-items:center;gap:8px;",
    "padding:6px 12px;border-top:1px solid #f0f4f8;",
    "background:#f8fafc;flex-shrink:0;",
    "}",
    "#ltw-reply-bar.on{display:flex}",
    "#ltw-reply-ic{font-size:15px;flex-shrink:0}",
    "#ltw-reply-txt{",
    "flex:1;font-size:12px;color:#475569;font-style:italic;",
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
    "}",
    "#ltw-reply-del{",
    "background:none;border:none;cursor:pointer;",
    "font-size:17px;line-height:1;color:#94a3b8;padding:0 2px;",
    "}",
    "#ltw-reply-del:hover{color:#475569}",

    /* ── Панель зворотного дзвінка (над полем вводу) ── */
    "#ltw-callback-panel{display:none;flex-shrink:0;",
    "padding:14px 14px 12px;border-top:1px solid #e8edf2;",
    "background:#f8fafc;max-height:46%;overflow-y:auto;}",
    "#ltw-callback-panel.on{display:block}",

    /* ── Цитата обраного товару в бульбашці ── */
    ".lt-quote{",
    "font-size:11px;color:rgba(255,255,255,.82);",
    "border-left:2px solid rgba(255,255,255,.5);",
    "padding-left:7px;margin-bottom:5px;",
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;",
    "}",

    /* ── Ввід ── */
    "#ltw-inp-wrap{padding:10px 12px;border-top:1px solid #f0f4f8;flex-shrink:0;display:flex;gap:8px;align-items:flex-end}",
    "#ltw-inp{",
    "flex:1;border:1.5px solid #e2e8f0;border-radius:13px;",
    /* font-size:16px — обов'язково для iOS Safari (<16px викликає авто-zoom при фокусі) */
    "padding:9px 13px;font-size:16px;font-family:inherit;",
    "resize:none;outline:none;line-height:1.5;max-height:96px;overflow:hidden;",
    "transition:border-color .15s;",
    /* Сумісність: фіксуємо розмір тексту, щоб мобільні браузери не масштабували його */
    "-webkit-text-size-adjust:100%;text-size-adjust:100%;",
    "}",
    "#ltw-inp:focus{border-color:" + CFG.color + "}",
    "#ltw-inp::placeholder{color:#c0ccd8}",
    "#ltw-btn{",
    "width:42px;height:42px;border-radius:12px;flex-shrink:0;",
    "background:" + CFG.color + ";border:none;cursor:pointer;",
    "display:flex;align-items:center;justify-content:center;",
    "transition:background .15s,transform .1s;",
    "}",
    "#ltw-btn:hover{background:" + CFG.colorDark + "}",
    "#ltw-btn:active{transform:scale(.92)}",
    "#ltw-btn:disabled{background:#cbd5e1;cursor:not-allowed}",
    "#ltw-btn svg{width:18px;height:18px;fill:#fff}",

    /* ── Підвал ── */
    "#ltw-foot{",
    "text-align:center;font-size:12px;color:#c8d2dc;",
    "padding:4px 8px 8px;flex-shrink:0;user-select:text;",
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
    "}",
    "#ltw-foot .lt-sid{font-family:ui-monospace,Consolas,monospace;color:#b7c2cd;cursor:pointer}",
    "#ltw-foot .lt-sid:hover{color:#64748b}",
    "#ltw-foot .lt-callback-foot{",
    "display:inline-block;margin-top:6px;padding:0;border:none;background:none;",
    "color:" + CFG.color + ";font-size:12px;font-weight:600;cursor:pointer;",
    "text-decoration:underline;text-underline-offset:2px;",
    "}",
    "#ltw-foot .lt-callback-foot:hover{color:" + CFG.colorDark + "}",

    /* ── Форма зворотного дзвінка ── */
    ".lt-callback{",
    "position:relative;width:100%;max-width:100%;min-width:0;box-sizing:border-box;",
    "background:#fff;border:1px solid #e2e8f0;border-radius:16px;",
    "padding:18px 16px 16px;",
    "box-shadow:0 2px 14px rgba(15,23,42,.07);",
    "}",
    ".lt-callback-close{",
    "position:absolute;top:10px;right:10px;z-index:1;",
    "width:30px;height:30px;padding:0;margin:0;",
    "border:none;border-radius:9px;cursor:pointer;",
    "background:#f1f5f9;color:#64748b;",
    "font-size:17px;line-height:1;font-family:inherit;",
    "display:flex;align-items:center;justify-content:center;",
    "transition:background .15s,color .15s;",
    "}",
    ".lt-callback-close:hover{background:#e2e8f0;color:#334155}",
    ".lt-callback-close:active{transform:scale(.94)}",
    ".lt-callback-hd{",
    "font-size:14px;font-weight:700;color:#1e293b;line-height:1.35;",
    "margin:0 28px 8px 0;display:flex;align-items:center;gap:8px;",
    "}",
    ".lt-callback-desc{",
    "font-size:12px;color:#64748b;line-height:1.5;",
    "margin:0 0 18px;padding:0 2px;",
    "}",
    ".lt-callback-fields{display:flex;flex-direction:column;gap:14px;margin:0}",
    ".lt-callback-field{display:flex;flex-direction:column;gap:7px;min-width:0;margin:0}",
    ".lt-callback-field label{",
    "font-size:12px;font-weight:600;color:#475569;margin:0;padding:0 2px;",
    "}",
    ".lt-callback-field input{",
    "width:100%;min-width:0;box-sizing:border-box;margin:0;",
    "border:1.5px solid #e2e8f0;border-radius:11px;",
    "padding:11px 13px;font-size:16px;line-height:1.35;",
    "font-family:inherit;color:#1e293b;background:#fff;",
    "outline:none;transition:border-color .15s,box-shadow .15s;",
    "-webkit-text-size-adjust:100%;",
    "}",
    ".lt-callback-field input:focus{",
    "border-color:" + CFG.color + ";box-shadow:0 0 0 3px rgba(229,62,43,.12);",
    "}",
    ".lt-callback-field input::placeholder{color:#94a3b8}",
    ".lt-callback-submit{",
    "width:100%;margin-top:16px;min-height:46px;padding:12px 16px;",
    "border:none;border-radius:12px;cursor:pointer;",
    "background:" + CFG.color + ";color:#fff;",
    "font-size:14px;font-weight:700;font-family:inherit;line-height:1.2;",
    "transition:background .15s,transform .1s;",
    "}",
    ".lt-callback-submit:hover{background:" + CFG.colorDark + "}",
    ".lt-callback-submit:active{transform:scale(.98)}",
    ".lt-callback-submit:disabled{background:#cbd5e1;cursor:not-allowed;transform:none}",
    ".lt-callback-status{margin:12px 2px 0;font-size:12px;line-height:1.45}",
    ".lt-callback-status.ok{color:#15803d}",
    ".lt-callback-status.err{color:#dc2626}",
    ".lt-callback.is-done .lt-callback-fields,.lt-callback.is-done .lt-callback-submit{display:none}",

    /* ════ АДАПТИВ ════ */

    /* Планшет — обмежуємо ширину, не розтягуємо на весь екран */
    "@media(max-width:900px){",
    "#ltw-win{",
    "right:16px;bottom:100px;",
    "width:min(calc(100vw - 32px), 440px);",
    "height:min(620px, calc(100dvh - 130px));",
    "}",
    "}",

    /* Мобайл/планшет-портрет — fullscreen віджет поверх усього */
    "@media(max-width:768px){",
    "#ltw-fab{bottom:" + CFG.mobileOffset + "px;right:16px;width:62px;height:62px}",
    "#ltw-fab svg{width:22px;height:22px}",
    "#ltw-win{",
    "top:0;left:0;right:0;bottom:0;",
    "width:100vw;width:100dvw;",
    "height:100vh;height:100dvh;",
    "max-width:none;max-height:none;",
    "border-radius:0;",
    "z-index:2147483647;",
    "}",
    /* Блокуємо прокрутку сторінки поки чат відкритий */
    "html.ltw-locked,html.ltw-locked body{overflow:hidden !important;}",
    /* Ховаємо FAB коли чат відкритий на fullscreen (щоб не перекривав input) */
    "#ltw-fab.is-open{display:none}",
    /* Показуємо кнопку закриття у header */
    "#ltw-close{display:flex}",
    "}",

    /* Мобайл малих розмірів — додатково компактимо шрифти/елементи */
    "@media(max-width:560px){",

    "#ltw-head{padding:10px 12px;gap:9px}",
    "#ltw-av{width:34px;height:34px;font-size:17px}",
    "#ltw-name{font-size:14px}",
    "#ltw-status{font-size:11.5px}",

    "#ltw-msgs{padding:12px 10px 42px;gap:10px}",
    "#ltw-scroll{width:30px;height:30px;right:8px;bottom:8px}",
    "#ltw-scroll svg{width:14px;height:14px}",

    ".lt-bub{font-size:13.5px;padding:9px 12px;max-width:84%}",
    ".lt-ava{width:26px;height:26px;font-size:12px}",

    ".lt-card{gap:9px;padding:9px}",
    ".lt-cimg,.lt-cno{width:62px;height:62px}",
    ".lt-cn{font-size:12px}",
    ".lt-cd{font-size:10.5px;-webkit-line-clamp:2}",
    ".lt-cp{font-size:14px}",
    ".lt-cop,.lt-cdis,.lt-cs{font-size:10.5px}",
    ".lt-cbtn-sel,.lt-cbtn-link{font-size:10.5px;height:28px;padding:0 5px}",

    "#ltw-reply-bar{padding:5px 10px}",
    "#ltw-reply-txt{font-size:11.5px}",

    "#ltw-inp-wrap{padding:8px 10px;gap:6px}",
    /* font-size:16px — НЕ змінюємо на менше, iOS буде зумити */
    "#ltw-inp{padding:8px 11px;font-size:16px;border-radius:11px}",
    "#ltw-btn{width:38px;height:38px;border-radius:11px}",
    "#ltw-btn svg{width:16px;height:16px}",

    "#ltw-foot{padding:10px 0 20px;font-size:12px}",
    "}",
    "@media(max-width:480px){",
    "#ltw-fab{bottom:90px;right:16px;width:62px;height:62px}",
    "}",

    /* Малий мобайл — кнопки картки в два рядки, вкорочений placeholder-текст */
    "@media(max-width:380px){",
    ".lt-bub{max-width:88%}",
    ".lt-cards{gap:7px}",
    ".lt-card{padding:8px;gap:8px}",
    ".lt-cimg,.lt-cno{width:56px;height:56px}",
    ".lt-cbtns{flex-direction:column;gap:4px}",
    ".lt-cbtn-sel,.lt-cbtn-link{width:100%;height:32px;padding:0 6px;min-height: 30px;}",
    ".lt-cf{min-height: 40px}",
    "#ltw-callback-panel{padding:12px 12px 10px}",
    ".lt-callback{padding:16px 14px 14px;border-radius:14px}",
    ".lt-callback-desc{margin-bottom:16px}",
    ".lt-callback-fields{gap:12px}",
    ".lt-callback-submit{margin-top:14px;min-height:44px}",
    "}",
  ].join("");

  // ════════════════════════════════════════════════════════
  //  ІНІЦІАЛІЗАЦІЯ
  // ════════════════════════════════════════════════════════
  function init() {
    if (document.getElementById("ltw")) return true;
    if (!document.body) return false;

    var root = document.createElement("div");
    root.id = "ltw";
    root.innerHTML = [
      "<style>" + CSS + "</style>",

      "<button id='ltw-fab' aria-label='Чат з консультантом'>",
      "<div id='ltw-badge'></div>",
      "<svg class='ic-open' viewBox='0 0 24 24'><path d='M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z'/></svg>",
      "<svg class='ic-close' viewBox='0 0 24 24'><path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/></svg>",
      "</button>",

      "<div id='ltw-win' role='dialog' aria-label='Чат Leader AI'>",
      "<div id='ltw-head'>",
      "<div id='ltw-av'>🤖</div>",
      "<div id='ltw-meta'>",
      "<div id='ltw-name'>" + CFG.name + "</div>",
      "<div id='ltw-status'>Онлайн</div>",
      "</div>",
      "<button id='ltw-close' type='button' aria-label='Закрити чат'>",
      "<svg viewBox='0 0 24 24'><path d='M18.3 5.71 12 12.01 5.71 5.71 4.29 7.13l6.29 6.29-6.29 6.29 1.42 1.42L12 14.83l6.29 6.29 1.42-1.42-6.29-6.29 6.29-6.29z'/></svg>",
      "</button>",
      "</div>",
      "<div id='ltw-msgs-wrap'>",
      "<div id='ltw-msgs'></div>",
      "<button id='ltw-scroll' type='button' aria-label='Прокрутити донизу'>",
      "<svg viewBox='0 0 24 24'><path d='M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z'/></svg>",
      "<span class='lt-sb-badge' id='ltw-sb-badge'>0</span>",
      "</button>",
      "</div>",
      "<div id='ltw-reply-bar'>",
      "<div id='ltw-reply-ic'>📦</div>",
      "<div id='ltw-reply-txt'></div>",
      "<button id='ltw-reply-del' aria-label='Скасувати вибір'>✕</button>",
      "</div>",
      "<div id='ltw-callback-panel' aria-label='Форма зворотного дзвінка'></div>",
      "<div id='ltw-inp-wrap'>",
      "<textarea id='ltw-inp' rows='1' placeholder='" + CFG.hint +
      "' maxlength='1000'></textarea>",
      "<button id='ltw-btn' aria-label='Надіслати'>",
      "<svg viewBox='0 0 24 24'><path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/></svg>",
      "</button>",
      "</div>",
      "<div id='ltw-foot'>Powered by Leader-Mah | <a href='tel:0800200070' style='color:inherit;text-decoration:underline'>0 800 2000 70</a> | ID: <span class='lt-sid' id='ltw-sid'></span><br><button type='button' class='lt-callback-foot' id='ltw-callback-foot'>📞 Залишити заявку</button></div>",
      "</div>",
    ].join("");

    document.body.appendChild(root);
    start();
    return true;
  }

  // ════════════════════════════════════════════════════════
  //  ЛОГІКА
  // ════════════════════════════════════════════════════════
  function start() {
    var fab = $("ltw-fab");
    var win = $("ltw-win");
    var msgs = $("ltw-msgs");
    var inp = $("ltw-inp");
    var btn = $("ltw-btn");
    var badge = $("ltw-badge");
    var sidEl = $("ltw-sid");
    var scrollBtn = $("ltw-scroll");
    var sbBadge = $("ltw-sb-badge");
    var closeBtn = $("ltw-close");

    var isOpen = false;
    var isLoad = false;
    var badgeN = 0;
    var SESSION = sid();
    var selectedProduct = null; // {id, name} — товар, обраний кнопкою "💬 Обрати"
    var unreadN = 0; // Кількість нових повідомлень, поки користувач не внизу

    // Показуємо ID чату у футері (щоб клієнт міг його повідомити менеджеру)
    if (sidEl) {
      sidEl.textContent = SESSION;
      sidEl.addEventListener("click", function () {
        try {
          navigator.clipboard.writeText(SESSION).then(function () {
            var prev = sidEl.textContent;
            sidEl.textContent = "✓ скопійовано";
            setTimeout(function () { sidEl.textContent = prev; }, 1500);
          });
        } catch (e) {
          // Fallback для старих браузерів
          var ta = document.createElement("textarea");
          ta.value = SESSION;
          ta.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          var prev = sidEl.textContent;
          sidEl.textContent = "✓ скопійовано";
          setTimeout(function () { sidEl.textContent = prev; }, 1500);
        }
      });
    }

    // ── Логіка кнопки "прокрутити вниз" ───────────────────
    // Показуємо, коли користувач прокрутив вгору більше ніж на 60px від низу.
    var SCROLL_THRESHOLD = 60;

    function isNearBottom() {
      return (msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight) < SCROLL_THRESHOLD;
    }

    function updateScrollBtn() {
      if (isNearBottom()) {
        scrollBtn.classList.remove("on", "has-new");
        unreadN = 0;
        sbBadge.textContent = "0";
      } else {
        scrollBtn.classList.add("on");
      }
    }

    function bumpUnread() {
      if (!isNearBottom()) {
        unreadN++;
        scrollBtn.classList.add("on", "has-new");
        sbBadge.textContent = unreadN > 9 ? "9+" : String(unreadN);
      }
    }

    msgs.addEventListener("scroll", updateScrollBtn, { passive: true });

    scrollBtn.addEventListener("click", function () {
      msgs.scrollTo({ top: msgs.scrollHeight, behavior: "smooth" });
      unreadN = 0;
      scrollBtn.classList.remove("has-new");
      sbBadge.textContent = "0";
    });

    var replyBar = $("ltw-reply-bar");
    var replyTxt = $("ltw-reply-txt");
    var replyDel = $("ltw-reply-del");

    // ── Логування у консоль ──────────────────────────────
    var log = {
      _prefix: "%c[LeaderAI]%c",
      _base: "color:#E53E2B;font-weight:bold",
      _reset: "color:inherit;font-weight:normal",
      info: function (msg, data) {
        if (data !== undefined) console.log(log._prefix + " " + msg, log._base, log._reset,
          data);
        else console.log(log._prefix + " " + msg, log._base, log._reset);
      },
      ok: function (msg, data) {
        var s = "color:#16a34a;font-weight:bold";
        if (data !== undefined) console.log(log._prefix + " ✅ " + msg, log._base, log._reset,
          data);
        else console.log(log._prefix + " ✅ " + msg, log._base, log._reset);
      },
      warn: function (msg, data) {
        if (data !== undefined) console.warn(log._prefix + " ⚠️ " + msg, log._base, log
          ._reset, data);
        else console.warn(log._prefix + " ⚠️ " + msg, log._base, log._reset);
      },
      err: function (msg, data) {
        log.logError(msg, data);
      },
      /** Усі помилки — у console.log (зручно фільтрувати в DevTools). */
      logError: function (msg, data) {
        if (data !== undefined) {
          console.log(log._prefix + " ❌ " + msg, log._base, log._reset, data);
        } else {
          console.log(log._prefix + " ❌ " + msg, log._base, log._reset);
        }
      },
      group: function (label) {
        console.group(log._prefix + " " + label, log._base, log
          ._reset);
      },
      end: function () { console.groupEnd(); },
      sep: function () { console.log("%c" + "─".repeat(50), "color:#cbd5e1"); },
    };

    function formatError(err) {
      if (!err) return { message: "unknown error" };
      if (typeof err === "string") return { message: err };
      return {
        name: err.name || "Error",
        message: err.message || String(err),
        stack: err.stack || null,
      };
    }

    function isBotErrorMessage(text) {
      var t = (text || "").toLowerCase();
      return /технічна помилка|тимчасово недоступн|сталася помилка|internal server error|timeout/i
        .test(t);
    }

    function logConsolePayload(label, payload) {
      if (!payload || typeof payload !== "object") return;
      if (payload.console) {
        log.logError(label + " | console", payload.console);
        if (payload.console.errors && payload.console.errors.length) {
          payload.console.errors.forEach(function (e, i) {
            log.logError(label + " | console.errors[" + i + "]", e);
          });
        }
      }
      if (payload.error) {
        log.logError(label + " | error", payload.error);
      }
    }

    /**
     * Виводить детальний trace запиту з бекенду:
     *  • класифікатор наміру (джерело, category/type, clarification)
     *  • pre-check (intent/stage/rewrite/risk/confidence + fallback)
     *  • policy overrides (які правила примусово переписали tool args)
     *  • кожну ітерацію агентного циклу з tool_calls (аргументи, кількість знайдених)
     *  • всі LLM-виклики (chat/classify/rerank) з токенами та мс
     *  • re-rank до/після
     *  • підсумок по токенах і вартість USD/UAH
     */
    function logDebugTrace(d) {
      if (!d) return;
      log.group("🔍 Trace (" + (d.model || "?") + ")");

      // Класифікатор
      if (d.classifier) {
        var c = d.classifier;
        var cLine = "source=" + c.source +
          " | type=" + (c.product_type || "?") +
          (c.target_category ? " | cat=\"" + c.target_category + "\"" : "") +
          (c.needs_clarification ? " | clarify=yes" : "");
        log.info("Класифікатор: " + cLine);
        if (c.notes) log.info("  notes: " + c.notes);
      } else {
        log.info("Класифікатор: skip");
      }

      // Pre-check
      if (d.precheck) {
        var p = d.precheck;
        var pLine = "source=" + (p.source || "fallback") +
          " | intent=" + (p.intent || "unknown") +
          " | stage=" + (p.stage || "generic") +
          (p.query_rewrite ? " | rewrite=\"" + p.query_rewrite + "\"" : "") +
          ((p.product_types && p.product_types.length) ? " | types=[" + p.product_types.join(
            ",") + "]" : "") +
          " | conf=" + ((p.confidence || 0).toFixed ? p.confidence.toFixed(3) : p.confidence);
        log.info("Pre-check: " + pLine);
        if (p.needs_clarification) log.warn("  pre-check: needs_clarification=true");
        if (p.risk_flags && p.risk_flags.length) {
          log.warn("  risk_flags: " + p.risk_flags.join(", "));
        }
        if (p.fallback_reason) {
          log.warn("  fallback_reason: " + p.fallback_reason);
        }
      } else {
        log.info("Pre-check: none");
      }

      // Policy overrides
      var pol = d.policy_overrides || [];
      if (pol.length) {
        log.group("Policy overrides (" + pol.length + ")");
        pol.forEach(function (po, idx) {
          var head = "[" + idx + "] iter=" + (po.iteration !== undefined ? po.iteration :
              "?") +
            " | tool=" + (po.tool || "?");
          log.info(head);
          (po.overrides || []).forEach(function (ov) {
            log.info("  rule=" + (ov.rule || "?"), {
              before: ov.before,
              after: ov
                .after
            });
          });
        });
        log.end();
      } else {
        log.info("Policy overrides: none");
      }
      if (d.precheck_fallbacks && d.precheck_fallbacks.length) {
        log.warn("Pre-check fallbacks: " + d.precheck_fallbacks.join(" | "));
      }

      // Ітерації агентного циклу
      var iters = d.iterations || [];
      if (iters.length) {
        log.group("Ітерації (" + iters.length + ")");
        iters.forEach(function (it) {
          var head = "#" + it.i +
            (it.with_tools ? " [tools]" : " [final]") +
            " → tokens in=" + (it.tokens_in || 0) +
            " out=" + (it.tokens_out || 0) +
            (it.cached ? " (cached=" + it.cached + ")" : "") +
            " | " + (it.ms || 0) + "мс";
          if (it.error) {
            log.err("Ітер " + head + " | error: " + it.error);
            return;
          }
          var tcs = it.tool_calls || [];
          if (!tcs.length) {
            log.info("Ітер " + head + " | finish=" + (it.finish || "") +
              (it.text_len ? " | text=" + it.text_len + " симв." : ""));
            return;
          }
          log.group("Ітер " + head);
          tcs.forEach(function (tc, k) {
            var args = tc.args || {};
            var argStr = Object.keys(args).map(function (key) {
              var v = args[key];
              if (Array.isArray(v)) v = "[" + v.join(",") + "]";
              else if (typeof v === "string") v = "\"" + v + "\"";
              return key + "=" + v;
            }).join(", ");
            var head2 = "[" + k + "] " + tc.name + "(" + argStr + ")" +
              " → found " + (tc.found || 0) +
              " | " + (tc.ms || 0) + "мс";
            if (tc.found_ids && tc.found_ids.length) {
              log.info(head2);
              log.info("    ids: " + tc.found_ids.join(", "));
            } else {
              log.info(head2);
            }
            if (tc.overrides && tc.overrides.length) {
              tc.overrides.forEach(function (ov) {
                log.info("    override: " + (ov.rule || "?"), {
                  before: ov.before,
                  after: ov.after
                });
              });
            }
          });
          log.end();
        });
        log.end();
      }

      // Окремі LLM-виклики (classify/rerank/chat) — плаский список
      var calls = d.llm_calls || [];
      if (calls.length) {
        log.group("LLM-виклики (" + calls.length + ")");
        calls.forEach(function (c, k) {
          log.info("[" + k + "] " + c.tag +
            " | in=" + (c.tokens_in || 0) +
            " out=" + (c.tokens_out || 0) +
            (c.cached ? " cached=" + c.cached : "") +
            " | " + (c.ms || 0) + "мс");
        });
        log.end();
      }

      // Re-rank
      if (d.rerank) {
        if (d.rerank.applied) {
          log.info("Re-rank: застосовано " + d.rerank.before +
            " → " + d.rerank.after + " (top_n=" + d.rerank.top_n + ")");
        } else {
          log.info("Re-rank: не застосовано");
        }
      }

      // Підсумок
      if (d.totals) {
        var t = d.totals;
        var cost = d.cost || {};
        var costStr = cost.usd !== undefined ?
          ("$" + cost.usd.toFixed(6) + " / ≈" + (cost.uah || 0).toFixed(4) + " грн") :
          "—";
        log.ok("Разом: in=" + t.tokens_in + " out=" + t.tokens_out +
          (t.cached ? " cached=" + t.cached : "") +
          " | " + (t.ms || 0) + "мс | " + costStr);
      }

      log.end();
    }

    log.info("Віджет v" + WIDGET_VERSION + " | session_id: " + SESSION);
    log.info("API endpoints →", API);

    // Відновлення або привітання
    loadHistory();

    // Відкриття/закриття вікна (спільна логіка для FAB та header-close)
    function setOpen(open) {
      isOpen = !!open;
      fab.classList.toggle("is-open", isOpen);
      win.classList.toggle("is-open", isOpen);
      document.documentElement.classList.toggle("ltw-locked", isOpen);
      if (isOpen) {
        hideBadge();
        scroll(true);
        setTimeout(function () { inp.focus(); }, 250);
        // Зберігаємо utm_chat у localStorage при першому відкритті чату.
        // Сайт читає його при оформленні замовлення та видаляє після успішного checkout.
        try {
          if (!localStorage.getItem("utm_chat")) {
            localStorage.setItem("utm_chat", SESSION);
          }
        } catch (e) { /* silent */ }
      } else if (inp) {
        inp.blur();
      }
    }

    // FAB — toggle
    fab.addEventListener("click", function () { setOpen(!isOpen); });

    // Хрестик у header (видимий на fullscreen <=768px) — close
    if (closeBtn) {
      closeBtn.addEventListener("click", function () { setOpen(false); });
    }

    // Надіслати
    btn.addEventListener("click", send);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    // Авторозмір textarea
    inp.addEventListener("input", function () {
      inp.style.height = "auto";
      inp.style.height = Math.min(inp.scrollHeight, 96) + "px";
    });

    // ── Вибір товару кнопкою "💬 Обрати" (делегування) ─────
    msgs.addEventListener("click", function (e) {
      var btn = e.target.closest(".lt-cbtn-sel");
      if (!btn) return;
      var pid = btn.getAttribute("data-id");
      var pname = btn.getAttribute("data-name");
      if (!pid) return;

      // Якщо вже обраний той самий — скасовуємо
      if (selectedProduct && selectedProduct.id === pid) {
        clearSelection();
        return;
      }

      selectedProduct = { id: pid, name: pname };

      // Підсвічуємо кнопку, знімаємо попередній вибір
      msgs.querySelectorAll(".lt-cbtn-sel").forEach(function (b) {
        b.classList.remove("lt-sel");
        b.textContent = "💬 Обрати";
      });
      btn.classList.add("lt-sel");
      btn.textContent = "✓ Обрано";

      // Reply bar
      replyTxt.textContent = pname;
      replyBar.classList.add("on");

      inp.focus();
      log.info("Обрано товар: " + pname + " (" + pid + ")");
    });

    // Скасування вибору (кнопка ✕ у reply bar)
    replyDel.addEventListener("click", function () {
      clearSelection();
    });

    var callbackPanel = $("ltw-callback-panel");
    var callbackFoot = $("ltw-callback-foot");
    if (callbackFoot) {
      callbackFoot.addEventListener("click", function () {
        showCallbackPanel();
        scroll(true);
      });
    }

    var ltwRoot = $("ltw");
    if (ltwRoot) {
      ltwRoot.addEventListener("click", function (e) {
        if (e.target.closest(".lt-callback-close")) {
          hideCallbackPanel();
          return;
        }
        var cbBtn = e.target.closest(".lt-callback-submit");
        if (!cbBtn) return;
        var formEl = cbBtn.closest(".lt-callback");
        if (formEl) submitCallbackForm(formEl);
      });
    }

    function clearSelection() {
      selectedProduct = null;
      replyBar.classList.remove("on");
      msgs.querySelectorAll(".lt-cbtn-sel").forEach(function (b) {
        b.classList.remove("lt-sel");
        b.textContent = "💬 Обрати";
      });
    }

    // ── Завантаження історії ──────────────────────────────
    function loadHistory() {
      var t0 = performance.now();
      log.info("Завантаження історії... → " + API.history);

      fetch(API.history + "?session_id=" + encodeURIComponent(SESSION) + "&all=1")
        .then(function (r) {
          if (!r.ok) {
            return r.text().then(function (raw) {
              var parsed = null;
              try { parsed = raw ? JSON.parse(raw) : null; } catch (_) {}
              log.logError("HTTP помилка history.php", {
                status: r.status,
                error: parsed && parsed.error ? parsed.error : null,
                body: parsed || raw,
              });
              throw new Error((parsed && parsed.error) ? parsed.error : ("HTTP " + r
                .status));
            });
          }
          return r.json();
        })
        .then(function (data) {
          var ms = (performance.now() - t0).toFixed(0);
          var hist = data.messages || [];

          log.sep();
          log.group("📜 Історія завантажена за " + ms + "мс");
          log.info("Повідомлень у базі: " + hist.length);

          if (hist.length === 0) {
            log.info("Порожня — показуємо привітання");
            log.end();
            addBot(CFG.greeting, []);
            showBadge(1);
          } else {
            var userCount = 0,
              botCount = 0,
              cardsTotal = 0;
            hist.forEach(function (m, i) {
              if (m.role === "user") {
                userCount++;
                var parsed = parseUserMsg(m.content);
                log.info("[" + i + "] 👤 user: " + parsed.text.slice(0, 80) + (parsed.text
                  .length > 80 ? "…" : "") + (parsed.reply ? " | 📦 " + parsed.reply
                  .name : ""));
                addUser(parsed.text, parsed.reply);
              } else if (m.role === "assistant") {
                botCount++;
                var prods = m.products || [];
                cardsTotal += prods.length;
                log.info("[" + i + "] 🤖 bot: " + m.content.slice(0, 80) + (m.content
                  .length > 80 ? "…" : "") + (prods.length ? " | 🛍 " + prods.length +
                  " карток" : ""));
                addBot(m.content, prods);
              }
            });
            log.ok("Відновлено: " + userCount + " user / " + botCount + " bot / " + cardsTotal +
              " карток товарів");
            log.end();
            // Після завантаження історії ставимо курсор на найновіше повідомлення
            scroll(true);
            unreadN = 0;
            scrollBtn.classList.remove("has-new", "on");
          }
        })
        .catch(function (e) {
          log.logError("Помилка завантаження історії", formatError(e));
          log.end && log.end();
          addBot(CFG.greeting, []);
          showBadge(1);
        });
    }

    // ── Відправка повідомлення ────────────────────────────
    function userWantsCallback(txt) {
      var t = (txt || "").toLowerCase();
      return /передзвон|перезвон|зворотн\w*\s*дзвін|залиш\w*\s+зворотн|хочу\s+залиш\w*\s+зворотн|залишити\s+заявку|звоніть\s+мені|менеджер\w*\s+передзвон|зв.?язати\w*\s+менеджер/i
        .test(t);
    }

    /** Відповідь бота вже пропонує форму (навіть якщо API не віддав show_callback_form). */
    function botOffersCallbackForm(text) {
      var t = (text || "").toLowerCase();
      return /залишити\s+заявку|leave\s+a\s+request|форма\s+[«"]?залишити|нижче\s+форма/i.test(t);
    }

    /** Показувати форму лише на новій відповіді (не при відновленні історії). */
    function shouldShowCallbackForm(userTxt, botTxt, apiFlag) {
      return !!apiFlag || userWantsCallback(userTxt || "") || botOffersCallbackForm(botTxt || "");
    }

    function send() {
      var txt = inp.value.trim();
      if (!txt || isLoad) return;
      inp.value = "";
      inp.style.height = "auto";

      // Збираємо payload до очищення стану
      var payload = { session_id: SESSION, message: txt };
      if (selectedProduct) {
        payload.selected_product_id = selectedProduct.id;
        payload.selected_product_name = selectedProduct.name;
      }

      var replySnap = selectedProduct; // зберігаємо до clearSelection
      addUser(txt, replySnap);
      clearSelection(); // скидаємо reply-bar після відправки

      setLoading(true);

      var t0 = performance.now();
      log.sep();
      log.group("📤 Запит #" + (++sendCount));
      log.info("Повідомлення: \"" + txt + "\"");
      log.info("session_id: " + SESSION);
      if (payload.selected_product_id) log.info("Обраний товар: " + payload
        .selected_product_name + " (" + payload.selected_product_id + ")");
      log.info("→ POST " + API.chat);

      post(API.chat, payload)
        .then(function (data) {
          var ms = (performance.now() - t0).toFixed(0);
          var products = data.products || [];

          log.ok("Відповідь отримана за " + ms + "мс");
          log.info("Текст: \"" + (data.message || "").slice(0, 120) + (data.message &&
              data.message.length > 120 ? "…" : "") + "\" (" + (data.message || "")
            .length + " симв.)");
          log.info("🛍 Товарів: " + products.length);

          logConsolePayload("chat.php", data);
          if (isBotErrorMessage(data.message)) {
            log.logError("Бот повернув повідомлення про помилку", {
              message: data.message,
              console: data.console || null,
            });
          }

          // Debug trace: ітерації, tool_calls, токени, вартість
          if (data.debug) logDebugTrace(data.debug);

          log.end();
          var showCb = shouldShowCallbackForm(txt, data.message, data.show_callback_form);
          addBot(data.message, products);
          if (showCb) showCallbackPanel();
          if (!isOpen) showBadge(++badgeN);
        })
        .catch(function (e) {
          var ms = (performance.now() - t0).toFixed(0);
          log.logError("Помилка chat.php після " + ms + "мс", formatError(e));
          log.end();
          addBot("Вибачте, сталася помилка. Спробуйте ще раз.", []);
        })
        .finally(function () { setLoading(false); });
    }

    var sendCount = 0;

    function setLoading(v) {
      isLoad = v;
      btn.disabled = v;
      v ? addTyping() : removeTyping();
      // Статус у хедері
      var statusEl = $("ltw-status");
      if (statusEl) {
        if (v) {
          statusEl.classList.add("is-typing");
          statusEl.innerHTML = "Набирає текст<span class='lt-st-dots'>...</span>";
        } else {
          statusEl.classList.remove("is-typing");
          statusEl.textContent = "Онлайн";
        }
      }
    }

    // ── Рендер повідомлень ────────────────────────────────
    function addUser(txt, reply) {
      var d = document.createElement("div");
      d.className = "lt-row u";
      var quoteHtml = reply ?
        "<div class='lt-quote'>📦 " + esc(reply.name) + "</div>" :
        "";
      d.innerHTML = "<div class='lt-ava'>👤</div><div class='lt-bub'>" + quoteHtml + esc(txt) +
        "</div>";
      msgs.appendChild(d);
      // Власне повідомлення користувача — завжди скролимо до кінця
      scroll(true);
    }

    // Парсить повідомлення з '[Товар в фокусі: ...]' — для відображення цитати з історії
    function parseUserMsg(content) {
      var m = content.match(/^\[Товар в фокусі: ([^|]+)\|[^\]]+\]\n([\s\S]*)$/);
      if (m) return { reply: { name: m[1].trim() }, text: m[2].trim() };
      return { reply: null, text: content };
    }

    function callbackFormHtml() {
      return [
        "<div class='lt-callback' data-callback-form='1'>",
        "<button type='button' class='lt-callback-close' aria-label='Закрити форму' title='Закрити'>×</button>",
        "<div class='lt-callback-hd'>📞 Зворотний дзвінок</div>",
        "<div class='lt-callback-desc'>Залиште ім'я та телефон — менеджер передзвонить.</div>",
        "<div class='lt-callback-fields'>",
        "<div class='lt-callback-field'><label>Ім'я</label>",
        "<input type='text' name='name' autocomplete='name' placeholder=\"Ваше ім'я\" maxlength='80'></div>",
        "<div class='lt-callback-field'><label>Телефон</label>",
        "<input type='tel' name='phone' autocomplete='tel' inputmode='tel' placeholder='+380 XX XXX XX XX' maxlength='20'></div>",
        "</div>",
        "<button type='button' class='lt-callback-submit'>Залишити заявку</button>",
        "<div class='lt-callback-status' aria-live='polite'></div>",
        "</div>",
      ].join("");
    }

    function showCallbackPanel() {
      if (!callbackPanel) return;
      if (!callbackPanel.querySelector("[data-callback-form='1']")) {
        callbackPanel.innerHTML = callbackFormHtml();
      }
      callbackPanel.classList.add("on");
      var nameIn = callbackPanel.querySelector("input[name='name']");
      if (nameIn) {
        setTimeout(function () { nameIn.focus(); }, 120);
      }
    }

    function hideCallbackPanel() {
      if (!callbackPanel) return;
      callbackPanel.classList.remove("on");
      callbackPanel.innerHTML = "";
    }

    function submitCallbackForm(formEl) {
      if (!formEl || formEl.classList.contains("is-done")) return;
      var nameIn = formEl.querySelector("input[name='name']");
      var phoneIn = formEl.querySelector("input[name='phone']");
      var statusEl = formEl.querySelector(".lt-callback-status");
      var btn = formEl.querySelector(".lt-callback-submit");
      var name = nameIn ? nameIn.value.trim() : "";
      var phone = phoneIn ? phoneIn.value.trim() : "";
      if (!name || !phone) {
        if (statusEl) {
          statusEl.className = "lt-callback-status err";
          statusEl.textContent = "Заповніть ім'я та телефон.";
        }
        return;
      }
      if (btn) btn.disabled = true;
      if (statusEl) {
        statusEl.className = "lt-callback-status";
        statusEl.textContent = "Надсилаємо…";
      }
      post(API.callback, {
        session_id: SESSION,
        name: name,
        phone: phone,
      }).then(function (data) {
        formEl.classList.add("is-done");
        if (statusEl) {
          statusEl.className = "lt-callback-status ok";
          statusEl.textContent = data.message ||
            "Дякуємо! Менеджер передзвонить найближчим часом.";
        }
        log.ok("Заявка на дзвінок надіслана");
        setTimeout(hideCallbackPanel, 4500);
      }).catch(function (e) {
        if (btn) btn.disabled = false;
        if (statusEl) {
          statusEl.className = "lt-callback-status err";
          statusEl.textContent = (e && e.message) ? e.message :
            "Не вдалося надіслати. Спробуйте ще раз або зателефонуйте 0 800 2000 70.";
        }
        log.logError("Помилка заявки на дзвінок", formatError(e));
      });
    }

    function addBot(text, products) {
      var wasNearBottom = isNearBottom();
      var d = document.createElement("div");
      d.style.cssText = "display:flex;flex-direction:column;gap:8px";
      var cards = (products && products.length) ?
        "<div class='lt-cards'>" + products.map(renderCard).join("") + "</div>" :
        "";
      d.innerHTML = [
        "<div class='lt-row b'>",
        "<div class='lt-ava'>🤖</div>",
        "<div class='lt-bub'>" + fmt(text) + "</div>",
        "</div>",
        cards,
      ].join("");
      msgs.appendChild(d);
      if (wasNearBottom) scroll(true);
      else bumpUnread();
    }

    function renderCard(p) {
      var img = p.image ?
        "<img class='lt-cimg' src='" + ea(p.image) + "' alt='" + ea(p.name) +
        "' loading='lazy' onerror=\"this.style.display='none'\">" :
        "<div class='lt-cno'>🔧</div>";
      var desc = p.description ? "<div class='lt-cd'>" + esc(p.description) + "</div>" : "";
      var old = p.old_price ? "<span class='lt-cop'>" + n(p.old_price) + " грн</span>" : "";
      var disc = p.discount_pct > 0 ? "<span class='lt-cdis'>−" + p.discount_pct + "%</span>" :
        "";
      var kit = p.is_kit ? "<div><span class='lt-ckit'>🎁 Комплект з АКБ</span></div>" : "";

      // Наявність
      var stock = (p.available && p.quantity > 3) ?
        "<span class='lt-cs y'>✓ В наявності</span>" :
        "<span class='lt-cs n'>✗ Немає в наявності</span>";

      // Клас для недоступних
      var cardCls = "lt-card" + (p.is_kit ? " lt-card-kit" : "") + (!(p.available && p.quantity >
        3) ? " lt-card-out" : "");

      // Кнопки
      var btnSel = "<button class='lt-cbtn-sel' data-id='" + ea(p.id) + "' data-name='" + ea(p
        .name) + "'>💬 Обрати</button>";
      var btnLink = p.url ?
        "<a class='lt-cbtn-link' href='" + ea(p.url) +
        "' target='_blank' rel='noopener noreferrer'>↗ На сайт</a>" :
        "";

      return [
        "<div class='" + cardCls + "'>",
        img,
        "<div class='lt-cbody'>",
        "<div>",
        kit,
        "<div class='lt-cn'>" + esc(p.name) + "</div>",
        desc,
        "</div>",
        "<div class='lt-cf'>",
        "<span class='lt-cp'>" + n(p.price) + " грн</span>",
        old, disc, stock,
        "</div>",
        "<div class='lt-cbtns'>",
        btnSel,
        btnLink,
        "</div>",
        "</div>",
        "</div>",
      ].join("");
    }

    function addTyping() {
      var wasNearBottom = isNearBottom();
      var d = document.createElement("div");
      d.className = "lt-row b lt-typing";
      d.id = "ltw-typing";
      d.innerHTML =
        "<div class='lt-ava'>🤖</div><div class='lt-bub'><div class='lt-dots'><div class='lt-dot'></div><div class='lt-dot'></div><div class='lt-dot'></div></div></div>";
      msgs.appendChild(d);
      if (wasNearBottom) scroll(true);
    }

    function removeTyping() {
      var t = document.getElementById("ltw-typing");
      if (t) t.parentNode
        .removeChild(t);
    }

    // ── Утиліти ──────────────────────────────────────────
    // force=true → скролимо завжди; без аргументу — лише якщо вже внизу.
    // Скрол робимо і синхронно (щоб наступний isNearBottom бачив актуальний
    // стан), і в raf (щоб догнати асинхронний рендер карток/зображень).
    function scroll(force) {
      if (!force && !isNearBottom()) return;
      msgs.scrollTop = msgs.scrollHeight;
      requestAnimationFrame(function () {
        msgs.scrollTop = msgs.scrollHeight;
        updateScrollBtn();
      });
    }

    function showBadge(n) {
      badge.textContent = n > 9 ? "9+" : String(n);
      badge.classList.add("on");
    }

    function hideBadge() {
      badge.classList.remove("on");
      badgeN = 0;
    }

    function $(id) { return document.getElementById(id); }

    function esc(s) {
      return String(s || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function ea(s) { return String(s || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

    function n(v) { return Number(v).toLocaleString("uk-UA"); }

    function fmt(s) {
      var html = esc(s)
        // ### / ## / # заголовки → жирний текст (без символів #)
        .replace(/^#{1,3} (.+)$/mg, "<strong>$1</strong>")
        // Рядки-параметри "- текст" → тільки курсив (знімаємо ** всередині)
        .replace(/^- (.+)$/mg, function (_, content) {
          var clean = content.replace(/\*\*(.+?)\*\*/g, "$1");
          return "<em>- " + clean + "</em>";
        })
        // **жирний** → bold (поза рядками-пунктами)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // *курсив* → italic (одинарні зірочки)
        .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");

      // Markdown посилання [text](url) — підтримка tel:/mailto:/https
      html = html.replace(
        /\[([^\]]+)\]\((tel:[^)\s]+|mailto:[^)\s]+|https?:\/\/[^)\s]+)\)/g,
        function (_, text, url) {
          // Захист від HTML-ін'єкції та javascript: протоколу
          if (/["<>]/.test(url)) return text;
          if (!/^(https?:|tel:|mailto:)/i.test(url)) return text;
          var attr = url.indexOf("http") === 0 ?
            " target='_blank' rel='noopener noreferrer'" :
            "";
          return "<a href='" + url + "'" + attr + ">" + text + "</a>";
        }
      );

      // Авто-tel для голих українських номерів 0 800 XXX XX (якщо ще не загорнуто)
      html = html.replace(
        /(?<!href=['"]tel:)(?<!>)\b(0\s?800\s?\d{3}\s?\d{2})\b(?![^<]*<\/a>)/g,
        function (m) {
          var clean = m.replace(/\s+/g, "");
          return "<a href='tel:" + clean + "'>" + m + "</a>";
        }
      );

      return html;
    }

    function post(url, data) {
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 90000); // 90с таймаут
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      }).then(function (r) {
        clearTimeout(timer);
        return r.text().then(function (raw) {
          var parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch (parseErr) {
            log.logError("Невалідний JSON у відповіді", {
              url: url,
              status: r.status,
              statusText: r.statusText,
              bodyPreview: (raw || "").slice(0, 500),
              parseError: formatError(parseErr),
            });
            throw new Error("Invalid JSON response (HTTP " + r.status + ")");
          }

          if (!r.ok) {
            log.logError("HTTP помилка API", {
              url: url,
              status: r.status,
              statusText: r.statusText,
              error: parsed && parsed.error ? parsed.error : null,
              console: parsed && parsed.console ? parsed.console : null,
              body: parsed || raw,
            });
            throw new Error((parsed && parsed.error) ? parsed.error : ("HTTP " + r
              .status));
          }

          return parsed || {};
        });
      }).catch(function (e) {
        clearTimeout(timer);
        if (e.name === "AbortError") {
          log.logError("Timeout API", { url: url, timeout_ms: 90000 });
          throw new Error("Timeout");
        }
        if (!(e && e.message && /HTTP |Invalid JSON|Timeout/.test(e.message))) {
          log.logError("Мережева помилка API", { url: url, error: formatError(e) });
        }
        throw e;
      });
    }
  }

  // Slater може інжектити скрипт у нестабільний момент DOM — робимо автоповтор без load/DOMContentLoaded.
  (function bootstrapWidget() {
    if (init()) return;
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (init() || tries >= 40) clearInterval(timer);
    }, 150);
  })();
})();
