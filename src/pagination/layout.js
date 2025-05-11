// @ts-check

/**
 * @typedef {(page:string)=>string} TypePageUrlRenderer
 */

class PaginationView {
    /**
     *
     * @param {number} current
     * @param {number} total
     * @param {number} delta
     * @param {string} [gap]
     * @returns {string[]}
     */
    static createPaginationArray(current, total, delta = 2, gap = "...") {
        if (total <= 1) return ["1"];

        const center = [current];

        // no longer O(1) but still very fast
        for (let i = 1; i <= delta; i++) {
            center.unshift(current - i);
            center.push(current + i);
        }

        const filteredCenter = center
            .filter((page) => page > 1 && page < total)
            .map((page) => page.toString());

        const includeLeftGap = current > 3 + delta;
        const includeLeftPages = current === 3 + delta;
        const includeRightGap = current < total - (2 + delta);
        const includeRightPages = current === total - (2 + delta);

        if (includeLeftPages) filteredCenter.unshift("2");
        if (includeRightPages) filteredCenter.push((total - 1).toString());

        if (includeLeftGap) filteredCenter.unshift(gap);
        if (includeRightGap) filteredCenter.push(gap);

        let total_str = total.toString();

        return ["1", ...filteredCenter, total_str];
    }

    /**
     *
     * @param {number} current_page
     * @param {number} total
     * @param {TypePageUrlRenderer|null} [page_url_rendrer]
     */
    static renderPaginationItems(current_page, total, page_url_rendrer) {
        let current_page_str = current_page.toString();

        let items = PaginationView.createPaginationArray(current_page, total);
        items = items.map(function (item) {
            let activeClass = current_page_str == item ? "active" : "";

            let page_url = page_url_rendrer ? page_url_rendrer(item) : "#"; //page_url_mask.replace(/:page/, item);

            if (item != "...")
                return `<li class="page-item ${activeClass}" page-value="${item}"><a class="page-link" href="${page_url}">${item}</a></li>`;

            return `<li class="page-item"><span class="page-link">${item}</span></li>`;
        });

        return items.join("\n");
    }

    /**
     *
     * @param {number} current_page
     * @param {number} total
     * @param {TypePageUrlRenderer|null} [page_url_rendrer]
     */
    static renderPagination(current_page, total, page_url_rendrer) {
        let code = PaginationView.renderPaginationItems(
            current_page,
            total,
            page_url_rendrer
        );
        return `
  <ul class="pagination">
  ${code}
  </ul>`;
    }
}

/**
 * Generates an HTML layout string for a pagination component.
 * This layout includes a navigation bar (previous, next, first, last) and a
 * list of page numbers.
 * @param {import('./pagination.js').Pagination} pagination - The pagination object used to generate the layout.
 * @returns {string} The HTML layout string.
 */
export function getHtmlLayout(pagination) {
    return PaginationView.renderPagination(
        pagination.current_page,
        pagination.pages_count,
        pagination.page_url_rendrer
    );
}
