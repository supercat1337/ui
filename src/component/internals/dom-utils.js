// @ts-check



/**
 * Filters elements by tag name within a specific DOM scope.
 * * @param {Element} root - The starting element for the search.
 * @param {string} tagName - Tag name to filter by (or '*' for all).
 * @param {Function} walkDomScope - The utility function for scoped traversal.
 * @param {import("../types.d.ts").DomScopeOptions} options - Configuration for the traversal.
 * @returns {Element[]} Array of matched elements.
 */
export function filterElementsByTagName(root, tagName, walkDomScope, options) {
    const targetTag = tagName.toLowerCase().trim();
    /** @type {Element[]} */
    const filteredElements = [];

    walkDomScope(
        root,
        node => {
            if (node.nodeType === options.window.Node.ELEMENT_NODE) {
                const el = /** @type {Element} */ (node);
                if (targetTag === '*' || el.tagName.toLowerCase() === targetTag) {
                    filteredElements.push(el);
                }
            }
        },
        options
    );

    return filteredElements;
}

/**
 * Logic for inserting fragments or elements into the DOM based on a strategy.
 * * @param {Element|DocumentFragment} fragment - The content to insert.
 * @param {Element} resolvedTarget - The destination element.
 * @param {"prepend"|"append"|"replace"} strategy - The insertion strategy.
 * @param {any} window - The window object.
 * @returns {Element|null} The root element of the inserted content.
 */
export function insertToDOM(fragment, resolvedTarget, strategy, window) {
    // 1. Identify the root element for reference tracking
    const rootElement =
        fragment instanceof window.Element
            ? /** @type {Element} */ (fragment)
            : fragment.firstElementChild;

    // 2. Execute DOM manipulation
    switch (strategy) {
        case 'prepend':
            resolvedTarget.prepend(fragment);
            break;
        case 'replace':
            resolvedTarget.replaceChildren(fragment);
            break;
        case 'append':
        default:
            resolvedTarget.append(fragment);
            break;
    }

    return rootElement;
}
