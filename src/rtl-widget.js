// rtl-widget.js -- compact, accessible settings panel for Codex RTL Plus.
// Inlined into src/rtl-payload.js; shares its state and lifecycle functions.

if (!document.getElementById('rtl-widget-style')) {
    var widgetStyle = document.createElement('style');
    widgetStyle.id = 'rtl-widget-style';
    widgetStyle.textContent = [
        '.rtl-widget-container{--rtl-accent:#6478ff;--rtl-accent-2:#4dc7d9;--rtl-panel:light-dark(rgba(249,250,252,.96),rgba(24,25,30,.96));--rtl-card:light-dark(rgba(255,255,255,.78),rgba(255,255,255,.055));--rtl-line:light-dark(rgba(22,27,38,.11),rgba(255,255,255,.11));--rtl-text:var(--color-token-foreground,light-dark(#171923,#f5f6fa));--rtl-muted:light-dark(#687083,#a9afbd);position:fixed;right:18px;bottom:18px;z-index:99999;direction:ltr!important;text-align:left!important;font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;color:var(--rtl-text)}',
        '.rtl-widget-container *{box-sizing:border-box}',
        '.rtl-widget-trigger{position:relative;width:46px;height:46px;border:1px solid rgba(255,255,255,.18);border-radius:15px;display:grid;place-items:center;color:#fff;background:linear-gradient(145deg,var(--rtl-accent),#5362db 56%,#3846b7);box-shadow:0 10px 26px rgba(53,65,158,.34),inset 0 1px 0 rgba(255,255,255,.28);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}',
        '.rtl-widget-trigger:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(53,65,158,.42),inset 0 1px 0 rgba(255,255,255,.3)}',
        '.rtl-widget-trigger:focus-visible,.rtl-close:focus-visible,.rtl-switch:focus-visible,.rtl-field:focus-visible,.rtl-reset:focus-visible{outline:3px solid color-mix(in srgb,var(--rtl-accent) 58%,white);outline-offset:3px}',
        '.rtl-widget-trigger-mark{display:flex;align-items:center;gap:2px;font-size:11px;font-weight:800;letter-spacing:-.06em}',
        '.rtl-widget-trigger-mark svg{width:15px;height:15px}',
        '.rtl-widget-status-dot{position:absolute;right:-2px;top:-2px;width:10px;height:10px;border:2px solid light-dark(#fff,#22242a);border-radius:99px;background:#7d879b}',
        '.rtl-widget-status-dot.is-on{background:#54d6a0;box-shadow:0 0 0 3px rgba(84,214,160,.16)}',
        '.rtl-widget-panel{position:absolute;right:0;bottom:58px;width:min(306px,calc(100vw - 24px));max-height:min(620px,calc(100vh - 90px));overflow:auto;padding:10px;border:1px solid var(--rtl-line);border-radius:22px;background:var(--rtl-panel);box-shadow:0 24px 70px rgba(7,10,20,.28),inset 0 1px 0 rgba(255,255,255,.12);backdrop-filter:blur(22px) saturate(1.18);-webkit-backdrop-filter:blur(22px) saturate(1.18);opacity:0;transform:translateY(8px) scale(.97);transform-origin:bottom right;visibility:hidden;pointer-events:none;transition:opacity .16s ease,transform .16s ease,visibility 0s linear .16s}',
        '.rtl-widget-container.is-open .rtl-widget-panel{opacity:1;transform:none;visibility:visible;pointer-events:auto;transition-delay:0s}',
        '.rtl-widget-header{display:flex;align-items:center;gap:10px;padding:4px 4px 11px}',
        '.rtl-widget-emblem{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(145deg,color-mix(in srgb,var(--rtl-accent) 18%,transparent),color-mix(in srgb,var(--rtl-accent-2) 16%,transparent));border:1px solid color-mix(in srgb,var(--rtl-accent) 28%,var(--rtl-line));color:var(--rtl-accent)}',
        '.rtl-widget-emblem svg{width:23px;height:23px}',
        '.rtl-widget-title-wrap{min-width:0;flex:1}',
        '.rtl-widget-title{margin:0;font-size:14px;font-weight:750;line-height:1.15;letter-spacing:-.015em}',
        '.rtl-widget-subtitle{margin:3px 0 0;color:var(--rtl-muted);font-size:10px;line-height:1.2;letter-spacing:.02em}',
        '.rtl-close{width:30px;height:30px;border:0;border-radius:9px;display:grid;place-items:center;background:transparent;color:var(--rtl-muted);cursor:pointer}',
        '.rtl-close:hover{background:var(--rtl-card);color:var(--rtl-text)}',
        '.rtl-section{margin-top:8px;padding:10px;border:1px solid var(--rtl-line);border-radius:15px;background:var(--rtl-card)}',
        '.rtl-section-label{margin:0 0 7px;color:var(--rtl-muted);font-size:9px;font-weight:750;letter-spacing:.12em;text-transform:uppercase}',
        '.rtl-setting-row{min-height:34px;display:flex;align-items:center;justify-content:space-between;gap:12px}',
        '.rtl-setting-row+.rtl-setting-row{border-top:1px solid var(--rtl-line);margin-top:6px;padding-top:6px}',
        '.rtl-setting-copy{min-width:0}',
        '.rtl-setting-name{display:block;font-size:12px;font-weight:650;line-height:1.25}',
        '.rtl-setting-hint{display:block;margin-top:2px;color:var(--rtl-muted);font-size:9px;line-height:1.3}',
        '.rtl-switch{position:relative;flex:0 0 auto;width:38px;height:22px;border:0;border-radius:99px;padding:0;background:#7b8190;cursor:pointer;transition:background .16s ease}',
        '.rtl-switch[aria-checked="true"]{background:var(--rtl-accent)}',
        '.rtl-switch-knob{position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.22);transform:translateX(0);transition:transform .16s cubic-bezier(.2,.8,.2,1)}',
        '.rtl-switch[aria-checked="true"] .rtl-switch-knob{transform:translateX(16px)}',
        '.rtl-field-row{display:grid;grid-template-columns:84px minmax(0,1fr);align-items:center;gap:10px;min-height:34px}',
        '.rtl-field-row+.rtl-field-row{border-top:1px solid var(--rtl-line);margin-top:6px;padding-top:6px}',
        '.rtl-field-label{font-size:11px;font-weight:620}',
        '.rtl-field{width:100%;height:30px;border:1px solid var(--rtl-line);border-radius:9px;padding:0 9px;background:light-dark(rgba(255,255,255,.75),rgba(5,7,12,.28));color:var(--rtl-text);font:500 11px/1 inherit}',
        '.rtl-field::placeholder{color:var(--rtl-muted)}',
        '.rtl-range-wrap{display:flex;align-items:center;gap:7px}',
        '.rtl-range{min-width:0;width:100%;accent-color:var(--rtl-accent);cursor:pointer}',
        '.rtl-reset{flex:0 0 auto;width:27px;height:27px;border:1px solid var(--rtl-line);border-radius:8px;background:transparent;color:var(--rtl-muted);cursor:pointer}',
        '.rtl-reset:hover{color:var(--rtl-text);background:var(--rtl-card)}',
        '.rtl-widget-footer{display:flex;align-items:center;justify-content:center;padding:10px 5px 3px}',
        '.rtl-widget-version{color:var(--rtl-muted);font-size:9px;letter-spacing:.05em}',
        '#rtl-settings-wrapper.is-disabled{opacity:.42;pointer-events:none;filter:saturate(.5)}',
        '@media (max-width:520px){.rtl-widget-container{right:12px;bottom:12px}.rtl-widget-panel{right:0;bottom:56px}}',
        '@media (prefers-reduced-motion:reduce){.rtl-widget-container *{transition:none!important}}'
    ].join('');
    document.head.appendChild(widgetStyle);
}

