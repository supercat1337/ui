// @ts-check

import { escapeHtml } from '../utils.js';

/**
 * Generates an HTML layout string for a paginated table component.
 * The layout includes a title, add and update buttons, a table, and a pagination section.
 * @param {import('./paginatedTable.js').PaginatedTable} paginatedTable - The paginated table object used to generate the layout.
 * @returns {string} The HTML layout string.
 */

export function getHtmlLayout(paginatedTable) {
    return /* html */ `
<div class="d-flex flex-column" style="min-height: 80vh">
    <div class="flex-grow-1 mt-3">
        <h1 class="display-6">
            <span ref="title">${escapeHtml(paginatedTable.title)}</span>
            <button class="btn btn-outline-secondary btn-sm ms-2" ref="add_data_button">
                Add
            </button>

            <button class="btn btn-outline-secondary btn-sm ms-2" ref="update_data_button">
                Update
            </button>
        </h1>
    
        <table class="table table-striped" ref="table" scope-ref="table">
        </table>

    </div>
</div>
<div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination_section" scope-ref="pagination">
</div>
`;
}