// @ts-nocheck
/// <reference types="./ui.esm.d.ts" />
import { selectRefsExtended, checkRefs, walkDomScope } from 'dom-scope';
import { EventEmitter } from '@supercat1337/event-emitter';



/**
 * Configuration Manager for UI Library.
 * Handles SSR flags and hydration data access.
 */
class ConfigManager {
    constructor() {
        /** @type {boolean} Indicates if we are currently in Server-Side Rendering mode. */
        this.isSSR = false;

        /** @type {string} The global key where hydration data is stored. */
        this.hydrationDataKey = '__HYDRATION_DATA__';

        /** * Safe reference to the global object (window in browser, global in Node).
         * @type {globalThis}
         */
        // @ts-ignore
        this.window = typeof globalThis !== 'undefined' ? globalThis : {};

        this.checkRefsFlag = true;
    }

    /**
     * Safely retrieves the hydration manifest from the global environment.
     * @returns {{[key:string]:ComponentMetadata}|null}
     */
    getManifest() {
        // globalThis works in both Node.js and Browsers
        const globalObject = typeof globalThis !== 'undefined' ? globalThis : {};
        return globalObject[this.hydrationDataKey] || null;
    }

    /**
     * Extracts state for a specific SID.
     * @param {string} sid - Server ID
     * @returns {any|null}
     */
    getHydrationData(sid) {
        const manifest = this.getManifest();
        if (manifest && manifest[sid]) {
            return manifest[sid].data;
        }
        return null;
    }

    /**
     * Clears the manifest to free up memory.
     */
    destroyManifest() {
        const globalObject = typeof globalThis !== 'undefined' ? globalThis : {};
        if (globalObject[this.hydrationDataKey]) {
            delete globalObject[this.hydrationDataKey];
        }
    }
}

// Export a singleton instance
const Config = new ConfigManager();




/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 * @param {Document} [doc=window.document] - The document object to check the ready state of.
 */
function DOMReady(callback, doc = window.document) {
    doc.readyState === 'interactive' || doc.readyState === 'complete'
        ? callback()
        : doc.addEventListener('DOMContentLoaded', callback);
}

/**
 * Escapes the given string from HTML interpolation.
 * Replaces the characters &, <, ", and ' with their corresponding HTML entities.
 * @param {string} unsafe - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[&<>"']/g, function (m) {
        let charset = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;', // ' -> &apos; for XML only
        };
        return charset[/** @type {'&' | '<' | '>'| '"' | "'"} */ (m)];
    });
}

/**
 * Sets the status of the button to "waiting" (i.e. disabled and showing a spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button while it is waiting.
 */
function ui_button_status_waiting_on(el, text) {
    el.disabled = true;
    el.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' +
        escapeHtml(text);
}

/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button.
 */
function ui_button_status_waiting_off(el, text) {
    el.disabled = false;
    el.innerText = text;
}

/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner)
 * and sets its innerHTML to the given HTML string.
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} html - The HTML string to be set as the button's innerHTML.
 */
function ui_button_status_waiting_off_html(el, html) {
    el.disabled = false;
    el.innerHTML = html;
}

/**
 * Scrolls the specified element to the top.
 * Sets the scrollTop property to 0, effectively
 * scrolling to the top of the content.
 * @param {HTMLElement} element - The element to scroll to the top.
 */
function scrollToTop(element) {
    element.scrollTop = 0;
}

/**
 * Scrolls the specified element to the bottom.
 * Sets the scrollTop property to the element's scrollHeight,
 * effectively scrolling to the bottom of the content.
 * @param {HTMLElement} element - The element to scroll to the bottom.
 */
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

/**
 * Adds the "d-none" class to the given elements, hiding them from view.
 * @param {...HTMLElement} elements - The elements to hide.
 */
function hideElements(...elements) {
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        element.classList.add('d-none');
    }
}

/**
 * Removes the "d-none" class from the given elements, making them visible.
 * @param {...HTMLElement} elements - The elements to show.
 */
function showElements(...elements) {
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        element.classList.remove('d-none');
    }
}

/**
 * Adds a spinner to the button (if it doesn't already have one).
 * The spinner is prepended to the button's contents.
 * @param {HTMLButtonElement} button - The button to add the spinner to.
 * @param {string|null} [customClassName] - The class name to use for the spinner.
 *                                      If not provided, 'spinner-border spinner-border-sm' is used.
 * @param {Document} [doc=window.document] - The document object to create the spinner element in.
 */
function showSpinnerInButton(button, customClassName = null, doc = window.document) {
    const checkClass = customClassName || 'spinner-border';
    if (button.getElementsByClassName(checkClass)[0]) return;

    let spinner = doc.createElement('span');
    spinner.className = checkClass;
    // Ensure the base class is there if using custom sub-classes
    if (customClassName && !customClassName.includes('spinner-border')) {
        spinner.classList.add('spinner-border');
    }

    button.prepend(spinner);
}

/**
 * Removes the spinner from the given button.
 * @param {HTMLButtonElement} button - The button which should have its spinner removed.
 */
function removeSpinnerFromButton(button) {
    let spinner = button.querySelector('.spinner-border');
    if (spinner) spinner.remove();
}

/**
 * Checks if the user prefers a dark color scheme.
 * Utilizes the `window.matchMedia` API to determine if the user's
 * system is set to a dark mode preference.
 * @returns {boolean} - Returns `true` if the user prefers dark mode, otherwise `false`.
 */
function isDarkMode(wnd = window) {
    if (wnd.matchMedia && wnd.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
    }

    return false;
}

/**
 * Returns the user's default language, or "en" if none can be determined.
 * @returns {string} The user's default language, in the form of a two-letter
 *   language code (e.g. "en" for English, "fr" for French, etc.).
 */
function getDefaultLanguage() {
    let m = navigator.language.match(/^[a-z]+/);
    let lang = m ? m[0] : 'en';
    return lang;
}

/**
 * Formats the given number of bytes into a human-readable string.
 *
 * @param {number} bytes - The number of bytes to be formatted.
 * @param {number} [decimals] - The number of decimal places to be used in the formatted string. Defaults to 2.
 * @param {string} [lang] - The language to be used for the size units in the formatted string. Defaults to the user's default language.
 * @param {{[key:string]: string[]}} [sizes] - An object containing the size units to be used in the formatted string. Defaults to the IEC standard units.
 * @returns {string} A human-readable string representation of the given number of bytes, in the form of a number followed by a unit of measurement (e.g. "3.5 KB", "1.2 GB", etc.).
 */
function formatBytes(bytes, decimals = 2, lang, sizes) {
    lang = lang || 'en';

    sizes = sizes || {
        en: ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    };

    const get_size = sizes[lang] ? sizes[lang] : sizes['en'];

    if (bytes === 0) {
        return '0 ' + get_size[0];
    }

    let minus_str = bytes < 0 ? '-' : '';
    bytes = Math.abs(bytes);

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return minus_str + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + get_size[i];
}

/**
 * Copies the given text to the clipboard using the Clipboard API.
 * @param {string} text - The text to be copied to the clipboard.
 * @param {Window & typeof globalThis} [wnd=window]
 * @returns {Promise<void>} A promise that resolves when the text has been successfully copied.
 */
function copyToClipboard(text, wnd = window) {
    return wnd.navigator.clipboard.writeText(text);
}

/**
 * Fades in the given element with the given duration.
 * The element is set to be block level and its opacity is set to 0.
 * The function then repeatedly adjusts the opacity of the element until it is 1.
 * The time between each adjustment is the given duration.
 * @param {HTMLElement} element - The element to fade in.
 * @param {number} [duration=400] - The duration of the fade in in milliseconds.
 * @param {Window} [wnd=window] - The window object to use for the requestAnimationFrame method.
 */
