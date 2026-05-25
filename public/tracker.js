/* Скупка24 — собственный трекер посетителей.
   Подключается на сайте через <script async src="/tracker.js"></script>
   Глобальные функции:
     window.skypkaTrack(name, data)
     window.skypkaConvert({type, phone, amount, ...})
   Запускается только после согласия cookie (по дефолту согласие подразумевается, как и для Метрики). */
(function () {
  'use strict';
  if (window.__skypkaAn) return;
  window.__skypkaAn = true;

  var API = 'https://functions.poehali.dev/4a685ed3-dad8-47ee-be16-48c6db749fd2';
  var HEARTBEAT_MS = 15000;
  var SCROLL_MARKS = [25, 50, 75, 100];
  var SENT_SCROLL = {};
  var SENT_FORM_START = {};
  var SAFE_FORM_RE = /(password|pwd|cvv|cvc|card|pan|secret)/i;

  // ---------- ID-ы ----------
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  var visitorId;
  try {
    visitorId = localStorage.getItem('sk_vid');
    if (!visitorId) { visitorId = uid(); localStorage.setItem('sk_vid', visitorId); }
  } catch (e) { visitorId = uid(); }

  var sessionId;
  try {
    sessionId = sessionStorage.getItem('sk_sid');
    if (!sessionId) { sessionId = uid(); sessionStorage.setItem('sk_sid', sessionId); }
  } catch (e) { sessionId = uid(); }

  var isNewSession = false;
  try { isNewSession = !sessionStorage.getItem('sk_sid_started'); if (isNewSession) sessionStorage.setItem('sk_sid_started', '1'); }
  catch (e) { isNewSession = true; }

  // ---------- Отправка ----------
  function send(payload, opts) {
    opts = opts || {};
    var url = API + '?action=' + (opts.action || 'track');
    var body = JSON.stringify(payload);
    try {
      if (opts.beacon && navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        credentials: 'omit',
      }).catch(function () { /* silent */ });
    } catch (e) { /* silent */ }
  }

  function track(event_type, event_data, extra) {
    var payload = {
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: event_type,
      page_url: location.href,
      page_title: document.title,
      referrer: document.referrer || null,
      event_data: event_data || {},
    };
    if (extra) for (var k in extra) payload[k] = extra[k];
    send(payload, { beacon: !!(extra && extra.beacon) });
  }

  window.skypkaTrack = function (name, data) {
    if (typeof name !== 'string' || !name) return;
    track(name, data || {});
  };

  window.skypkaConvert = function (info) {
    info = info || {};
    var payload = {
      visitor_id: visitorId,
      session_id: sessionId,
      type: String(info.type || info.form_type || 'unknown'),
      phone: info.phone || null,
      amount: info.amount || null,
      form_data: info,
    };
    send(payload, { action: 'convert' });
    // Дублируем как form_submit
    track('form_submit', { type: payload.type, amount: payload.amount || null });
  };

  // ---------- Старт сессии и pageview ----------
  if (isNewSession) {
    track('session_start');
  }
  track('pageview');

  // SPA: следим за изменением URL
  var lastUrl = location.href;
  function checkUrl() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      SENT_SCROLL = {};
      setTimeout(function () { track('pageview'); }, 50);
    }
  }
  setInterval(checkUrl, 500);
  try {
    var origPush = history.pushState;
    history.pushState = function () { var r = origPush.apply(this, arguments); checkUrl(); return r; };
    window.addEventListener('popstate', checkUrl);
  } catch (e) { /* noop */ }

  // ---------- Heartbeat ----------
  var hbTimer = null;
  function startHeartbeat() {
    if (hbTimer) return;
    hbTimer = setInterval(function () {
      if (document.visibilityState === 'visible') track('heartbeat');
    }, HEARTBEAT_MS);
  }
  function stopHeartbeat() {
    if (hbTimer) { clearInterval(hbTimer); hbTimer = null; }
  }
  startHeartbeat();
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { track('heartbeat'); startHeartbeat(); }
    else { stopHeartbeat(); }
  });

  // ---------- Клики по контактам ----------
  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.tagName === 'A' && t.href) {
        var href = t.href.toLowerCase();
        if (href.indexOf('tel:') === 0) {
          track('phone_click', { href: t.href });
          return;
        }
        if (href.indexOf('wa.me') >= 0 || href.indexOf('whatsapp') >= 0) {
          track('whatsapp_click', { href: t.href });
          return;
        }
        if (href.indexOf('t.me') >= 0 || href.indexOf('telegram') >= 0) {
          track('telegram_click', { href: t.href });
          return;
        }
      }
      t = t.parentNode;
    }
  }, { capture: true });

  // ---------- Формы ----------
  function isSafeForm(form) {
    // Не трекаем формы где есть password/card
    if (!form || !form.elements) return true;
    for (var i = 0; i < form.elements.length; i++) {
      var el = form.elements[i];
      if (el.name && SAFE_FORM_RE.test(el.name)) return false;
      if (el.type === 'password') return false;
    }
    return true;
  }

  function formKey(form) {
    return form.getAttribute('data-form-name') || form.id || form.action || form.name || ('form_' + Math.random().toString(36).slice(2, 6));
  }

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT')) return;
    var form = el.closest && el.closest('form');
    if (!form || !isSafeForm(form)) return;
    var key = formKey(form);
    if (SENT_FORM_START[key]) return;
    SENT_FORM_START[key] = 1;
    track('form_start', { form: key });
  }, true);

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    if (!isSafeForm(form)) return;
    var key = formKey(form);
    var data = {};
    try {
      var fd = new FormData(form);
      fd.forEach(function (v, k) {
        if (SAFE_FORM_RE.test(k)) return;
        if (typeof v === 'string' && v.length < 200) data[k] = v;
      });
    } catch (er) { /* noop */ }
    track('form_submit', { form: key, fields: Object.keys(data) });
  }, true);

  // ---------- Глубина скролла ----------
  function onScroll() {
    var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    if (h <= 0) return;
    var pct = Math.round((window.scrollY / h) * 100);
    SCROLL_MARKS.forEach(function (m) {
      if (pct >= m && !SENT_SCROLL[m]) {
        SENT_SCROLL[m] = 1;
        track('scroll_depth', { depth: m });
      }
    });
  }
  var scrollTimer = null;
  window.addEventListener('scroll', function () {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(onScroll, 200);
  }, { passive: true });

  // ---------- Завершение сессии ----------
  window.addEventListener('beforeunload', function () {
    track('session_end', null, { beacon: true });
  });
})();
