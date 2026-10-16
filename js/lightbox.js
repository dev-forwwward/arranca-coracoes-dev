export function lightbox() {
    // Turn items into Fancybox triggers for their own image.
    // Fancybox itself is loaded via page custom code and bound in main.js.
    // Omit `item` to make the `list` element itself the trigger; omit `image` to use its first <img>
    const galleries = [
        // Portfolio page
        { list: '.blog12_list', item: '.work_case_item', image: '.blog12_image', caption: 'h2', group: 'portfolio' },
        // Gallery page
        { list: '.gallery-grid', item: '.gallery-item', image: '.gallery-image', group: 'gallery' },
        // Home page showreel
        { list: '.h_showreel_container', group: 'showreel' },
    ];

    galleries.forEach(({ list, item, image = 'img', caption, group }) => {
        const listEl = document.querySelector(list);
        if (!listEl) return;

        if (typeof Fancybox === 'undefined') {
            console.warn(`Fancybox is not loaded on this page; "${group}" lightbox disabled`);
            return;
        }

        const setLightboxAttrs = () => {
            const items = item ? listEl.querySelectorAll(item) : [listEl];
            items.forEach(itemEl => {
                const img = itemEl.querySelector(image);
                if (!img || itemEl.hasAttribute('data-fancybox')) return;
                itemEl.setAttribute('data-fancybox', group);
                itemEl.setAttribute('data-src', img.getAttribute('src')); // src is the original upload
                const captionEl = caption && itemEl.querySelector(caption);
                if (captionEl) itemEl.setAttribute('data-caption', captionEl.textContent.trim());
            });
        };
        setLightboxAttrs();
        // Catch items rendered later (e.g. Finsweet CMS Load pagination)
        new MutationObserver(setLightboxAttrs).observe(listEl, { childList: true });
    });
}