function fadeIn(element, duration = 400, wnd = window) {
    element.style.opacity = '0';
    element.style.display = 'block';
    let last = +new Date();
    const tick = () => {
        let date = +new Date();
        element.style.opacity = String(+element.style.opacity + (date - last) / duration);
        last = +new Date();
        if (+element.style.opacity < 1) {
            (wnd.requestAnimationFrame && wnd.requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };
    tick();
}

/**
 * Fades out the given element with the given duration.
 * The element is set to be block level and its opacity is set to 1.
 * The function then repeatedly adjusts the opacity of the element until it is 0.
 * The time between each adjustment is the given duration.
 * @param {HTMLElement} element - The element to fade out.
 * @param {number} [duration=400] - The duration of the fade out in milliseconds.
 * @param {Window} [wnd=window] - The window object to use for the requestAnimationFrame method.
 */
function fadeOut(element, duration = 400, wnd = window) {
    element.style.opacity = '1';
    let last = +new Date();
    const tick = () => {
        let date = +new Date();
        element.style.opacity = String(+element.style.opacity - (date - last) / duration);
        last = +new Date();
        if (+element.style.opacity > 0) {
            (wnd.requestAnimationFrame && wnd.requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };
    tick();
}

/**
 * Sleeps for the given number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep for.
 * @returns {Promise<void>} A promise that resolves when the sleep is over.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensures that a promise resolves or rejects after at least the given minimum time has elapsed.
 * If the promise resolves or rejects before the minimum time has elapsed, the result or error is stored and
 * the promise returned by this function resolves or rejects with the stored result or error when the minimum time has elapsed.
 * @param {Promise<T>} promise - The promise to wait for.
 * @param {number} minTime - The minimum time to wait in milliseconds.
 * @template T
 * @returns {Promise<T>} A promise that resolves or rejects after at least the given minimum time has elapsed.
 */
function withMinimumTime(promise, minTime) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let promiseFinished = false;
        let timerFinished = false;
        /** @type {T} */
        let result;
        /** @type {Error} */
        let error;

        setTimeout(() => {
            timerFinished = true;
            if (promiseFinished) {
                if (error) reject(error);
                else resolve(result);
            }
        }, minTime);

        promise
            .then(res => {
                result = res;
                promiseFinished = true;

                const elapsed = Date.now() - startTime;
                if (elapsed >= minTime && timerFinished) {
                    resolve(res);
                }
            })
            .catch(err => {
                error = err;
                promiseFinished = true;

                const elapsed = Date.now() - startTime;
                if (elapsed >= minTime && timerFinished) {
                    reject(err);
                }
            });
    });
}

/**
 * Attaches a listener to an event on the given ancestor element that targets the given target element selector.
 * @param {string} eventType
 * @param {Element} ancestorElement
 * @param {string} targetElementSelector
 * @param {*} listenerFunction
 */
function delegateEvent(eventType, ancestorElement, targetElementSelector, listenerFunction) {
    ancestorElement.addEventListener(eventType, function (event) {
        let target;

        if (event.target && event.target instanceof Config.window.Element) {
            target = event.target;

            if (event.target.matches(targetElementSelector)) {
                listenerFunction(event, target);
            } else if (event.target.closest(targetElementSelector)) {
                target = event.target.closest(targetElementSelector);
                listenerFunction(event, target);
            }
        }
    });
}

/**
 * A wrapper class for strings that should not be escaped.
 */
class SafeHTML {
    /** @param {string} html */
    constructor(html) {
        this.html = html;
    }
    toString() {
        return this.html;
    }
}

/**
 * Marks a string as safe HTML to avoid escaping.
 * @param {string} html
 * @returns {SafeHTML}
 */
function unsafeHTML(html) {
    return new SafeHTML(html);
}

/**
 * Tagged template literal for high-performance HTML generation.
 * Handles strings, arrays, DOM nodes, and DocumentFragments safely.
 * * @param {TemplateStringsArray | string} strings - Static parts of the template or a raw HTML string.
 * @param {...any} values - Dynamic values to interpolate.
 * @returns {DocumentFragment} A live DocumentFragment containing the parsed HTML.
 */
function htmlDOM(strings, ...values) {
    /** @type {string} */
    let rawResult = '';

    // 1. Handle raw string input (non-tagged usage)
    if (typeof strings === 'string') {
        const tmpl = document.createElement('template');
        tmpl.innerHTML = strings.trim();
        return tmpl.content;
    }

    // 2. Build the HTML string from tagged template parts
    // Start with the first static string part
    rawResult = strings[0];

    for (let i = 0; i < values.length; i++) {
        let value = values[i];

        // Normalization: convert null, undefined, or false to empty strings
        if (value === null || value === undefined || value === false) {
            value = '';
        }

        // Processing Logic: Convert various types into strings/SafeHTML
        if (Array.isArray(value)) {
            // Handle arrays: iterate and serialize each item
            const joined = value
                .map(item => {
                    // Strict falsy check for array elements
                    if (item === null || item === undefined || item === false) return '';

                    if (item instanceof SafeHTML) return item.toString();
                    if (item instanceof Config.window.Element) return item.outerHTML;

                    if (item instanceof Config.window.DocumentFragment) {
                        const tempDiv = document.createElement('div');
                        tempDiv.appendChild(item.cloneNode(true));
                        return tempDiv.innerHTML;
                    }

                    if (item instanceof Config.window.Node) {
                        return item.nodeType === Config.window.Node.TEXT_NODE
                            ? escapeHtml(item.textContent ?? '')
                            : '';
                    }

                    return escapeHtml(String(item));
                })
                .join('');

            // Mark as safe to prevent double-escaping of the joined result
            value = unsafeHTML(joined);
        } else if (value instanceof Config.window.Element) {
            // Single Element: capture its outer HTML
            value = unsafeHTML(value.outerHTML);
        } else if (value instanceof Config.window.DocumentFragment) {
            // Single Fragment: convert to inner HTML string
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(value.cloneNode(true));
            value = unsafeHTML(tempDiv.innerHTML);
        } else if (value instanceof Config.window.Node) {
            // Single Node: handle text content only, ignore comments/others
            value = unsafeHTML(
                value.nodeType === Config.window.Node.TEXT_NODE
                    ? escapeHtml(value.textContent ?? '')
                    : ''
            );
        }

        // Final assembly: Check if the value is SafeHTML, otherwise escape it
        const stringValue =
            value instanceof SafeHTML ? value.toString() : escapeHtml(String(value));

        // Append interpolated value and the next static string part
        rawResult += stringValue + strings[i + 1];
    }

    // 3. Final parsing into DOM
    const tmpl = document.createElement('template');
    tmpl.innerHTML = rawResult.trim();
    return tmpl.content;
}

/*

// 1. As a tagged template (with escaping and array support)
const items = ['Apple', 'Banana'];
const element = htmlDOM`
    <ul>
        ${items.map(item => `<li>${item}</li>`)} 
        <li>${unsafeHTML('<span>Trusted info</span>')}</li>
    </ul>
`;

// 2. As a regular function
const simple = htmlDOM('<div>Static content</div>');

*/

/*
List: 
html`<ul>${[1, 2, 3].map(n => `<li>${n}</li>`)}</ul>`
*/

/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @template {Function} T
 * @param {T} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @param {boolean} [immediate=false] - Whether to invoke the function on the leading edge instead of the trailing.
 * @returns {T & { cancel(): void }} A new debounced function with a `cancel` method.
 */
function debounce(func, wait, immediate = false) {
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timeoutId = null;
    let result;

    let debounced = function (...args) {
        const context = this;

        const later = function () {
            timeoutId = null;
            if (!immediate) result = func.apply(context, args);
        };

        const callNow = immediate && !timeoutId;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(later, wait);

        if (callNow) result = func.apply(context, args);
        return result;
    };

    debounced.cancel = function () {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
    };

    return /** @type {T & { cancel(): void }} */ (/** @type {any} */ (debounced));
}

/**
 * Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds.
 *
 * @template {Function} T
 * @param {T} func - The function to throttle.
 * @param {number} wait - The number of milliseconds to throttle invocations to.
 * @param {Object} [options] - Options object.
 * @param {boolean} [options.leading=true] - Whether to invoke on the leading edge.
 * @param {boolean} [options.trailing=true] - Whether to invoke on the trailing edge.
 * @returns {T & { cancel(): void }} A new throttled function with a `cancel` method.
 */
function throttle(func, wait, options = {}) {
    const { leading = true, trailing = true } = options;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timeoutId = null;
    let lastArgs = null;
    let lastContext = null;
    let lastCallTime = 0;

    const invokeFunc = function () {
        lastCallTime = Date.now();
        func.apply(lastContext, lastArgs);
        lastArgs = lastContext = null;
    };

    let throttled = function (...args) {
        const now = Date.now();
        const remaining = wait - (now - lastCallTime);

        lastArgs = args;
        lastContext = this;

        if (remaining <= 0 || remaining > wait) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            lastCallTime = now;
            func.apply(lastContext, lastArgs);
            lastArgs = lastContext = null;
        } else if (!timeoutId && trailing) {
            timeoutId = setTimeout(() => {
                timeoutId = null;
                if (trailing) invokeFunc();
            }, remaining);
        }
    };

    throttled.cancel = function () {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
        lastArgs = lastContext = null;
        lastCallTime = 0;
    };

    return /** @type {T & { cancel(): void }} */ (/** @type {any} */ (throttled));
}

/**
 * Sets up a listener that calls a callback when a click occurs outside the specified element.
 *
 * @param {Element} element - The DOM element to detect outside clicks for.
 * @param {(event: MouseEvent) => void} callback - Function to call when an outside click is detected.
 * @returns {() => void} A function that removes the event listener.
 */
function onClickOutside(element, callback) {
    if (!element || typeof callback !== 'function') {
        throw new Error('onClickOutside: element and callback are required');
    }

    const handler = event => {
        // Check if the click target is outside the element
        if (!element.contains(event.target)) {
            callback(event);
        }
    };

    // Use capture phase to ensure the handler runs before any other click handlers
    // that might stop propagation.
    document.addEventListener('click', handler, true);

    // Return an unsubscribe function
    return () => {
        document.removeEventListener('click', handler, true);
    };
}

/*
// Example

import { onClickOutside } from '@supercat1337/ui';

const modal = document.getElementById('myModal');
const unsubscribe = onClickOutside(modal, () => {
    console.log('Clicked outside!');
    modal.style.display = 'none';
});

// also you can ununsubscribe:
// unsubscribe();

*/

/**
 * Tagged template literal for secure and high-performance HTML string generation.
 * Automatically escapes dynamic values to prevent XSS attacks unless wrapped in `unsafeHTML`.
 * Supports primitives (strings, numbers, booleans) and arrays of values.
 *
 * @example
 * // Returns: "<div>Hello &lt;script&gt;</div>"
 * const result = html`<div>Hello ${'<script>'}</div>`;
 *
 * @example
 * // Returns: "<ul><li>1</li><li>2</li></ul>"
 * const items = [1, 2];
 * const list = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`;
 *
 * @param {TemplateStringsArray | string} strings - Static parts of the template or a raw HTML string.
 * @param {...any} values - Dynamic values to be escaped and interpolated.
 * @returns {string} A sanitized HTML string.
 */
function html(strings, ...values) {
    /** @type {string} */
    let rawResult = '';

    // 1. Handle raw string input (non-tagged usage)
    // Allows the function to be used as a simple string trimmer/formatter
    if (typeof strings === 'string') {
        return strings.trim();
    }

    // 2. Build the HTML string from tagged template parts
    // Initialize with the first static fragment of the template
    rawResult = strings[0];

    for (let i = 0; i < values.length; i++) {
        let value = values[i];

        // Normalization: convert null, undefined, or false to empty strings
        // to avoid rendering "null" or "false" in the final HTML
        if (value === null || value === undefined || value === false) {
            value = '';
        }

        // Processing Logic: Handle nested arrays and complex types
        if (Array.isArray(value)) {
            // Recursively process array elements and join them into a single string
            const joined = value
                .map(item => {
                    // Filter out falsy values within arrays
                    if (item === null || item === undefined || item === false) return '';

                    // If the item is already marked as SafeHTML, return it as is
                    if (item instanceof SafeHTML) return item.toString();

                    // Otherwise, escape the string representation of the item
                    return escapeHtml(String(item));
                })
                .join('');

            // Wrap the joined string in SafeHTML to prevent double-escaping
            // during the final assembly
            value = unsafeHTML(joined);
        }

        // Final assembly: Escape the value unless it is an instance of SafeHTML
        const stringValue =
            value instanceof SafeHTML ? value.toString() : escapeHtml(String(value));

        // Append interpolated value and the next static string part
        rawResult += stringValue + strings[i + 1];
    }

    // Return the trimmed result for cleaner output
    return rawResult.trim();
}



/**
 * Formats the given timestamp into a human-readable string representation of
 * a date and time. The date is formatted according to the user's locale, and
 * the time is formatted according to the user's locale with a 24-hour clock.
 * @param {number} unix_timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date and time.
 */
function formatDateTime(unix_timestamp) {
    var t = new Date(unix_timestamp * 1000);
    return `${t.toLocaleDateString("en-GB")} ${t.toLocaleTimeString("en-GB")}`;
}

/**
 * Formats the given timestamp into a human-readable string representation of
 * a date. The date is formatted according to the user's locale.
 * @param {number} unix_timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date.
 */
function formatDate(unix_timestamp) {
    var t = new Date(unix_timestamp * 1000);
    return `${t.toLocaleDateString("en-GB")}`;
}

/**
 * Returns the current Unix time in seconds.
 * @param {Date} [dateObject=new Date()] - The date object to get the Unix time from. Defaults to the current date and time.
 * @returns {number}
 */
function unixtime(dateObject = new Date()) {
    return Math.floor(dateObject.getTime() / 1000);
}



/**
 * Creates an array of page numbers to be displayed in a pagination list.
 * @param {number} current
 * @param {number} total
 * @param {number} delta
 * @param {string} [gap]
 * @returns {string[]}
 */
function createPaginationArray(current, total, delta = 2, gap = '...') {
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
function renderPaginationElement(
    currentPageNumber,
    totalPages,
    itemUrlRenderer,
    onClickCallback
) {
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

        if (onClickCallback) {
            a.addEventListener('click', e => {
                e.preventDefault();
                let link = /** @type {HTMLAnchorElement} */ (e.target);
                if (!link) return false;

                let pageValue = link.getAttribute('data-page-value');
                if (!pageValue) return false;

                return onClickCallback(Number(pageValue));
            });
        }
    });

    return ul;
}

/**
 * Internal storage for counters associated with each prefix.
 * @type {Map<string, number>}
 */
const counterMap = new Map();

/**
 * Generates a unique ID with the specified prefix using an auto-incrementing counter.
 * The counter is maintained per prefix, ensuring uniqueness for each prefix independently.
 * Ideal for creating IDs for HTML elements (e.g., `btn-1`, `modal-2`).
 *
 * @param {string} prefix - The prefix for the generated ID. Should be a valid HTML ID prefix.
 * @returns {string} A unique ID string in the format `${prefix}-${counter}`.
 *
 * @example
 * generateId('btn'); // "btn-1"
 * generateId('btn'); // "btn-2"
 * generateId('modal'); // "modal-1"
 */
function generateId(prefix = "el") {
  // Retrieve the current counter for the given prefix, default to 0
  const currentCount = counterMap.get(prefix) ?? 0;
  const nextCount = currentCount + 1;

  // Store the updated counter
  counterMap.set(prefix, nextCount);

  // Return the combined ID
  return `${prefix}-${nextCount}`;
}




