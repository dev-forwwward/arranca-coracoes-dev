// Fancybox picks its html5video player and the <source type> from the file extension, so only formats every
// browser plays are accepted: .mov would get type="video/quicktime", which Chrome refuses to play
const VIDEO_EXT = /\.(mp4|webm)$/i;

// Validate a Dropbox video share link and turn it into a direct file URL.
// Accepted: file links (www.dropbox.com/scl/fi/<id>/<file>?rlkey=… — rlkey is required — or legacy /s/<id>/<file>)
// and direct links (dl.dropboxusercontent.com/…). Share links (…&st=…&dl=0) open Dropbox's preview page; raw=1 serves the file itself.
// Returns { url } or { error } describing what's wrong with the link
export const parseDropboxVideo = (src) => {
    let url;
    try {
        url = new URL(src.trim());
    } catch {
        return { error: 'not a valid URL' };
    }
    if (url.protocol !== 'https:') return { error: 'must be an https:// link' };

    const fileName = decodeURIComponent(url.pathname.split('/').pop() || '');
    const checkExt = () => VIDEO_EXT.test(fileName) ? null : { error: `"${fileName || url.pathname}" is not an .mp4 or .webm file` };

    if (url.hostname === 'dl.dropboxusercontent.com') return checkExt() || { url: url.toString() };
    if (!/^(www\.)?dropbox\.com$/.test(url.hostname)) return { error: 'not a Dropbox link' };

    if (/^\/(scl\/fo|sh)\//.test(url.pathname)) return { error: 'this is a folder link; share the video file itself' };
    const isNewFileLink = /^\/scl\/fi\/[^/]+\/[^/]+$/.test(url.pathname);
    const isLegacyFileLink = /^\/s\/[^/]+\/[^/]+$/.test(url.pathname);
    if (!isNewFileLink && !isLegacyFileLink) return { error: 'not a Dropbox file share link' };
    if (isNewFileLink && !url.searchParams.get('rlkey')) return { error: 'missing the rlkey parameter; copy the full share link' };

    const extError = checkExt();
    if (extError) return extError;

    url.searchParams.delete('dl');
    url.searchParams.delete('st');
    url.searchParams.set('raw', '1');
    return { url: url.toString() };
};

// Point a trigger at its data-video-src video. Poster: data-video-poster, else the given <img>, else the element's first <img>.
// Marks the element as processed either way; an invalid link is left untouched (and logged) so it doesn't open a broken slide.
// Returns true when the element now plays a video
let standaloneCount = 0;
const applyVideo = (el, posterImg) => {
    posterImg ??= el.querySelector('img');
    const src = el.getAttribute('data-video-src')?.trim();
    if (!src || el.hasAttribute('data-video-ready')) return el.getAttribute('data-video-ready') === 'valid';

    const { url, error } = parseDropboxVideo(src);
    if (error) {
        el.setAttribute('data-video-ready', 'invalid');
        console.warn(`Lightbox: ignoring data-video-src (${error}):`, src, el);
        return false;
    }
    el.setAttribute('data-video-ready', 'valid');
    // No data-type: it would skip Fancybox's extension-based detection and leave the <source> type empty
    el.setAttribute('data-src', url);
    const poster = el.getAttribute('data-video-poster') || posterImg?.getAttribute('src');
    if (poster) el.setAttribute('data-poster', poster);
    // A data-fancybox set in Webflow groups videos into one gallery; otherwise each video opens on its own
    if (!el.hasAttribute('data-fancybox')) el.setAttribute('data-fancybox', `video-${++standaloneCount}`);
    return true;
};

export function lightbox() {
    // Fancybox itself is loaded via page custom code and bound (delegated, on [data-fancybox]) in main.js
    if (typeof Fancybox === 'undefined') {
        if (document.querySelector('[data-video-src]')) console.warn('Fancybox is not loaded on this page; video lightboxes disabled');
        return;
    }

    // Image galleries: turn items into Fancybox triggers for their own image.
    // Omit `item` to make the `list` element itself the trigger; omit `image` to use its first <img>
    // `caption` is cloned as HTML, so the lightbox caption keeps the item's Webflow classes
    // An item with a valid data-video-src plays that video instead (its image becomes the poster)
    const galleries = [
        // Portfolio page: project info block under the image; data-video-src bound to the Work's Dropbox Link in Webflow
        { list: '.blog12_list', item: '.work_case_item', image: '.blog12_image', caption: '.row.space_between', group: 'portfolio' },
        // Gallery page
        { list: '.gallery-grid', item: '.gallery-item', image: '.gallery-image', group: 'gallery' },
        // Home page showreel
        { list: '.h_showreel_container', group: 'showreel' },
    ];

    galleries.forEach(({ list, item, image = 'img', caption, group }) => {
        const listEl = document.querySelector(list);
        if (!listEl) return;

        const setLightboxAttrs = () => {
            const items = item ? listEl.querySelectorAll(item) : [listEl];
            items.forEach(itemEl => {
                if (itemEl.hasAttribute('data-lightbox-ready')) return;
                const img = itemEl.querySelector(image);
                // Set the group first so applyVideo keeps it instead of making the video standalone
                const hadGroup = itemEl.hasAttribute('data-fancybox');
                if (!hadGroup) itemEl.setAttribute('data-fancybox', group);
                if (!applyVideo(itemEl, img)) {
                    if (!img) {
                        if (!hadGroup) itemEl.removeAttribute('data-fancybox');
                        return;
                    }
                    itemEl.setAttribute('data-src', img.getAttribute('src')); // src is the original upload
                }
                itemEl.setAttribute('data-lightbox-ready', '');
                const captionEl = caption && itemEl.querySelector(caption);
                if (captionEl) itemEl.setAttribute('data-caption', captionEl.outerHTML);
            });
        };
        setLightboxAttrs();
        // Catch items rendered later (e.g. Finsweet CMS Load pagination)
        new MutationObserver(setLightboxAttrs).observe(listEl, { childList: true });
    });

    // Any other element with data-video-src (galleries above have already claimed theirs)
    const setVideoTriggers = () => document.querySelectorAll('[data-video-src]:not([data-video-ready])').forEach(el => applyVideo(el));
    setVideoTriggers();
    new MutationObserver(setVideoTriggers).observe(document.body, { childList: true, subtree: true });
}
