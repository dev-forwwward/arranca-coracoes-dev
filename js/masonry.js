// Gallery page masonry: .gallery-grid keeps its Webflow columns, but rows become 1px steps (masonry.css) and each
// .gallery-item spans its own height plus the gap. Webflow fixes the media boxes at 16:9, so each item's real ratio
// is read from its video (or image) and set as --masonry-ratio, which masonry.css applies to those boxes
const GRID = '.gallery-grid';
const ITEM = '.gallery-item';
const ROW = 1; // px, must match grid-auto-rows in masonry.css

const setRatio = (item, w, h) => {
    if (w && h) item.style.setProperty('--masonry-ratio', `${w} / ${h}`);
};

// The ratio lives on the item, so its height holds while the lightbox has borrowed the <video> (video-preview.js)
const watchMedia = (item) => {
    const video = item.querySelector('video');
    if (video) {
        const apply = () => {
            const { videoWidth: w, videoHeight: h } = video;
            setRatio(item, w, h);
            // Also on the wrapper video-preview.js moves into the lightbox, so it can open at the video's own ratio
            // instead of the default 16:9 box (masonry.css)
            const wrap = video.closest('.preview-video');
            if (wrap && w && h) {
                wrap.style.setProperty('--media-ratio', w / h);
                wrap.classList.add('has-media-ratio');
            }
        };
        // video-preview.js may set the src later; until the metadata arrives the item stays 16:9
        if (video.readyState >= 1) apply();
        else video.addEventListener('loadedmetadata', apply, { once: true });
        return;
    }
    // Skip Webflow's placeholder for an empty image field
    const img = item.querySelector('img:not(.w-dyn-bind-empty)');
    if (!img) return;
    const apply = () => setRatio(item, img.naturalWidth, img.naturalHeight);
    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
};

const layout = (grid) => {
    const gap = parseFloat(window.getComputedStyle(grid).columnGap) || 0;
    grid.querySelectorAll(ITEM).forEach((item) => {
        const height = item.getBoundingClientRect().height;
        // Hidden items (e.g. filtered out) measure 0: leave them unspanned
        item.style.gridRowEnd = height ? `span ${Math.ceil((height + gap) / ROW)}` : '';
    });
};

export function masonry() {
    const grids = document.querySelectorAll(GRID);
    if (!grids.length) return;

    // Batch bursts of size changes into one layout pass per grid per frame
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
        // Spans only change the item's grid area, not its own box (align-items: start), so this can't loop.
        // Covers window resizes, breakpoints, media ratios arriving and items shown/hidden
        const resizeObserver = new ResizeObserver(() => schedule(grid));

        const setupItems = () => {
            grid.querySelectorAll(`${ITEM}:not([data-masonry-ready])`).forEach((item) => {
                item.setAttribute('data-masonry-ready', '');
                watchMedia(item);
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
