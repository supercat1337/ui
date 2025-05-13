// @ts-check

/**
 * @typedef {(page:string)=>string} TypePageUrlRenderer
 */

/**
 *
 * @param {number} current
 * @param {number} total
 * @param {number} delta
 * @param {string} [gap]
 * @returns {string[]}
 */
function createPaginationArray(current, total, delta = 2, gap = "...") {
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
 * @param {number} currentPage
 * @param {number} total
 * @param {TypePageUrlRenderer|null} [pageUrlRenderer]
 */
function renderPaginationItems(currentPage, total, pageUrlRenderer) {
    let currentPage_str = currentPage.toString();

    let items = createPaginationArray(currentPage, total);
    items = items.map(function (item) {
        let activeClass = currentPage_str == item ? "active" : "";

        let page_url = pageUrlRenderer ? pageUrlRenderer(item) : "#"; //page_url_mask.replace(/:page/, item);

        if (item != "...")
            return `<li class="page-item ${activeClass}" page-value="${item}"><a class="page-link" href="${page_url}">${item}</a></li>`;

        return `<li class="page-item"><span class="page-link">${item}</span></li>`;
    });

    return items.join("\n");
}

/**
 *
 * @param {number} currentPage
 * @param {number} total
 * @param {TypePageUrlRenderer|null} [pageUrlRenderer]
 */
function renderPagination(currentPage, total, pageUrlRenderer) {
    let code = renderPaginationItems(currentPage, total, pageUrlRenderer);
    return `
  <ul class="pagination">
  ${code}
  </ul>`;
}

export { renderPaginationItems, renderPagination, createPaginationArray };