/**
 * Creates a wrapper around a Storage object (localStorage or sessionStorage)
 * with automatic JSON serialization and change subscription.
 *
 * @param {Storage} storage - The storage object to wrap (e.g. localStorage, sessionStorage).
 * @returns {{
 *   get: (key: string) => any,
 *   set: (key: string, value: any) => void,
 *   remove: (key: string) => void,
 *   clear: () => void,
 *   on: (key: string, callback: (newValue: any, oldValue: any) => void) => () => void
 * }} An object with storage methods.
 */
function createStorage(storage) {
    // Map of key -> Set of callbacks
    const listeners = new Map();

    // Handle storage events from the same origin
    const handleStorage = event => {
        if (event.storageArea !== storage) return;

        const { key, newValue, oldValue } = event;

        // If key is null, it means clear() was called
        if (key === null) {
            // Notify all listeners with null values
            listeners.forEach((callbacks, listenerKey) => {
                callbacks.forEach(cb => cb(null, null));
            });
            return;
        }

        const callbacks = listeners.get(key);
        if (callbacks) {
            // Parse values (they are strings from the event)
            const parsedNew = newValue !== null ? JSON.parse(newValue) : null;
            const parsedOld = oldValue !== null ? JSON.parse(oldValue) : null;
            callbacks.forEach(cb => cb(parsedNew, parsedOld));
        }
    };

    // Subscribe to storage events once when the first listener is added
    let isListening = false;
    const startListening = () => {
        if (!isListening) {
            Config.window.addEventListener('storage', handleStorage);
            isListening = true;
        }
    };

    const stopListening = () => {
        if (isListening && listeners.size === 0) {
            Config.window.removeEventListener('storage', handleStorage);
            isListening = false;
        }
    };

    /**
     * Retrieves a value from storage.
     * @param {string} key
     * @returns {any} Parsed value, or null if not found.
     */
    const get = key => {
        const raw = storage.getItem(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return raw; // fallback for non-JSON values (shouldn't happen if set is used)
        }
    };

    /**
     * Stores a value in storage.
     * @param {string} key
     * @param {any} value
     */
    const set = (key, value) => {
        const oldRaw = storage.getItem(key);
        const newRaw = JSON.stringify(value);
        storage.setItem(key, newRaw);
        // Manually trigger listeners for the same tab (storage event only fires in other tabs)
        const callbacks = listeners.get(key);
        if (callbacks) {
            const oldValue = oldRaw !== null ? JSON.parse(oldRaw) : null;
            callbacks.forEach(cb => cb(value, oldValue));
        }
    };

    /**
     * Removes a key from storage.
     * @param {string} key
     */
    const remove = key => {
        const oldRaw = storage.getItem(key);
        storage.removeItem(key);
        // Notify local listeners
        const callbacks = listeners.get(key);
        if (callbacks) {
            const oldValue = oldRaw !== null ? JSON.parse(oldRaw) : null;
            callbacks.forEach(cb => cb(null, oldValue));
        }
    };

    /**
     * Clears all keys in this storage.
     */
    const clear = () => {
        storage.clear();
        // Notify all local listeners with null values
        listeners.forEach((callbacks, key) => {
            callbacks.forEach(cb => cb(null, null));
        });
    };

    /**
     * Subscribes to changes of a specific key.
     * @param {string} key
     * @param {(newValue: any, oldValue: any) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    const on = (key, callback) => {
        if (!listeners.has(key)) {
            listeners.set(key, new Set());
        }
        listeners.get(key).add(callback);
        startListening();

        return () => {
            const callbacks = listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    listeners.delete(key);
                }
            }
            stopListening();
        };
    };

    return { get, set, remove, clear, on };
}

// Pre-created instances for convenience
const local = createStorage(Config.window.localStorage);
const session = createStorage(Config.window.sessionStorage);

/*
// example

javascript
import { local, session } from '@supercat1337/ui';

local.set('user', { name: 'Alice', age: 30 });
const user = local.get('user');
console.log(user); // { name: 'Alice', age: 30 }

const unsubscribe = local.on('user', (newValue, oldValue) => {
    console.log('User changed from', oldValue, 'to', newValue);
});

local.set('user', { name: 'Bob', age: 25 });

unsubscribe();

session.set('theme', 'dark');
*/



class Toggler {
    /** @type {Map<string, { isActive: boolean, on: (itemName:string) => void, off: (itemName:string) => void }>} */
    items = new Map();

    /** @type {string} */
    #active = '';

    /**
     * Adds an item to the toggler.
     * @param {string} itemName - The name of the item to be added.
     * @param {(itemName:string) => void} on - The function to be called when the item is set as active.
     * @param {(itemName:string) => void} off - The function to be called when the item is set as inactive.
     */
    addItem(itemName, on, off) {
        if (this.items.has(itemName)) {
            throw new Error('Item already exists');
        }

        this.items.set(itemName, { isActive: false, on, off });
        return this;
    }

    /**
     * Removes the item with the given name from the toggler.
     * @param {string} itemName - The name of the item to be removed.
     */
    removeItem(itemName) {
        if (this.#active === itemName) {
            this.#active = '';
        }

        this.items.delete(itemName);
    }

    /**
     * Sets the active item to the given item name.
     * @param {string} active - The name of the item to be set as active.
     * @throws {Error} If the item does not exist in the toggler.
     */
    setActive(active) {
        if (!this.items.has(active)) {
            throw new Error('Item not found');
        }

        if (this.#active === active) {
            return;
        }

        for (const [key, value] of this.items) {
            if (key === active) {
                this.#active = key;

                if (!value.isActive) {
                    value.isActive = true;
                    value.on(key);
                }
            } else {
                if (value.isActive) {
                    value.off(key);
                }
                value.isActive = false;
            }
        }
    }

    /**
     * Runs the callbacks for all items in the toggler.
     * If an item is active, the "on" callback is called with the item name as the argument.
     * If an item is inactive, the "off" callback is called with the item name as the argument.
     */
    runCallbacks() {
        for (const [key, value] of this.items) {
            if (value.isActive) {
                value.on(key);
            } else {
                value.off(key);
            }
        }
    }

    /**
     * Initializes the toggler with the given active item name.
     * Sets the active item to the given item name and runs the callbacks for all items in the toggler.
     * @param {string} active - The name of the item to be set as active.
     */
    init(active) {
        this.setActive(active);
        this.runCallbacks();
    }

    clear() {
        this.items = new Map();
        this.#active = '';
    }
}



/**
 * Injects the core CSS styles into the document.
 * The core styles include support for the "d-none" class, which is commonly used in Bootstrap to hide elements.
 * The core styles also include support for the "html-fragment" element, which is used as a container for HTML fragments.
 * @param {Document|null} [doc=window.document] - The document to inject the styles into. Defaults to the global document.
 * @returns {void}
 */

function injectCoreStyles(doc = window.document) {
    
    if (!doc) {
        throw new Error("Document is null. Cannot inject core styles.");
    }

    const css = /* css */ `
.d-none {
    display: none !important;
}

html-fragment {
    display: contents;
}
`;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);

    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
}



class Slot {
    /** @type {string} */
    name;
    /** @type {Component[]} */
    #components = [];

    /** @type {Component} */
    #ownerComponent;

    /** @type {string | ((component: Component) => string) | null} */
    #defaultLayout = null;

    /**
     * Initializes a new instance of the Slot class.
     * @param {string} name - The name of the slot.
     * @param {Component} component
     */
    constructor(name, component) {
        this.name = name;
        this.#ownerComponent = component;
    }

    /**
     * Sets the default layout for the slot.
     * @param {string | ((component: Component) => string) | null} layout
     */
    setDefaultLayout(layout) {
        this.#defaultLayout = layout;
    }

    /**
     * Checks if the slot has a default layout defined.
     * @returns {boolean} True if default layout exists.
     */
    hasDefaultLayout() {
        return this.#defaultLayout !== null;
    }

    /**
     * Attaches a component to the slot.
     * This method sets the given component's parent component and parent slot name,
     * and adds the component to the slot's internal array of components.
     * @param {Component} component - The component to attach to the slot.
     * @param {"append"|"replace"|"prepend"} [mode='append']
     */
    attach(component, mode = 'append') {
        this.attachMany([component], mode);
    }

    /**
     *
     * @param {Component[]} components
     * @param {"append"|"replace"|"prepend"} [mode='append']
     */
    attachMany(components, mode = 'append') {
        for (let i = 0; i < components.length; i++) {
            let component = components[i];
            component.$internals.parentComponent = this.#ownerComponent;
            component.$internals.assignedSlotName = this.name;
        }

        const componentsSet = new Set(components);
        this.#components = this.#components.filter(c => !componentsSet.has(c));

        if (mode === 'replace') {
            this.clear();
            this.#components.push(...components);
        } else if (mode === 'prepend') {
            this.#components.unshift(...components);
        } else {
            this.#components.push(...components);
        }
    }

    /**
     * Detaches a component from the slot.
     * This method sets the given component's parent component and parent slot name to null,
     * and removes the component from the slot's internal set of components.
     * @param {Component} component - The component to detach from the slot.
     * @returns {boolean}
     */
    detach(component) {
        component.$internals.parentComponent = null;
        component.$internals.assignedSlotName = '';

        let foundIndex = this.#components.indexOf(component);
        if (foundIndex > -1) {
            this.#components.splice(foundIndex, 1);
        }

        return foundIndex != -1;
    }

    /**
     * Detaches all components from the slot.
     * This method sets all components' parent component and parent slot name to null,
     * and removes all components from the slot's internal set of components.
     */
    detachAll() {
        this.#components.forEach(component => {
            component.$internals.parentComponent = null;
            component.$internals.assignedSlotName = '';
        });
        this.#components = [];
    }

    /**
     * Mounts all children components of the slot to the DOM.
     */
    mount() {
        if (!this.#ownerComponent.isConnected) {
            console.warn(
                `Cannot mount Slot "${this.name}" in disconnected component ${
                    this.#ownerComponent.constructor.name
                }`
            );
            return;
        }

        let slotRoot = this.#ownerComponent.$internals.scopeRefs[this.name];
        if (!slotRoot) {
            console.warn(
                `Cannot get root element for Slot "${this.name}" does not exist in component "${
                    this.#ownerComponent.constructor.name
                }"`
            );
            return;
        }

        if (this.#components.length > 0) {
            // Remove default content if components are present
            slotRoot.replaceChildren();
            this.#components.forEach(childComponent => {
                childComponent.mount(slotRoot, 'append');
            });
        } else if (this.#defaultLayout) {
            // Apply default layout if slot is empty
            const layout =
                typeof this.#defaultLayout === 'function'
                    ? this.#defaultLayout(this.#ownerComponent)
                    : this.#defaultLayout;

            slotRoot.innerHTML = layout;
        }
    }

    /**
     * Unmounts all children components of the slot from the DOM.
     * This method iterates over all children components of the slot and calls their unmount method.
     */
    unmount() {
        for (let i = 0; i < this.#components.length; i++) {
            let child = this.#components[i];
            child.unmount();
        }
    }

    /**
     * Clears the slot of all its children components.
     * This method first unmounts all children components of the slot, then detaches them from the slot.
     */
    clear() {
        //this.unmount();
        //this.detachAll();

        for (let i = 0; i < this.#components.length; i++) {
            let child = this.#components[i];
            child.unmount();
            child.$internals.parentComponent = null;
            child.$internals.assignedSlotName = '';
        }

        this.#components = [];
    }

    getLength() {
        return this.#components.length;
    }

    /**
     *
     * @returns {Component[]}
     */
    getComponents() {
        //return [...this.#components];
        return this.#components;
    }
    
    /*
     * Returns true if the slot has attached components.
     * @returns {boolean}
     */
    hasComponents() {
        return this.#components.length > 0;
    }
}



