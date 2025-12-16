// @ts-check

/**
 * Creates an array of page numbers to be displayed in a pagination list.
 * @param {number} current
 * @param {number} total
 * @param {number} delta
 * @param {string} [gap]
 * @returns {string[]}
 */
export function createPaginationArray(current, total, delta = 2, gap = '...') {
    if (total <= 1) return ['1'];

    const center = [current];

    // no longer O(1) but still very fast
    for (let i = 1; i <= delta; i++) {
        center.unshift(current - i);
        center.push(current + i);
    }

    const filteredCenter = center
        .filter(page => page > 1 && page < total)
        .map(page => page.toString());

    const includeLeftGap = current > 3 + delta;
    const includeLeftPages = current === 3 + delta;
    const includeRightGap = current < total - (2 + delta);
    const includeRightPages = current === total - (2 + delta);

    if (includeLeftPages) filteredCenter.unshift('2');
    if (includeRightPages) filteredCenter.push((total - 1).toString());

    if (includeLeftGap) filteredCenter.unshift(gap);
    if (includeRightGap) filteredCenter.push(gap);

    let total_str = total.toString();

    return ['1', ...filteredCenter, total_str];
}

/**
 * Renders a pagination list with the given parameters.
 * @param {number} currentPageNumber - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @param {(page:number)=>string} [itemUrlRenderer] - The function to generate the URL for each page item.
 * @param {(page:number)=>void|boolean} [onClickCallback] - The callback function to be called when a page item is clicked.
 * @returns {HTMLUListElement} - The rendered pagination list.
 */
export function renderPaginationElement(currentPageNumber, totalPages, itemUrlRenderer, onClickCallback) {
    let ul = document.createElement('ul');
    ul.classList.add('pagination');

    let items = createPaginationArray(currentPageNumber, totalPages);
    items.forEach(item => {
        let li = document.createElement('li');
        li.classList.add('page-item');

        if (item == '...') {
            li.classList.add('disabled');
            let span = document.createElement('span');
            span.classList.add('page-link');
            span.textContent = item;
            li.appendChild(span);
            ul.appendChild(li);
            return;
        }

        let a = document.createElement('a');
        a.classList.add('page-link');

        if (item == currentPageNumber.toString()) {
            li.classList.add('active');
        }

        if (itemUrlRenderer) {
            a.href = itemUrlRenderer(Number(item));
        } else {
            a.href = '#';
        }

        a.textContent = item;
        a.setAttribute('data-page-value', item);

        li.appendChild(a);
        ul.appendChild(li);

        a.addEventListener('click', e => {
            e.preventDefault();
            let link = /** @type {HTMLAnchorElement} */ (e.target);
            if (!link) return;

            if (onClickCallback) {
                let pageValue = link.getAttribute('data-page-value');
                if (!pageValue) return;

                onClickCallback(Number(pageValue));
            }
        });
    });

    return ul;
}
