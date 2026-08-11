/**
 * LEADER — автозаповнення форми оформлення замовлення (Webflow checkout).
 *
 * ═══ КУДИ ПІДКЛЮЧИТИ ═══
 * Webflow → сторінка CHECKOUT → Page Settings → Custom Code → Before </body>
 * (рекомендовано ПІСЛЯ leader-common.js з Site Settings)
 *
 * Потрібна авторизація в кабінеті (/cabinet/login) — токени в localStorage.
 *
 * Поля форми (id з checkout leader-tools.com.ua):
 *   #name_form, #phone_form, #city_form, #index_form, #adress_dost
 *   Delivery: #NovaPoshta | #UkrPoshta
 *   Адресна доставка: #address-delivery-toggle + #address-delivery-wrapper-field
 *
 * Подія: leader:checkout-filled (detail — дані з get-checkout-data.php)
 */
(function () {
  'use strict';

  var api = window.LeaderApi;
  var API_BASE = api ? api.API_BASE : (window.LEADER_API_BASE ||
    'https://zakupeace.biz.ua/webflow/users/api');

  var PROVIDER_RADIO = {
    novaposhta: 'NovaPoshta',
    ukrposhta: 'UkrPoshta',
    NovaPoshta: 'NovaPoshta',
    UkrPoshta: 'UkrPoshta',
  };

  var FILLED_FLAG = 'data-leader-autofill';

  function getToken() {
    return api ? api.getToken() : (localStorage.getItem('access_token') || '').trim();
  }

  function getRefreshToken() {
    return api ? api.getRefreshToken() : (localStorage.getItem('refresh_token') || '').trim();
  }

  function $(id) {
    return document.getElementById(id);
  }

  function dispatchInput(el) {
    if (!el) return;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function setInputValue(el, value) {
    if (!el || value == null || value === '') return false;
    if (el.value === String(value)) return false;
    el.value = value;
    el.setAttribute(FILLED_FLAG, '1');
    dispatchInput(el);
    return true;
  }

  function setWebflowRadio(input) {
    if (!input) return false;
    var name = input.name;
    var group = name ?
      document.querySelectorAll('input[type="radio"][name="' + name + '"]') : [input];

    group.forEach(function (radio) {
      var isTarget = radio === input;
      radio.checked = isTarget;
      var label = radio.closest('label.w-radio');
      var visual = label ? label.querySelector('.w-radio-input') : null;
      if (visual) {
        if (isTarget) {
          visual.classList.add('w--redirected-checked');
        } else {
          visual.classList.remove('w--redirected-checked');
        }
      }
    });

    input.setAttribute(FILLED_FLAG, '1');
    dispatchInput(input);
    return true;
  }

  function setDeliveryProvider(provider) {
    var key = provider ? String(provider).toLowerCase() : '';
    var value = PROVIDER_RADIO[provider] || PROVIDER_RADIO[key];
    if (!value) return false;
    var input = document.getElementById(value);
    if (!input) {
      input = document.querySelector(
        'input[name="Delivery"][value="' + value + '"]'
      );
    }
    if (!input) return false;
    return setWebflowRadio(input);
  }

  function setAddressDeliveryMode(enabled, streetAddress) {
    var toggle = $('address-delivery-toggle');
    var wrapper = $('address-delivery-wrapper-field');
    var addressInput = $('adress_dost');

    if (!toggle) return false;

    if (enabled && streetAddress) {
      if (!toggle.checked) {
        toggle.checked = true;
        dispatchInput(toggle);
      }
      if (wrapper) {
        wrapper.style.display = '';
      }
      setInputValue(addressInput, streetAddress);
      return true;
    }

    return false;
  }

  function formatPhoneDisplay(phone) {
    if (!phone) return '';
    var digits = String(phone).replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('380') === 0) {
      return (
        '+38 ' +
        digits.slice(2, 5) +
        ' ' +
        digits.slice(5, 8) +
        ' ' +
        digits.slice(8, 10) +
        ' ' +
        digits.slice(10, 12)
      );
    }
    if (digits.length === 10 && digits.indexOf('0') === 0) {
      return (
        '+38 ' +
        digits.slice(1, 4) +
        ' ' +
        digits.slice(4, 7) +
        ' ' +
        digits.slice(7, 9) +
        ' ' +
        digits.slice(9, 11)
      );
    }
    return phone;
  }

  function buildFullName(customer) {
    if (!customer) return '';
    if (customer.full_name && String(customer.full_name).trim()) {
      return String(customer.full_name).trim();
    }
    var parts = [customer.last_name, customer.first_name, customer.middle_name].filter(
      function (p) {
        return p && String(p).trim();
      }
    );
    return parts.join(' ').trim();
  }

  function isCheckoutFormReady() {
    return !!($('name_form') || $('phone_form'));
  }

  function applyCheckoutData(data) {
    if (!data) return false;
    var customer = data.customer || {};
    var address = data.default_address || null;
    var changed = false;

    changed =
      setInputValue($('name_form'), buildFullName(customer)) || changed;
    changed =
      setInputValue($('phone_form'), formatPhoneDisplay(customer.phone)) ||
      changed;

    if (address) {
      var provider = data.delivery_provider || address.provider;
      changed = setDeliveryProvider(provider) || changed;

      changed = setInputValue($('city_form'), address.city_name) || changed;

      var branchOrIndex =
        address.branch_number ||
        address.branch_name ||
        extractBranchFromText(data.delivery_text);
      changed = setInputValue($('index_form'), branchOrIndex) || changed;

      if (address.address && String(address.address).trim()) {
        changed =
          setAddressDeliveryMode(true, String(address.address).trim()) || changed;
      } else if (address.delivery_type === 'courier' && data.delivery_text) {
        changed =
          setAddressDeliveryMode(true, data.delivery_text) || changed;
      }
    }

    if (changed) {
      document.dispatchEvent(
        new CustomEvent('leader:checkout-filled', { detail: data })
      );
    }

    return changed;
  }

  function extractBranchFromText(text) {
    if (!text) return '';
    var m = String(text).match(/(?:відділення|отделение|№)\s*[:#]?\s*(\d+)/i);
    return m ? m[1] : '';
  }

  function fetchCheckoutData(token) {
    return fetch(API_BASE + '/profile/get-checkout-data.php', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }).then(function (response) {
      return response.json().then(function (body) {
        return { response: response, body: body };
      });
    });
  }

  function refreshAndRetry() {
    if (api) {
      return api.refreshAccessToken().then(function (newToken) {
        return fetchCheckoutData(newToken);
      });
    }

    var refreshToken = getRefreshToken();
    if (!refreshToken) return Promise.reject(new Error('no refresh token'));

    return fetch(API_BASE + '/auth/refresh-token.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (!data.success || !data.data) {
          throw new Error('refresh failed');
        }
        if (api) {
          api.setTokens(data.data);
        } else {
          localStorage.setItem('access_token', data.data.token);
          localStorage.setItem('refresh_token', data.data.refresh_token);
          if (data.data.expires_at) {
            localStorage.setItem('token_expires_at', data.data.expires_at);
          }
        }
        return data.data.token;
      })
      .then(function (newToken) {
        return fetchCheckoutData(newToken);
      });
  }

  function loadCheckoutData() {
    var token = getToken();
    if (!token) return Promise.resolve(null);

    if (api) {
      return api.apiGetData('/profile/get-checkout-data.php');
    }

    return fetchCheckoutData(token)
      .then(function (result) {
        if (result.response.status === 401) {
          return refreshAndRetry();
        }
        return result;
      })
      .then(function (result) {
        if (!result) return null;
        if (result.body && result.body.success && result.body.data) {
          return result.body.data;
        }
        if (!result.body && result.customer) {
          return result;
        }
        if (!result.body || !result.body.success || !result.body.data) {
          return null;
        }
        return result.body.data;
      });
  }

  function waitForCheckoutForm(maxMs) {
    maxMs = maxMs || 8000;
    return new Promise(function (resolve) {
      if (isCheckoutFormReady()) {
        resolve(true);
        return;
      }
      var start = Date.now();
      var observer = new MutationObserver(function () {
        if (isCheckoutFormReady()) {
          observer.disconnect();
          resolve(true);
        } else if (Date.now() - start > maxMs) {
          observer.disconnect();
          resolve(false);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () {
        observer.disconnect();
        resolve(isCheckoutFormReady());
      }, maxMs);
    });
  }

  function autofillCheckout() {
    var token = getToken();
    if (!token) return;

    var checkoutData = null;

    loadCheckoutData()
      .then(function (data) {
        checkoutData = data;
        if (!checkoutData) return;
        return waitForCheckoutForm();
      })
      .then(function (ready) {
        if (!checkoutData || !ready) return;
        applyCheckoutData(checkoutData);
      })
      .catch(function (error) {
        console.warn('[Leader checkout autofill]', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autofillCheckout);
  } else {
    autofillCheckout();
  }
})();
