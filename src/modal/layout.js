// layout.js
// @ts-check

/**
 * @returns {string}
 */
function getHtml() {
    let html = /* html */ `
<div class="modal fade" data-bs-backdrop="static" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" ref="modal_title">Modal name</h5>
                <button type="button" ref="close_x_button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" ref="modal_body">
                <div scope-ref="modal_body" ref="section_with_content" class="d-none">
                </div>
                <div ref="section_error" class="text-center d-none">

                    <div class="d-flex justify-content-center align-items-center fs-5 text-danger" style="min-height: 25vh">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/>
                            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                        </svg>
                        <span ref="error_text" class="ms-3"
                            style="white-space: initial; word-wrap: break-word;">
                            Error text
                        </span>
                    </div>
                </div>

                <div ref="section_loading" class="d-none">
                    <div class="d-flex justify-content-center align-items-center" style="min-height: 25vh">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span ref="loading_text" class="ms-3 fs-5"
                            style="white-space: initial; word-wrap: break-word;">
                            Loading...
                        </span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" ref="close_button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" ref="submit_button" class="btn btn-primary">Add</button>
            </div>
        </div>
    </div>
</div>
`;

    return html;
}

export { getHtml };