class SlotManager {
    /** @type {Map<string, Slot>} */
    slots = new Map();

    /** @type {Component} */
    #ownerComponent;

    /**
     * @param {Component} component
     */
    constructor(component) {
        this.#ownerComponent = component;
    }

    /**
     * Adds a slot to the component.
     * This method is used to programmatically add a slot to the component.
     * If the slot already exists, it is returned as is.
     * Otherwise, a new slot is created and added to the component's internal maps.
     * @param {string} slotName - The name of the slot to add.
     * @param {Object} [options={}]
     * @param {string | ((component: Component) => string)} [options.defaultLayout]
     * @returns {Slot} Returns the slot.
     */
    registerSlot(slotName, options = {}) {
        let slot = this.slots.get(slotName);

        if (!slot) {
            slot = new Slot(slotName, this.#ownerComponent);
            this.slots.set(slotName, slot);
        }

        if (options.defaultLayout !== undefined) {
            slot.setDefaultLayout(options.defaultLayout);
        }

        return slot;
    }

    /**
     * @param {string} slotName
     * @returns {Slot | null}
     */
    getSlot(slotName) {
        return this.slots.get(slotName) || null;
    }

    /**
     *
     * @param {string} slotName
     * @returns {HTMLElement|null}
     */
    getSlotElement(slotName) {
        if (!this.#ownerComponent.isConnected) {
            return null;
        }

        return this.#ownerComponent.$internals.scopeRefs[slotName] || null;
    }

    /**
     * Checks if the given slot name exists in the component.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot exists, false otherwise.
     */
    hasSlot(slotName) {
        return this.slots.has(slotName);
    }

    /**
     * Removes the given slot name from the component.
     * This method first unmounts all children components of the given slot name,
     * then removes the slot name from the component's internal maps.
     * @param {string} slotName - The name of the slot to remove.
     */
    removeSlot(slotName) {
        const slot = this.slots.get(slotName);
        if (slot) {
            slot.clear();
            this.slots.delete(slotName);
        }
    }

    /**
     * Checks if the given slot name has any children components associated with it.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot has children components, false otherwise.
     */
    hasSlotContent(slotName) {
        let slot = this.getSlot(slotName);
        if (slot == null) return false;
        return slot.getLength() > 0;
    }

    /**
     * Clears the given slot name of all its children components.
     * This method first removes all children components of the given slot name from the component,
     * then unmounts them and finally removes them from the component's internal maps.
     * @param {string} slotName - The name of the slot to clear.
     * @returns {boolean} True if the slot was cleared, false otherwise.
     */
    clearSlotContent(slotName) {
        let slot = this.getSlot(slotName);
        if (slot == null) return false;

        slot.clear();

        return true;
    }

    /**
     * Returns an array of slot names defined in the component.
     * @type {string[]}
     */
    get slotNames() {
        let names = Array.from(this.slots.keys());
        return names;
    }

    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     */
    mountAllSlots() {
        if (!this.#ownerComponent.isConnected) return;

        this.slots.forEach(slot => {
            slot.mount();
        });
    }

    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     * If no slot name is given, all children components of all slots are mounted to the DOM.
     * @param {string} slotName - The name of the slot to mount children components for.
     */
    mountSlot(slotName) {
        let slot = this.getSlot(slotName);
        if (!slot) {
            console.warn(
                `Slot "${slotName}" does not exist in component "${
                    this.#ownerComponent.constructor.name
                }"`
            );
            return;
        }

        slot.mount();
    }

    /**
     * Unmounts all children components of the component from the DOM.
     * This method iterates over all children components of the component and calls their unmount method.
     */
    unmountAll() {
        this.slots.forEach(slot => {
            slot.unmount();
        });
    }

    /**
     * Unmounts all children components of the given slot name from the DOM.
     * @param {string} slotName - The name of the slot to unmount children components for.
     */
    unmountSlot(slotName) {
        let slot = this.getSlot(slotName);
        if (slot == null) return;

        slot.unmount();
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {Component[]} components - The components to add to the slot.
     * @param {"append"|"replace"|"prepend"} [mode="append"]
     * @returns {Slot} Returns the slot.
     */
    attachToSlot(slotName, components, mode = 'append') {
        let slot = this.registerSlot(slotName);

        for (let i = 0; i < components.length; i++) {
            let component = components[i];
            let usingSlot = this.findSlotByComponent(component);

            if (usingSlot != null) {
                usingSlot.detach(component);
            }
        }

        slot.attachMany(components, mode);

        return slot;
    }

    /**
     * Removes the given child component from all slots.
     * This method first checks if the child component exists in the component's internal maps.
     * If it does, it removes the child component from the set of all children components and
     * from the sets of children components of all slots.
     * @param {Component} childComponent - The child component to remove.
     * @returns {boolean} True if the child component was removed, false otherwise.
     */
    removeComponent(childComponent) {
        let slot = this.findSlotByComponent(childComponent);
        if (!slot) return false;

        slot.detach(childComponent);
        childComponent.unmount();

        return true;
    }

    /**
     * Finds the slot associated with the given child component.
     * @param {Component} component - The child component to find the slot for.
     * @returns {Slot | null} The slot associated with the child component, or null if no slot is found.
     */
    findSlotByComponent(component) {
        let parentComponent = component.$internals.parentComponent;

        if (parentComponent != this.#ownerComponent) {
            return null;
        }

        return this.getSlot(component.$internals.assignedSlotName);
    }

    /**
     * Finds a direct child by its SID.
     * @param {string} sid
     * @returns {Component|null}
     */
    findChildBySid(sid) {
        for (const [_, slot] of this.slots) {
            const found = slot.getComponents().find(c => c.$internals.sid === sid);
            if (found) return found;
        }
        return null;
    }

    /**
     *
     * @param {string} slotName
     * @returns {number}
     */
    getSlotLength(slotName) {
        let slot = this.getSlot(slotName);
        if (slot == null) return 0;
        return slot.getLength();
    }

    getSlots() {
        return this.slots;
        //return new Map(this.slots);
    }
}



/** @type {WeakMap<Function, string>} */
const classIdMap = new WeakMap();
let classCounter = 0;

/**
 * Gets or generates a stable unique ID for a component class (e.g., 'bd-1').
 * @param {Function} ctor - The component class constructor.
 * @returns {string} The unique class identifier.
 */
function getComponentClassId(ctor) {
    let id = classIdMap.get(ctor);
    if (!id) {
        classCounter++;
        id = `bd-${classCounter}`;
        classIdMap.set(ctor, id);
    }
    return id;
}

class Internals {
    /** * Private storage for the lazy instance ID.
     * @type {string|null}
     */
    #instanceId = null;

    /** * The server-side identifier used for hydration.
     * @type {string|null}
     */
    sid = null;

    /**
     * Lazy getter for the instanceId.
     * Generates a unique ID only when first requested.
     */
    get instanceId() {
        if (this.#instanceId === null) {
            this.#instanceId = Internals.generateInstanceId();

            // If the root element exists, sync the attribute for DOM-to-Instance lookups
            if (this.root instanceof Config.window.Element) {
                this.root.setAttribute('data-component-root', this.#instanceId);
            }
        }
        return this.#instanceId;
    }

    /**
     * Allows manual override of the instanceId.
     * @param {string} value
     */
    set instanceId(value) {
        this.#instanceId = value;
    }

    /** @type {EventEmitter<any>} */
    eventEmitter = new EventEmitter();

    /** @type {AbortController} */
    disconnectController = new AbortController();

    /** @type {Element|null} */
    root = null;

    /** @type {TextUpdateFunction|null} */
    textUpdateFunction = null;

    /** @type {Record<string, any>} */
    textResources = {};

    /** @type {Record<string, HTMLElement>} */
    refs = {};

    /** @type {Record<string, HTMLElement>} */
    scopeRefs = {};

    /** @type {Component|null} */
    parentComponent = null;

    /** @type {string} */
    assignedSlotName = '';

    /** @type {"replace"|"append"|"prepend"|"hydrate"} */
    mountMode = 'replace';

    /** @type {boolean} */
    cloneTemplateOnRender = true;

    /** @type {Element|null} */
    parentElement = null;

    /** @type {Set<Element>} */
    elementsToRemove = new Set();

    /** @type {Map<string, Element>} */
    teleportRoots = new Map();

    /** @type {import('dom-scope').ScopeRoot[]} */
    additionalRoots = [];

    /** @type {boolean} */
    isHydrated = false;

    /** @type {number} */
    static #instanceIdCounter = 0;

    static #sessionPrefix = Math.random().toString(36).slice(2, 6);
    /**
     * Generates a unique instance ID.
     * @returns {string} The unique instance ID.
     */
    static generateInstanceId() {
        let counter = ++Internals.#instanceIdCounter;
        return `${Internals.#sessionPrefix}-${counter}`;
    }
}




/**
 *
 * @param {((component: any) => Node|string)|string|null|Node} layout
 * @param {*} ctx
 * @returns
 */
function resolveLayout(layout, ctx) {
    /** @type {Node} */
    let template;

    // 2. Resolve content
    if (typeof layout === 'function') {
        // Dynamic: always execute the function. Cannot be cached as a whole.
        const returnValue = layout(ctx);
        if (returnValue instanceof Config.window.Node) {
            template = returnValue;
        } else if (typeof returnValue === 'string') {
            template = htmlDOM(returnValue);
        } else {
            throw new Error(`Invalid layout function return type: ${typeof returnValue}`);
        }
    } else if (typeof layout === 'string') {
        // Static: parse the string via the html helper
        template = htmlDOM(layout.trim());
    } else if (layout instanceof window.Node) {
        template = layout;
    } else {
        console.warn('Unsupported layout type:', typeof layout, layout);
        throw new Error(`Unsupported layout type: ${typeof layout}`);
    }

    // 3. Normalization logic (Ensuring single root element)
    /** @type {Element} */
    let result;

    if (template.nodeType === Config.window.Node.ELEMENT_NODE) {
        result = /** @type {Element} */ (template);
    } else if (template.nodeType === Config.window.Node.DOCUMENT_FRAGMENT_NODE) {
        const children = Array.from(template.childNodes).filter(
            node =>
                node.nodeType === Config.window.Node.ELEMENT_NODE ||
                (node.nodeType === Config.window.Node.TEXT_NODE && node.textContent.trim() !== '')
        );

        if (children.length === 1 && children[0].nodeType === Config.window.Node.ELEMENT_NODE) {
            result = /** @type {Element} */ (children[0]);
        } else {
            result = document.createElement('html-fragment');
            result.appendChild(template);
        }
    } else {
        result = document.createElement('html-fragment');
        result.appendChild(template);
    }
    return result;
}

/**
 * Default handler for the "connect" event.
 * This function calls the `reloadText` method and then the `connectedCallback` method of the component.
 * If the `connectedCallback` method throws an error, it is caught and console.error is called with the error.
 * @param {any} ctx
 * @param {Component} component - The component instance
 */
function onConnectDefault(ctx, component) {
    component.reloadText();
    try {
        component.connectedCallback();
    } catch (e) {
        console.error('Error in connectedCallback:', e);
    }
}

/**
 * Default handler for the "disconnect" event.
 * This function calls the `disconnectedCallback` method of the component.
 * If the `disconnectedCallback` method throws an error, it is caught and console.error is called with the error.
 * @param {any} ctx
 * @param {Component} component - The component instance
 */
function onDisconnectDefault(ctx, component) {
    try {
        component.disconnectedCallback();
    } catch (e) {
        console.error('Error in disconnectedCallback:', e);
    }
}


const UI_COMPONENT_SHEET = Symbol('isUIComponentSheet');

function extractComponentStyles(doc = document) {
    if (!doc.adoptedStyleSheets) return '';

    return doc.adoptedStyleSheets
        .filter(sheet => sheet[UI_COMPONENT_SHEET] === true)
        .map(sheet => {
            return Array.from(sheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
        })
        .join('\n');
}





/**
 * Recursively updates SIDs for a component tree.
 * Pure logic extracted from the Component class to allow isolated testing.
 * * @param {any} component - The root component to start from.
 * @param {string} newSid - The new SID to assign.
 * @param {HydrationCallbacks} callbacks - Methods to interact with the component instance.
 */
function updateComponentTreeSid(component, newSid, callbacks) {
    // 1. Update the current component's SID via callback
    callbacks.onUpdateSid(component, newSid);

    // 2. Trigger hydration for this level
    callbacks.onApplyHydration(component);

    // 3. Process children in slots
    const slots = callbacks.getSlots(component);

    slots.forEach((slot, name) => {
        // Assume slot has a method to get its children (components)
        const subComponents = typeof slot.getComponents === 'function' ? slot.getComponents() : [];
        
        for (let j = 0; j < subComponents.length; j++) {
            const subChild = subComponents[j];
            // Format: "parentSid.slotName.index" (e.g., "0.main.1")
            const subSid = `${newSid}.${name}.${j}`;
            
            // Recursive call
            updateComponentTreeSid(subChild, subSid, callbacks);
        }
    });
}





/**
 * Filters elements by tag name within a specific DOM scope.
 * * @param {Element} root - The starting element for the search.
 * @param {string} tagName - Tag name to filter by (or '*' for all).
 * @param {Function} walkDomScope - The utility function for scoped traversal.
 * @param {DomScopeOptions} options - Configuration for the traversal.
 * @returns {Element[]} Array of matched elements.
 */
function filterElementsByTagName(root, tagName, walkDomScope, options) {
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
function insertToDOM(fragment, resolvedTarget, strategy, window) {
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



/**
 * Prepares a DOM element to act as a teleport root by setting necessary attributes.
 * @param {Element} node - The element to prepare.
 * @param {string} name - Teleport name from the config.
 * @param {string|null} parentSid - The SID of the owning component (for SSR/Hydration).
 * @param {string} instanceId - The unique ID of the component instance.
 */
function prepareTeleportNode(node, name, parentSid, instanceId) {
    node.setAttribute('data-component-teleport', name);
    node.setAttribute('data-component-root', instanceId);
    
    if (parentSid) {
        node.setAttribute('data-parent-sid', parentSid);
    }
}

/**
 * Attempts to find an existing teleport node in the DOM during hydration.
 * @param {Document|Element} root - Search root (usually document).
 * @param {string} parentSid - The owner's SID.
 * @param {string} teleportName - The name of the teleport.
 * @returns {Element|null}
 */
function findExistingTeleport(root, parentSid, teleportName) {
    const selector = `[data-parent-sid="${parentSid}"][data-component-teleport="${teleportName}"]`;
    return root.querySelector(selector);
}

/**
 * Claims an existing teleport node by updating its attributes for the new instance.
 * @param {Element} node - The teleport node to claim.
 * @param {string} instanceId - The new instance ID.
 */
function claimTeleportNode(node, instanceId) {
    node.setAttribute('data-component-root', instanceId);
    node.removeAttribute('data-parent-sid');
}



/**
 * Creates and returns a CSSStyleSheet from a string or an existing sheet.
 * Marks it with a special symbol for library tracking.
 * * @param {string | CSSStyleSheet} styles - CSS string or existing stylesheet.
 * @param {symbol} marker - Unique symbol to mark the sheet as internal.
 * @param {any} window - The window object for constructor access.
 * @returns {CSSStyleSheet | null}
 */
function createComponentStyleSheet(styles, marker, window) {
    if (typeof window.CSSStyleSheet === 'undefined') return null;

    let sheet;
    if (styles instanceof window.CSSStyleSheet) {
        sheet = styles;
    } else {
        sheet = new window.CSSStyleSheet();
        // @ts-ignore
        sheet.replaceSync(styles);
    }

    // Mark it as ours so SSR and other components can identify it
    sheet[marker] = true;
    return sheet;
}

/**
 * Injects a stylesheet into the document's adoptedStyleSheets.
 * Ensures no duplicates by checking the marker.
 * * @param {Document} doc - The target document.
 * @param {CSSStyleSheet} sheet - The sheet to inject.
 */
function injectSheet(doc, sheet) {
    if (!doc.adoptedStyleSheets) {
        // Fallback for environments without adoptedStyleSheets support
        // @ts-ignore
        doc.adoptedStyleSheets = [];
    }

    // Double check to prevent adding the exact same instance twice
    if (!doc.adoptedStyleSheets.includes(sheet)) {
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    }
}



/**
 * Prepares the rendered element by setting identifying attributes and managing cache.
 * @param {Element} element - The fresh or resolved element from layout.
 * @param {Object} options
 * @param {string} options.instanceId - The unique ID of the component instance.
 * @param {string|null} [options.sid] - The stable Session ID for SSR/Hydration.
 * @param {boolean} [options.isSSR] - Whether the current environment is SSR.
 * @returns {Element} The prepared element.
 */
function prepareRenderResult(element, { instanceId, sid, isSSR }) {
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
function getCloneFromCache(cachedElement, shouldClone) {
    if (shouldClone && cachedElement) {
        return /** @type {Element} */ (cachedElement.cloneNode(true));
    }
    return null;
}




/**
 * Pure logic to collect and merge references from multiple roots.
 * @param {Element[]} roots - All root elements to scan (main + additional).
 * @param {Function} selectRefsExtended - The external utility for deep scanning.
 * @param {Object} options - Scanning configuration.
 * @returns {RefScanResult}
 */
function scanRootsForRefs(roots, selectRefsExtended, options) {
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



/**
 * Recursively finds a component in the tree by its SID.
 * Includes optimization checks to skip irrelevant branches.
 * * @param {Component} startComponent - Where to start the search.
 * @param {string} targetSid - The SID to find.
 * @returns {Component | null}
 */
function findComponentBySid(startComponent, targetSid) {
    const currentSid = startComponent.$internals.sid;

    // 1. Quick check: is it the current component?
    if (currentSid === targetSid) {
        return startComponent;
    }

    // 2. Optimization: if targetSid doesn't start with currentSid,
    // the target cannot be in this branch.
    if (currentSid && !targetSid.startsWith(currentSid + '.')) {
        return null;
    }

    // 3. Recursive search through slots
    const slots = startComponent.slotManager.getSlots();
    for (const slot of slots.values()) {
        for (const child of slot.getComponents()) {
            const found = findComponentBySid(child, targetSid);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Collects all ancestor components starting from the current one up to the root.
 * @param {Component} component
 * @returns {Component[]} Array of components from self to top-level root.
 */
function collectComponentAncestors(component) {
    /** @type {Component<any>[]} */
    const ancestors = [];
    let current = component;

    while (current) {
        ancestors.push(current);
        current = current.$internals.parentComponent;
    }

    return ancestors;
}



/**
 * Validates the container and the mount mode.
 * @param {any} container 
 * @param {string} mode 
 * @param {Object} window - Configured window object
 * @throws {TypeError|Error}
 */
function validateMountArgs(container, mode, window) {
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
function findHydrationRoot(container, sid) {
    if (container.getAttribute('data-sid') === sid) {
        return container;
    }
    return container.querySelector(`[data-sid="${sid}"]`);
}




const sharedTemplates = new WeakMap();

/**
 * @template {import("dom-scope").RefsAnnotation} [T=any]
 */
class Component {
    /** @type {string | CSSStyleSheet | null} */
    static styles = null;
    static _stylesInjected = false;

    /** @type {Internals} */
    $internals = new Internals();

    /**
     * Shared template for all instances of this class.
     * Best for performance as it's cached globally.
     * @type {string|undefined}
     */
    static layout;

    /**
     * Instance-specific layout. Overrides static layout.
     * Use a function for dynamic structures or a string/Node for unique instances.
     * @type {((component: any) => Node|string)|string|null|Node}
     */
    layout = null;

    /** @type {TeleportList} */
    teleports = {};

    /** @type {T} */
    refsAnnotation;

    #isConnected = false;

    slotManager = new SlotManager(this);

    #isCollapsed = false;

    #cachedElement = null;

    /** @type {Function[]} */
    #disposers = [];

    /**
     * Initializes a new instance of the Component class.
     * @param {Object} [options] - An object with the following optional properties:
     * @param {string} [options.instanceId] - The instance ID of the component. If not provided, a unique ID will be generated.
     * @param {string} [options.sid]
     */
    constructor(options = {}) {
        const { instanceId = null, sid = null } = options;
        this.$internals = new Internals();

        if (instanceId) this.$internals.instanceId = instanceId;

        this.on('connect', onConnectDefault);
        this.on('disconnect', onDisconnectDefault);

        // Set the Server ID if provided (Hydration mode)
        if (sid) {
            this.$internals.sid = sid;

            this.once('restore', data => {
                this.restoreCallback(data);
            });
        }
    }

    /** @returns {string} */
    get instanceId() {
        return this.$internals.instanceId;
    }

    /* State */

    /**
     * Checks if the component is connected to a root element.
     * @returns {boolean} True if the component is connected, false otherwise.
     */
    get isConnected() {
        return this.#isConnected;
    }

    /**
     * Triggers the text update logic by calling the registered text update function.
     * Use this to refresh translated strings, plural forms, or formatted labels
     * without rerendering the entire component structure.
     */
    reloadText() {
        if (this.$internals.textUpdateFunction) {
            this.$internals.textUpdateFunction(this);
        }
    }

    /**
     * Registers a specialized function responsible for updating text nodes within the component.
     * This is particularly useful for i18n (internationalization) or when specific labels
     * depend on multiple state variables.
     * * @param {((component: this) => void) | null} func - The function to be called by `reloadText()`.
     */
    setTextUpdateFunction(func) {
        this.$internals.textUpdateFunction = func;
    }

    /**
     * Sets the layout of the component by assigning the template content.
     * @param {((component: this) => Node|string)|string} layout - A function that returns a Node representing the layout.
     * @param {T} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setLayout(layout, annotation) {
        this.layout = layout;

        if (annotation) {
            this.refsAnnotation = annotation;
        }
    }

    /**
     * Returns the unique class identifier (CID) for this component type.
     * Useful for external styling or testing.
     * @returns {string}
     */
    static get classId() {
        return getComponentClassId(this);
    }

    /**
     * Shortcut to get the component class identifier.
     * @returns {string}
     */
    get classId() {
        return /** @type {typeof Component} */ (this.constructor).classId;
    }

    #ensureStylesInjected() {
        const ctor = /** @type {typeof Component} */ (this.constructor);

        if (ctor._stylesInjected) return;

        if (Config.window.document.getElementById('ui-ssr-styles')) {
            ctor._stylesInjected = true;
            return;
        }

        if (ctor.styles) {
            this.#injectStaticStyles(ctor.styles);
        }

        ctor._stylesInjected = true;
    }

    /**
     *
     * @param {string | CSSStyleSheet | null} styles
     * @returns
     */
    #injectStaticStyles(styles) {
        // Use the utility to create the sheet
        const sheet = createComponentStyleSheet(styles, UI_COMPONENT_SHEET, Config.window);

        if (sheet) {
            // Inject it into the global document
            injectSheet(document, sheet);
        }
    }

    /* Refs */

    /**
     * Returns the refs object.
     * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
     * The refs object is only available after the component has been connected to the DOM.
     * @returns {typeof this["refsAnnotation"]}
     */
    getRefs() {
        if (!this.#isConnected) {
            throw new Error('Component is not connected to the DOM');
        }

        return /** @type {any} */ (this.$internals.refs);
    }

    /**
     * Checks if a ref with the given name exists.
     * @param {string} refName - The name of the ref to check.
     * @returns {boolean} True if the ref exists, false otherwise.
     */
    hasRef(refName) {
        let refs = this.getRefs();
        return refName in refs;
    }

    /**
     * Manually rescans the component's DOM tree to update the `refs` object.
     * While this is called automatically during mounting and hydration, you should
     * call it manually if you've dynamically injected new HTML containing `data-ref`
     * attributes (e.g., via innerHTML) to ensure `getRefs()` returns the latest elements.
     * * @throws {Error} If the component is not currently connected to the DOM.
     * @returns {void}
     */
    updateRefs() {
        if (!this.$internals.root) {
            throw new Error('Component is not connected to the DOM');
        }

        this.emit('before-update-refs');

        // 1. Prepare roots
        const allRoots = /** @type {Element[]} */ (
            this.$internals.additionalRoots.length > 0
                ? [this.$internals.root, ...this.$internals.additionalRoots]
                : [this.$internals.root]
        );

        // 2. Delegate "heavy" scanning to pure utility
        const { refs, scopeRefs } = scanRootsForRefs(allRoots, selectRefsExtended, {
            scopeAttribute: ['data-slot', 'data-component-root'],
            refAttribute: 'data-ref',
            window: Config.window,
        });

        // 3. Post-processing (Orchestration)
        for (const key in scopeRefs) {
            this.slotManager.registerSlot(key);
        }

        this.$internals.refs = refs;
        this.$internals.scopeRefs = scopeRefs;

        // 4. Validation
        if (Config.checkRefsFlag && this.refsAnnotation) {
            checkRefs(refs, this.refsAnnotation);
        }
    }

    serialize() {
        return {};
    }

    /* Events */

    /**
     * Subscribes to a specified event.
     * @param {ComponentEvent} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event, callback) {
        return this.$internals.eventEmitter.on(event, callback);
    }

    /**
     * Subscribes to a specified event and automatically unsubscribes after the first trigger.
     * @param {ComponentEvent} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function.
     * @returns {() => void} A function that can be called to unsubscribe the listener before it triggers.
     */
    once(event, callback) {
        return this.$internals.eventEmitter.once(event, callback);
    }

    /**
     * Emits an event with the given arguments.
     * @param {ComponentEvent} event - The name of the event to emit.
     * @param {any} [data={}] - The data object to be passed to the event handlers.
     */
    emit(event, data = {}) {
        return this.$internals.eventEmitter.emit(event, data, this);
    }

    /**
     * Attaches an event listener to the specified element.
     * The event listener is automatically removed when the component is unmounted.
     * @param {HTMLElement|Element} element - The element to attach the event listener to.
     * @param {keyof HTMLElementEventMap} event - The name of the event to listen to.
     * @param {EventListenerOrEventListenerObject} callback - The function to be called when the event is triggered.
     * @returns {() => void} A function that can be called to remove the event listener.
     */
    $on(element, event, callback) {
        element.addEventListener(event, callback, {
            signal: this.$internals.disconnectController.signal,
        });
        return () => element.removeEventListener(event, callback);
    }

    /* Lifecycle methods */

    /**
     * Connects the component to the specified componentRoot element.
     * Initializes the refs object and sets the component's root element.
     * Emits "connect" event through the event emitter.
     * @param {HTMLElement} componentRoot - The root element to connect the component to.
     */
    #connect(componentRoot) {
        this.$internals.root = componentRoot;
        this.updateRefs();

        this.$internals.disconnectController = new (
            Config.window.AbortController || AbortController
        )();
        this.#isConnected = true;
        this.slotManager.mountAllSlots();

        this.emit('connect');
    }

    /**
     * Disconnects the component from the DOM.
     * Sets the component's #isConnected flag to false.
     * Clears the refs and scopeRefs objects.
     * Aborts all event listeners attached with the $on method.
     * Emits "disconnect" event through the event emitter.
     */
    #disconnect() {
        if (this.#isConnected === false) return;

        this.#isConnected = false;
        this.$internals.disconnectController.abort();
        this.$internals.refs = {};
        this.$internals.scopeRefs = {};
        this.#runDisposers();
        this.emit('disconnect');
    }

    /**
     * This method is called when the component is connected to the DOM.
     * It is an empty method and is intended to be overridden by the user.
     * @memberof Component
     */
    connectedCallback() {}

    /**
     * This method is called when the component is disconnected from the DOM.
     * It is an empty method and is intended to be overridden by the user.
     * @memberof Component
     */
    disconnectedCallback() {}

    /**
     * Called automatically during the hydration process to restore the component's state.
     * This method receives data serialized by `serialize()` on the server.
     * Use this to synchronize your internal `this.state` with server-provided data
     * before the component becomes interactive in the DOM.
     * * @param {any} data - The plain object retrieved from the hydration manifest (window.__HYDRATION_DATA__).
     * @returns {void}
     */
    restoreCallback(data) {}

    /**
     * Internal rendering engine.
     * Separates static (cached) layouts from dynamic (functional) layouts.
     * Ensures a single root Element is always returned.
     * @returns {Element}
     */
    #render() {
        const ctor = /** @type {typeof Component} */ (this.constructor);
        const layout = this.layout || ctor.layout;
        if (!layout) throw new Error('Layout is not defined.');

        const isFunction = typeof layout === 'function';
        const shouldClone = this.$internals.cloneTemplateOnRender;

        /** @type {Element} */
        let result;

        // Resolve the raw element (from cache or new)
        if (!isFunction && layout === ctor.layout) {
            let cached = sharedTemplates.get(ctor);
            if (!cached) {
                cached = resolveLayout(layout, this);
                sharedTemplates.set(ctor, cached);
            }
            result = /** @type {Element} */ (cached.cloneNode(true));
        } else if (!isFunction) {
            const cached = getCloneFromCache(this.#cachedElement, shouldClone);
            result = cached || resolveLayout(layout, this);
        } else {
            result = resolveLayout(layout, this);
        }

        /**
         * Prepare the root element:
         * - Assigns instanceId and sid
         * - Sets data-component-root attribute
         */
        this.$internals.root = prepareRenderResult(result, {
            instanceId: this.instanceId,
            sid: this.$internals.sid,
            isSSR: Config.isSSR,
        });

        /*
         * Handle CSS Scoping:
         * If 'cssScope' is enabled, attach the unique class ID (data-cid)
         * to the root element for native @scope rule targeting.
         */
        // @ts-ignore
        if (ctor.cssScope) {
            result.setAttribute('data-cid', getComponentClassId(ctor));
        }

        /**
         * Initialize slots:
         * Captures default content from HTML (client/SSR) or JS config.
         */
        this.#initDefaultSlots(layout, result);

        // 4. Final caching and returning
        if (!isFunction && shouldClone && !this.#cachedElement) {
            this.#cachedElement = result;
            return /** @type {Element} */ (result.cloneNode(true));
        }

        return result;
    }

    /**
     * Mounts the component to a DOM container or hydrates existing HTML.
     * @param {string|HTMLElement|(() => HTMLElement)} container - The target (selector, element, or provider).
     * @param {"replace"|"append"|"prepend"|"hydrate"} mode - The mounting strategy.
     */
    mount(container, mode = 'replace') {
        // Prevent `mount` from executing in SSR environment (early return when Config.isSSR is true)
        if (Config.isSSR) return;
        if (this.isCollapsed) return;

        // Resolve the container to a guaranteed Element before validation
        const resolvedContainer = this.#resolveTarget(container);

        // Validate using the guaranteed Element
        validateMountArgs(resolvedContainer, mode, Config.window);

        if (mode === 'hydrate') {
            return this.#handleHydration(resolvedContainer);
        }

        if (this.isConnected) {
            this.#handleMove(resolvedContainer, mode);
        } else {
            this.#handleInitialMount(resolvedContainer, mode);
        }
    }

    /**
     * @param {Element} container
     */
    #handleHydration(container) {
        this.#ensureStylesInjected();
        const sid = this.$internals.sid;

        if (!sid) throw new Error('Hydration failed: No SID assigned.');

        const root = findHydrationRoot(container, sid);
        if (!root) throw new Error(`Hydration failed: SID "${sid}" not found.`);

        root.removeAttribute('data-sid');
        root.setAttribute('data-component-root', this.instanceId);

        this.$internals.root = root;
        this.$internals.parentElement = root.parentElement;
        this.$internals.mountMode = 'replace';

        this.#applyHydration();
        this.#connect(/** @type {HTMLElement} */ (root));
        this.emit('mount');
    }

    /**
     * @param {Element} container
     * @param {"replace"|"append"|"prepend"} mode
     */
    #handleInitialMount(container, mode) {
        const root = this.#render();

        if (mode === 'replace') container.replaceChildren(root);
        else if (mode === 'append') container.append(root);
        else if (mode === 'prepend') container.prepend(root);

        this.$internals.root = root;
        this.$internals.parentElement = container;
        this.$internals.mountMode = mode;

        this.#ensureStylesInjected();
        this.#mountTeleports();
        this.emit('prepareRender', root);
        this.#connect(/** @type {HTMLElement} */ (root));
        this.emit('mount');
    }

    /**
     * @param {Element} container
     * @param {"replace"|"append"|"prepend"} mode
     */
    #handleMove(container, mode) {
        const root = this.getRootNode();

        if (mode === 'replace') container.replaceChildren(root);
        else if (mode === 'append') container.append(root);
        else if (mode === 'prepend') container.prepend(root);

        this.$internals.parentElement = container;
        this.$internals.mountMode = mode;
        this.emit('move', { to: container });
    }

    /**
     * Unmounts the component from the DOM.
     * Emits "beforeUnmount" and "unmount" events through the event emitter.
     * Disconnects the component from the DOM and removes the root element.
     */
    unmount() {
        if (this.#isConnected === false) return;

        this.emit('beforeUnmount');
        this.slotManager.unmountAll();

        this.#disconnect();

        this.#cleanupTeleports();
        this.$internals.additionalRoots = [];
        this.$internals.root?.remove();
        this.$internals.root = null;

        this.$internals.elementsToRemove.forEach(el => {
            el.remove();
        });
        this.$internals.elementsToRemove.clear();

        this.emit('unmount');
    }

    /**
     * Returns the AbortSignal that aborts when the component is unmounted.
     * Use this to cancel async operations (fetch, timers, etc.) automatically.
     * @returns {AbortSignal}
     */
    getUnmountSignal() {
        return this.$internals.disconnectController.signal;
    }

    /**
     * Rerenders the component.
     * If the component is connected, it unmounts and mounts the component again.
     * If the component is not connected, it mounts the component to the parent component's slot.
     */
    rerender() {
        this.collapse();
        this.expand();
    }

    /**
     * Returns whether the component is currently in a collapsed state (replaced by a placeholder).
     * @returns {boolean}
     */
    get isCollapsed() {
        return this.#isCollapsed;
    }

    /**
     * Collapses the component by replacing its DOM content with a lightweight placeholder.
     * Unlike `unmount()`, this state is tracked by `isCollapsed`, allowing the component
     * to remember its exact position in the DOM tree for future restoration.
     */
    collapse() {
        this.unmount();
        this.#isCollapsed = true;
        this.emit('collapse');
    }

    /**
     * Re-mounts a collapsed component back into its original DOM position.
     */
    expand() {
        this.#isCollapsed = false;

        // 1. If already connected, nothing to do
        if (this.#isConnected) return;

        const parent = this.$internals.parentComponent;

        // 2. Delegate to specific resolution logic
        const target = parent ? this.#resolveSlotTarget(parent) : this.#resolveStandaloneTarget();

        if (!target) return;

        // 3. Perform the mount and notify
        this.mount(target, this.$internals.mountMode);
        this.emit('expand');
    }

    /**
     * Resolves the target element for a standalone component.
     * @returns {HTMLElement|null}
     */
    #resolveStandaloneTarget() {
        const el = this.$internals.parentElement;

        if (!el) {
            console.warn('[Expand] Cannot expand: no parent element specified.');
            return null;
        }

        if (!el.isConnected) {
            console.warn('[Expand] Cannot expand: parent element is disconnected from DOM.');
            return null;
        }

        return /** @type {HTMLElement} */ (el);
    }

    /**
     * Resolves the target slot in a parent component.
     * @param {Component} parent
     * @returns {HTMLElement|null}
     */
    #resolveSlotTarget(parent) {
        if (!parent.isConnected) {
            console.warn('[Expand] Cannot expand: parent component is not connected.');
            return null;
        }

        const slotName = this.$internals.assignedSlotName;
        const slotRef = parent.$internals.scopeRefs[slotName];

        if (!slotRef) {
            console.warn(`[Expand] Cannot find slot "${slotName}" in parent component.`);
            return null;
        }

        return slotRef;
    }

    /**
     * Forces the expansion of the entire component hierarchy from the current node up to the root.
     * Use this when you need to ensure a specific nested component is visible,
     * even if its ancestors were previously collapsed.
     */
    expandForce() {
        /** @type {Component[]} */
        const ancestors = collectComponentAncestors(this);

        for (let i = ancestors.length - 1; i >= 0; i--) {
            ancestors[i].expand();
        }
    }

    /**
     * Registers a cleanup function to be executed when the component is unmounted.
     * * This is the recommended way to manage third-party resources (like MobX disposers,
     * timers, or external library instances) to ensure they are properly cleaned up
     * without manually overriding `disconnectedCallback`.
     *
     * @param {() => void} fn - The cleanup function to register.
     * @example
     * connectedCallback() {
     * // Example: Auto-cleanup for a timer
     * const timerId = setInterval(() => this.tick(), 1000);
     * this.addDisposer(() => clearInterval(timerId));
     * * // Example: Auto-cleanup for a third-party library
     * const chart = new Chart(this.getRefs().canvas, config);
     * this.addDisposer(() => chart.destroy());
     * }
     */
    addDisposer(fn) {
        if (typeof fn === 'function') {
            this.#disposers.push(fn);
        }
    }

    #runDisposers() {
        this.#disposers.forEach(dispose => {
            try {
                dispose();
            } catch (e) {
                console.error(`Error in disposer:`, e);
            }
        });
        this.#disposers = [];
    }

    /* Slots, parent, children */

    /**
     * Returns an array of the slot names defined in the component.
     * @returns {string[]}
     */
    getSlotNames() {
        return this.slotManager.slotNames;
    }

    /**
     * Clears the given slot name of all its children components.
     * This method first removes all children components of the given slot name from the component,
     * then unmounts them and finally removes them from the component's internal maps.
     * @param {string} slotName - The name of the slot to clear.
     * @returns {boolean} True if the slot was cleared, false otherwise.
     */
    clearSlotContent(slotName) {
        return this.slotManager.clearSlotContent(slotName);
    }

    /**
     * Checks if the given slot name has any children components associated with it.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot has children components, false otherwise.
     */
    hasSlotContent(slotName) {
        return this.slotManager.hasSlotContent(slotName);
    }

    /**
     * Detaches a component from the slot.
     * @returns {boolean}
     */
    detachFromSlot() {
        let oldParentComponent = this.parentComponent;
        if (oldParentComponent && this.$internals.assignedSlotName) {
            //let slot = oldParentComponent.slotManager.findSlotByComponent(this);
            let slot = oldParentComponent.slotManager.getSlot(this.$internals.assignedSlotName);
            if (!slot) return false;

            return slot.detach(this);
        }
        return false;
    }

    /**
     * Returns a slot element
     * @param {string} slotName
     * @returns {HTMLElement|null}
     */
    getSlotElement(slotName) {
        return this.slotManager.getSlotElement(slotName);
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {Component|Component[]} componentOrComponents - The component to add to the slot.
     * @param {"append"|"replace"|"prepend"} [mode="append"]
     * @returns {Component<T>}
     * @throws {Error} If the slot does not exist.
     */
    addToSlot(slotName, componentOrComponents, mode = 'append') {
        /** @type {Component[]} */
        const components = Array.isArray(componentOrComponents)
            ? componentOrComponents
            : [componentOrComponents];

        const validModes = new Set(['append', 'replace', 'prepend']);
        if (!validModes.has(mode)) mode = 'append';

        const oldLength = this.slotManager.getSlotLength(slotName);
        const slot = this.slotManager.attachToSlot(slotName, components, mode);

        const parentSid = this.$internals.sid;
        if (parentSid) {
            const allComponents = slot.getComponents();
            let startIndex = 0;

            if (mode === 'append') {
                startIndex = oldLength;
            }

            for (let i = startIndex; i < allComponents.length; i++) {
                const child = allComponents[i];
                const newSid = `${parentSid}.${slotName}.${i}`;
                this.#recursiveUpdateSid(child, newSid);
            }
        }

        if (this.#isConnected) {
            if (mode == 'replace') {
                slot.unmount();
                slot.mount();
            } else {
                const slotRoot = this.slotManager.getSlotElement(slotName);
                if (!slotRoot) {
                    console.warn(`Slot root for "${slotName}" not found, cannot mount children`);
                    return this;
                }

                if (mode == 'append') {
                    for (let i = 0; i < components.length; i++) {
                        let child = components[i];
                        child.mount(slotRoot, 'append');
                    }
                } else if (mode == 'prepend') {
                    for (let i = components.length - 1; i >= 0; i--) {
                        let child = components[i];
                        child.mount(slotRoot, 'prepend');
                    }
                }
            }
        }

        return this;
    }

    /**
     * SSR strategy: Parses HTML string to find slot contents.
     * @param {string} html
     */
    #captureFromHTMLString(html) {
        const slotNamesMatch = html.matchAll(/data-slot=["']([^"']+)["']/g);

        for (const match of slotNamesMatch) {
            const slotName = match[1];
            const slot = this.slotManager.registerSlot(slotName);

            if (!slot.hasDefaultLayout()) {
                const content = this.#extractBalancedContent(html, slotName);
                if (content) {
                    slot.setDefaultLayout(content);
                }
            }
        }
    }

    /**
     * Extracts innerHTML from a string by balancing tags.
     * @param {string} html
     * @param {string} slotName
     */
    #extractBalancedContent(html, slotName) {
        const attr = `data-slot="${slotName}"`;
        const idx = html.indexOf(attr);
        if (idx === -1) return null;

        const openStart = html.lastIndexOf('<', idx);
        const tagMatch = html.substring(openStart + 1).match(/^[a-z0-9-]+/i);
        if (!tagMatch) return null;

        const tagName = tagMatch[0];
        const openTagPrefix = `<${tagName}`;
        const closeTag = `</${tagName}>`;

        const firstOpenEnd = html.indexOf('>', idx) + 1;

        let depth = 1;
        let cursor = firstOpenEnd;

        while (depth > 0) {
            const nextOpen = html.indexOf(openTagPrefix, cursor);
            const nextClose = html.indexOf(closeTag, cursor);

            if (nextClose === -1) break; // Ошибка верстки

            if (nextOpen !== -1 && nextOpen < nextClose) {
                depth++;
                cursor = nextOpen + openTagPrefix.length;
            } else {
                depth--;
                if (depth === 0) {
                    return html.substring(firstOpenEnd, nextClose).trim();
                }
                cursor = nextClose + closeTag.length;
            }
        }
        return null;
    }

    /**
     * Dispatcher for capturing default slot content.
     * @param {any} layout - The raw layout (string, function, or Node).
     * @param {Element} resultElement - The resolved DOM element.
     */
    #initDefaultSlots(layout, resultElement) {
        if (Config.isSSR) {
            // На сервере работаем со строками (Regex + Tag Balancing)
            let htmlString = '';
            if (typeof layout === 'string') {
                htmlString = layout;
            } else if (typeof layout === 'function') {
                const res = layout(this);
                if (typeof res === 'string') htmlString = res;
            }

            if (htmlString) {
                this.#captureFromHTMLString(htmlString);
            }
        } else {
            this.#captureFromDOM(resultElement);
        }
    }

    /**
     * Browser-side strategy: uses DOM API to find and capture slot content.
     * @param {Element} root
     */
    #captureFromDOM(root) {
        const slotElements = root.querySelectorAll('[data-slot]');
        slotElements.forEach(el => {
            const slotName = el.getAttribute('data-slot');
            if (!slotName) return;

            const slot = this.slotManager.registerSlot(slotName);
            if (!slot.hasDefaultLayout()) {
                const content = el.innerHTML.trim();
                if (content) {
                    slot.setDefaultLayout(content);
                }
            }
        });
    }

    /**
     * Returns the parent component of the current component, or null if the current component is a root component.
     * @returns {Component | null} The parent component of the current component, or null if the current component is a root component.
     */
    get parentComponent() {
        return this.$internals.parentComponent || null;
    }

    /* DOM */

    /**
     * Returns the root node of the component.
     * This is the node that the component is mounted to.
     * @returns {HTMLElement} The root node of the component.
     */
    getRootNode() {
        if (!this.$internals.root) {
            throw new Error('Component is not connected to the DOM');
        }

        return /** @type {HTMLElement} */ (this.$internals.root);
    }

    /**
     * Removes an element from the DOM when the component is unmounted.
     * The element is stored in an internal set and removed from the DOM when the component is unmounted.
     * @param {...Element} elements - The elements to remove from the DOM when the component is unmounted.
     */
    removeOnUnmount(...elements) {
        for (let i = 0; i < elements.length; i++) {
            this.$internals.elementsToRemove.add(elements[i]);
        }
    }

    /**
     * Internal method to get elements by tag name, filtering out those within scoped refs.
     * @param {string} tagName - The tag name to search for.
     * @returns {Element[]} An array of elements matching the tag name, excluding those within scoped refs.
     */
    #getElementsByTagName(tagName) {
        if (!this.#isConnected) {
            throw new Error('Component is not connected to the DOM');
        }

        if (!this.$internals.root) {
            throw new Error('Component is not connected to the DOM');
        }

        return filterElementsByTagName(this.$internals.root, tagName, walkDomScope, {
            scopeAttribute: ['data-slot', 'data-component-root'],
            refAttribute: 'data-ref',
            window: Config.window,
        });
    }

