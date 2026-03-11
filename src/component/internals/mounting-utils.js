// @ts-check

/**
 * Validates the container and the mount mode.
 * @param {any} container 
 * @param {string} mode 
 * @param {Object} window - Configured window object
 * @throws {TypeError|Error}
 */
export function validateMountArgs(container, mode, window) {
    if (!(container instanceof window.Element)) {
        throw new TypeError('Mount target must be a valid DOM Element.');
    }

    const validModes = ['replace', 'append', 'prepend', 'hydrate'];
    if (!validModes.includes(mode)) {
        throw new Error(`Invalid mount mode "${mode}". Expected: ${validModes.join(', ')}`);
    }
}

/**
 * Resolves the actual element that should be the component's root during hydration.
 * @param {Element} container 
 * @param {string} sid 
 * @returns {Element|null}
 */
export function findHydrationRoot(container, sid) {
    if (container.getAttribute('data-sid') === sid) {
        return container;
    }
    return container.querySelector(`[data-sid="${sid}"]`);
}