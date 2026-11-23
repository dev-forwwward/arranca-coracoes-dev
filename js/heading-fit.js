// Portfolio rows (the list, and the lightbox caption, which clones the row): balanced text layout, ported from the
// portfolio prototype (Portfolio prototype/website test/script.js). Webflow markup:
//   .blog12_item-row-container
//     ├ .blog12_item-row-container-inner-main-row   [ big (client)    , small (title)   ]
//     └ .row                                         [ small (producer), big (director) ]
//
// Side by side (desktop):
//  1. Big text wraps in BALANCED lines (the shortest possible longest line for its line count), with explicit <br>s
//     computed from measured word widths. 1 word = 1 line, more words = 2 lines; 3 only when that helps the row.
//  2. Small text takes 1 or 2 balanced lines and sits beside the LAST line of the big text, baseline to baseline,
//     tucked under the big text's longer lines (negative margin) instead of beside the whole block.
//  3. The left/right combination is scored per row: line rules first, then a comfortable gap between the sides, each
//     side within half the row, fewest lines, narrowest. If nothing fits side by side, the right side stacks under.
//  Lightbox caption: the info hangs in the band under the video, which has room for 3 lines of big text, so a
//  caption never uses more than 3 and never stacks.
//
// Stacked layouts (tablet/mobile, where Webflow puts big and small text in a column) keep the earlier fit: each text
// box hugs its longest line, and a caption heading over 3 lines gets just enough extra width to fit in 3.
// Without this script (or before it runs), styles.css (PORTFOLIO LIST) still gives a sensible layout.
const ROW = '.blog12_item-row-container';
const BLOCKS = ['.blog12_item-row-container-inner-main-row', '.row']; // left, right: direct children of the row
const HEADING = '.heading-style-h3_custom'; // big text
const SUBTITLE = '.work-lower-text'; // small text
const CAPTION = '.fancybox__caption';

const MAX_LINES = 3; // caption: big-text lines that fit in the band under the video
// Small text: 1 word = 1 line, more = 2 (smallOk). A 3rd line is only a fallback for tight rows (narrow desktop,
// tablet): it breaks the small-text rule, which ranks below the big-text rule, so it's only picked when it saves
// the big text a 4th line (the earlier fit's order: small text wraps first, headings after)
const MAX_SMALL_LINES = 3;
const MAX_SHARE = 0.5; // preferred max width of one side, as a share of the row
const COMFORT_GAP = 56; // preferred minimum space between the two sides, in px

const splitWords = (t) => t.split(/\s+/).filter(Boolean);
// Keep "&" and dashes on the line of the word before them, so a line never starts with one
const glue = (words) => words.reduce((out, w) => {
    if (/^[&–—-]$/.test(w) && out.length) out[out.length - 1] += ` ${w}`;
    else out.push(w);
    return out;
}, []);

// ---- Measuring ------------------------------------------------------------------------------------------------
// Word widths per font, measured once each in a hidden clone of a real element, so they get the site's real text
// styles (font, letter-spacing, text-transform). The font key changes with the breakpoint font sizes
const wordWidths = new Map();
const fontKey = (el) => {
    const c = window.getComputedStyle(el);
    return [c.fontStyle, c.fontWeight, c.fontSize, c.fontFamily, c.letterSpacing, c.textTransform].join('|');
};
const measurer = (proto, words) => {
    const key = fontKey(proto);
    const missing = [...new Set([...words, ' '])].filter((w) => !wordWidths.has(`${key}|${w}`));
    if (missing.length) {
        const box = proto.cloneNode(false);
        // pre: keeps the lone space's width (normal white-space drops a space at the end of a line)
        box.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;width:auto;max-width:none';
        const spans = missing.map((w) => {
            const span = document.createElement('span');
            span.textContent = w;
            box.append(span, document.createElement('br'));
            return [w, span];
        });
        proto.parentElement.appendChild(box);
        spans.forEach(([w, span]) => wordWidths.set(`${key}|${w}`, span.getBoundingClientRect().width));
        box.remove();
    }
    return (w) => wordWidths.get(`${key}|${w}`);
};