    /**
     * Returns an array of elements matching the given tag name within the component's scope.
     * Unlike standard querySelectorAll, this method respects component boundaries:
     * it ignores elements that belong to nested child components.
     * * @param {string} tagName - The tag name to search for (e.g., 'li', 'div').
     * @param {string} [querySelector] - An optional CSS selector to further filter the results.
     * @returns {Element[]} An array of elements belonging ONLY to the current component level.
     */
    queryLocal(tagName, querySelector = '') {
        let elements = this.#getElementsByTagName(tagName);
        if (querySelector === '') {
            return elements;
        } else {
            return elements.filter(el => el.matches(querySelector));
        }
    }

    /**
     * @param {string} name - teleport name
     * @param {TeleportConfig} config - teleport config
     * @returns {Element}
     */
    #renderTeleport(name, config) {
        const result = resolveLayout(config.layout, this);

        prepareTeleportNode(result, name, this.$internals.sid, this.instanceId);

        return result;
    }

    /**
     * @param {string} name
     * @param {Element} root
     */
    #registerRemoteRoot(name, root) {
        if (!this.$internals.additionalRoots.includes(root)) {
            this.$internals.additionalRoots.push(root);
        }
        this.$internals.teleportRoots.set(name, root);
    }

    #mountTeleports() {
        if (!this.teleports) return;

        for (const [name, config] of Object.entries(this.teleports)) {
            // 1. Generate the UI fragment/element
            this.#mountTeleport(name, config);
        }
    }

    /**
     * @param {string} name
     * @param {TeleportConfig} config
     */
    #mountTeleport(name, config) {
        const fragment = this.#renderTeleport(name, config);

        // Resolve the target to a guaranteed HTMLElement
        const resolvedTarget = this.#resolveTarget(config.target);

        // Now #insertToDOM only deals with Element and Fragment
        const rootElement = this.#insertToDOM(fragment, resolvedTarget, config.strategy);
        this.#registerRemoteRoot(name, rootElement);
    }

    /**
     * Resolves a target (string, function, or Element) into a guaranteed HTMLElement.
     * @param {any} target
     * @returns {HTMLElement}
     * @throws {Error}
     */
    #resolveTarget(target) {
        let element = null;

        if (typeof target === 'function') {
            element = target.call(this);
        } else if (typeof target === 'string') {
            element = document.querySelector(target);
        } else if (target instanceof Config.window.Element) {
            element = target;
        }

        if (!element) {
            throw new Error(`[Mounting Error] Target element not found for: ${target}`);
        }

        return element;
    }

    /**
     * Mounts a fragment or element into a specified target using a given strategy.
     * @param {Element|DocumentFragment} fragment - The content to insert (result of resolveLayout).
     * @param {HTMLElement} target - The destination: element, selector, or provider function.
     * @param {"prepend"|"append"|"replace"} [strategy="append"] - The insertion strategy.
     * @returns {Element|null} The root element of the inserted content.
     */
    #insertToDOM(fragment, target, strategy = 'append') {
        // We can still keep a small safety check, but the heavy lifting is done in #resolveTarget
        return insertToDOM(fragment, target, strategy, Config.window);
    }

    #cleanupTeleports() {
        // 1. Physically remove teleported elements from the DOM
        for (const rootElement of this.$internals.teleportRoots.values()) {
            rootElement.remove();
        }

        // 2. Clear the tracking collections
        this.$internals.teleportRoots.clear();
    }

    /**
     * Synchronizes already existing teleported nodes (SSR) with the component instance.
     */
    #hydrateTeleports() {
        if (!this.teleports || !this.$internals.sid) return;

        for (const [name, config] of Object.entries(this.teleports)) {
            const existing = findExistingTeleport(document, this.$internals.sid, name);

            if (existing) {
                claimTeleportNode(existing, this.instanceId);
                this.#registerRemoteRoot(name, existing);
            } else {
                console.warn(`[Hydration] Teleport "${name}" not found. Falling back to mount.`);
                this.#mountTeleport(name, config);
            }
        }
    }

    /**
     * Checks the global manifest and emits the hydrate event if data exists for this SID.
     */
    #applyHydration() {
        if (this.$internals.isHydrated) return;

        const sid = this.$internals.sid;
        if (!sid) return;

        this.#hydrateTeleports();

        // @ts-ignore
        const metadata = Config.getHydrationData(sid);

        if (metadata) {
            this.$internals.isHydrated = true;
            this.emit('restore', metadata);
        }
    }

    /**
     * Recursively updates SIDs for a component and all its nested children.
     * @param {Component} component
     * @param {string} newSid
     */

    #recursiveUpdateSid(component, newSid) {
        updateComponentTreeSid(component, newSid, {
            onUpdateSid: (comp, sid) => {
                comp.$internals.sid = sid;
            },
            onApplyHydration: comp => {
                comp.#applyHydration();
            },
            getSlots: comp => {
                return comp.slotManager.getSlots();
            },
        });
    }

    /**
     * Finds a nested component by its string SID.
     * @param {string} targetSid - The SID to search for.
     * @returns {Component|null}
     */
    getComponentBySid(targetSid) {
        return findComponentBySid(this, targetSid);
    }

    /**
     * Retrieves hydration data for this specific component instance from the global manifest.
     * Useful for accessing server-provided state BEFORE the component is mounted or hydrated.
     * While `restoreCallback` is triggered automatically during `mount('hydrate')`,
     * this method allows manual data retrieval at any time after instantiation.
     * @returns {any | null}
     */
    getHydrationData() {
        const sid = this.$internals.sid;
        return sid ? Config.getHydrationData(sid) : null;
    }
}



