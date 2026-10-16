const slugify = (str) => str.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function works() {
    // Work Case Link Redirect (for case links in Homepage and Works)
    const workCaseLinks = document.querySelectorAll('.work_case_link');
    if (workCaseLinks.length > 0) {
        workCaseLinks.forEach(link => {
            link.href += link.getAttribute('slug');
        });
    }

    // Home category links: point to Portfolio with ?filter=<category-slug>
    const categoryLinks = document.querySelectorAll('.work-categories-link');
    categoryLinks.forEach(link => {
        const title = link.querySelector('.work-categories-title');
        if (!title) return;
        const url = new URL(link.href, location.origin);
        url.searchParams.set('filter', slugify(title.textContent));
        link.href = url.toString();
    });

    // Portfolio filter: move the .active state to the selected tag
    const filterForm = document.querySelector('[fs-cmsfilter-element="filters"]');
    if (filterForm) {
        const tags = filterForm.querySelectorAll('.tag.w-radio');
        filterForm.addEventListener('change', (e) => {
            if (e.target.type !== 'radio') return;
            tags.forEach(tag => {
                tag.classList.toggle('active', tag.contains(e.target));
            });
        });

        // Pre-apply filter from ?filter=<category-slug> once Finsweet CMS Filter is ready
        const filterParam = new URLSearchParams(location.search).get('filter');
        if (filterParam) {
            window.fsAttributes = window.fsAttributes || [];
            window.fsAttributes.push(['cmsfilter', () => {
                const tag = [...tags].find(tag => {
                    const field = tag.querySelector('[fs-cmsfilter-field]');
                    return field && slugify(field.textContent) === filterParam;
                });
                tag?.querySelector('input[type="radio"]')?.click();
            }]);
        }
    }

}