function rtlSwitchMarkup(id, checked, label) {
    return '<button id="' + id + '" class="rtl-switch" type="button" role="switch" aria-label="' + label + '" aria-checked="' + (checked ? 'true' : 'false') + '"><span class="rtl-switch-knob"></span></button>';
}

var widgetWrapper = document.createElement('div');
widgetWrapper.className = 'rtl-widget-container';
widgetWrapper.innerHTML = `
  <button class="rtl-widget-trigger" type="button" aria-label="Open Codex RTL Plus settings" aria-expanded="false" aria-controls="rtl-widget-panel">
    <span class="rtl-widget-trigger-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h12M4 7l3-3M4 7l3 3M20 17H8m12 0-3-3m3 3-3 3"/></svg>
      <span>RTL</span>
    </span>
    <span class="rtl-widget-status-dot ${rtlEnabled ? 'is-on' : ''}"></span>
  </button>
  <section id="rtl-widget-panel" class="rtl-widget-panel" role="dialog" aria-modal="false" aria-label="Codex RTL Plus settings" aria-hidden="true">
    <header class="rtl-widget-header">
      <div class="rtl-widget-emblem" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h11M3 8l3-3M3 8l3 3M21 16H10m11 0-3-3m3 3-3 3"/><path d="M7 13h3v6H7zM14 5h3v6h-3z" opacity=".55"/></svg>
      </div>
      <div class="rtl-widget-title-wrap">
        <h2 class="rtl-widget-title">Codex RTL Plus</h2>
        <p class="rtl-widget-subtitle">Direction, type &amp; mixed-text controls</p>
      </div>
      <button class="rtl-close" type="button" aria-label="Close settings">✕</button>
    </header>

    <div class="rtl-section">
      <p class="rtl-section-label">Direction</p>
      <div class="rtl-setting-row">
        <div class="rtl-setting-copy"><span id="rtl-toggle-label" class="rtl-setting-name">Smart RTL</span><span class="rtl-setting-hint">Detect direction in conversations</span></div>
        ${rtlSwitchMarkup('rtl-toggle-btn', rtlEnabled, 'Smart RTL')}
      </div>
      <div id="rtl-settings-wrapper" class="${rtlEnabled ? '' : 'is-disabled'}">
        <div class="rtl-setting-row">
          <div class="rtl-setting-copy"><span class="rtl-setting-name">Force RTL</span><span class="rtl-setting-hint">Keep all conversation prose RTL</span></div>
          ${rtlSwitchMarkup('rtl-force-btn', forceRTL, 'Force RTL')}
        </div>
        <div class="rtl-setting-row">
          <div class="rtl-setting-copy"><span class="rtl-setting-name">Prompt RTL</span><span class="rtl-setting-hint">Update direction while typing or pasting</span></div>
          ${rtlSwitchMarkup('rtl-prompt-btn', promptRTL, 'Prompt RTL')}
        </div>
      </div>
    </div>

    <div class="rtl-section">
      <p class="rtl-section-label">Typography</p>
      <label class="rtl-field-row"><span class="rtl-field-label">FA / AR</span><input id="rtl-fafont-input" class="rtl-field" type="text" placeholder="Vazirmatn" value="${savedFaFont}" spellcheck="false"></label>
      <label class="rtl-field-row"><span class="rtl-field-label">English</span><input id="rtl-enfont-input" class="rtl-field" type="text" placeholder="System" value="${savedEnFont}" spellcheck="false"></label>
      <label class="rtl-field-row"><span class="rtl-field-label">Code</span><input id="rtl-codefont-input" class="rtl-field" type="text" placeholder="System mono" value="${savedCodeFont}" spellcheck="false"></label>
      <label class="rtl-field-row"><span class="rtl-field-label">Line height</span><span class="rtl-range-wrap"><input id="rtl-lh-input" class="rtl-range" type="range" min="1.2" max="2.5" step="0.1" value="${savedLH}"><button id="rtl-lh-reset" class="rtl-reset" type="button" aria-label="Reset line height">↺</button></span></label>
    </div>

    <div class="rtl-section">
      <p class="rtl-section-label">Keyboard</p>
      <div class="rtl-setting-row">
        <div class="rtl-setting-copy"><span class="rtl-setting-name">Shift + 2 → @</span><span class="rtl-setting-hint">Fix the Persian keyboard shortcut</span></div>
        ${rtlSwitchMarkup('rtl-at-btn', fixAtSign, 'Persian keyboard at-sign fix')}
      </div>
    </div>

    <footer class="rtl-widget-footer">
      <span class="rtl-widget-version">CODEX RTL PLUS</span>
    </footer>
  </section>`;
