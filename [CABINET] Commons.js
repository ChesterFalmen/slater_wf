/**
 * LEADER — спільні утиліти для інтеграції Webflow ↔ PHP API.
 *
 * ═══ КУДИ ПІДКЛЮЧИТИ ═══
 * Webflow → Project Settings → Custom Code → Before </body>
 * (на ВСІХ сторінках магазину, ПЕРШИМ перед іншими leader-*.js)
 *
 * ═══ НАЛАШТУВАННЯ (опційно, перед цим скриптом) ═══
 * <script>
 *   window.LEADER_API_BASE = 'https://zakupeace.biz.ua/webflow/users/api';
 *   window.LEADER_CABINET_BASE = '/cabinet';  // mount path Webflow Cloud
 * </script>
 */
(function (global) {
  'use strict';

  var API_BASE =
    global.LEADER_API_BASE ||
    'https://zakupeace.biz.ua/webflow/users/api';

  var CABINET_BASE = (global.LEADER_CABINET_BASE || '/cabinet').replace(/\/$/, '');

  var TOKEN_KEY = 'access_token';
  var REFRESH_KEY = 'refresh_token';
  var EXPIRES_KEY = 'token_expires_at';

  function getToken() {
    return (localStorage.getItem(TOKEN_KEY) || '').trim();
  }

  function getRefreshToken() {
    return (localStorage.getItem(REFRESH_KEY) || '').trim();
  }

  function isAuthenticated() {
    return !!getToken();
  }

  function setTokens(data) {
    if (!data || !data.token) return;
    localStorage.setItem(TOKEN_KEY, data.token.trim());
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_KEY, data.refresh_token.trim());
    }
    if (data.expires_at) {
      localStorage.setItem(EXPIRES_KEY, data.expires_at);
    }
  }

  function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    localStorage.removeItem('user');
  }

  function refreshAccessToken() {
    var refreshToken = getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('no refresh token'));
    }

    return fetch(API_BASE + '/auth/refresh-token.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      .then(function (response) {
        return response.json();
      })
      .then(function (body) {
        if (!body.success || !body.data) {
          throw new Error('refresh failed');
        }
        setTokens(body.data);
        return body.data.token;
      });
  }

  function apiFetch(path, options) {
    options = options || {};
    var token = getToken();
    var headers = Object.assign({ Accept: 'application/json' },
      options.headers || {}
    );
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    return fetch(API_BASE + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body || null,
      cache: 'no-store',
    }).then(function (response) {
      return response.json().then(function (body) {
        return { response: response, body: body };
      });
    });
  }

  function apiGet(path) {
    return apiFetch(path, { method: 'GET' }).then(function (result) {
      if (result.response.status === 401 && getRefreshToken()) {
        return refreshAccessToken().then(function () {
          return apiFetch(path, { method: 'GET' });
        });
      }
      return result;
    });
  }

  function apiGetData(path) {
    return apiGet(path).then(function (result) {
      if (!result.body || !result.body.success || !result.body.data) {
        return null;
      }
      return result.body.data;
    });
  }

  function cabinetUrl(path) {
    var p = path || '';
    if (p && p.charAt(0) !== '/') p = '/' + p;
    return CABINET_BASE + p;
  }

  global.LeaderApi = {
    API_BASE: API_BASE,
    CABINET_BASE: CABINET_BASE,
    getToken: getToken,
    getRefreshToken: getRefreshToken,
    isAuthenticated: isAuthenticated,
    setTokens: setTokens,
    clearTokens: clearTokens,
    refreshAccessToken: refreshAccessToken,
    apiFetch: apiFetch,
    apiGet: apiGet,
    apiGetData: apiGetData,
    cabinetUrl: cabinetUrl,
  };
})(window);
