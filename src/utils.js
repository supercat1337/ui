// @ts-check

/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 */
export function DOMReady(callback) {
    if (document.readyState === "complete") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}