class SlotToggler {
    #isDestroyed = false;

    /** @type {string[]} */
    #slotNames;

    /** @type {string} */
    #activeSlotName;

    /** @type {Component} */
    component;

    /**
     * Creates a new instance of SlotToggler.
     * @param {Component} component - The component that owns the slots.
     * @param {string[]} slotNames - The names of the slots.
     * @param {string} [activeSlotName] - The name of the slot that is currently active.
     */
    constructor(component, slotNames, activeSlotName) {
        this.component = component;
        this.#slotNames = slotNames.slice();
        this.#activeSlotName = activeSlotName ? activeSlotName : this.#slotNames[0];
    }

    get slotNames() {
        return this.#slotNames;
    }

    get activeSlotName() {
        return this.#activeSlotName;
    }

    init() {
        for (let i = 0; i < this.#slotNames.length; i++) {
            if (this.#slotNames[i] != this.activeSlotName) {
                let slotElement = this.component.slotManager.getSlotElement(this.#slotNames[i]);
                if (slotElement) {
                    hideElements(slotElement);
                }
                this.component.slotManager.unmountSlot(this.#slotNames[i]);
            }
        }

        this.component.slotManager.mountSlot(this.activeSlotName);
        let slotElement = this.component.slotManager.getSlotElement(this.activeSlotName);
        if (slotElement) {
            showElements(slotElement);
        }
    }

    /**
     * Toggles the active slot to the given slot name.
     * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
     * @param {string} slotName - The name of the slot to toggle to.
     */
    /**
     * Toggles the active slot to the given slot name.
     * @param {string} slotName - The name of the slot to activate.
     */
    toggle(slotName) {
        if (this.#isDestroyed || !this.component) {
            throw new Error('SlotToggler is destroyed');
        }

        if (!this.#slotNames.includes(slotName)) {
            throw new Error(`Slot "${slotName}" is not defined in this SlotToggler`);
        }

        if (slotName === this.#activeSlotName) return;

        const sm = this.component.slotManager;

        // 1. Deactivate current slot
        if (this.#activeSlotName) {
            sm.unmountSlot(this.#activeSlotName);
            const prevElement = sm.getSlotElement(this.#activeSlotName);
            if (prevElement) hideElements(prevElement);
        }

        // 2. Activate new slot
        sm.mountSlot(slotName);
        this.#activeSlotName = slotName;

        const nextElement = sm.getSlotElement(this.#activeSlotName);
        if (nextElement) showElements(nextElement);
    }

    destroy() {
        this.#isDestroyed = true;
        // @ts-ignore
        this.component = null;
        this.#slotNames = [];
        this.#activeSlotName = '';
    }
}




/**
 * Generates a flat map of the component tree for SSR hydration.
 * * @param {...Component} rootComponents - The starting root components of the tree.
 * @returns {Record<string, ComponentMetadata>} A flat dictionary of component metadata indexed by SID.
 */
function generateManifest(...rootComponents) {
    /** @type {Record<string, any>} */
    const container = {};
    /** @type {Set<string>} */
    const processedIds = new Set();

    /**
     * @param {Component} component
     * @param {string} assignedSid - SID assigned by the parent or root loop
     */
    function register(component, assignedSid) {
        // 1. Force SID assignment if it's missing or needs update
        if (!component.$internals.sid || component.$internals.sid !== assignedSid) {
            component.$internals.sid = assignedSid;
        }

        const sid = component.$internals.sid;

        if (processedIds.has(sid)) return;
        processedIds.add(sid);

        /** @type {Record<string, string[]>} */
        const slots = {};

        component.slotManager.slots.forEach((slot, slotName) => {
            /** @type {string[]} */
            const childSids = [];

            let components = slot.getComponents();

            components.forEach((child, index) => {
                // Construct the child SID based on the current component's SID
                const childSid = `${sid}.${slotName}.${index}`;

                // Collect the SID for the manifest
                childSids.push(childSid);

                // Recurse
                register(child, childSid);
            });

            slots[slotName] = childSids;
        });

        container[sid] = {
            className: component.constructor.name,
            // Fallback to empty object if no serialize method
            data: component.serialize(),
            slots: slots,
        };
    }

    rootComponents.forEach((component, index) => {
        if (component) {
            // If the root component already has a SID (e.g. 'app'), use it.
            // Otherwise, generate a default one like 'root0'
            const rootSid = component.$internals.sid || `root${index}`;
            register(component, rootSid);
        }
    });

    return container;
}

/**
 * Creates an HTMLScriptElement containing the hydration manifest.
 * Useful for DOM-based environments or JSDOM on the server.
 * * @param {Record<string, ComponentMetadata>} manifest - The hydration map.
 * @param {string} variableName - Global variable name (default: __HYDRATION_DATA__).
 * @returns {HTMLScriptElement}
 */
function createManifestScript(manifest, variableName = '__HYDRATION_DATA__') {
    const script = document.createElement('script');

    // We use JSON.stringify and wrap it in a self-executing assignment
    const rawJson = JSON.stringify(manifest).replace(/<\/script>/g, '<\\/script>');
    script.textContent = `window.${variableName} = ${rawJson};`;

    return script;
}

/**
 * Alternative for pure string-based SSR (Node.js without JSDOM)
 * @param {Record<string, ComponentMetadata>} manifest
 * @param {string} variableName
 * @returns {string}
 */
function renderManifestHTML(manifest, variableName = '__HYDRATION_DATA__') {
    const rawJson = JSON.stringify(manifest).replace(/<\/script>/g, '<\\/script>');
    return `<script>window.${variableName} = ${rawJson};</script>`;
}

/*
// example

// server.js
import { renderToString } from './ssr-engine.js';
import { generateManifest } from './manifest-generator.js';
import { renderManifest } from './manifest-renderer.js';

const root = new App();
// ... setup tree ...

const htmlContent = renderToString(root);
const manifest = generateManifest(root);
const manifestScript = renderManifest(manifest);

const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Surgical DOM App</title>
</head>
<body>
    <div id="app">${htmlContent}</div>
    
    ${renderManifestHTML}
    
    <script src="/bundle.js"></script>
</body>
</html>
`;
*/

export { Component, Config, DOMReady, SlotToggler, Toggler, UI_COMPONENT_SHEET, copyToClipboard, createManifestScript, createPaginationArray, createStorage, debounce, delegateEvent, escapeHtml, extractComponentStyles, fadeIn, fadeOut, formatBytes, formatDate, formatDateTime, generateId, generateManifest, getDefaultLanguage, hideElements, html, htmlDOM, injectCoreStyles, isDarkMode, local, onClickOutside, removeSpinnerFromButton, renderManifestHTML, renderPaginationElement, scrollToBottom, scrollToTop, session, showElements, showSpinnerInButton, sleep, throttle, ui_button_status_waiting_off, ui_button_status_waiting_off_html, ui_button_status_waiting_on, unixtime, unsafeHTML, withMinimumTime };
