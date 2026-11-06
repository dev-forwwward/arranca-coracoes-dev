import { parseDropboxVideo } from './lightbox.js';

// Home page hover previews: each .video-hover-container (CMS item) holds a poster image and a .video-preview-embed
// with a muted <video>. The embed binds the Work's Dropbox share link to data-preview-src; it's validated and turned
// into a direct file URL here before being used as src, so the browser never tries to play Dropbox's preview page.
// (Not data-video-src: lightbox.js claims every [data-video-src] element as a Fancybox trigger.)
// A src / <source src> set straight to a share link is still picked up and fixed, but costs one wasted request
const CONTAINER = '.video-hover-container';
const EMBED = '.video-preview-embed';
const ALWAYS_ON = `${EMBED}.always-on`;

// Without a poster: media fragment that makes the browser paint a frame before playback (Safari shows a blank video at t=0)
const PREVIEW_TIME = 0.1;

let previewCount = 0;

const setupVideo = (video) => {
    if (video.hasAttribute('data-preview-ready')) return;
    const source = video.querySelector('source');
    const raw = video.getAttribute('data-preview-src') || source?.getAttribute('src') || video.getAttribute('src');
    if (!raw?.trim()) return;

    // Drop whatever the embed set directly, so only the formatted URL is ever requested
    source?.remove();
    video.removeAttribute('src');

    const { url, error } = parseDropboxVideo(raw);
    if (error) {
        video.setAttribute('data-preview-ready', 'invalid');
        console.warn(`Video preview: ignoring link (${error}):`, raw, video);
        return;
    }

    // Autoplay rules: only muted + inline videos may be started from script without a click
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('data-preview-ready', 'valid');
    // A failed load leaves the video blank with no other sign; say which link broke
    video.addEventListener('error', () => console.warn('Video preview: failed to load', url, video.error, video));

    const container = video.closest(CONTAINER) || video.parentElement;

    // With a poster (set in the embed) there's no blank video to cover, so play from the very start
    const startTime = video.getAttribute('poster') ? 0 : PREVIEW_TIME;

    const load = () => {
        if (video.getAttribute('src')) return;
        video.preload = 'auto';
        video.src = startTime ? `${url}#t=${startTime}` : url;
        video.load();
    };

    // Featured previews (.video-preview-embed) buffer in full on page load so they play instantly.
    // Any other list (e.g. the Works list, ~65 items via CMS Load) loads each video only as it nears the viewport:
    // dozens of full Dropbox downloads at once split the bandwidth (and can get throttled), leaving most of them blank
    if (video.closest(EMBED)) {
        load();
    } else {
        video.preload = 'none';
        const io = new IntersectionObserver((entries) => {
            if (!entries.at(-1).isIntersecting) return;
            io.disconnect();
            load();
        }, { rootMargin: '50% 0px' });
        io.observe(container);
    }
    // Wrapper the lightbox can move: Fancybox wraps a bare <video> in a new div and puts *that* div back on close
    const wrap = document.createElement('div');
    wrap.className = 'preview-video';
    wrap.id = `preview-video-${++previewCount}`;
    video.before(wrap);
    wrap.appendChild(video);
    const inLightbox = () => wrap.classList.contains('fancybox__content');

    // .video-preview-embed.always-on: plays on loop by itself instead of on hover (any number per page)
    const alwaysOn = !!video.closest(ALWAYS_ON);
    let onScreen = false;

    const play = () => {
        if (inLightbox()) return;
        load(); // in case the hover beats the viewport observer
        video.play().then(() => container.classList.add('is-playing')).catch(() => {});
    };
    const stop = () => {
        // Opening the lightbox over the item fires mouseleave; the video is playing in there now
        if (inLightbox()) return;
        video.pause();
        video.currentTime = startTime;
        container.classList.remove('is-playing');
    };

    // Lightbox hand-off: when the item's lightbox would play this same video (lightbox.js set its data-src from the
    // item's data-video-src), open this <video> instead, as Fancybox inline content. It carries on from where the hover
    // preview was, with the data already buffered, instead of Fancybox starting a second download in a new player
    const trigger = video.closest('[data-fancybox]');
    if (trigger && trigger.getAttribute('data-src') === url) {
        trigger.setAttribute('data-src', `#${wrap.id}`);
        trigger.setAttribute('data-type', 'inline');

        // lightbox:show / lightbox:hide are dispatched on the slide content by the Fancybox options in main.js
        wrap.addEventListener('lightbox:show', () => {
            load();
            video.controls = true;
            video.muted = false;
            container.classList.remove('is-playing');
            // Unmuted play needs a user gesture; if the browser still refuses, play muted (controls can unmute)
            video.play().catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
        });
        wrap.addEventListener('lightbox:hide', () => {
            video.pause();
            video.muted = true;
        });

        // Back in the item: Fancybox hid the wrapper (display: none) before moving it back in a setTimeout;
        // ours is queued after it, so the wrapper is home by the time it's reset to the preview state
        // (Also covers neighbouring slides Fancybox preloaded but never showed)
        let moved = false;
        new MutationObserver(() => {
            if (inLightbox()) {
                moved = true;
                return;
            }
            if (!moved) return;
            moved = false;
            setTimeout(() => {
                wrap.style.display = '';
                video.controls = false;
                video.muted = true;
                // Always-on: back to looping (if on screen), from where the lightbox left it
                if (alwaysOn) {
                    if (onScreen) play();
                    return;
                }
                video.pause();
                video.currentTime = startTime;
            });
        }).observe(wrap, { attributes: true, attributeFilter: ['class'] });
    }

    if (alwaysOn) {
        // Loops with no interaction; paused while scrolled out of view, so several of them on a page don't keep
        // decoding off screen. The observer reports right away, and play() before any data arrives just waits for it
        new IntersectionObserver((entries) => {
            onScreen = entries.at(-1).isIntersecting;
            if (onScreen) play();
            else if (!inLightbox()) video.pause();
        }).observe(container);
    } else if (window.matchMedia('(hover: hover)').matches) {
        container.addEventListener('mouseenter', play);
        container.addEventListener('mouseleave', stop);
    } else {
        // Devices without hover (touch) play the preview while it's on screen instead
        // A fast scroll can queue several entries for the same container; the last one is the current state
        new IntersectionObserver((entries) => (entries.at(-1).isIntersecting ? play() : stop()), { threshold: 0.5 }).observe(container);
    }
};

// Any video carrying data-preview-src, whatever its embed's class (e.g. .blog12_video in the Works list),
// plus videos inside .video-preview-embed that set the link as src / <source src>
const VIDEOS = `video[data-preview-src], ${EMBED} video`;

export function videoPreview() {
    const setupAll = () => document.querySelectorAll(`:is(${VIDEOS}):not([data-preview-ready])`).forEach(setupVideo);
    setupAll();
    // Catch items rendered later (Finsweet CMS Load pagination / CMS Filter)
    new MutationObserver(setupAll).observe(document.body, { childList: true, subtree: true });
}
