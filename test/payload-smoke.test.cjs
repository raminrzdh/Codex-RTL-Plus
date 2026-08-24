'use strict';

// End-to-end smoke test for the ASSEMBLED, injected payload.
//
// The rtl-core unit tests cover the pure detection logic in isolation, but the
// bugs that have historically broken RTL live in the *assembled* bin/payload.js:
// an unsubstituted placeholder, the core inlined into a comment, an identifier
// collision between the core's isRTL(cp) and the payload's state variable. None
// of those show up until the whole payload is substituted and executed in a DOM.
//
// This test assembles the payload exactly as bin/index.js does at inject time,
// runs it in jsdom, and asserts it neither throws nor logs an error, mounts its
// widget, and actually directs text. `npm test` rebuilds bin/payload.js first
// (pretest), so this always exercises the current source.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const payloadPath = path.join(__dirname, '..', 'bin', 'payload.js');

// Substitute placeholders the same way bin/index.js does (split/join = replace
// every occurrence, literally). If this diverges from index.js, update both.
function assemble(config) {
    let payload = fs.readFileSync(payloadPath, 'utf8');
    payload = payload.split('__FONT_BASE64__').join('AAAA');
    payload = payload.split('__RTL_CONFIG__').join(JSON.stringify(config));
    return payload;
}

