/**
 * Marasil WhatsApp Floating Widget
 * Seamless, lightweight, zero-dependency WhatsApp Web chat bubble.
 */
(function () {
  'use strict';

  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var phone = (currentScript && currentScript.getAttribute('data-phone')) || '';
  var brand = (currentScript && currentScript.getAttribute('data-brand')) || 'خدمة العملاء';
  var greeting = (currentScript && currentScript.getAttribute('data-greeting')) || 'مرحباً بك! 👋 كيف يمكننا مساعدتك اليوم؟';
  var color = (currentScript && currentScript.getAttribute('data-color')) || '#25D366';
  var position = (currentScript && currentScript.getAttribute('data-position')) || 'bottom-right';

  if (!phone) return;

  var cleanPhone = phone.replace(/[^\d+]/g, '').replace('+', '');

  // Inject Styles
  var style = document.createElement('style');
  style.textContent = `
    .mrsl-widget-container {
      position: fixed;
      bottom: 24px;
      ${position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      direction: rtl;
    }
    .mrsl-widget-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${color};
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      outline: none;
      position: relative;
    }
    .mrsl-widget-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.32);
    }
    .mrsl-widget-btn svg {
      width: 32px;
      height: 32px;
      fill: #ffffff;
    }
    .mrsl-widget-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: ${color};
      opacity: 0.6;
      animation: mrsl-pulse 2s infinite;
      z-index: -1;
    }
    @keyframes mrsl-pulse {
      0% { transform: scale(1); opacity: 0.6; }
      70% { transform: scale(1.35); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }
    .mrsl-widget-popup {
      display: none;
      position: absolute;
      bottom: 74px;
      ${position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
      width: 330px;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
      overflow: hidden;
      animation: mrsl-slide-up 0.25s ease-out forwards;
    }
    @keyframes mrsl-slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mrsl-widget-popup.active {
      display: block;
    }
    .mrsl-popup-header {
      background: linear-gradient(135deg, #128C7E, #075E54);
      color: #ffffff;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mrsl-popup-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .mrsl-popup-info h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }
    .mrsl-popup-info p {
      margin: 2px 0 0 0;
      font-size: 12px;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .mrsl-status-dot {
      width: 8px;
      height: 8px;
      background: #25D366;
      border-radius: 50%;
      display: inline-block;
    }
    .mrsl-popup-body {
      padding: 16px;
      background: #e5ddd5;
      background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 0);
      background-size: 12px 12px;
      min-height: 80px;
    }
    .mrsl-popup-bubble {
      background: #ffffff;
      padding: 10px 14px;
      border-radius: 12px 0 12px 12px;
      font-size: 13px;
      line-height: 1.5;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      display: inline-block;
      max-width: 90%;
    }
    .mrsl-popup-footer {
      padding: 12px 16px;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
    }
    .mrsl-popup-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 10px;
      background-color: #25D366;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      box-sizing: border-box;
      transition: background-color 0.2s;
    }
    .mrsl-popup-btn:hover {
      background-color: #1eb956;
    }
  `;
  document.head.appendChild(style);

  // Create Widget DOM
  var container = document.createElement('div');
  container.className = 'mrsl-widget-container';

  var waIcon = '<svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.77 14.13c-.24.67-1.39 1.25-1.92 1.33-.51.08-1.17.11-3.37-.8-2.62-1.08-4.32-3.74-4.45-3.91-.13-.18-1.07-1.42-1.07-2.72 0-1.29.68-1.93.92-2.19.24-.26.52-.33.7-.33.17 0 .35 0 .5.01.16.01.38-.06.59.45.22.52.74 1.8.8 1.93.07.13.11.29.02.47-.09.18-.14.29-.27.45-.13.16-.28.35-.4.47-.13.13-.27.27-.12.53.15.26.68 1.11 1.45 1.8 1 .89 1.84 1.17 2.1 1.3.26.13.41.11.56-.06.15-.18.66-.77.83-1.03.18-.26.35-.22.59-.13.24.09 1.53.72 1.79.85.26.13.43.2.5.31.07.11.07.65-.17 1.32z"/></svg>';

  var targetWaUrl = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(greeting);

  container.innerHTML = `
    <div class="mrsl-widget-popup" id="mrslWidgetPopup">
      <div class="mrsl-popup-header">
        <div class="mrsl-popup-avatar">💬</div>
        <div class="mrsl-popup-info">
          <h4>${brand}</h4>
          <p><span class="mrsl-status-dot"></span> متصل الآن • يرد خلال دقيقة</p>
        </div>
      </div>
      <div class="mrsl-popup-body">
        <div class="mrsl-popup-bubble">${greeting}</div>
      </div>
      <div class="mrsl-popup-footer">
        <a href="${targetWaUrl}" target="_blank" rel="noopener noreferrer" class="mrsl-popup-btn">
          ${waIcon}
          <span>بدء المحادثة في واتساب</span>
        </a>
      </div>
    </div>
    <button class="mrsl-widget-btn" id="mrslWidgetBtn" aria-label="تواصل معنا عبر واتساب">
      <div class="mrsl-widget-pulse"></div>
      ${waIcon}
    </button>
  `;

  document.body.appendChild(container);

  var btn = document.getElementById('mrslWidgetBtn');
  var popup = document.getElementById('mrslWidgetPopup');

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    popup.classList.toggle('active');
  });

  document.addEventListener('click', function (e) {
    if (!container.contains(e.target)) {
      popup.classList.remove('active');
    }
  });
})();