document.body.appendChild(widgetWrapper);

var _wTrigger = widgetWrapper.querySelector('.rtl-widget-trigger');
var _wPanel = document.getElementById('rtl-widget-panel');
var _wClose = widgetWrapper.querySelector('.rtl-close');
var _wStatusDot = widgetWrapper.querySelector('.rtl-widget-status-dot');
var _wToggleBtn = document.getElementById('rtl-toggle-btn');
var _wToggleLabel = document.getElementById('rtl-toggle-label');
var _wSettingsWrapper = document.getElementById('rtl-settings-wrapper');
var _wForceBtn = document.getElementById('rtl-force-btn');
var _wPromptBtn = document.getElementById('rtl-prompt-btn');
var _wAtBtn = document.getElementById('rtl-at-btn');
var _wFaFontInput = document.getElementById('rtl-fafont-input');
var _wEnFontInput = document.getElementById('rtl-enfont-input');
var _wCodeFontInput = document.getElementById('rtl-codefont-input');
var _wLhInput = document.getElementById('rtl-lh-input');
var _wLhResetBtn = document.getElementById('rtl-lh-reset');

function setWidgetOpen(open) {
    widgetWrapper.classList.toggle('is-open', open);
    _wTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    _wPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) _wClose.focus(); else _wTrigger.focus();
}