// ---- Wrapping -------------------------------------------------------------------------------------------------
// Balanced wrap into at most n lines: the narrowest max line width whose greedy wrap still fits in n lines
const balanced = (ws, space, n) => {
    const greedy = (max) => {
        const lines = [[]];
        let x = 0;
        ws.forEach((w, i) => {
            if (lines.at(-1).length && x + space + w > max) {
                lines.push([]);
                x = 0;
            }
            x += (lines.at(-1).length ? space : 0) + w;
            lines.at(-1).push(i);
        });
        return lines;
    };
    let lo = Math.max(...ws);
    let hi = ws.reduce((t, w) => t + w, 0) + space * (ws.length - 1);
    while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        if (greedy(mid).length <= n) hi = mid;
        else lo = mid;
    }
    const lines = greedy(hi);
    return { lines, widths: lines.map((l) => l.reduce((t, i) => t + ws[i], 0) + space * (l.length - 1)) };
};

// Every distinct balanced wrap of a word list, in 1..maxLines lines
const wraps = (words, ws, space, maxLines) => {
    const out = [];
    const seen = new Set();
    for (let n = 1; n <= Math.min(maxLines, words.length); n++) {
        const { lines, widths } = balanced(ws, space, n);
        const key = lines.map((l) => l.join(',')).join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ text: lines.map((l) => l.map((i) => words[i])), widths });
    }
    return out;
};

// ---- Side-by-side layout --------------------------------------------------------------------------------------
// Every way one side (big + small text) can be laid out, with the resulting width
const blockStates = (b, inCaption) => {
    const bigWords = glue(splitWords(b.bigText));
    const smallWords = splitWords(b.smallText);
    const bigWidth = measurer(b.big, bigWords);
    let bigWraps = wraps(bigWords, bigWords.map(bigWidth), bigWidth(' '), bigWords.length);
    if (inCaption) {
        const fitting = bigWraps.filter((w) => w.text.length <= MAX_LINES);
        if (fitting.length) bigWraps = fitting;
    }
    let smallWraps = [null];
    if (b.small && smallWords.length) {
        const smallWidth = measurer(b.small, smallWords);
        smallWraps = wraps(smallWords, smallWords.map(smallWidth), smallWidth(' '), MAX_SMALL_LINES);
    }
    const states = [];
    for (const big of bigWraps) {
        for (const small of smallWraps) {
            const bigMax = Math.max(...big.widths);
            // Big lines the small text sits beside: up to 2 small lines fit within the big text's last line; a 3rd
            // reaches up into the line above, so then it clears the last two
            const beside = Math.max(...big.widths.slice(small && small.text.length > 2 ? -2 : -1));
            const smallMax = small ? Math.max(...small.widths) : 0;
            states.push({
                big: big.text,
                small: small && small.text,
                tuck: small ? bigMax - beside : 0, // how far the small text slides under the big text's longer lines
                width: Math.ceil(Math.max(bigMax, small ? beside + b.gap + smallMax : 0)),
                bigLines: big.text.length,
                smallLines: small ? small.text.length : 1,
                // Line rule: big text with more than one word takes 2 lines (3 allowed, see fitSideBySide); 1 word, 1 line
                ruleOk: big.text.length === (bigWords.length > 1 ? 2 : 1),
                smallOk: !small || small.text.length === (smallWords.length > 1 ? 2 : 1), // same rule for small text
                multi: bigWords.length > 1,
            });
        }
    }
    return states;
};

// Explicit lines as text nodes and <br>s (CMS text never goes through HTML parsing)
const setLines = (el, lines) => el.replaceChildren(...lines.flatMap((l, i) => (i ? [document.createElement('br'), l.join(' ')] : [l.join(' ')])));

const apply = (b, st) => {
    // Explicit lines, no wrapping: the box is exactly as wide as its longest line
    setLines(b.big, st.big);
    Object.assign(b.big.style, { whiteSpace: 'nowrap', maxWidth: 'none', width: 'auto', flex: 'none' });
    if (b.small && !st.small) {
        b.small.style.display = 'none'; // empty (e.g. no producer): its flex gap would push the big text
    } else if (b.small) {
        setLines(b.small, st.small);
        Object.assign(b.small.style, {
            whiteSpace: 'nowrap',
            maxWidth: 'none',
            width: 'auto',
            flex: 'none',
            // Webflow bottom-aligns it (align-self: flex-end + a padding nudge); the block's baseline alignment replaces that
            alignSelf: 'auto',
            paddingBottom: '0',
            // The small text is left of the big text on the right side, right of it on the left side
            [b.smallFirst ? 'marginRight' : 'marginLeft']: `${-st.tuck}px`,
        });
    }
    Object.assign(b.el.style, {
        alignItems: 'last baseline', // the big text's last line and the small text's last line share a baseline
        flex: 'none',
        width: `${st.width}px`,
        // Right side: keep the big text flush right even when the tucked small text leaves the block room to spare
        justifyContent: b.smallFirst ? 'flex-end' : '',
    });
};

