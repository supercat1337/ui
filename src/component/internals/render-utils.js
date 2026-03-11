// @ts-check

/**
 * Prepares the rendered element by setting identifying attributes and managing cache.
 * @param {Element} element - The fresh or resolved element from layout.
 * @param {Object} options
 * @param {string} options.instanceId - The unique ID of the component instance.
 * @param {string|null} [options.sid] - The stable Session ID for SSR/Hydration.
 * @param {boolean} [options.isSSR] - Whether the current environment is SSR.
 * @returns {Element} The prepared element.
 */
export function prepareRenderResult(element, { instanceId, sid, isSSR }) {
    // 1. Always set instanceId for internal tracking
    if (instanceId) {
        element.setAttribute('data-component-root', instanceId);
    }

    // 2. If we are on the server (or preparing SSR), we MUST set the sid
    if (isSSR && sid) {
        element.setAttribute('data-sid', sid);
    }

    return element;
}

/**
 * Handles the cloning logic for static layouts to improve performance.
 * @param {Element|null} cachedElement - The previously cached element.
 * @param {boolean} shouldClone - Whether cloning is enabled in internals.
 * @returns {Element|null} A clone of the element or null if not available.
 */
export function getCloneFromCache(cachedElement, shouldClone) {
    if (shouldClone && cachedElement) {
        return /** @type {Element} */ (cachedElement.cloneNode(true));
    }
    return null;
}