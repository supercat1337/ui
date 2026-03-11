// @ts-check


/**
 * Pure logic to collect and merge references from multiple roots.
 * @param {Element[]} roots - All root elements to scan (main + additional).
 * @param {Function} selectRefsExtended - The external utility for deep scanning.
 * @param {Object} options - Scanning configuration.
 * @returns {import("../types.d.ts").RefScanResult}
 */
export function scanRootsForRefs(roots, selectRefsExtended, options) {
    // 1. Initial deep scan
    let { refs, scopeRefs } = selectRefsExtended(roots, null, options);

    const rootRefs = {};
    const window = options.window;

    // 2. Scan the roots themselves (selectRefsExtended usually scans children)
    for (const root of roots) {
        if (root instanceof window.Element) {
            const refName = root.getAttribute(options.refAttribute);
            if (refName) {
                rootRefs[refName] = root;
            }

            const slotAttribute = options.scopeAttribute.find(attr => root.hasAttribute(attr));
            if (slotAttribute && root.getAttribute(slotAttribute)) {
                const slotName = root.getAttribute(slotAttribute);
                // We specifically look for slots in roots
                if (root.hasAttribute('data-slot')) {
                    scopeRefs[slotName] = /** @type {HTMLElement} */ (root);
                }
            }
        }
    }

    return {
        refs: { ...refs, ...rootRefs },
        scopeRefs
    };
}