const fitSideBySide = (row, blocks, inCaption) => {
    const rowGap = parseFloat(window.getComputedStyle(row).columnGap) || 0;
    const room = row.clientWidth - (blocks.length > 1 ? rowGap : 0);
    const sets = blocks.map((b) => blockStates(b, inCaption));
    // 3 big-text lines are allowed too, but only get picked when they fix a side that is too wide or leave a
    // comfortable gap between the two sides (scoring below)
    const okFor = (st) => st.ruleOk || (st.multi && st.bigLines === 3);
    let best = null;
    const consider = (combo) => {
        const total = combo.reduce((t, s) => t + s.width, 0);
        const fits = total <= room;
        const broken = combo.filter((s) => !okFor(s)).length;
        const smallBroken = combo.filter((s) => !s.smallOk).length;
        const cramped = combo.length > 1 && room + rowGap - total < COMFORT_GAP ? 1 : 0;
        const wide = combo.length > 1 ? combo.filter((s) => s.width > room * MAX_SHARE).length : 0;
        const lines = (key) => combo.reduce((t, s) => t + s[key], 0);
        // Fits: rules, then not cramped, then each side within half the row, fewest lines, narrowest.
        // Doesn't fit: narrowest
        const score = fits
            ? [0, broken, smallBroken, cramped, wide, lines('bigLines'), lines('smallLines'), total]
            : [1, total, 0, 0, 0, 0, 0, 0];
        const better = !best || score.some((v, k) => score.slice(0, k).every((u, j) => u === best.score[j]) && v < best.score[k]);
        if (better) best = { combo, score };
    };
    if (sets.length === 1) sets[0].forEach((s) => consider([s]));
    else for (const a of sets[0]) for (const c of sets[1]) consider([a, c]);

    // Nothing fits side by side (e.g. a long single word plus its small text): stack the right side under the left
    // one, each laid out on its own, rather than overflow the row. Never in the caption (no room under the video)
    const stacked = best.score[0] === 1 && blocks.length > 1 && !inCaption;
    if (stacked) {
        const cmp = (a, b) => (a.ruleOk ? 0 : 1) - (b.ruleOk ? 0 : 1) || (a.smallOk ? 0 : 1) - (b.smallOk ? 0 : 1)
            || a.bigLines - b.bigLines || a.smallLines - b.smallLines || a.width - b.width;
        const pick = (S) => [...S].filter((s) => s.width <= row.clientWidth).sort(cmp)[0] || [...S].sort((a, b) => a.width - b.width)[0];
        best = { combo: sets.map(pick) };
    }
    blocks.forEach((b, i) => apply(b, best.combo[i]));
    if (stacked) {
        Object.assign(row.style, { flexWrap: 'wrap', rowGap: `${rowGap}px` });
        blocks[1].el.style.marginLeft = 'auto';
    }
};

// ---- Stacked layout (earlier fit) ------------------------------------------------------------------------------
// Widest rendered line: the range gives one rect per line fragment, grouped here by line
const longestLine = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const lines = new Map();
    for (const { top, left, right, width } of range.getClientRects()) {
        if (!width) continue;
        const key = Math.round(top);
        const line = lines.get(key);
        lines.set(key, line ? { left: Math.min(line.left, left), right: Math.max(line.right, right) } : { left, right });
    }
    let max = 0;
    lines.forEach(({ left, right }) => { max = Math.max(max, right - left); });
    return max;
};

// Hug the longest line, if the text wrapped and left its box wider than that
const hug = (el) => {
    const width = longestLine(el);
    if (width && width < el.getBoundingClientRect().width - 0.5) {
        el.style.width = `${Math.ceil(width)}px`;
    }
};

// Rendered lines: one top per line, give or take rounding between a line's fragments
const lineCount = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = [...range.getClientRects()].filter((r) => r.width).map((r) => r.top).sort((a, b) => a - b);
    return tops.filter((top, i) => i === 0 || top - tops[i - 1] > 2).length;
};

