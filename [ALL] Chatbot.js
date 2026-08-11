/**
 * Leader-mah Chatbot для Webflow
 * Версія: 2.0 (OpenAI Assistant + Webflow Integration)
 * Використання: Додайте в Custom Code (Before </body> tag)
 */

// Webflow push функція для правильної ініціалізації
window.Webflow ||= [];
window.Webflow.push(() => {
  'use strict';

  // Конфігурація чат-бота
  const CONFIG = {
    proxyUrl: 'https://zakupeace.biz.ua/webflow/bot/openai-assistant-proxy.php',
    position: 'bottom-right', // 'bottom-left' | 'bottom-right'
    autoOpen: false,
    welcomeMessage: 'Вітаю! Я помічник Leader-mah. Чим я можу вам допомогти? 🔧',
    colors: {
      primary: '#007cba',
      primaryHover: '#005a8b',
      secondary: '#f8f9fa',
      text: '#333333',
      background: '#ffffff'
    },
    // Webflow специфічні налаштування
    webflow: {
      respectExistingStyles: true,
      useWebflowAnimations: true,
      integrateWithForms: true
    }
  };

  // Стан чат-бота
  let chatbotState = {
    isOpen: false,
    threadId: null,
    isLoading: false,
    isInitialized: false
  };

  // Кеш елементів
  let elements = {};

  /**
   * Ініціалізація чат-бота після завантаження Webflow
   */
  function initChatbot() {
    if (chatbotState.isInitialized) return;

    console.log('🤖 Ініціалізація Leader Chatbot для Webflow...');

    // Перевіряємо чи Webflow готовий
    if (typeof Webflow === 'undefined') {
      console.warn('⚠️ Webflow не знайдено, використовуємо стандартну ініціалізацію');
    }

    // Створюємо чат-бот
    createChatbotStyles();
    createChatbotHTML();
    initEventListeners();

    chatbotState.isInitialized = true;
    console.log('✅ Leader Chatbot ініціалізовано');

    // Інтеграція з Webflow формами (якщо потрібно)
    if (CONFIG.webflow.integrateWithForms) {
      integrateWithWebflowForms();
    }
  }

  /**
   * Створення CSS стилів з урахуванням Webflow
   */
  function createChatbotStyles() {
    // Перевіряємо чи стилі вже додані
    if (document.getElementById('leader-chatbot-styles')) return;

    const css = `
        /* Leader Chatbot Styles для Webflow */
        .leader-chatbot-trigger {
            position: fixed !important;
            ${CONFIG.position.includes('right') ? 'right: 20px !important;' : 'left: 20px !important;'}
            bottom: 20px !important;
            width: 60px !important;
            height: 60px !important;
            background: ${CONFIG.colors.primary} !important;
            border-radius: 50% !important;
            border: none !important;
            cursor: pointer !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s ease !important;
            color: white !important;
            font-size: 24px !important;
            font-family: inherit !important;
            outline: none !important;
        }
        
        .leader-chatbot-trigger:hover {
            background: ${CONFIG.colors.primaryHover} !important;
            transform: scale(1.1) !important;
        }
        
        .leader-chatbot-trigger:focus {
            outline: 2px solid ${CONFIG.colors.primary} !important;
            outline-offset: 2px !important;
        }
        
        .leader-chatbot-window {
            position: fixed !important;
            ${CONFIG.position.includes('right') ? 'right: 20px !important;' : 'left: 20px !important;'}
            bottom: 100px !important;
            width: 350px !important;
            height: 500px !important;
            max-height: calc(100vh - 140px) !important;
            background: ${CONFIG.colors.background} !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
            z-index: 999998 !important;
            display: none !important;
            flex-direction: column !important;
            overflow: hidden !important;
            font-family: inherit !important;
            opacity: 0 !important;
            transform: translateY(20px) scale(0.95) !important;
            transition: all 0.3s ease !important;
        }
        
        .leader-chatbot-window.show {
            display: flex !important;
            opacity: 1 !important;
            transform: translateY(0) scale(1) !important;
        }
        
        .leader-chatbot-header {
            background: ${CONFIG.colors.primary} !important;
            color: white !important;
            padding: 16px !important;
            font-weight: 600 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-size: 16px !important;
        }
        
        .leader-chatbot-close {
            background: none !important;
            border: none !important;
            color: white !important;
            font-size: 20px !important;
            cursor: pointer !important;
            padding: 4px !important;
            width: 28px !important;
            height: 28px !important;
            border-radius: 4px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: background 0.2s ease !important;
        }
        
        .leader-chatbot-close:hover {
            background: rgba(255,255,255,0.1) !important;
        }
        
        .leader-chatbot-messages {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 16px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            scroll-behavior: smooth !important;
        }
        
        .leader-chatbot-messages::-webkit-scrollbar {
            width: 6px !important;
        }
        
        .leader-chatbot-messages::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
        }
        
        .leader-chatbot-messages::-webkit-scrollbar-thumb {
            background: #c1c1c1 !important;
            border-radius: 3px !important;
        }
        
        .leader-chatbot-message {
            max-width: 80% !important;
            padding: 10px 14px !important;
            border-radius: 18px !important;
            word-wrap: break-word !important;
            line-height: 1.4 !important;
            font-size: 14px !important;
            animation: messageSlideIn 0.3s ease !important;
        }
        
        @keyframes messageSlideIn {
            from {
                opacity: 0 !important;
                transform: translateY(10px) !important;
            }
            to {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        }
        
        .leader-chatbot-message.user {
            background: ${CONFIG.colors.primary} !important;
            color: white !important;
            align-self: flex-end !important;
            margin-left: auto !important;
        }
        
        .leader-chatbot-message.bot {
            background: ${CONFIG.colors.secondary} !important;
            color: ${CONFIG.colors.text} !important;
            align-self: flex-start !important;
        }
        
        .leader-chatbot-input-container {
            padding: 16px !important;
            border-top: 1px solid #eee !important;
            display: flex !important;
            gap: 8px !important;
            background: ${CONFIG.colors.background} !important;
        }
        
        .leader-chatbot-input {
            flex: 1 !important;
            padding: 10px 14px !important;
            border: 1px solid #ddd !important;
            border-radius: 20px !important;
            outline: none !important;
            font-size: 14px !important;
            font-family: inherit !important;
            background: white !important;
            color: ${CONFIG.colors.text} !important;
            transition: border-color 0.2s ease !important;
        }
        
        .leader-chatbot-input:focus {
            border-color: ${CONFIG.colors.primary} !important;
            box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.1) !important;
        }
        
        .leader-chatbot-input::placeholder {
            color: #999 !important;
        }
        
        .leader-chatbot-send {
            background: ${CONFIG.colors.primary} !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 16px !important;
            transition: all 0.2s ease !important;
            outline: none !important;
        }
        
        .leader-chatbot-send:hover:not(:disabled) {
            background: ${CONFIG.colors.primaryHover} !important;
            transform: scale(1.05) !important;
        }
        
        .leader-chatbot-send:disabled {
            background: #ccc !important;
            cursor: not-allowed !important;
            transform: none !important;
        }
        
        .leader-chatbot-loading {
            display: flex !important;
            gap: 4px !important;
            padding: 10px 14px !important;
            align-self: flex-start !important;
        }
        
        .leader-chatbot-loading div {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            background: #ccc !important;
            animation: leader-chatbot-pulse 1.4s ease-in-out infinite both !important;
        }
        
        .leader-chatbot-loading div:nth-child(1) { animation-delay: -0.32s !important; }
        .leader-chatbot-loading div:nth-child(2) { animation-delay: -0.16s !important; }
        
        @keyframes leader-chatbot-pulse {
            0%, 80%, 100% { 
                transform: scale(0) !important; 
                opacity: 0.5 !important;
            }
            40% { 
                transform: scale(1) !important; 
                opacity: 1 !important;
            }
        }
        
        /* Мобільна адаптивність для Webflow */
        @media (max-width: 767px) {
            .leader-chatbot-window {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-height: 100% !important;
                border-radius: 0 !important;
            }
            
            .leader-chatbot-trigger {
                right: 15px !important;
                bottom: 15px !important;
                width: 55px !important;
                height: 55px !important;
                font-size: 22px !important;
            }
        }
        
        /* Адаптація під темну тему Webflow */
        @media (prefers-color-scheme: dark) {
            .leader-chatbot-window {
                background: #1a1a1a !important;
            }
            
            .leader-chatbot-message.bot {
                background: #2a2a2a !important;
                color: #ffffff !important;
            }
            
            .leader-chatbot-input {
                background: #2a2a2a !important;
                color: #ffffff !important;
                border-color: #444 !important;
            }
            
            .leader-chatbot-input::placeholder {
                color: #aaa !important;
            }
        }
        `;

    const style = document.createElement('style');
    style.id = 'leader-chatbot-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Створення HTML структури чат-бота
   */
  function createChatbotHTML() {
    // Перевіряємо чи HTML вже створений
    if (document.getElementById('leader-chatbot-trigger')) return;

    // Створюємо кнопку виклику
    const trigger = document.createElement('button');
    trigger.id = 'leader-chatbot-trigger';
    trigger.className = 'leader-chatbot-trigger';
    trigger.innerHTML = '💬';
    trigger.setAttribute('aria-label', 'Відкрити чат з помічником Leader-mah');
    trigger.setAttribute('type', 'button');

    // Створюємо вікно чату
    const chatWindow = document.createElement('div');
    chatWindow.id = 'leader-chatbot-window';
    chatWindow.className = 'leader-chatbot-window';
    chatWindow.setAttribute('role', 'dialog');
    chatWindow.setAttribute('aria-labelledby', 'chatbot-header-title');

    chatWindow.innerHTML = `
            <div class="leader-chatbot-header">
                <span id="chatbot-header-title">Leader-mah Помічник</span>
                <button class="leader-chatbot-close" aria-label="Закрити чат" type="button">×</button>
            </div>
            <div class="leader-chatbot-messages" role="log" aria-live="polite" aria-label="Повідомлення чату"></div>
            <div class="leader-chatbot-input-container">
                <input 
                    type="text" 
                    class="leader-chatbot-input" 
                    placeholder="Напишіть ваше запитання..." 
                    maxlength="500"
                    aria-label="Введіть повідомлення"
                    autocomplete="off"
                >
                <button class="leader-chatbot-send" aria-label="Відправити повідомлення" type="button">➤</button>
            </div>
        `;

    // Додаємо елементи до DOM
    document.body.appendChild(trigger);
    document.body.appendChild(chatWindow);

    // Зберігаємо посилання на елементи
    elements = {
      trigger: trigger,
      window: chatWindow,
      messages: chatWindow.querySelector('.leader-chatbot-messages'),
      input: chatWindow.querySelector('.leader-chatbot-input'),
      send: chatWindow.querySelector('.leader-chatbot-send'),
      close: chatWindow.querySelector('.leader-chatbot-close')
    };
  }

  /**
   * Ініціалізація обробників подій
   */
  function initEventListeners() {
    if (!elements.trigger) return;

    // Основні обробники
    elements.trigger.addEventListener('click', toggleChat);
    elements.close.addEventListener('click', closeChat);
    elements.send.addEventListener('click', sendMessage);

    // Обробка Enter в полі вводу
    elements.input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Обробка Escape для закриття
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && chatbotState.isOpen) {
        closeChat();
      }
    });

    // Клік поза вікном для закриття (опціонально)
    document.addEventListener('click', function (e) {
      if (chatbotState.isOpen &&
        !elements.window.contains(e.target) &&
        !elements.trigger.contains(e.target)) {
        // Можна розкоментувати для автозакриття
        // closeChat();
      }
    });
  }

  /**
   * Перемикання стану чату
   */
  function toggleChat() {
    if (chatbotState.isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  /**
   * Відкриття чату з Webflow анімацією
   */
  function openChat() {
    if (chatbotState.isOpen) return;

    chatbotState.isOpen = true;
    elements.window.style.display = 'flex';

    // Використовуємо requestAnimationFrame для плавної анімації
    requestAnimationFrame(() => {
      elements.window.classList.add('show');
    });

    // Фокус на поле вводу
    setTimeout(() => {
      elements.input.focus();
    }, 300);

    // Показуємо привітальне повідомлення
    if (elements.messages.children.length === 0) {
      addMessage('bot', CONFIG.welcomeMessage);
    }

    // Інтеграція з Webflow аналітикою (якщо потрібно)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'chatbot_opened', {
        event_category: 'engagement',
        event_label: 'leader_chatbot'
      });
    }
  }

  /**
   * Закриття чату з анімацією
   */
  function closeChat() {
    if (!chatbotState.isOpen) return;

    chatbotState.isOpen = false;
    elements.window.classList.remove('show');

    // Приховуємо після анімації
    setTimeout(() => {
      if (!chatbotState.isOpen) {
        elements.window.style.display = 'none';
      }
    }, 300);

    // Повертаємо фокус на тригер
    elements.trigger.focus();
  }

  /**
   * Відправка повідомлення з інтеграцією Webflow
   */
  async function sendMessage() {
    const message = elements.input.value.trim();
    if (!message || chatbotState.isLoading) return;

    // Додаємо повідомлення користувача
    addMessage('user', message);
    elements.input.value = '';

    // Показуємо індикатор завантаження
    showLoading();

    try {
      // Відправляємо запит до OpenAI Assistant
      const response = await fetch(CONFIG.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          message: message,
          thread_id: chatbotState.threadId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      // Зберігаємо thread ID для подальших запитів
      if (data.thread_id) {
        chatbotState.threadId = data.thread_id;
      }

      // Додаємо відповідь бота
      addMessage('bot', data.message);

      // Webflow аналітика
      if (typeof gtag !== 'undefined') {
        gtag('event', 'chatbot_message_sent', {
          event_category: 'engagement',
          event_label: 'leader_chatbot'
        });
      }

    } catch (error) {
      console.error('Leader Chatbot error:', error);
      addMessage('bot',
        'Вибачте, виникла помилка. Спробуйте ще раз або зверніться до нашої служби підтримки за телефоном 0 800 2000 70 📞'
      );

      // Webflow аналітика помилок
      if (typeof gtag !== 'undefined') {
        gtag('event', 'chatbot_error', {
          event_category: 'error',
          event_label: error.message
        });
      }
    } finally {
      hideLoading();
    }
  }

  /**
   * Додавання повідомлення до чату
   */
  function addMessage(sender, text) {
    const message = document.createElement('div');
    message.className = `leader-chatbot-message ${sender}`;
    message.textContent = text;
    message.setAttribute('role', sender === 'bot' ? 'status' : 'text');

    elements.messages.appendChild(message);

    // Плавне прокручування до останнього повідомлення
    requestAnimationFrame(() => {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    });
  }

  /**
   * Показ індикатора завантаження
   */
  function showLoading() {
    chatbotState.isLoading = true;
    elements.send.disabled = true;
    elements.input.disabled = true;

    const loading = document.createElement('div');
    loading.className = 'leader-chatbot-loading';
    loading.innerHTML = '<div></div><div></div><div></div>';
    loading.setAttribute('aria-label', 'Завантаження відповіді');

    elements.messages.appendChild(loading);

    requestAnimationFrame(() => {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    });
  }

  /**
   * Приховування індикатора завантаження
   */
  function hideLoading() {
    chatbotState.isLoading = false;
    elements.send.disabled = false;
    elements.input.disabled = false;

    const loading = elements.messages.querySelector('.leader-chatbot-loading');
    if (loading) {
      loading.remove();
    }
  }

  /**
   * Інтеграція з Webflow формами
   */
  function integrateWithWebflowForms() {
    // Знаходимо всі Webflow форми
    const webflowForms = document.querySelectorAll('form[data-name]');

    webflowForms.forEach(form => {
      // Додаємо кнопку "Потрібна допомога?" до форм
      const helpButton = document.createElement('button');
      helpButton.type = 'button';
      helpButton.textContent = '💬 Потрібна допомога?';
      helpButton.style.cssText = `
                background: ${CONFIG.colors.primary};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-top: 10px;
                transition: background 0.2s ease;
            `;

      helpButton.addEventListener('click', () => {
        openChat();
        setTimeout(() => {
          elements.input.value = 'Мені потрібна допомога з формою на сайті';
          elements.input.focus();
        }, 500);
      });

      helpButton.addEventListener('mouseenter', () => {
        helpButton.style.background = CONFIG.colors.primaryHover;
      });

      helpButton.addEventListener('mouseleave', () => {
        helpButton.style.background = CONFIG.colors.primary;
      });

      form.appendChild(helpButton);
    });
  }

  /**
   * Публічний API для Webflow
   */
  window.LeaderChatbot = {
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
    sendMessage: function (text) {
      if (!chatbotState.isInitialized) {
        console.warn('Chatbot not initialized yet');
        return;
      }
      elements.input.value = text;
      sendMessage();
    },
    isOpen: () => chatbotState.isOpen,
    isInitialized: () => chatbotState.isInitialized
  };

  // Ініціалізуємо чат-бот
  initChatbot();

  console.log('✅ Leader Chatbot для Webflow готовий до роботи');
});
