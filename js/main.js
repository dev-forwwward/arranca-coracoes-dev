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
    const fancyboxEl = document.querySelector("[data-fancybox]");
    if (fancyboxEl) {
        Fancybox.bind("[data-fancybox]", {
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