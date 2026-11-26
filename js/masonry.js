// Gallery page masonry: .gallery-grid keeps its Webflow columns, but rows become 1px steps (masonry.css) and each
// .gallery-item spans its own height plus the gap. Webflow fixes the media boxes at 16:9, so each item's real ratio
// is read from its video (or image) and set as --masonry-ratio, which masonry.css applies to those boxes.
//
// The span is computed from the item's width and media ratio, never from its rendered height, so a span can't feed
// back into the next one. Safari also needs min-width: 0 on the items (masonry.css), or spans widen the columns
const GRID = '.gallery-grid';
const ITEM = '.gallery-item';
const ROW = 1; // px, must match grid-auto-rows in masonry.css
const FALLBACK_RATIO = 16 / 9; // Webflow's default media box, used until the real ratio is known

const ratios = new WeakMap(); // item -> width / height of its media

const setRatio = (item, w, h, onChange) => {
    if (!w || !h) return;
    ratios.set(item, w / h);
    item.style.setProperty('--masonry-ratio', `${w} / ${h}`);
    onChange();
};

// The ratio lives on the item, so its height holds while the lightbox has borrowed the <video> (video-preview.js)
const watchMedia = (item, onChange) => {
    const video = item.querySelector('video');
    if (video) {
        const apply = () => setRatio(item, video.videoWidth, video.videoHeight, onChange);
        // video-preview.js may set the src later; until the metadata arrives the item stays 16:9
        if (video.readyState >= 1) apply();
        else video.addEventListener('loadedmetadata', apply, { once: true });
        return;
    }
    // Skip Webflow's placeholder for an empty image field
    const img = item.querySelector('img:not(.w-dyn-bind-empty)');
    if (!img) return;
    const apply = () => setRatio(item, img.naturalWidth, img.naturalHeight, onChange);
    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener('load', apply, { once: true });
};

const layout = (grid) => {
    const gap = parseFloat(window.getComputedStyle(grid).columnGap) || 0;
    grid.querySelectorAll(ITEM).forEach((item) => {
        // Width comes from the column, so it doesn't depend on the span. Hidden items (e.g. filtered out) measure 0:
        // leave them unspanned
        const width = item.getBoundingClientRect().width;
        if (!width) {
            item.style.gridRowEnd = '';
            return;
        }
        const height = width / (ratios.get(item) || FALLBACK_RATIO);
        item.style.gridRowEnd = `span ${Math.ceil((height + gap) / ROW)}`;
    });
};

export function masonry() {
    const grids = document.querySelectorAll(GRID);
    if (!grids.length) return;

    // Batch bursts of changes into one layout pass per grid per frame
    const dirty = new Set();
    let frame = null;
    const schedule = (grid) => {
        dirty.add(grid);
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = null;
            dirty.forEach(layout);
            dirty.clear();
        });
    };

    grids.forEach((grid) => {
        // Covers window resizes, breakpoints and items shown/hidden. Spans only depend on width and ratio, so a
        // height change caused by a span recomputes the same spans and settles instead of looping
        const resizeObserver = new ResizeObserver(() => schedule(grid));
        const onChange = () => schedule(grid);

        const setupItems = () => {
            grid.querySelectorAll(`${ITEM}:not([data-masonry-ready])`).forEach((item) => {
                item.setAttribute('data-masonry-ready', '');
                watchMedia(item, onChange);
                resizeObserver.observe(item);
            });
            schedule(grid);
        };

        grid.classList.add('is-masonry');
        setupItems();
        // Catch items rendered later (Finsweet CMS Load infinite mode)
        new MutationObserver(setupItems).observe(grid, { childList: true });
    });

    console.log('Loading masonry()');
}
