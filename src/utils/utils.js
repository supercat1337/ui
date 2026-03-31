// @ts-check

import { Config } from '../component/config.js';

/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 * @param {Document} [doc=window.document] - The document object to check the ready state of.
 */
export function DOMReady(callback, doc = window.document) {
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
export function escapeHtml(unsafe) {
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
export function ui_button_status_waiting_on(el, text) {
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
export function ui_button_status_waiting_off(el, text) {
    el.disabled = false;
    el.innerText = text;
}

/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner)
 * and sets its innerHTML to the given HTML string.
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} html - The HTML string to be set as the button's innerHTML.
 */
export function ui_button_status_waiting_off_html(el, html) {
    el.disabled = false;
    el.innerHTML = html;
}

/**
 * Scrolls the specified element to the top.
 * Sets the scrollTop property to 0, effectively
 * scrolling to the top of the content.
 * @param {HTMLElement} element - The element to scroll to the top.
 */
export function scrollToTop(element) {
    element.scrollTop = 0;
}

/**
 * Scrolls the specified element to the bottom.
 * Sets the scrollTop property to the element's scrollHeight,
 * effectively scrolling to the bottom of the content.
 * @param {HTMLElement} element - The element to scroll to the bottom.
 */
export function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

/**
 * Adds the "d-none" class to the given elements, hiding them from view.
 * @param {...HTMLElement} elements - The elements to hide.
 */
export function hideElements(...elements) {
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        element.classList.add('d-none');
    }
}

/**
 * Removes the "d-none" class from the given elements, making them visible.
 * @param {...HTMLElement} elements - The elements to show.
 */
export function showElements(...elements) {
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
export function showSpinnerInButton(button, customClassName = null, doc = window.document) {
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
export function removeSpinnerFromButton(button) {
    let spinner = button.querySelector('.spinner-border');
    if (spinner) spinner.remove();
}

/**
 * Checks if the user prefers a dark color scheme.
 * Utilizes the `window.matchMedia` API to determine if the user's
 * system is set to a dark mode preference.
 * @returns {boolean} - Returns `true` if the user prefers dark mode, otherwise `false`.
 */
export function isDarkMode(wnd = window) {
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
export function getDefaultLanguage() {
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
export function formatBytes(bytes, decimals = 2, lang, sizes) {
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
export function copyToClipboard(text, wnd = window) {
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
export function fadeIn(element, duration = 400, wnd = window) {
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
export function fadeOut(element, duration = 400, wnd = window) {
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
export function sleep(ms) {
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
export function withMinimumTime(promise, minTime) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let promiseFinished = false;
        let timerFinished = false;
        /** @type {T} */
        let result;
        /** @type {Error} */
        let error;

        const timerId = setTimeout(() => {
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
export function delegateEvent(eventType, ancestorElement, targetElementSelector, listenerFunction) {
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
export function unsafeHTML(html) {
    return new SafeHTML(html);
}

/**
 * Tagged template literal for high-performance HTML generation.
 * Handles strings, arrays, DOM nodes, and DocumentFragments safely.
 * * @param {TemplateStringsArray | string} strings - Static parts of the template or a raw HTML string.
 * @param {...any} values - Dynamic values to interpolate.
 * @returns {DocumentFragment} A live DocumentFragment containing the parsed HTML.
 */
export function htmlDOM(strings, ...values) {
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
export function debounce(func, wait, immediate = false) {
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
export function throttle(func, wait, options = {}) {
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
export function onClickOutside(element, callback) {
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
export function html(strings, ...values) {
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