// Caption heading over MAX_LINES: lift the max-width, then narrow it back down to the narrowest width that still fits
const widen = (el) => {
    if (lineCount(el) <= MAX_LINES) return;
    let lo = el.getBoundingClientRect().width; // too narrow
    el.style.maxWidth = 'none';
    // Even all the room the row can give isn't enough: leave it with all of it
    if (lineCount(el) > MAX_LINES) return;
    let hi = el.getBoundingClientRect().width; // wide enough
    while (hi - lo > 1) {
        const mid = (lo + hi) / 2;
        el.style.maxWidth = `${mid}px`;
        if (lineCount(el) <= MAX_LINES) hi = mid;
        else lo = mid;
    }
    el.style.maxWidth = `${Math.ceil(hi)}px`;
};

const fitStacked = (el, inCaption) => {
    const headings = el.querySelectorAll(HEADING);
    const subtitles = el.querySelectorAll(SUBTITLE);
    if (inCaption) headings.forEach(widen);
    // Headings first: the space they give back can unwrap a subtitle. Second pass: in a tight row flex can still
    // squeeze a box below the width set, rewrapping it narrower again. Each pass only narrows, so two settle it
    for (let pass = 0; pass < 2; pass++) {
        headings.forEach(hug);
        subtitles.forEach(hug);
    }
};

// ---- Row -------------------------------------------------------------------------------------------------------
// Back to the Webflow text and styles, so every fit starts from the same state
const reset = (row, el, big, small) => {
    row.removeAttribute('style');
    el.removeAttribute('style');
    big.textContent = big.dataset.text;
    big.removeAttribute('style');
    if (small) {
        small.textContent = small.dataset.text;
        small.removeAttribute('style');
    }
};

const fit = (row) => {
    if (!row.clientWidth) return; // hidden (filtered out, not shown yet): the observer fits it once it has a size
    const inCaption = !!row.closest(CAPTION);
    const blocks = [];
    BLOCKS.forEach((sel) => {
        const el = row.querySelector(`:scope > ${sel}`);
        const big = el?.querySelector(HEADING);
        if (!big) return;
        const small = el.querySelector(SUBTITLE);
        // The original text, kept as an attribute: the line breaks added below would merge words in textContent.
        // A caption cloned from an already fitted row carries it over
        big.dataset.text ??= big.textContent.replace(/\s+/g, ' ').trim();
        if (small) small.dataset.text ??= small.textContent.replace(/\s+/g, ' ').trim();
        reset(row, el, big, small);
        const style = window.getComputedStyle(el);
        if (style.display === 'none') return;
        if (style.flexDirection !== 'row') {
            fitStacked(el, inCaption);
            return;
        }
        blocks.push({
            el,
            big,
            small,
            bigText: big.dataset.text,
            smallText: small ? small.dataset.text : '',
            smallFirst: !!small && !!(small.compareDocumentPosition(big) & Node.DOCUMENT_POSITION_FOLLOWING),
            gap: parseFloat(style.columnGap) || 0,
        });
    });
    if (blocks.length) fitSideBySide(row, blocks, inCaption);
};

export function headingFit() {
    if (!document.querySelector(ROW)) return;

    // Batch bursts of resizes into one pass per frame
    const dirty = new Set();
    let frame = null;
    const schedule = (row) => {
        dirty.add(row);
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = null;
            dirty.forEach((row) => {
                try {
                    fit(row);
                } catch (err) {
                    console.error('headingFit: layout failed for a row', err, row);
                }
            });
            dirty.clear();
        });
    };

    // Rows follow their parent's width; fitting only changes their height, and refitting at the same width gives
    // the same result, so this settles after one extra pass
    const resizeObserver = new ResizeObserver((entries) => entries.forEach(({ target }) => schedule(target)));
    // Tracked here, not with an attribute: a lightbox caption is cloned from a row's HTML and must still get set up
    const observed = new WeakSet();
    const setupRows = () => {
        document.querySelectorAll(ROW).forEach((row) => {
            if (observed.has(row)) return;
            observed.add(row);
            resizeObserver.observe(row);
        });
    };

    setupRows();
    // Catch rows rendered later (Finsweet CMS Load, lightbox captions)
    new MutationObserver(setupRows).observe(document.body, { childList: true, subtree: true });

    console.log('Loading headingFit()');
}
