// Cache-busted dynamic imports: jsdelivr/browsers cache static `import` specifiers
// hard (branch-alias staleness even after purge). A fresh query param per load
// forces a real fetch every time, so pushes to main show up immediately
const v = Date.now();

// Add a script here to have it loaded and initialized automatically
const modules = [
    { path: 'main', exportName: 'mainInit' },
    { path: 'menu', exportName: 'navBarMenu' },
    { path: 'swiper', exportName: 'swiperInit' },
    { path: 'works', exportName: 'works' },
    { path: 'form', exportName: 'form' },
    { path: 'faqs', exportName: 'faqs' },
    { path: 'footer-date', exportName: 'footerDate' },
];

let inits = [];
try {
    const loaded = await Promise.all(
        modules.map(({ path }) => import(`./${path}.js?v=${v}`))
    );
    inits = loaded.map((mod, i) => mod[modules[i].exportName]);
} catch (err) {
    console.error('Failed to load one or more scripts:', err);
}

window.tabletBreakpoint = 991;
window.mobileBreakpoint = 767;

function init() {
    document.fonts.ready.then(() => {
        inits.forEach((initFn) => initFn());
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

