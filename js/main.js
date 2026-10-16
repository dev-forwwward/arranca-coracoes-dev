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
    // Follower is position: fixed, so it tracks clientX/Y directly (no rect math).
    // Visibility is handled in CSS via :has(.mouse-follower-card:hover).
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.mouse-follower-container').forEach(container => {
            const follower = container.querySelector('.mouse-follower');
            if (!follower) return;

            gsap.set(follower, { xPercent: -50, yPercent: -50 });
            const xTo = gsap.quickTo(follower, 'x', { duration: 0.4, ease: 'power2.out' });
            const yTo = gsap.quickTo(follower, 'y', { duration: 0.4, ease: 'power2.out' });

            // Snap to the pointer on entry so it doesn't glide in from its last position
            container.addEventListener('pointerenter', (e) => {
                xTo(e.clientX, e.clientX);
                yTo(e.clientY, e.clientY);
            });
            container.addEventListener('pointermove', (e) => {
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