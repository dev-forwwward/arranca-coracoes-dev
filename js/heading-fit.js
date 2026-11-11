// Portfolio rows: once a heading or subtitle wraps, its box stays at its max/available width (styles.css, PORTFOLIO
// LIST) instead of hugging the longest line, which leaves a gap next to it. Shrink each one to its longest line.
// Covers the portfolio list and the lightbox caption (a clone of the row)
const ROW = '.blog12_item-row-container';
const HEADING = '.heading-style-h3_custom';
const SUBTITLE = '.work-lower-text';

// Lightbox caption: the info hangs in the band under the video, which only has room for 3 lines of heading.
// A heading that would wrap to more gets just enough extra width (out of the gap between the row's two sides) to fit
// in 3. Every other heading, and the portfolio list, keep the usual 6.3em measure (styles.css)
const CAPTION = '.fancybox__caption';
const MAX_LINES = 3;

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
    // Hidden rows (filtered out, not yet shown) measure 0
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

// Over MAX_LINES: lift the max-width, then narrow it back down to the narrowest width that still fits
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

const fit = (row) => {
    const headings = row.querySelectorAll(HEADING);
    const subtitles = row.querySelectorAll(SUBTITLE);
    // Let everything wrap at its natural width first
    headings.forEach((el) => { el.style.width = ''; el.style.maxWidth = ''; });
    subtitles.forEach((el) => { el.style.width = ''; });
    if (row.closest(CAPTION)) headings.forEach(widen);
    // Headings first: the space they give back can unwrap a subtitle, so subtitles are measured after
    // Second pass: in a tight row flex can still squeeze a box below the width set, rewrapping it narrower again.
    // Each pass only narrows, so two settle it
    for (let pass = 0; pass < 2; pass++) {
        headings.forEach(hug);
        subtitles.forEach(hug);
    }
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
            dirty.forEach(fit);
            dirty.clear();
        });
    };

    // Rows follow their parent's width, so fitting their text (which only changes row height) can't loop
    const resizeObserver = new ResizeObserver((entries) => entries.forEach(({ target }) => schedule(target)));
    const setupRows = () => {
        document.querySelectorAll(`${ROW}:not([data-heading-fit])`).forEach((row) => {
            row.setAttribute('data-heading-fit', '');
            resizeObserver.observe(row);
        });
    };

    setupRows();
    // Catch rows rendered later (Finsweet CMS Load, lightbox captions)
    new MutationObserver(setupRows).observe(document.body, { childList: true, subtree: true });

    console.log('Loading headingFit()');
}
