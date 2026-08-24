// GENERATED FILE -- do not edit by hand.
// Built from src/rtl-core.cjs + src/rtl-payload.js + src/rtl-widget.js by
// tools/build-payload.mjs. Run `npm run build` after editing any of those.
// The font/config placeholders are substituted by bin/index.js at inject time.

// rtl-payload.js -- DOM layer for the Codex Smart RTL patch.
//
// TEMPLATE. tools/build-payload.mjs assembles the shipped bin/payload.js by:
//   1. replacing the /*__RTL_CORE__*/ marker with the function bodies of
//      src/rtl-core.cjs (module.exports stripped), and
//   2. leaving the font/config placeholders (declared below) in place --
//      bin/index.js substitutes those at inject time (font bytes + user config).
//      Do NOT write the literal placeholder tokens anywhere else in this file:
//      the substitution must find exactly one occurrence of each.
//
// Everything lives in one IIFE so the detection core, the DOM engine, the
// settings widget, and the config all share a scope. Keep the core marker inside
// this IIFE so its helpers (hasRTL, firstStrong, segmentText, cellDir, ...) are
// visible to the DOM engine below.
;(function () {
    'use strict';
    if (typeof document === 'undefined') return;
    try {
        // --- CONFIG (substituted by bin/index.js) ---
        var fontBase64 = '__FONT_BASE64__';
        var rtlConfig = __RTL_CONFIG__;

        var rtlEnabled = rtlConfig.isRTL !== false;
        var forceRTL = rtlConfig.forceRTL === true;
        var promptRTL = rtlConfig.promptRTL !== false;
        var fixAtSign = rtlConfig.fixAtSign !== false;
        var savedFaFont = rtlConfig.faFont || '';
        var savedEnFont = rtlConfig.enFont || '';
        var savedCodeFont = rtlConfig.codeFont || '';
        var savedLH = rtlConfig.lh || '1.6';

        // Codex composes its chat input with Lexical. Never mutate DOM a live
        // editor owns: it reverts foreign mutations inside its subtree, which
        // re-fires our MutationObserver, which mutates again -- an infinite loop
        // that hangs the app (the same class of freeze as Claude's issue #33).
        // Detect the editor by its fundamental nature, not one brittle testid.
        // Electron/React editor implementations vary between `true`, an empty
        // contenteditable attribute, and `plaintext-only`. Match every enabled
        // contenteditable form so task-box direction does not depend on which
        // editor build Codex currently ships.
        var ACTIVE_EDITABLE_SEL = '[contenteditable]:not([contenteditable="false"])';
        var WRITING_SEL = ACTIVE_EDITABLE_SEL + ', [data-lexical-editor="true"], textarea, .ProseMirror, [role="textbox"]';
        var EDITOR_SEL = WRITING_SEL + ', [data-lexical-text="true"]';
        var PROMPT_DIR_ATTR = 'data-rtl-prompt-dir';

        // Codex is a natively LTR app; only the conversation should flip. Confine
        // ALL direction work to the message thread (.thread-scroll-container) plus
        // the composer, so the app's own chrome -- sidebar (aside.app-shell-left-panel),
        // navigation, top menus, toolbars -- stays in its native LTR. Chrome must
        // stay LTR to match the window-controls fix.
        var CONVERSATION_SEL = '.thread-scroll-container';
        // Chrome we must never touch even via the global composer/input pass.
        var CHROME_SEL = 'aside, nav, [role="navigation"], [role="menubar"], [role="toolbar"], header';

        // The live conversation roots. Falls back to the largest vertical scroller
        // (then <body>) so a future class rename degrades instead of breaking.
        function conversationRoots() {
            var roots = Array.prototype.slice.call(document.querySelectorAll(CONVERSATION_SEL));
            if (roots.length) return roots;
            var best = null, bestH = 0;
            var els = document.querySelectorAll('main, section, div');
            for (var i = 0; i < els.length; i++) {
                var e = els[i];
                if (e.closest(CHROME_SEL)) continue;
                if (e.scrollHeight > e.clientHeight + 60) {
                    var s = window.getComputedStyle(e);
                    if (/auto|scroll/.test(s.overflowY) && e.scrollHeight > bestH) { best = e; bestH = e.scrollHeight; }
                }
            }
            return best ? [best] : [document.body];
        }

        // True if the node sits inside the conversation thread.
        function inConversation(node) {
            var el = (node && node.nodeType === 1) ? node : (node ? node.parentElement : null);
            return !!(el && el.closest && el.closest(CONVERSATION_SEL));
        }

        // --- PURE DETECTION CORE (inlined from src/rtl-core.cjs by build-payload.mjs) ---
        // >>> inlined src/rtl-core.cjs >>>
        // rtl-core.js -- pure, DOM-free RTL/LaTeX detection logic.
        //
        // SOURCE OF TRUTH for the detection engine. tools/build-payload.mjs inlines the
        // function bodies of this file into the injected IIFE inside bin/payload.js (it
        // strips the module.exports guard at the bottom). test/rtl-core.test.cjs requires
        // this file directly. Keep this file DOM-free so it stays unit-testable. It is a
        // .cjs file because package.json sets "type":"module" -- the CommonJS export at
        // the bottom is what the test loads and what the build tool strips.
        'use strict';

        // Strong-RTL code-point ranges, [lo, hi] inclusive. Covers the modern living
        // RTL scripts plus the common historic/astral ones. Tested against code points
        // (codePointAt), NOT UTF-16 code units, so astral blocks like Adlam work.
        var RTL_RANGES = [
            [0x0590, 0x05FF], // Hebrew
            [0x0600, 0x06FF], // Arabic
            [0x0700, 0x074F], // Syriac
            [0x0750, 0x077F], // Arabic Supplement
            [0x0780, 0x07BF], // Thaana
            [0x07C0, 0x07FF], // NKo
            [0x0800, 0x083F], // Samaritan
            [0x0840, 0x085F], // Mandaic
            [0x0860, 0x086F], // Syriac Supplement
            [0x0870, 0x089F], // Arabic Extended-B
            [0x08A0, 0x08FF], // Arabic Extended-A
            [0xFB1D, 0xFB4F], // Hebrew presentation forms
            [0xFB50, 0xFDFF], // Arabic presentation forms-A
            [0xFE70, 0xFEFF], // Arabic presentation forms-B
            [0x10800, 0x1083F], // Cypriot Syllabary block (incl. early RTL scripts)
            [0x10840, 0x1085F], // Imperial Aramaic
            [0x10A00, 0x10A5F], // Kharoshthi
            [0x10E60, 0x10E7F], // Rumi Numeral Symbols
            [0x1E800, 0x1E8DF], // Mende Kikakui
            [0x1E900, 0x1E95F], // Adlam
            [0x1EE00, 0x1EEFF]  // Arabic Mathematical Alphabetic Symbols
        ];

        // cp: a Unicode code point (from String.prototype.codePointAt).
        function isRTL(cp) {
            for (var i = 0; i < RTL_RANGES.length; i++) {
                if (cp >= RTL_RANGES[i][0] && cp <= RTL_RANGES[i][1]) return true;
            }
            return false;
        }

        function hasRTL(text) {
            if (!text) return false;
            for (var i = 0; i < text.length;) {
                var cp = text.codePointAt(i);
                if (isRTL(cp)) return true;
                i += cp > 0xFFFF ? 2 : 1;
            }
            return false;
        }

        // Direction of the first strong character: 'rtl', 'ltr', or null (no strong char).
        function firstStrong(text) {
            if (!text) return null;
            for (var i = 0; i < text.length;) {
                var cp = text.codePointAt(i);
                if (isRTL(cp)) return 'rtl';
                // ASCII Latin letters are strong-LTR (matches the original /[a-zA-Z]/ rule).
                if ((cp >= 0x41 && cp <= 0x5A) || (cp >= 0x61 && cp <= 0x7A)) return 'ltr';
                i += cp > 0xFFFF ? 2 : 1;
            }
            return null;
        }

        // Remove leading LTR-only noise (filenames, URLs, paths, backtick-code) so a
        // Hebrew/Persian sentence that starts with "foo.js" still detects as RTL.
        function stripLeadingLTR(text) {
            return text
                .replace(/^[\s]*(?:[\w.\-]+\.[\w]{1,5})\s*/g, '')
                .replace(/https?:\/\/\S+/g, '')
                .replace(/[\w.\-]+[\/\\][\w.\-\/\\]+/g, '')
                .replace(/`[^`]+`/g, '');
        }

        // A "$...$" body is treated as math only when it carries a real LaTeX signal.
        // This is the currency guard: "$5.99" or "$5 to $10" lack the signal and stay text.
        var LATEX_SIGNAL = /[\\^_{}]|\b(?:frac|sqrt|sum|prod|int|lim|infty|cdot|times|div|leq|geq|neq|approx|partial|nabla|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|matrix|begin|end|left|right|text|mathbb|mathcal|vec|hat|bar|overline|underline)\b/;

        function hasLatexSignal(body) {
            return LATEX_SIGNAL.test(body);
        }

        // Find math regions as [start, end) index pairs over `text`.
        // Unambiguous delimiters ($$...$$, \[...\], \(...\)) always count; single $...$
        // only counts with a LaTeX signal and only outside already-claimed regions.
        function findLatexRanges(text) {
            var ranges = [];
            if (!text) return ranges;

            function claim(re, requireSignal, bodyStart, bodyEnd) {
                var m;
                re.lastIndex = 0;
                while ((m = re.exec(text)) !== null) {
                    var start = m.index;
                    var end = m.index + m[0].length;
                    if (overlaps(start, end)) continue;
                    if (requireSignal) {
                        var body = m[0].slice(bodyStart, m[0].length - bodyEnd);
                        if (!hasLatexSignal(body)) continue;
                    }
                    ranges.push([start, end]);
                }
            }
            function overlaps(s, e) {
                for (var i = 0; i < ranges.length; i++) {
                    if (s < ranges[i][1] && e > ranges[i][0]) return true;
                }
                return false;
            }

            // Order matters: claim the unambiguous, greedier delimiters first.
            claim(/\$\$[\s\S]+?\$\$/g, false, 0, 0);
            claim(/\\\[[\s\S]+?\\\]/g, false, 0, 0);
            claim(/\\\([\s\S]+?\\\)/g, false, 0, 0);
            // Single $...$ -- no newline inside, must carry a LaTeX signal (currency guard).
            claim(/\$[^$\n]+?\$/g, true, 1, 1);

            ranges.sort(function (a, b) { return a[0] - b[0]; });
            return ranges;
        }

        // --- BARE NUMERIC / ARITHMETIC ISOLATION ---
        //
        // Assistants frequently write arithmetic WITHOUT LaTeX delimiters, e.g. a Persian
        // sentence containing "2 + 3 = 5". Inside an RTL paragraph the Unicode bidi
        // algorithm lays the number+operator tokens out right-to-left, so it renders
        // mirrored as "5 = 3 + 2". findMathRanges marks such runs so the DOM can isolate
        // LTR -- the same fix findLatexRanges applies to "$...$", extended to bare math.
        //
        // Operator characters whose PRESENCE proves a run is a genuine expression (not a
        // lone number, date, IP, version, or list marker). ASCII core plus common
        // Unicode math (multiply, divide, minus-sign, <=, >=, !=, ~=, arrow, dots,
        // root). Built with String.fromCharCode so the SOURCE stays pure ASCII. The '-'
        // is escaped so the string is a safe regex class body. Order/codes: U+00D7 U+00F7
        // U+00B1 U+2212 U+2264 U+2265 U+2260 U+2248 U+2192 U+00B7 U+2022 U+2219 U+2217
        // U+22C5 U+221A.
        var MATH_OP_CHARS = '+\\-*/=<>%' + String.fromCharCode(
            0xD7, 0xF7, 0xB1, 0x2212, 0x2264, 0x2265, 0x2260,
            0x2248, 0x2192, 0xB7, 0x2022, 0x2219, 0x2217, 0x22C5, 0x221A);
        var MATH_OP_RE  = new RegExp('[' + MATH_OP_CHARS + ']');
        var MATH_DIGIT_RE = /[0-9]/;
        // A whitespace-delimited token is "mathy" when built only from digits and math
        // punctuation/operators, OR it is a single Latin letter used as a variable
        // (x, y, n). Multi-letter Latin tokens (English words, "3D", "4K") are NOT
        // mathy, so they break a run and keep prose out of the isolated island.
        var MATH_TOKEN_RE = new RegExp('^(?:[0-9.,:;()\\[\\]{}|' + MATH_OP_CHARS + ']+|[A-Za-z])$');

        function isMathyToken(tok) {
            return !!tok && MATH_TOKEN_RE.test(tok);
        }

        // A token may BOUND a run only if it carries an operand -- a digit or a single
        // Latin variable letter. Pure operator/punctuation tokens ("+", "=", "(") can
        // sit inside a run but never start or end it (avoids dangling "+ 3").
        function isOperandToken(tok) {
            return MATH_DIGIT_RE.test(tok) || /^[A-Za-z]$/.test(tok);
        }

        // Find bare numeric/arithmetic runs as [start, end) index pairs over `text`.
        // A run must be whitespace/line delimited, operand-bounded, and contain at least
        // one digit AND one operator. Lone numbers, "$5" currency, RTL-glued
        // constructs (a prefix letter joined to a number with no space), dates/IPs
        // without operators, and "1." list markers are deliberately left alone.
        function findMathRanges(text) {
            var ranges = [];
            if (!text || !MATH_OP_RE.test(text) || !MATH_DIGIT_RE.test(text)) return ranges;

            // Scan line by line so a run never spans a newline (each line is its own
            // bidi paragraph). `base` is the absolute offset of the current line.
            var base = 0;
            var lines = text.split('\n');
            for (var li = 0; li < lines.length; li++) {
                scanLine(lines[li], base);
                base += lines[li].length + 1; // +1 for the '\n' removed by split
            }
            return ranges;

            function scanLine(line, off) {
                var toks = [];
                var re = /\S+/g; // non-whitespace tokens; \s breaks them
                var m;
                while ((m = re.exec(line)) !== null) {
                    toks.push({ v: m[0], start: m.index, end: m.index + m[0].length });
                }
                var i = 0;
                while (i < toks.length) {
                    if (!isMathyToken(toks[i].v)) { i++; continue; }
                    var j = i;
                    while (j + 1 < toks.length && isMathyToken(toks[j + 1].v)) j++;
                    // toks[i..j] is a maximal mathy group. Trim non-operand tokens off
                    // both ends so the isolated run is operand-bounded.
                    var a = i, b = j;
                    while (a <= b && !isOperandToken(toks[a].v)) a++;
                    while (b >= a && !isOperandToken(toks[b].v)) b--;
                    if (a <= b) {
                        var s = off + toks[a].start;
                        var e = off + toks[b].end;
                        // Drop sentence punctuation that clung to the ends (never part of
                        // a real number at a boundary: a decimal never ends in '.').
                        while (e > s && '.,:;'.indexOf(text.charAt(e - 1)) !== -1) e--;
                        while (e > s && ',:;'.indexOf(text.charAt(s)) !== -1) s++;
                        var sub = text.slice(s, e);
                        if (e - s >= 2 && MATH_DIGIT_RE.test(sub) && MATH_OP_RE.test(sub)) {
                            ranges.push([s, e]);
                        }
                    }
                    i = j + 1;
                }
            }
        }

        // Split text into alternating {type:'text'|'math', value} segments. 'math' covers
        // both LaTeX islands (findLatexRanges) and bare arithmetic (findMathRanges); the
        // DOM layer isolates both LTR. LaTeX wins when the two overlap.
        function segmentText(text) {
            var segs = [];
            if (!text) return segs;
            var ranges = findLatexRanges(text);
            var numeric = findMathRanges(text);
            for (var n = 0; n < numeric.length; n++) {
                var ns = numeric[n][0], ne = numeric[n][1], clash = false;
                for (var c = 0; c < ranges.length; c++) {
                    if (ns < ranges[c][1] && ne > ranges[c][0]) { clash = true; break; }
                }
                if (!clash) ranges.push(numeric[n]);
            }
            if (!ranges.length) {
                segs.push({ type: 'text', value: text });
                return segs;
            }
            ranges.sort(function (a, b) { return a[0] - b[0]; });
            var pos = 0;
            for (var i = 0; i < ranges.length; i++) {
                if (ranges[i][0] > pos) {
                    segs.push({ type: 'text', value: text.slice(pos, ranges[i][0]) });
                }
                segs.push({ type: 'math', value: text.slice(ranges[i][0], ranges[i][1]) });
                pos = ranges[i][1];
            }
            if (pos < text.length) segs.push({ type: 'text', value: text.slice(pos) });
            return segs;
        }

        // Classify a table cell's direction from its text. A cell counts as RTL if it
        // *contains* any RTL character -- not merely if its first strong char is RTL.
        // Header labels often start with a Latin term ("blob ...", "ID ...") yet belong
        // to an RTL column, so first-strong is too weak here. Neutral cells (digits,
        // hashes, punctuation only) return null so they do not sway the majority.
        function cellDir(text) {
            if (hasRTL(text)) return 'rtl';
            if (firstStrong(text) === 'ltr') return 'ltr';
            return null;
        }

        // Decide a whole table's column direction from header / first-column cell dirs.
        // Each input is an array of 'rtl' | 'ltr' | null. Header wins; first column is
        // the tie-breaker. Returns 'rtl' (flip columns) or null (leave LTR).
        function tableDirFromCells(headerDirs, firstColDirs) {
            // First header is the semantic key column (row labels). If it's RTL and the
            // first data cell agrees, the table is an RTL table regardless of how many
            // product/entity names appear as LTR in subsequent headers.
            if (headerDirs && headerDirs[0] === 'rtl' &&
                    firstColDirs && firstColDirs[0] === 'rtl') return 'rtl';
            var h = majorityDir(headerDirs || []);
            if (h === 'rtl') return 'rtl';
            if (h === 'ltr') return null;
            var c = majorityDir(firstColDirs || []);
            return c === 'rtl' ? 'rtl' : null;
        }

        function majorityDir(dirs) {
            var r = 0, l = 0;
            for (var i = 0; i < dirs.length; i++) {
                if (dirs[i] === 'rtl') r++;
                else if (dirs[i] === 'ltr') l++;
            }
            if (r > l) return 'rtl';
            if (l > r) return 'ltr';
            return null;
        }

        // <<< inlined src/rtl-core.cjs <<<
        // --- END PURE DETECTION CORE ---

        // ================= DOM ENGINE =================

        // Get text from element excluding <code> children (DOM-aware)
        function textWithoutCode(el) {
            var out = '';
            var nodes = el.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (n.nodeType === 3) { out += n.textContent; }
                else if (n.nodeType === 1 && n.tagName !== 'CODE' && n.tagName !== 'PRE') {
                    out += textWithoutCode(n);
                }
            }
            return out;
        }

        // --- PER-LINE DIRECTIONAL SPLITTING ---
        // A paragraph rendered with <br> separators or whitespace-pre may carry
        // multiple lines, each in a different script. Forcing a single dir on the
        // host mangles every line that disagrees. Defer to unicode-bidi:plaintext
        // and stamp a flag so later passes skip it.
        var RTL_SPLIT_FLAG = 'data-rtl-split';
        var BR_OR_NL_SPLIT = /(<br\s*\/?>|\n)/i;

        // Read visual lines without mutating the live React-owned DOM. textContent
        // does not preserve <br> boundaries, so use a detached clone to turn them
        // into newlines before classifying each line.
        function textWithLineBreaks(el) {
            var clone = el.cloneNode(true);
            Array.prototype.slice.call(clone.querySelectorAll('br')).forEach(function (br) {
                br.parentNode.replaceChild(document.createTextNode('\n'), br);
            });
            return clone.textContent || '';
        }

        function hasMultiScriptLines(el) {
            var src = textWithLineBreaks(el);
            if (!src) return false;
            if (!hasRTL(src)) return false;
            if (!(BR_OR_NL_SPLIT.test(el.innerHTML) || src.indexOf('\n') !== -1)) return false;

            // A Latin-first line that contains RTL prose is still semantically an
            // RTL line. Only delegate to plaintext when the block contains both
            // RTL lines and genuinely LTR-only lines. If every line contains RTL
            // (API ... فارسی / Version ... فارسی), one explicit RTL base direction
            // correctly handles the whole block.
            var sawRTL = false, sawLTR = false;
            src.split('\n').forEach(function (line) {
                if (!line.trim()) return;
                if (hasRTL(line)) sawRTL = true;
                else if (firstStrong(line) === 'ltr') sawLTR = true;
            });
            return sawRTL && sawLTR;
        }

        function splitToDirectionalSpans(el) {
            if (el.hasAttribute(RTL_SPLIT_FLAG)) return;
            // No DOM rewriting -- assigning innerHTML breaks React reconciliation.
            // <br> is a paragraph separator in the Unicode BiDi algorithm, so with
            // unicode-bidi:plaintext each line auto-picks its direction.
            el.setAttribute(RTL_SPLIT_FLAG, '1');
            if (el.hasAttribute('dir')) el.removeAttribute('dir');
            el.style.direction = '';
            el.style.textAlign = 'start';
            el.style.unicodeBidi = 'plaintext';
        }

        // If an element inherits RTL via a parent CSS class (not an explicit dir
        // attribute on itself), removing dir alone won't free it -- pin ltr.
        function resetDirOrPinLTR(el) {
            if (window.getComputedStyle(el).direction === 'rtl') {
                el.dir = 'ltr';
                el.style.direction = 'ltr';
                return;
            }
            if (el.hasAttribute('dir')) el.removeAttribute('dir');
            el.style.direction = '';
        }

        // --- HYBRID DIRECTION DETECTION ---
        function detectElDir(el) {
            var full = el.textContent || '';
            if (!hasRTL(full)) return null;
            var noCode = textWithoutCode(el);
            var d = firstStrong(noCode);
            if (d === 'rtl') return 'rtl';
            var stripped = stripLeadingLTR(noCode);
            d = firstStrong(stripped);
            if (d === 'rtl') return 'rtl';
            // RTL chars exist but hide behind code/filenames -> treat as RTL.
            return 'rtl';
        }

        function detectTextDir(text) {
            if (!text || !text.trim()) return null;
            var d = firstStrong(text);
            if (d === 'rtl') return 'rtl';
            if (!hasRTL(text)) return 'ltr';
            var stripped = stripLeadingLTR(text);
            d = firstStrong(stripped);
            if (d === 'rtl') return 'rtl';
            return 'rtl';
        }

        // querySelectorAll that INCLUDES root itself if it matches
        function qsa(root, sel) {
            var base = root.querySelectorAll ? root : document;
            var els = Array.prototype.slice.call(base.querySelectorAll(sel));
            if (root.matches && root.matches(sel)) els.unshift(root);
            return els;
        }

        function forceCodeLTR(root) {
            qsa(root, 'pre, .code-block__code').forEach(function (b) {
                if (b.closest(EDITOR_SEL)) return;
                b.dir = 'ltr'; b.style.textAlign = 'left'; b.style.unicodeBidi = 'embed';
            });
            qsa(root, 'code').forEach(function (c) {
                if (c.closest(EDITOR_SEL)) return;
                if (!c.closest('pre') && !c.closest('.code-block__code')) c.dir = 'ltr';
            });
            qsa(root, '.katex, .katex-display, mjx-container').forEach(function (m) {
                if (m.closest(EDITOR_SEL)) return;
                m.style.unicodeBidi = 'isolate'; m.style.direction = 'ltr';
            });
        }

        // --- RAW LaTeX + BARE-ARITHMETIC ISOLATION ---
        // Inside an RTL paragraph the neutral $ \ { } chars scramble a formula and
        // bare arithmetic ("2 + 3 = 5") gets mirrored to "5 = 3 + 2". Isolate each
        // math segment (LaTeX or bare numeric, per segmentText) in its own
        // ltr/unicode-bidi:isolate span. Replace a single TEXT node with a fragment
        // (replaceChild) -- never innerHTML -- to stay gentle on React, and flag
        // islands so we never re-wrap during streaming.
        var ISLAND_FLAG = 'data-rtl-island';

        function isolateMath(root) {
            if (typeof document.createTreeWalker !== 'function') return;
            var host = (root && root.nodeType === 1) ? root : document.body;
            if (!host) return;
            var walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
                acceptNode: function (node) {
                    var v = node.nodeValue;
                    if (!v) return NodeFilter.FILTER_REJECT;
                    var hasTex = v.indexOf('$') !== -1 || v.indexOf('\\') !== -1;
                    var hasNum = MATH_DIGIT_RE.test(v) && MATH_OP_RE.test(v);
                    if (!hasTex && !hasNum) return NodeFilter.FILTER_REJECT;
                    var p = node.parentElement;
                    if (!p) return NodeFilter.FILTER_REJECT;
                    if (p.tagName === 'SCRIPT' || p.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
                    // replaceChild on a text node the user is typing into is the
                    // most violent mutation an editor can receive -- reject inside
                    // any editor to avoid a freeze loop.
                    if (p.closest('pre, code, .code-block__code, [' + ISLAND_FLAG + '], ' + EDITOR_SEL)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            });
            var targets = [];
            var n;
            while ((n = walker.nextNode())) targets.push(n);
            targets.forEach(function (textNode) {
                var segs = segmentText(textNode.nodeValue);
                var hasMath = segs.some(function (s) { return s.type === 'math'; });
                if (!hasMath) return;
                var frag = document.createDocumentFragment();
                segs.forEach(function (s) {
                    if (s.type === 'math') {
                        var span = document.createElement('span');
                        span.setAttribute(ISLAND_FLAG, '1');
                        span.style.unicodeBidi = 'isolate';
                        span.style.direction = 'ltr';
                        span.textContent = s.value;
                        frag.appendChild(span);
                    } else {
                        frag.appendChild(document.createTextNode(s.value));
                    }
                });
                if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
            });
        }

        // --- TABLE COLUMN ORDERING ---
        // An RTL table should read right-to-left: the first column on the right.
        // Per-cell direction is handled by processText; here we only flip the whole
        // table's column order via dir="rtl" on a stable <table> element.
        var TABLE_FLAG = 'data-rtl-table';

        function processTables(root) {
            qsa(root, 'table').forEach(function (t) {
                if (t.getAttribute(TABLE_FLAG) === 'rtl') return;
                if (t.closest(EDITOR_SEL)) return;
                var headerCells = Array.prototype.slice.call(t.querySelectorAll('thead th'));
                if (!headerCells.length) {
                    var firstRow = t.querySelector('tr');
                    if (firstRow) headerCells = Array.prototype.slice.call(firstRow.querySelectorAll('th, td'));
                }
                var headerDirs = headerCells.map(function (c) { return cellDir(c.textContent || ''); });
                var rows = Array.prototype.slice.call(t.querySelectorAll('tbody tr'));
                if (!rows.length) rows = Array.prototype.slice.call(t.querySelectorAll('tr')).slice(1);
                var firstColDirs = rows.map(function (r) {
                    var cell = r.querySelector('th, td');
                    return cell ? cellDir(cell.textContent || '') : null;
                });
                if (tableDirFromCells(headerDirs, firstColDirs) === 'rtl') {
                    t.setAttribute(TABLE_FLAG, 'rtl');
                    t.dir = 'rtl';
                    t.style.direction = 'rtl';
                }
            });
        }

        function processText(root) {
            qsa(root, 'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, summary, label, dt, dd').forEach(function (el) {
                if (el.closest(EDITOR_SEL) || el.closest('pre') || el.closest('.code-block__code')) return;
                if (el.hasAttribute(RTL_SPLIT_FLAG)) return;
                var dir = detectElDir(el);
                if (dir) {
                    if (dir === 'rtl' && hasMultiScriptLines(el)) {
                        splitToDirectionalSpans(el);
                        return;
                    }
                    el.dir = dir;
                    el.style.direction = dir;
                    if (el.tagName === 'LI') {
                        el.style.listStylePosition = (dir === 'rtl') ? 'inside' : '';
                        var parentList = el.closest('ul, ol');
                        if (parentList && dir === 'rtl' && !parentList.hasAttribute('dir')) {
                            parentList.dir = 'rtl';
                            parentList.style.direction = 'rtl';
                            var pl = getComputedStyle(parentList).paddingLeft;
                            if (parseFloat(pl) > 0) { parentList.style.paddingRight = pl; parentList.style.paddingLeft = '0'; }
                        }
                    }
                } else {
                    resetDirOrPinLTR(el);
                    if (el.tagName === 'LI') el.style.listStylePosition = '';
                }
            });

            qsa(root, 'ul, ol').forEach(function (el) {
                if (el.closest(EDITOR_SEL) || el.closest('pre')) return;
                var dir = detectElDir(el);
                if (dir === 'rtl') {
                    el.dir = 'rtl';
                    el.style.direction = 'rtl';
                    var pl = getComputedStyle(el).paddingLeft;
                    if (parseFloat(pl) > 0) { el.style.paddingRight = pl; el.style.paddingLeft = '0'; }
                } else {
                    resetDirOrPinLTR(el);
                    el.style.paddingRight = ''; el.style.paddingLeft = '';
                }
            });
        }

        // Universal: process ANY leaf text container (dialogs, tooltips, etc.)
        function processContainers(root) {
            qsa(root, 'div, span, button, a, label').forEach(function (el) {
                if (el.closest('pre') || el.closest('code') || el.closest(EDITOR_SEL)) return;
                if (el.hasAttribute(RTL_SPLIT_FLAG)) return;
                if (el.hasAttribute(ISLAND_FLAG)) return;
                if (el.closest('.rtl-widget-container')) return; // never touch our own widget
                var parent = el.parentElement;
                if (parent && parent.hasAttribute(RTL_SPLIT_FLAG)) return;
                if (el.querySelector('p, div, ul, ol, h1, h2, h3, h4, h5, h6, pre, table')) return;
                if (/^(P|LI|H[1-6]|BLOCKQUOTE|TD|TH|UL|OL)$/.test(el.tagName)) return;
                var text = (el.textContent || '').trim();
                if (text.length < 2) return;
                if (hasRTL(text)) {
                    if (hasMultiScriptLines(el)) {
                        splitToDirectionalSpans(el);
                    } else {
                        el.dir = detectTextDir(text) || 'rtl';
                        el.style.textAlign = 'start';
                    }
                } else if (el.hasAttribute('dir')) {
                    el.removeAttribute('dir');
                    el.style.textAlign = '';
                }
            });
        }

        function processInput() {
            document.querySelectorAll(WRITING_SEL).forEach(function (input) {
                // The composer is the only rich-text input we direct. Never touch
                // inputs that live in the app chrome (e.g. sidebar search).
                if (input.closest(CHROME_SEL)) return;
                if (!promptRTL) {
                    input.removeAttribute(PROMPT_DIR_ATTR);
                    input.style.direction = '';
                    input.style.textAlign = '';
                    return;
                }
                var text = input.textContent || input.innerText || input.value || '';
                var dir = detectTextDir(text);
                if (dir === 'rtl') {
                    input.setAttribute(PROMPT_DIR_ATTR, 'rtl');
                    input.style.direction = 'rtl'; input.style.textAlign = 'right';
                } else {
                    input.setAttribute(PROMPT_DIR_ATTR, 'ltr');
                    input.style.direction = 'ltr'; input.style.textAlign = 'left';
                }
            });
        }

        function processAll() {
            if (!rtlEnabled) return;
            // Scope every pass to the conversation thread; leave app chrome LTR.
            conversationRoots().forEach(function (root) {
                isolateMath(root);
                processText(root);
                processContainers(root);
                processTables(root);
                forceCodeLTR(root);
            });
            processInput(); // composer lives outside the thread scroller
        }

        // Baseline stylesheet: isolate each prose block so an explicit dir chosen
        // by the detector remains authoritative, plus code/math LTR and table flip.
        // `unicode-bidi:plaintext` must only be used for blocks explicitly marked
        // as multi-line: on normal prose it re-detects the base direction from the
        // first strong character and defeats dir="rtl" for mixed sentences such as
        // "Shortlist باید Order را 10٪ افزایش بدهد."
        function injectBaselineStyles() {
            if (document.getElementById('codex-rtl-baseline')) return;
            var s = document.createElement('style');
            s.id = 'codex-rtl-baseline';
            // Broad isolation net on prose, but SCOPED to the conversation thread
            // (C) so the app chrome stays LTR. Codex renders chat text in div/span
            // (not semantic <p>), so span/div/[role="presentation"] must be included
            // or conversation text never auto-directs. The composer (a rich-text
            // editor outside the thread scroller) is covered by its own rule. The
            // code/island/table rules come AFTER and win on specificity
            // ([data-rtl-island] > span) or later cascade order (pre code
            // descendants), so isolation still overrides plaintext.
            var C = CONVERSATION_SEL + ' ';
            var prose = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span', 'div', '[role="presentation"]']
                .map(function (t) { return C + t; }).join(',');
            var codeSel = [C + 'pre', C + '.code-block__code', C + 'pre *', C + 'code *', C + 'pre span', C + 'code span', C + '[data-line] span'].join(',');
            s.textContent = [
                prose + '{unicode-bidi:isolate!important;text-align:start!important}',
                // Composer input (rich-text editor, lives outside the thread scroller).
                ACTIVE_EDITABLE_SEL + ' p,[data-lexical-text="true"],.ProseMirror p,[role="textbox"] p{unicode-bidi:isolate!important;text-align:start!important}',
                // Codex can put its own direction on Lexical paragraph/span nodes.
                // The root flag lets the detected prompt direction win throughout
                // the editor after typing or paste, without rewriting editor DOM.
                '[' + PROMPT_DIR_ATTR + '="rtl"],[' + PROMPT_DIR_ATTR + '="rtl"] p,[' + PROMPT_DIR_ATTR + '="rtl"] span,[' + PROMPT_DIR_ATTR + '="rtl"] [data-lexical-text="true"]{direction:rtl!important;text-align:right!important;unicode-bidi:isolate!important}',
                '[' + PROMPT_DIR_ATTR + '="ltr"],[' + PROMPT_DIR_ATTR + '="ltr"] p,[' + PROMPT_DIR_ATTR + '="ltr"] span,[' + PROMPT_DIR_ATTR + '="ltr"] [data-lexical-text="true"]{direction:ltr!important;text-align:left!important;unicode-bidi:isolate!important}',
                // Multi-line mixed-script blocks deliberately delegate each line to
                // the Unicode BiDi algorithm; the detector stamps this flag first.
                '[' + RTL_SPLIT_FLAG + ']{unicode-bidi:plaintext!important;text-align:start!important}',
                '.rtl-widget-container,.rtl-widget-container *{direction:ltr!important;text-align:left!important;unicode-bidi:isolate!important}',
                codeSel + '{unicode-bidi:isolate!important;direction:ltr!important;text-align:left!important}',
                C + 'code{unicode-bidi:isolate!important;direction:ltr!important}',
                '[data-rtl-island]{unicode-bidi:isolate!important;direction:ltr!important;text-align:left!important}',
                C + '.katex,' + C + '.katex-display,' + C + 'mjx-container{unicode-bidi:isolate!important;direction:ltr!important}',
                C + 'table[dir="rtl"]{direction:rtl!important}',
                C + 'ul[dir="rtl"],' + C + 'ol[dir="rtl"],' + C + '[dir="rtl"] ul,' + C + '[dir="rtl"] ol{padding-left:0!important;padding-right:1.25rem!important}'
            ].join('');
            document.head.appendChild(s);
        }

        function removeBaselineStyles() {
            var s = document.getElementById('codex-rtl-baseline');
            if (s && s.parentNode) s.parentNode.removeChild(s);
        }

        // Best-effort revert of everything the JS engine stamped, so toggling RTL
        // off actually returns the page to LTR (inline dir attrs would otherwise
        // linger). We only touch elements carrying our own flags/inline styles.
        function revertEngine() {
            removeBaselineStyles();
            var sel = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,summary,label,dt,dd,ul,ol,div,span,button,a,table,pre,code';
            document.querySelectorAll(sel).forEach(function (el) {
                if (el.closest('.rtl-widget-container')) return;
                if (el.hasAttribute(RTL_SPLIT_FLAG)) el.removeAttribute(RTL_SPLIT_FLAG);
                if (el.getAttribute(TABLE_FLAG)) el.removeAttribute(TABLE_FLAG);
                if (el.hasAttribute('dir')) el.removeAttribute('dir');
                el.style.direction = '';
                el.style.textAlign = '';
                el.style.unicodeBidi = '';
                el.style.paddingRight = '';
                el.style.paddingLeft = '';
                el.style.listStylePosition = '';
            });
            document.querySelectorAll('[' + ISLAND_FLAG + ']').forEach(function (span) {
                if (span.parentNode) {
                    span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
                }
            });
        }

        // ================= DYNAMIC CSS (fonts / line-height / force / master) =================
        var rtlStyle = document.createElement('style');
        rtlStyle.id = 'codex-rtl-style';

        function updateDynamicCSS() {
            if (!rtlEnabled) {
                if (rtlStyle.parentNode) rtlStyle.parentNode.removeChild(rtlStyle);
                return;
            }

            var faFontRule = '';
            var faFontName = "'PersianOnlyFont'";
            if (savedFaFont) {
                faFontName = "'UserPersianFont', 'PersianOnlyFont'";
                var baseFaFont = savedFaFont.replace(/[-\s]?Regular$/i, '');
                faFontRule =
                    "@font-face{font-family:'UserPersianFont';src:local('" + savedFaFont + "'),local('" + baseFaFont + "');font-weight:400;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;}" +
                    "@font-face{font-family:'UserPersianFont';src:local('" + baseFaFont + " Bold'),local('" + baseFaFont + "-Bold'),local('" + baseFaFont + "Bold');font-weight:700;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;}";
            }

            var enFontStr = savedEnFont ? "'" + savedEnFont + "', ui-sans-serif, system-ui, sans-serif" : 'ui-sans-serif, system-ui, sans-serif';
            var codeFontStr = savedCodeFont ? "'" + savedCodeFont + "', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" : 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

            // Everything the dynamic sheet does is scoped to the conversation (C)
            // plus the composer, so fonts / line-height / Force-RTL never touch the
            // app's own LTR chrome.
            var C = CONVERSATION_SEL + ' ';
            var COMPOSER = ACTIVE_EDITABLE_SEL + ',' + ACTIVE_EDITABLE_SEL + ' p,[data-lexical-text="true"],.ProseMirror,.ProseMirror p,[role="textbox"],[role="textbox"] p';

            var forceRtlStyle = forceRTL ? (
                [C + 'p', C + 'li', C + 'h1', C + 'h2', C + 'h3', C + 'h4', C + 'h5', C + 'h6', COMPOSER].join(',') +
                '{direction:rtl!important;text-align:right!important;unicode-bidi:isolate!important;}'
            ) : '';
            if (!promptRTL && forceRtlStyle) {
                forceRtlStyle = (
                    [C + 'p', C + 'li', C + 'h1', C + 'h2', C + 'h3', C + 'h4', C + 'h5', C + 'h6'].join(',') +
                    '{direction:rtl!important;text-align:right!important;unicode-bidi:isolate!important;}'
                );
            }

            rtlStyle.textContent = [
                faFontRule,
                "@font-face{font-family:'PersianOnlyFont';src:url('data:font/woff2;base64," + fontBase64 + "') format('woff2');font-weight:100 900;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF;}",
                // Font scoped to the conversation + composer (not :root), so chrome keeps its own font.
                CONVERSATION_SEL + ',' + CONVERSATION_SEL + ' *,' + COMPOSER + '{font-family:' + faFontName + ',' + enFontStr + ',"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"!important;}',
                ':root{--diffs-font-family:' + codeFontStr + '!important;--diffs-font-fallback:' + codeFontStr + '!important;}',
                '.rtl-widget-container,.rtl-widget-container *{direction:ltr!important;text-align:left!important;unicode-bidi:isolate!important;}',
                forceRtlStyle,
                C + 'pre,' + C + 'code,' + C + 'pre *,' + C + 'code *,' + C + '[data-line] span{font-family:' + codeFontStr + '!important;}',
                // Codex terminals are rendered outside the conversation scope.
                '.xterm-dom-renderer-owner-1 .xterm-rows{font-family:' + codeFontStr + '!important;}',
                [C + 'p', C + 'li', C + 'h1', C + 'h2', C + 'h3', ACTIVE_EDITABLE_SEL + ' p', '[data-lexical-text="true"]', '.ProseMirror p', '[role="textbox"] p'].join(',') + '{line-height:' + savedLH + '!important;}'
            ].join('\n');

            if (!rtlStyle.parentNode) document.head.appendChild(rtlStyle);
        }

        // ================= ENGINE LIFECYCLE =================
        var _obs = null;
        var _engineOn = false;

        function attachObserver() {
            if (_obs) return;
            var pendingMuts = [];
            function mutInsideEditor(m) {
                var t = m.target;
                var el = (t && t.nodeType === 1) ? t : (t ? t.parentElement : null);
                return !!(el && el.closest && el.closest(EDITOR_SEL));
            }
            _obs = new MutationObserver(function (muts) {
                if (!rtlEnabled) return;
                var relevant = [];
                for (var i = 0; i < muts.length; i++) {
                    var m = muts[i];
                    if (m.addedNodes.length === 0 && m.type !== 'characterData') continue;
                    if (mutInsideEditor(m)) continue;
                    // Only react to mutations inside the conversation thread -- app
                    // chrome (sidebar, menus) must stay LTR and never be reprocessed.
                    if (!inConversation(m.target)) continue;
                    // Ignore our own widget's mutations.
                    var tgt = m.target;
                    var tel = (tgt && tgt.nodeType === 1) ? tgt : (tgt ? tgt.parentElement : null);
                    if (tel && tel.closest && tel.closest('.rtl-widget-container')) continue;
                    relevant.push(m);
                }
                if (!relevant.length) return;
                for (var j = 0; j < relevant.length; j++) pendingMuts.push(relevant[j]);
                if (window._codexRtlT) return; // throttle
                window._codexRtlT = setTimeout(function () {
                    window._codexRtlT = null;
                    if (!rtlEnabled) { pendingMuts = []; return; }
                    var toProcess = pendingMuts;
                    pendingMuts = [];
                    var roots = new Set();
                    toProcess.forEach(function (m) {
                        m.addedNodes.forEach(function (n) { if (n.nodeType === 1) roots.add(n); });
                        if (m.type === 'characterData' && m.target.parentElement) roots.add(m.target.parentElement);
                    });
                    var expanded = new Set(roots);
                    roots.forEach(function (r) {
                        if (!r.closest) return;
                        var txt = r.closest('p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, summary, label, dt, dd');
                        if (txt) expanded.add(txt);
                        var list = r.closest('ul, ol');
                        if (list) expanded.add(list);
                        var tbl = r.closest('table');
                        if (tbl) expanded.add(tbl);
                    });
                    roots = expanded;
                    if (roots.size > 0 && roots.size <= 30) {
                        roots.forEach(function (r) {
                            isolateMath(r);
                            processText(r);
                            processContainers(r);
                            processTables(r);
                            forceCodeLTR(r);
                        });
                        processInput();
                    } else {
                        processAll();
                    }
                }, 50);
            });
            _obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        }

        function startEngine() {
            if (_engineOn) { updateDynamicCSS(); processAll(); return; }
            _engineOn = true;
            injectBaselineStyles();
            updateDynamicCSS();
            processAll();
            attachObserver();
        }

        function stopEngine() {
            _engineOn = false;
            updateDynamicCSS(); // removes dynamic sheet when rtlEnabled is false
            revertEngine();
        }

        // Global Shift+2 -> "@" fix for Persian keyboard layouts.
        document.addEventListener('keydown', function (e) {
            if (!fixAtSign) return;
            if (e.code === 'Digit2' && e.shiftKey) {
                if (e.key === '٬' || e.key === '،') {
                    e.preventDefault();
                    document.execCommand('insertText', false, '@');
                }
            }
        }, { capture: true });

        // Editor mutations are intentionally excluded from MutationObserver to
        // avoid fighting React/Lexical. The native input event is the safe signal
        // to recompute direction while the user types in the task composer.
        document.addEventListener('input', function (e) {
            var target = e.target;
            if (!target || !target.closest || !target.closest(WRITING_SEL)) return;
            processInput();
        }, { capture: true });

        // Persist config back to the main process via the console channel that
        // bin/index.js listens for (SAVE_RTL_CONFIG|<json>).
        function saveConfig() {
            console.log('SAVE_RTL_CONFIG|' + JSON.stringify({
                isRTL: rtlEnabled,
                forceRTL: forceRTL,
                promptRTL: promptRTL,
                fixAtSign: fixAtSign,
                faFont: savedFaFont,
                enFont: savedEnFont,
                codeFont: savedCodeFont,
                lh: savedLH
            }));
        }

        // ================= SETTINGS WIDGET (inlined by build-payload.mjs) =================
        // >>> inlined src/rtl-widget.js >>>
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
                '.rtl-widget-trigger:focus-visible,.rtl-close:focus-visible,.rtl-switch:focus-visible,.rtl-field:focus-visible,.rtl-reset:focus-visible,.rtl-repo-link:focus-visible{outline:3px solid color-mix(in srgb,var(--rtl-accent) 58%,white);outline-offset:3px}',
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
                '.rtl-widget-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 5px 3px}',
                '.rtl-widget-version{color:var(--rtl-muted);font-size:9px;letter-spacing:.05em}',
                '.rtl-repo-link{display:inline-flex;align-items:center;gap:6px;border-radius:8px;color:var(--rtl-text)!important;text-decoration:none!important;font-size:10px;font-weight:700}',
                '.rtl-repo-link:hover{color:var(--rtl-accent)!important}',
                '.rtl-repo-link svg{width:14px;height:14px}',
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
              <a class="rtl-repo-link" href="https://github.com/raminrzdh/Codex-RTL-Plus" target="_blank" rel="noopener noreferrer" aria-label="Open Codex RTL Plus repository on GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0C17.03 5.3 18 5.61 18 5.61c.63 1.58.23 2.75.12 3.04.73.8 1.17 1.82 1.17 3.08 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.14v3c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"/></svg>
                <span>GitHub repository</span>
              </a>
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

        // <<< inlined src/rtl-widget.js <<<

        // ================= INIT =================
        if (rtlEnabled) startEngine(); else updateDynamicCSS();
    } catch (e) {
        try { console.error('[Codex RTL]', e); } catch (_) {}
    }
})();
