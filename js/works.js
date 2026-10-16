export function works() {
    // Work Case Link Redirect (for case links in Homepage and Works)
    const workCaseLinks = document.querySelectorAll('.work_case_link');
    if (workCaseLinks.length > 0) {
        workCaseLinks.forEach(link => {
            link.href += link.getAttribute('slug');
        });
    }

}