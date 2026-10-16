# White-label Defaults

Shared JS/CSS asset bundle served via jsDelivr and embedded as custom code across Forwwward's Webflow sites. Rather than being built/bundled per project, this repo is loaded directly from the CDN, so every push to `main` should be treated as an immediate production deploy.

## How it loads

[`js/script-loader.js`](js/script-loader.js) is the single entry point embedded in Webflow. It:

- Cache-busts every module import with a `Date.now()` query param, so pushes to `main` show up immediately on jsDelivr without waiting on CDN/browser cache.
- Dynamically imports and initializes each feature module (`main`, `menu`, `swiper`, `works`, `form`, `faqs`, `footer-date`) once fonts are ready, on `DOMContentLoaded`.
- Exposes global breakpoints (`window.tabletBreakpoint = 991`, `window.mobileBreakpoint = 767`) for other modules to consume.

Add a new module to the `modules` array in `script-loader.js` to have it loaded and initialized automatically.

## Features

<!-- AUTO-GENERATED:FEATURES:START -->

_Regenerated automatically from the current contents of `js/` and `css/` on every push to `main` — see [`scripts/generate-readme.js`](scripts/generate-readme.js) and [`.github/workflows/update-readme.yml`](.github/workflows/update-readme.yml). Do not hand-edit inside this block; edit the script instead._

## JavaScript modules

### [`js/faqs.js`](js/faqs.js) — `faqs()`

- Initialize

### [`js/footer-date.js`](js/footer-date.js) — `footerDate()`

- Set dynamic date in Footer Components

### [`js/form-multistep-calendly.js`](js/form-multistep-calendly.js)

_Entire file is commented out — not currently active or wired into `script-loader.js`._

### [`js/form.js`](js/form.js) — `form()`

- Form validation
- Disable native HTML5 validation
- Find the field wrapper using jQuery
- Find the existing label-error-wrapper
- Append error to the existing wrapper
- Fallback to default behavior
- Radio Button
- Remove selected class from all s_cfo_radio elements
- Add selected class to the parent .s_cfo_radio of the checked input

### [`js/main.js`](js/main.js) — `mainInit()`

- LENIS
- Sync Lenis scrolling with ScrollTrigger
- This ensures Lenis's smooth scroll animation updates on each GSAP tick
- Disable lag smoothing in GSAP to prevent any delay in scroll animations
- FANCYBOX INIT
- Copy link share

### [`js/menu.js`](js/menu.js) — `navBarMenu()`

- NAV MENU
- Hide initially with class
- CLOSE MENU
- Restore scroll
- OPEN MENU
- Lock scroll
- Remove display none
- MENU - ACCORDION
- Initialize
- Run scroll logic on load in case page is opened mid-scroll

### [`js/swiper.js`](js/swiper.js) — `swiperInit()`

- Init all Swipers
- for screens 500px wide and up
- for screens 768px wide and up

### [`js/works.js`](js/works.js) — `works()`

_No inline section comments found — see source for details._

## Stylesheets

### [`css/faqs.css`](css/faqs.css)

Imported by `css/styles.css`.

### [`css/form-multistep-calendly.css`](css/form-multistep-calendly.css)

_Not currently imported by `css/styles.css` — verify it is still in use._

### [`css/menu.css`](css/menu.css)

Imported by `css/styles.css`.

### [`css/styles.css`](css/styles.css)

Root stylesheet.

<!-- AUTO-GENERATED:FEATURES:END -->

## Deployment

[`.github/workflows/purge-jsdelivr.yml`](.github/workflows/purge-jsdelivr.yml) runs on push to `main` (or manual dispatch): it diffs changed `.js`/`.css`/`.html` files and purges each from the jsDelivr CDN cache, so client sites pick up changes right away.

[`.github/workflows/update-readme.yml`](.github/workflows/update-readme.yml) runs on every push to `main` touching `js/**` or `css/**` (additions, edits, and deletions all count): it re-runs [`scripts/generate-readme.js`](scripts/generate-readme.js), which rescans those directories from scratch and rewrites the Features section above, then commits the result straight back to `main` if anything changed. No AI/API calls involved — it's a plain script, so there's no added cost beyond the CI minutes.

## Dependencies

Assumed to be loaded externally by the host page (not bundled here): jQuery + jQuery Validate, GSAP + ScrollTrigger, Lenis, Swiper, Fancybox, and Calendly's embed script.
