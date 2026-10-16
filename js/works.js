export function works() {
    // Work Case Link Redirect (for case links in Homepage and Works)
    const workCaseLinks = document.querySelectorAll('.work_case_link');
    if (workCaseLinks.length > 0) {
        workCaseLinks.forEach(link => {
            link.href += link.getAttribute('slug');
        });
    }

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
    }

}