function syncSwitch(button, checked) {
    button.setAttribute('aria-checked', checked ? 'true' : 'false');
}

_wTrigger.addEventListener('click', function () { setWidgetOpen(!widgetWrapper.classList.contains('is-open')); });
_wClose.addEventListener('click', function () { setWidgetOpen(false); });
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && widgetWrapper.classList.contains('is-open')) setWidgetOpen(false);
});
document.addEventListener('pointerdown', function (event) {
    if (widgetWrapper.classList.contains('is-open') && !widgetWrapper.contains(event.target)) setWidgetOpen(false);
});

_wToggleBtn.addEventListener('click', function () {
    rtlEnabled = !rtlEnabled;
    saveConfig();
    syncSwitch(_wToggleBtn, rtlEnabled);
    _wToggleLabel.textContent = 'Smart RTL';
    _wSettingsWrapper.classList.toggle('is-disabled', !rtlEnabled);
    _wStatusDot.classList.toggle('is-on', rtlEnabled);
    if (rtlEnabled) startEngine(); else stopEngine();
});

_wForceBtn.addEventListener('click', function () {
    forceRTL = !forceRTL;
    saveConfig();
    syncSwitch(_wForceBtn, forceRTL);
    updateDynamicCSS();
});

_wPromptBtn.addEventListener('click', function () {
    promptRTL = !promptRTL;
    saveConfig();
    syncSwitch(_wPromptBtn, promptRTL);
    updateDynamicCSS();
    processInput();
});

_wAtBtn.addEventListener('click', function () {
    fixAtSign = !fixAtSign;
    saveConfig();
    syncSwitch(_wAtBtn, fixAtSign);
});

_wFaFontInput.addEventListener('input', function () {
    savedFaFont = _wFaFontInput.value.trim();
    saveConfig();
    updateDynamicCSS();
});

_wEnFontInput.addEventListener('input', function () {
    savedEnFont = _wEnFontInput.value.trim();
    saveConfig();
    updateDynamicCSS();
});

_wCodeFontInput.addEventListener('input', function () {
    savedCodeFont = _wCodeFontInput.value.trim();
    saveConfig();
    updateDynamicCSS();
});

_wLhInput.addEventListener('input', function () {
    savedLH = _wLhInput.value;
    saveConfig();
    updateDynamicCSS();
});

_wLhResetBtn.addEventListener('click', function () {
    _wLhInput.value = '1.6';
    savedLH = '1.6';
    saveConfig();
    updateDynamicCSS();
});
