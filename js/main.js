export function mainInit() {

    // LENIS
    window.lenis = new Lenis(); // globally available

    // Sync Lenis scrolling with ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
    // This ensures Lenis's smooth scroll animation updates on each GSAP tick
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // Disable lag smoothing in GSAP to prevent any delay in scroll animations
    gsap.ticker.lagSmoothing(0);

    // FANCYBOX INIT
    // Fancybox is only loaded on pages that need it (page custom code). Bind is delegated,
    // so it also catches [data-fancybox] elements added later (e.g. by works.js / CMS Load)
    if (typeof Fancybox !== 'undefined') {
        // Icon paths from Figma; stroke color/width come from CSS (currentColor + --f-button-svg-stroke-width)
        const icon = (d) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" tabindex="-1"><path d="${d}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        // Toolbar wordmark reuses the navbar's Webflow class, so it follows the site's typography
        const brandText = document.querySelector('.navbar-desktop-text')?.textContent.trim() || '';

        Fancybox.bind("[data-fancybox]", {
            mainClass: 'lightbox',
            // Match the site's mobile breakpoint: below it, the caption moves to the footer (mobile layout)
            compact: () => window.matchMedia(`(max-width: ${window.mobileBreakpoint}px)`).matches,
            Toolbar: {
                enabled: true,
                display: { left: [], middle: ['brand'], right: ['close'] },
                items: {
                    brand: { tpl: `<div class="navbar-desktop-text">${brandText}</div>` },
                    close: { tpl: `<button class="f-button" title="{{CLOSE}}" data-fancybox-close>${icon('M18 6L12 12M12 12L6 18M12 12L6 6M12 12L18 18')}</button>` },
                },
            },
            Thumbs: false,
            Carousel: {
                Navigation: {
                    prevTpl: icon('M15 18L9 12L15 6'),
                    nextTpl: icon('M9 18L15 12L9 6'),
                },
            },
            on: {
                init: () => {
                    lenis.stop();
                },
                close: () => {
                    lenis.start();
                }
            }
        });
    }

    // PRELOADER
    gsap.to('.preloader', {
        opacity: 0,
        delay: .1,
        duration: .5,
        ease: "power2.out",
        onComplete: () => {
            document.querySelector('.preloader').remove();
        }
    });

    // MOUSE FOLLOWER
    // One global .mouse-follower (in Global Styles), position: fixed, so it tracks clientX/Y directly.
    // Any element with .mouse-follower-card triggers it; visibility is handled in CSS via :has().
    const follower = document.querySelector('.mouse-follower');
    const followerCards = document.querySelectorAll('.mouse-follower-card');
    if (follower && followerCards.length && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        gsap.set(follower, { xPercent: -50, yPercent: -50 });
        const xTo = gsap.quickTo(follower, 'x', { duration: 0.4, ease: 'power2.out' });
        const yTo = gsap.quickTo(follower, 'y', { duration: 0.4, ease: 'power2.out' });

        followerCards.forEach(card => {
            // Snap to the pointer on entry so it doesn't glide in from its last position
            card.addEventListener('pointerenter', (e) => {
                xTo(e.clientX, e.clientX);
                yTo(e.clientY, e.clientY);
            });
            card.addEventListener('pointermove', (e) => {
                xTo(e.clientX);
                yTo(e.clientY);
            });
        });
    }

    // Copy link share
    const copyShare = document.querySelectorAll(".copy-to-clipboard");
    copyShare?.forEach(shareBtn => {
        shareBtn.addEventListener("click", function (e) {
            e.preventDefault();
            let tooltip = shareBtn.querySelector(".tooltip");
            tooltip?.classList.add("show");
            setTimeout(() => {
                tooltip?.classList.remove("show");
            }, 1500);
            navigator.clipboard.writeText(location.href);
        });
    });

    console.log("Loading mainInit()");

}