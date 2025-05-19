// @ts-check

import { escapeHtml } from "../utils.js";

/**
 * Generates an HTML layout string for a paginated table component.
 * The layout includes a title, add and update buttons, a table, and a pagination section.
 * @param {import('./paginatedTable.js').PaginatedTable} paginatedTable - The paginated table object used to generate the layout.
 * @returns {string} The HTML layout string.
 */

export function getHtmlLayout(paginatedTable) {
    return /* html */ `
<div style="display: contents;">    
    <table class="table table-striped" ref="table" scope-ref="table"></table>
    <div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination" scope-ref="pagination"></div>
</div>
`;
}
