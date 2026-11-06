import { parseDropboxVideo } from './lightbox.js';

// Home page hover previews: each .video-hover-container (CMS item) holds a poster image and a .video-preview-embed
// with a muted <video>. The embed binds the Work's Dropbox share link to data-preview-src; it's validated and turned
// into a direct file URL here before being used as src, so the browser never tries to play Dropbox's preview page.
// (Not data-video-src: lightbox.js claims every [data-video-src] element as a Fancybox trigger.)
// A src / <source src> set straight to a share link is still picked up and fixed, but costs one wasted request
const CONTAINER = '.video-hover-container';
const EMBED = '.video-preview-embed';

// Media fragment: makes the browser paint a frame before playback (Safari shows a blank video at t=0)
const PREVIEW_TIME = 0.1;

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
    // Buffer the whole preview up front so it plays instantly on first hover, not just the first frame
    video.preload = 'auto';
    video.src = `${url}#t=${PREVIEW_TIME}`;
    video.load();
    video.setAttribute('data-preview-ready', 'valid');

    const container = video.closest(CONTAINER) || video.closest(EMBED);
    const play = () => {
        video.play().then(() => container.classList.add('is-playing')).catch(() => {});
    };
    const stop = () => {
        video.pause();
        video.currentTime = PREVIEW_TIME;
        container.classList.remove('is-playing');
    };

    // Devices without hover (touch) play the preview while it's on screen instead
    if (window.matchMedia('(hover: hover)').matches) {
        container.addEventListener('mouseenter', play);
        container.addEventListener('mouseleave', stop);
    } else {
        new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : stop()), { threshold: 0.5 }).observe(container);
    }
};

export function videoPreview() {
    const embeds = document.querySelectorAll(EMBED);
    if (!embeds.length) return;
    embeds.forEach(embed => embed.querySelectorAll('video').forEach(setupVideo));
}
