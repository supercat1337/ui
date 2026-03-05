// @ts-check

let idCounter = 0;

/**
 * Generates a unique ID with an optional prefix.
 * 
 * @param {string} [prefix=''] - The prefix to prepend to the ID.
 * @returns {string} The generated unique ID.
 */
export function uniqueId(prefix = '') {
    const id = ++idCounter;
    return prefix ? `${prefix}${id}` : String(id);
}