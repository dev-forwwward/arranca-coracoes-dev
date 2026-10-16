export function navBarMenu() {
    // ---------------------------------------
    // NAV MENU
    const trigger = document.querySelector('#menu-trigger');
    const menuNavBar = document.querySelector(".mobile-dropdown-menu");
    const navLinks = document.querySelectorAll('.menu-link');
    const html = document.documentElement;
    const body = document.body;
    const mobileMenu = document.querySelector('.mobile-dropdown-menu');

    let scrollY = 0;
    // Hide initially with class
    //mobileMenu.classList.add('is-hidden');

    trigger.addEventListener("click", function (event) {
        event.stopPropagation();

        const isOpen = menuNavBar.classList.contains("w--open");

        if (isOpen) {
            // CLOSE MENU
            body.classList.remove("navbar-menu-open");
            html.classList.remove("lock-viewport");

            // Restore scroll
            body.style.position = '';
            body.style.top = '';
            window.scrollTo(0, scrollY);

            gsap.to(mobileMenu, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    //mobileMenu.classList.add('is-hidden');
                    menuNavBar.classList.remove("w--open");
                    gsap.set('.mobile-dropdown-menu', { display: 'none' });
                }
            });


        } else {
            // OPEN MENU
            scrollY = window.scrollY;

            // Lock scroll
            body.style.position = 'fixed';
            body.style.top = `-${scrollY}px`;
            body.classList.add("navbar-menu-open");
            html.classList.add("lock-viewport");

            // Remove display none
            //mobileMenu.classList.remove('is-hidden');

            gsap.timeline({ defaults: { overwrite: true } })
                .fromTo('.mobile-dropdown-menu', { opacity: 0 }, {
                    opacity: 1,
                    duration: 0.5,
                    ease: 'power2.out',
                    onStart: () => {
                        menuNavBar.classList.add("w--open");
                        gsap.set('.mobile-dropdown-menu', { display: 'flex' });
                        html.classList.add("lock-viewport"); // ✅ lock scroll
                    }
                })
                .fromTo('.nav_menu_bg_gradient', { opacity: 0 }, {
                    opacity: 1,
                    duration: 0.5,
                    ease: 'power3.out'
                }, "<")
                .fromTo('.menu-link-container, .mobile-dropdown-menu .button, .text-size-medium', {
                    opacity: 0,
                    yPercent: 10
                }, {
                    opacity: 1,
                    yPercent: 0,
                    stagger: 0.1,
                    duration: 1,
                    ease: 'power2.out'
                }, "<");
        }
    });



    // ---------------------------------------
    // MENU - ACCORDION
    //https://webflow.com/made-in-webflow/website/pageblock-accordion-with-plus

    class PBAccordionMenu {
        constructor() {
            this.cleanupInitialState();
            this.init();
        }

        cleanupInitialState() {
            document.querySelectorAll('[pb-component-menu="accordion"]').forEach(accordion => {
                const group = accordion.querySelector('[pb-accordion-element-menu="group"]');
                if (!group) return;

                const items = group.querySelectorAll('[pb-accordion-element-menu="accordion"]');
                items.forEach(item => {
                    const content = item.querySelector('[pb-accordion-element-menu="content"]');
                    const trigger = item.querySelector('[pb-accordion-element-menu="trigger"]');
                    const arrow = item.querySelector('[pb-accordion-element-menu="arrow"]');
                    const plus = item.querySelector('[pb-accordion-element-menu="plus"]');

                    if (content) {
                        content.style.maxHeight = '0';
                        content.style.opacity = '0';
                        content.style.visibility = 'hidden';
                        content.style.display = 'none';
                    }
                    if (trigger) trigger.setAttribute('aria-expanded', 'false');

                    item.classList.remove('is-active-accordion');
                    content?.classList.remove('is-active-accordion');
                    if (arrow) arrow.classList.remove('is-active-accordion');
                    if (plus) plus.classList.remove('is-active-accordion');
                });

                const initial = group.getAttribute('pb-accordion-initial');
                if (initial && initial !== 'none') {
                    const initialItem = items[parseInt(initial) - 1];
                    if (initialItem) {
                        this.openAccordion(initialItem);
                    }
                }
            });
        }

        init() {
            document.querySelectorAll('[pb-component-menu="accordion"]').forEach(accordion => {
                const group = accordion.querySelector('[pb-accordion-element-menu="group"]');
                if (!group) return;
                group.addEventListener('click', (e) => this.handleClick(e, group));
            });
        }

        handleClick(event, group) {
            const triggerClicked = event.target.closest('[pb-accordion-element-menu="trigger"]');
            if (!triggerClicked) return; // only toggle if the trigger itself (or a child of it) was clicked

            const accordionItem = triggerClicked.closest('[pb-accordion-element-menu="accordion"]');
            if (!accordionItem) return;

            const isOpen = accordionItem.classList.contains('is-active-accordion');
            const isSingle = group.getAttribute('pb-accordion-single-menu') === 'true';

            if (isSingle) {
                group.querySelectorAll('[pb-accordion-element-menu="accordion"]').forEach(item => {
                    if (item !== accordionItem && item.classList.contains('is-active-accordion')) {
                        this.closeAccordion(item);
                    }
                });
            }

            if (isOpen) {
                this.closeAccordion(accordionItem);
            } else {
                this.openAccordion(accordionItem);
            }
        }

        openAccordion(item) {
            const trigger = item.querySelector('[pb-accordion-element-menu="trigger"]');
            const content = item.querySelector('[pb-accordion-element-menu="content"]');
            const arrow = item.querySelector('[pb-accordion-element-menu="arrow"]');
            const plus = item.querySelector('[pb-accordion-element-menu="plus"]');

            content.style.visibility = 'visible';
            content.style.display = 'block';

            content.offsetHeight;

            const contentHeight = content.scrollHeight;

            requestAnimationFrame(() => {
                content.style.maxHeight = `${contentHeight}px`;
                content.style.opacity = '1';
                trigger.setAttribute('aria-expanded', 'true');
                item.classList.add('is-active-accordion');
                content.classList.add('is-active-accordion');
                if (arrow) arrow.classList.add('is-active-accordion');
                if (plus) plus.classList.add('is-active-accordion');
            });

            content.addEventListener('transitionend', () => {
                if (item.classList.contains('is-active-accordion')) {
                    content.style.maxHeight = 'none';
                }
            }, { once: true });
        }

        closeAccordion(item) {
            const trigger = item.querySelector('[pb-accordion-element-menu="trigger"]');
            const content = item.querySelector('[pb-accordion-element-menu="content"]');
            const arrow = item.querySelector('[pb-accordion-element-menu="arrow"]');
            const plus = item.querySelector('[pb-accordion-element-menu="plus"]');

            content.style.maxHeight = `${content.scrollHeight}px`;
            content.style.display = 'block';

            content.offsetHeight;

            requestAnimationFrame(() => {
                content.style.maxHeight = '0';
                content.style.opacity = '0';
                trigger.setAttribute('aria-expanded', 'false');
                item.classList.remove('is-active-accordion');
                content.classList.remove('is-active-accordion');
                if (arrow) arrow.classList.remove('is-active-accordion');
                if (plus) plus.classList.remove('is-active-accordion');
            });

            content.addEventListener('transitionend', () => {
                if (!item.classList.contains('is-active-accordion')) {
                    content.style.visibility = 'hidden';
                    content.style.display = 'none';
                }
            }, { once: true });
        }
    }

    // Initialize
    new PBAccordionMenu();





    /* Menu HIDE/REVEAL w/ Scroll */
    let lastScrollTop = 0;
    const navComponent = document.querySelector(".navbar_component");

    if (!navComponent) {
        console.warn("navComponent not found.");
        return;
    }

    const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const isOpen = menuNavBar.classList.contains("w--open");

        if (!isOpen) {
            if (scrollTop > lastScrollTop && scrollTop > 10) {
                let navHeight = navComponent.offsetHeight;
                navComponent.style.top = `-${navHeight}px`;
            } else {
                navComponent.style.top = "0";
            }
        }

        if (scrollTop > 50 && !isOpen) {
            navComponent.classList.add("scrolled");
        } else {
            navComponent.classList.remove("scrolled");
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    // Run scroll logic on load in case page is opened mid-scroll
    handleScroll();

    window.addEventListener("scroll", handleScroll);





    // when the user hovers a link on the right side, 
    // the image on the left of the submenu should change
    //
    const links  = document.querySelectorAll(".item_list_dropdown");
    const box    = document.getElementById("submenu-image");
    const layers = box ? box.querySelectorAll(".col_img") : [];

    if (!links.length || layers.length < 2) return;

    let active = 0; // index of the currently visible layer
    const cache = new Map(); // remembers which URLs are loaded
    cache.set("current", null);

    function crossfade(url) {
        if (!url || cache.get("current") === url) return;

        const next = active ^ 1;           // toggle 0/1
        const nextImg = layers[next];
        const curImg  = layers[active];

        const reveal = () => {
        nextImg.classList.add("show");   // fade in next
        curImg.classList.remove("show"); // fade out current
        active = next;
        cache.set("current", url);
        };

        // set src and wait for load to avoid any gap
        nextImg.src = url;

        // Prefer decode() for instant-ready swap when possible
        if ("decode" in nextImg) {
        nextImg.decode().then(() => {
            cache.set(url, true);
            reveal();
        }).catch(() => {
            // fallback if decode fails (SVG, etc.)
            nextImg.addEventListener("load", () => { cache.set(url, true); reveal(); }, { once: true });
        });
        } else {
        nextImg.addEventListener("load", () => { cache.set(url, true); reveal(); }, { once: true });
        }
    }

    // Hover bindings
    links.forEach(link => {
        link.addEventListener("mouseenter", () => {
        crossfade(link.getAttribute("data-img"));
        });
    });

    // Initial image (from first link)
    const first = links[0]?.getAttribute("data-img");
    if (first) {
        layers[active].src = first;
        layers[active].classList.add("show");
        cache.set(first, true);
        cache.set("current", first);
    }

    console.log("running navBarMenu()");

}