function run(config) {
    // Mirror Codex's real structure: an LTR app shell (sidebar) + the conversation
    // thread inside .thread-scroll-container + a composer input outside the thread.
    const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
        <aside class="app-shell-left-panel">
            <nav role="navigation"><a id="nav-item">مهمة جديدة</a><a>الدردشة</a></nav>
        </aside>
        <main>
            <div class="thread-scroll-container">
                <div dir="auto"><span>مرحبا كيف حالك اليوم يا صديقي</span></div>
                <p>Hello world, this is a plain English paragraph.</p>
                <p id="latin-first-persian">Shortlist باید Order را 10٪ افزایش بدهد.</p>
                <p id="multiline-latin-first-persian">API باید Response را به‌صورت JSON برگرداند.<br>Codex می‌تواند این File را دوباره بررسی کند.<br>Version جدید حدود 20٪ سریع‌تر است.</p>
                <div>النتيجة هي 2 + 3 = 5 تمام</div>
                <pre><code>const x = 1 + 2;</code></pre>
            </div>
            <div id="composer" contenteditable="true"><p>اكتب رسالتك هنا</p></div>
            <div id="task-composer" contenteditable="plaintext-only"><p>API باید Response را به‌صورت JSON برگرداند.</p><p>Codex می‌تواند این File را دوباره بررسی کند.</p><p>Version جدید حدود 20٪ سریع‌تر است.</p></div>
        </main>
    </body></html>`, { runScripts: 'outside-only', pretendToBeVisual: true });

    const { window } = dom;
    window.document.execCommand = () => true; // jsdom lacks it; widget uses it

    const errors = [];
    const origError = console.error;
    console.error = (...a) => { errors.push(a.map(String).join(' ')); };

    let threw = null;
    try {
        window.Function(assemble(config)).call(window);
    } catch (e) {
        threw = e;
    } finally {
        console.error = origError;
    }
    return { window, errors, threw };
}

const DEFAULT = { faFont: '', enFont: '', codeFont: '', lh: '1.6', isRTL: true, forceRTL: false, promptRTL: true, fixAtSign: true };

test('payload executes without throwing or logging an error', () => {
    const { errors, threw } = run(DEFAULT);
    assert.strictEqual(threw, null, threw && threw.stack);
    assert.deepStrictEqual(errors, [], 'payload logged errors: ' + errors.join(' | '));
});

test('settings widget and stylesheets mount', () => {
    const { window } = run(DEFAULT);
    assert.ok(window.document.querySelector('.rtl-widget-container'), 'widget missing');
    assert.ok(window.document.getElementById('codex-rtl-baseline'), 'baseline stylesheet missing');
    assert.ok(window.document.getElementById('codex-rtl-style'), 'dynamic stylesheet missing');
});

test('Arabic block gets dir=rtl, English stays LTR', () => {
    const { window } = run(DEFAULT);
    const arabic = window.document.querySelector('.thread-scroll-container > div:nth-child(1)');
    const english = window.document.querySelector('.thread-scroll-container > p');
    assert.strictEqual(arabic.getAttribute('dir'), 'rtl');
    assert.notStrictEqual(english.getAttribute('dir'), 'rtl');
});

test('Latin-first Persian sentence keeps the detected RTL base direction', () => {
    const { window } = run(DEFAULT);
    const mixed = window.document.getElementById('latin-first-persian');
    assert.strictEqual(mixed.getAttribute('dir'), 'rtl');

    const css = window.document.getElementById('codex-rtl-baseline').textContent;
    assert.match(css, /p[^{}]*\{unicode-bidi:isolate!important/);
    assert.ok(
        css.includes('[data-rtl-split]{unicode-bidi:plaintext!important'),
        'plaintext should be reserved for explicitly marked multi-line blocks'
    );
});

test('multi-line Latin-first Persian text stays RTL when every line contains RTL', () => {
    const { window } = run(DEFAULT);
    const mixed = window.document.getElementById('multiline-latin-first-persian');
    assert.strictEqual(mixed.getAttribute('dir'), 'rtl');
    assert.ok(!mixed.hasAttribute('data-rtl-split'));
    assert.strictEqual(mixed.style.direction, 'rtl');
});

test('task composer supports plaintext-only and Latin-first Persian prompts', () => {
    const { window } = run(DEFAULT);
    const composer = window.document.getElementById('task-composer');
    composer.innerHTML = '<p>Codex می‌تواند این File را دوباره بررسی کند</p>';
    composer.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.strictEqual(composer.getAttribute('data-rtl-prompt-dir'), 'rtl');
    assert.strictEqual(composer.style.direction, 'rtl');
    assert.strictEqual(composer.style.textAlign, 'right');
    assert.strictEqual(window.getComputedStyle(composer.querySelector('p')).direction, 'rtl');
    assert.strictEqual(window.getComputedStyle(composer.querySelector('p')).textAlign, 'right');

    const css = window.document.getElementById('codex-rtl-baseline').textContent;
    assert.ok(
        css.includes('[contenteditable]:not([contenteditable="false"]) p'),
        'composer isolation CSS should cover every enabled contenteditable form'
    );
});

test('Prompt RTL toggle immediately restores and reapplies composer direction', () => {
    const { window } = run(DEFAULT);
    const composer = window.document.getElementById('task-composer');
    const toggle = window.document.getElementById('rtl-prompt-btn');
    assert.strictEqual(composer.style.direction, 'rtl');

    toggle.click();
    assert.ok(!composer.hasAttribute('data-rtl-prompt-dir'));
    assert.strictEqual(composer.style.direction, '');
    assert.strictEqual(composer.style.textAlign, '');

    toggle.click();
    assert.strictEqual(composer.style.direction, 'rtl');
    assert.strictEqual(composer.style.textAlign, 'right');
});

test('RTL is scoped to the conversation: sidebar/chrome stays LTR', () => {
    const { window } = run(DEFAULT);
    const navItem = window.document.getElementById('nav-item'); // Arabic sidebar link
    // The engine must NOT stamp dir=rtl on app chrome, even though it is Arabic.
    assert.notStrictEqual(navItem.getAttribute('dir'), 'rtl');
    // And the baseline stylesheet must not target bare (unscoped) prose selectors.
    const css = window.document.getElementById('codex-rtl-baseline').textContent;
    assert.ok(css.includes('.thread-scroll-container'), 'baseline CSS should be scoped to the thread');
    assert.ok(!/(^|,|\})\s*div\s*\{unicode-bidi:plaintext/.test(css), 'baseline must not flip every div');
});

test('bare arithmetic is isolated as an LTR island', () => {
    const { window } = run(DEFAULT);
    const island = window.document.querySelector('[data-rtl-island]');
    assert.ok(island, 'no math island created');
    assert.strictEqual(island.textContent, '2 + 3 = 5');
    assert.strictEqual(island.style.direction, 'ltr');
});

test('code stays LTR', () => {
    const { window } = run(DEFAULT);
    assert.strictEqual(window.document.querySelector('pre').getAttribute('dir'), 'ltr');
});

test('Code Font also targets Codex terminal rows', () => {
    const { window } = run(Object.assign({}, DEFAULT, { codeFont: 'JetBrainsMono Nerd Font' }));
    const css = window.document.getElementById('codex-rtl-style').textContent;
    assert.ok(
        css.includes(".xterm-dom-renderer-owner-1 .xterm-rows{font-family:'JetBrainsMono Nerd Font', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace!important;}"),
        'terminal rows should inherit the configured Code Font'
    );
});

test('disabled config (isRTL:false) still loads and mounts the widget', () => {
    const { errors, threw, window } = run(Object.assign({}, DEFAULT, { isRTL: false }));
    assert.strictEqual(threw, null, threw && threw.stack);
    assert.deepStrictEqual(errors, []);
    assert.ok(window.document.querySelector('.rtl-widget-container'), 'widget should still mount when disabled');
    assert.ok(!window.document.getElementById('codex-rtl-baseline'), 'engine should not apply when disabled');
});
