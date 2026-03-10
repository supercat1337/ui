import { selectRefsExtended, checkRefs, walkDomScope } from 'dom-scope';
import { EventEmitter } from '@supercat1337/event-emitter';

// @ts-check

/**
 * @typedef {Object} ComponentMetadata
 * @property {string} className - The constructor name for class instantiation.
 * @property {any} data - Serialized state from component.serialize().
 * @property {Record<string, string[]>} slots - Map of slot names to child instance IDs.
 */

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
    }

    /**
     * Safely retrieves the hydration manifest from the global environment.
     * @returns {ComponentMetadata|null}
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

// @ts-check


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
    return unsafe.replace(/[&<"']/g, function (m) {
        let charset = {
            '&': '&amp;',
            '<': '&lt;',
            '"': '&quot;',
            "'": '&#39;', // ' -> &apos; for XML only
        };
        return charset[/** @type {'&' | '<' | '"' | "'"} */ (m)];
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
    if (button.getElementsByClassName('spinner-border')[0]) return;

    let spinner = doc.createElement('span');

    if (customClassName) {
        spinner.className = customClassName;
    } else {
        spinner.className = 'spinner-border spinner-border-sm';
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
 * @returns {Promise<void>} A promise that resolves when the text has been successfully copied.
 */
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
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
 * Creates a DocumentFragment from a template string.
 * Supports arrays, SafeHTML objects, and automatic escaping of untrusted values.
 * * @param {TemplateStringsArray} strings - Template strings from the tagged template.
 * @param {...any} values - Values to interpolate.
 * @returns {DocumentFragment}
 */
/**
 * Creates a DocumentFragment from a template string or a tagged template.
 * High-performance: uses <template> and handles arrays/SafeHTML.
 * * @param {TemplateStringsArray | string} strings - Template strings array or a single string.
 * @param {...any} values - Values to interpolate.
 * @returns {DocumentFragment}
 */
function html(strings, ...values) {
    let rawResult = '';

    if (typeof strings === 'string') {
        // Handle regular function call: html('<div>...</div>')
        rawResult = strings;
    } else if (Array.isArray(strings)) {
        // Handle tagged template call: html`<div>${value}</div>`
        rawResult = strings.reduce((acc, str, i) => {
            let value = values[i - 1];

            // 1. Handle Arrays (join elements)
            if (Array.isArray(value)) {
                value = value.join('');
            }

            // 2. Process value: check for SafeHTML wrapper or escape
            const stringValue =
                value instanceof SafeHTML ? value.toString() : escapeHtml(String(value ?? ''));

            return acc + stringValue + str;
        });
    }

    const tmpl = document.createElement('template');
    tmpl.innerHTML = rawResult;
    return tmpl.content;
}

/*

// 1. As a tagged template (with escaping and array support)
const items = ['Apple', 'Banana'];
const element = html`
    <ul>
        ${items.map(item => `<li>${item}</li>`)} 
        <li>${unsafeHTML('<span>Trusted info</span>')}</li>
    </ul>
`;

// 2. As a regular function
const simple = html('<div>Static content</div>');

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

    const handler = (event) => {
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

// @ts-check

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

// @ts-check

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

// @ts-check

let idCounter = 0;

/**
 * Generates a unique ID with an optional prefix.
 * 
 * @param {string} [prefix=''] - The prefix to prepend to the ID.
 * @returns {string} The generated unique ID.
 */
function uniqueId(prefix = '') {
    const id = ++idCounter;
    return prefix ? `${prefix}${id}` : String(id);
}

// @ts-check


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

// @ts-check

class Toggler {
    /** @type {Map<string, { isActive: boolean, on: (itemName:string) => void, off: (itemName:string) => void }>} */
    items = new Map();

    /** @type {string} */
    #active = "";

    /**
     * Adds an item to the toggler.
     * @param {string} itemName - The name of the item to be added.
     * @param {(itemName:string) => void} on - The function to be called when the item is set as active.
     * @param {(itemName:string) => void} off - The function to be called when the item is set as inactive.
     */
    addItem(itemName, on, off) {
        if (this.items.has(itemName)) {
            throw new Error("Item already exists");
        }

        this.items.set(itemName, { isActive: false, on, off });
    }

    /**
     * Removes the item with the given name from the toggler.
     * @param {string} itemName - The name of the item to be removed.
     */
    removeItem(itemName) {
        if (this.#active === itemName) {
            this.#active = "";
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
            throw new Error("Item not found");
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
}

// @ts-check

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

// @ts-check

class Slot {
    /** @type {string} */
    name;
    /** @type {Set<Component>} */
    components = new Set();

    /** @type {Component} */
    #component;

    /**
     * Initializes a new instance of the Slot class.
     * @param {string} name - The name of the slot.
     * @param {Component} component
     */
    constructor(name, component) {
        this.name = name;
        this.#component = component;
    }

    /**
     * Attaches a component to the slot.
     * This method sets the given component's parent component and parent slot name,
     * and adds the component to the slot's internal set of components.
     * @param {Component} component - The component to attach to the slot.
     */
    attach(component) {
        component.$internals.parentComponent = this.#component;
        component.$internals.assignedSlotName = this.name;
        this.components.add(component);
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
        return this.components.delete(component);
    }

    /**
     * Detaches all components from the slot.
     * This method sets all components' parent component and parent slot name to null,
     * and removes all components from the slot's internal set of components.
     */
    detachAll() {
        this.components.forEach(component => {
            component.$internals.parentComponent = null;
            component.$internals.assignedSlotName = '';
        });
        this.components.clear();
    }

    /**
     * Mounts all children components of the slot to the DOM.
     */
    mount() {
        if (!this.#component.isConnected) {
            console.warn(
                `Cannot mount Slot "${this.name}" in disconnected component ${
                    this.#component.constructor.name
                }`
            );
            return;
        }

        let slotRoot = this.#component.$internals.scopeRefs[this.name];
        if (!slotRoot) {
            console.warn(
                `Cannot get root element for Slot "${this.name}" does not exist in component "${
                    this.#component.constructor.name
                }"`
            );
            return;
        }

        this.components.forEach(childComponent => {
            childComponent.mount(slotRoot, 'append');
        });
    }

    /**
     * Unmounts all children components of the slot from the DOM.
     * This method iterates over all children components of the slot and calls their unmount method.
     */
    unmount() {
        this.components.forEach(childComponent => {
            childComponent.unmount();
        });
    }

    /**
     * Clears the slot of all its children components.
     * This method first unmounts all children components of the slot, then detaches them from the slot.
     */
    clear() {
        this.unmount();
        this.detachAll();
    }

    getLength() {
        return this.components.size;
    }

    /**
     * 
     * @returns {Component[]}
     */
    getComponents() {
        return [...this.components];
    }
}

// @ts-check

class SlotManager {
    /** @type {Map<string, Slot>} */
    slots = new Map();

    /** @type {Component} */
    #component;

    /**
     * @param {Component} component
     */
    constructor(component) {
        this.#component = component;
    }

    /**
     * Adds a slot to the component.
     * This method is used to programmatically add a slot to the component.
     * If the slot already exists, it is returned as is.
     * Otherwise, a new slot is created and added to the component's internal maps.
     * @param {string} slotName - The name of the slot to add.
     * @returns {Slot} Returns the slot.
     */
    registerSlot(slotName) {
        let slot = this.getSlot(slotName);
        if (slot != null) {
            return slot;
        } else {
            let slot = new Slot(slotName, this.#component);
            this.slots.set(slotName, slot);
            return slot;
        }
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
        if (!this.#component.isConnected) {
            return null;
        }

        return this.#component.$internals.scopeRefs[slotName] || null;
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
        let slotExists = this.hasSlot(slotName);
        if (slotExists) {
            this.clearSlotContent(slotName);
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
        return slot.components.size > 0;
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
        if (!this.#component.isConnected) return;

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
                    this.#component.constructor.name
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
        for (let [slotName, slot] of this.slots) {
            slot.unmount();
        }
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
     * @param {...Component} components - The components to add to the slot.
     * @returns {Slot} Returns the slot.
     */
    attachToSlot(slotName, ...components) {
        let slot = this.registerSlot(slotName);

        for (let i = 0; i < components.length; i++) {
            let component = components[i];
            let usingSlot = this.findSlotByComponent(component);

            if (usingSlot != null) {
                usingSlot.detach(component);
            }

            slot.attach(component);
        }

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
        /*
        for (let [slotName, slot] of this.slots) {
            if (slot.components.has(component)) {
                return slot;
            }
        }

        return null;
        */

        let parentComponent = component.$internals.parentComponent;

        if (parentComponent != this.#component) {
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
    }

}

// @ts-check

/**
 * @typedef {(component: import('./component.js').Component) => void} TextUpdateFunction
 */

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

    /** @type {import('./component.js').Component|null} */
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

    /**
     * Generates a unique instance ID.
     * @returns {string} The unique instance ID.
     */
    static generateInstanceId() {
        let counter = ++Internals.#instanceIdCounter;
        return `c${counter}`;
    }
}

// @ts-check

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
            template = html(returnValue);
        } else {
            throw new Error(`Invalid layout function return type: ${typeof returnValue}`);
        }
    } else if (typeof layout === 'string') {
        // Static: parse the string via the html helper
        template = html(layout.trim());
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
 * @param {Component} component - The component instance
 */
function onConnectDefault(component) {
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
 * @param {Component} component - The component instance
 */
function onDisconnectDefault(component) {
    try {
        component.disconnectedCallback();
    } catch (e) {
        console.error('Error in disconnectedCallback:', e);
    }
}

// @ts-check


/**
 * @typedef {"connect" | "disconnect" | "mount" | "unmount" | "prepareRender" | "collapse" | "expand" | "restore"} ComponentLifecycleEvent
 * @typedef {ComponentLifecycleEvent | (string & {})} ComponentEvent
 */

/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */

/**
 * @typedef {"append" | "prepend" | "replace"} TeleportStrategy
 */

/**
 * @typedef {Object} TeleportConfig
 * @property {() => DocumentFragment} layout - A function that returns a markup fragment for teleportation.
 * @property {Element | string | (() => Element | null)} target - A target element, selector, or function that returns an element.
 * @property {TeleportStrategy} [strategy] - Insertion strategy (default is "append").
 */

/**
 * @typedef {Object.<string, TeleportConfig>} TeleportList
 */

/**
 * @template {import("dom-scope").RefsAnnotation} [T=any]
 */
class Component {
    /** @type {Internals} */
    $internals = new Internals();

    /** @type {((component: this) => Node|string)|string|null|Node} */
    layout = null;

    /** @type {TeleportList} */
    teleports = {};

    /** @type {T} */
    refsAnnotation;

    #isConnected = false;

    slotManager = new SlotManager(this);

    #isCollapsed = false;

    #cachedElement = null;

    /**
     * Initializes a new instance of the Component class.
     * @param {Object} [options] - An object with the following optional properties:
     * @param {string} [options.instanceId] - The instance ID of the component. If not provided, a unique ID will be generated.
     * @param {string} [options.sid]
     */
    constructor(options = {}) {
        const { instanceId = null, sid = null } = options;
        this.$internals = new Internals();

        this.$internals.instanceId = instanceId || `uid-${Math.random().toString(36).slice(2, 9)}`;
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

        const allRoots =
            this.$internals.additionalRoots.length > 0
                ? [this.$internals.root, ...this.$internals.additionalRoots]
                : [this.$internals.root];

        let { refs, scopeRefs } = selectRefsExtended(allRoots, null, {
            scopeAttribute: ['data-slot', 'data-component-root'],
            refAttribute: 'data-ref',
            window: Config.window,
        });

        let rootRefs = {};
        for (let i = 0; i < allRoots.length; i++) {
            let root = allRoots[i];
            if (root instanceof Config.window.Element) {
                let refName = root.getAttribute('data-ref');
                if (refName) {
                    rootRefs[refName] = root;
                }
            }
        }

        refs = { ...refs, ...rootRefs };

        for (let key in scopeRefs) {
            this.slotManager.registerSlot(key);
        }

        this.$internals.refs = refs;
        this.$internals.scopeRefs = scopeRefs;

        if (this.refsAnnotation) {
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
     * @param {...any} args - The arguments to be passed to the event handlers.
     */
    emit(event, ...args) {
        return this.$internals.eventEmitter.emit(event, ...args, this);
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
        if (this.#isConnected === true) {
            throw new Error('Component is already connected');
        }

        this.$internals.root = componentRoot;
        this.updateRefs();

        this.$internals.disconnectController = new AbortController();
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
        const layout = this.layout;
        if (!layout) {
            throw new Error('Layout is not defined for the component.');
        }

        // Static check: if layout is not a function, it is considered a static string
        const isStatic = typeof layout !== 'function';

        // 1. Fast path for static: return a clone from cache if available
        if (isStatic && this.$internals.cloneTemplateOnRender && this.#cachedElement) {
            return /** @type {Element} */ (this.#cachedElement.cloneNode(true));
        }

        const result = resolveLayout(layout, this);

        this.$internals.sid;

        // 4. Set identifying attributes
        // Always set instanceId for internal tracking
        if (this.instanceId) {
            result.setAttribute('data-component-root', this.instanceId);
        }

        // If we are on the server (or preparing SSR), we MUST set the sid
        if (Config.isSSR && this.$internals.sid) {
            result.setAttribute('data-sid', this.$internals.sid);
        }

        // 5. Cache the result ONLY if it was a static layout
        if (isStatic && this.$internals.cloneTemplateOnRender) {
            this.#cachedElement = result;
            // Return a clone to keep the cached original "pristine"
            return /** @type {Element} */ (result.cloneNode(true));
        }

        // For functions, return the "live" result directly without long-term caching
        return result;
    }

    /**
     * Mounts the component to a DOM container or hydrates existing HTML.
     * @param {Element} container - The target DOM element (the "hole").
     * @param {"replace"|"append"|"prepend"|"hydrate"} mode - The mounting strategy.
     */
    mount(container, mode = 'replace') {
        if (this.#isCollapsed) return;

        // Validation
        if (!(container instanceof Config.window.Element)) {
            throw new TypeError('Mount target must be a valid DOM Element.');
        }

        const validModes = ['replace', 'append', 'prepend', 'hydrate'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid mount mode "${mode}". Expected: ${validModes.join(', ')}`);
        }

        const isHydrating = mode === 'hydrate';
        const isMoving = this.isConnected;

        // 2. Hydration Path
        if (isHydrating) {
            const sid = this.$internals.sid;
            if (!sid) {
                throw new Error('Hydration failed: Component has no SID assigned.');
            }

            const componentRoot =
                container.getAttribute('data-sid') === sid
                    ? container
                    : container.querySelector(`[data-sid="${sid}"]`);

            if (!componentRoot) {
                throw new Error(`Hydration failed: Node with data-sid="${sid}" not found.`);
            }

            componentRoot.removeAttribute('data-sid');
            componentRoot.setAttribute('data-component-root', this.instanceId);

            this.$internals.root = componentRoot;
            this.#applyHydration();

            // Standard finalization for hydration
            this.#connect(/** @type {HTMLElement} */ (componentRoot));
            this.emit('mount');
            return;
        }

        // 3. Render or Reuse Path
        // If moving, we use the existing root. If new, we call #render().
        const componentRoot = isMoving ? this.getRootNode() : this.#render();

        // 3. DOM Insertion
        if (mode === 'replace') container.replaceChildren(componentRoot);
        else if (mode === 'append') container.append(componentRoot);
        else if (mode === 'prepend') container.prepend(componentRoot);

        // Finalize Connection
        this.$internals.root = componentRoot;
        this.$internals.parentElement = componentRoot.parentElement;

        // 5. Lifecycle Logic
        if (!isMoving) {
            // Only mount teleports and connect logic if it's the FIRST time
            this.#mountTeleports();
            this.emit('prepareRender', componentRoot);
            this.#connect(/** @type {HTMLElement} */ (componentRoot));
            this.emit('mount');
        } else {
            // If it was just a move, we might want a specific event
            this.emit('move', { to: container });
        }
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

        this.$internals.elementsToRemove.forEach(el => {
            el.remove();
        });
        this.$internals.elementsToRemove.clear();

        this.emit('unmount');
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
     * If the parent component is also collapsed, this may not result in immediate
     * visibility unless `expandForce()` is used.
     */
    expand() {
        this.#isCollapsed = false;
        if (this.#isConnected === true) return;

        let parentComponent = this.$internals.parentComponent;

        if (parentComponent === null) {
            if (this.$internals.parentElement) {
                if (this.$internals.parentElement.isConnected) {
                    this.mount(this.$internals.parentElement, this.$internals.mountMode);
                } else {
                    console.warn(
                        'Cannot expand a disconnected component without a parent element (parent element is not connected)'
                    );
                    return;
                }
            } else {
                console.warn(
                    'Cannot expand a disconnected component without a parent element (no parent element specified)'
                );
                return;
            }
        } else {
            if (parentComponent.isConnected === false) {
                console.warn('Cannot expand a disconnected parent component');
                return;
            }

            let assignedSlotRef =
                parentComponent.$internals.scopeRefs[this.$internals.assignedSlotName];

            if (!assignedSlotRef) {
                console.warn(
                    `Cannot find a rendered slot with name "${this.$internals.assignedSlotName}" in the parent component`
                );
                return;
            }

            this.mount(assignedSlotRef, this.$internals.mountMode);
        }

        this.emit('expand');
    }

    /**
     * Forces the expansion of the entire component hierarchy from the current node up to the root.
     * Use this when you need to ensure a specific nested component is visible,
     * even if its ancestors were previously collapsed.
     */
    expandForce() {
        /** @type {Component[]} */
        let components = [];

        /** @type {Component} */
        let currentComponent = this;

        while (currentComponent) {
            components.push(currentComponent);
            currentComponent = currentComponent.$internals.parentComponent;
        }

        for (let i = components.length - 1; i >= 0; i--) {
            let component = components[i];
            component.expand();
        }
    }

    /* Slots, parent, children */

    /**
     * Returns an array of the slot names defined in the component.
     * @returns {string[]}
     */
    getSlotNames() {
        return this.slotManager.slotNames;
    }

    #detachFromParentSlot() {
        let oldParentComponent = this.parentComponent;
        if (oldParentComponent) {
            let slot = oldParentComponent.slotManager.findSlotByComponent(this);
            if (!slot) return false;

            return slot.detach(this);
        }
        return false;
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The component to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentToSlot(slotName, ...components) {
        const parentSid = this.$internals.sid;
        const startIndex = this.slotManager.getSlotLength(slotName);

        for (let i = 0; i < components.length; i++) {
            const child = components[i];

            if (parentSid) {
                const newSid = `${parentSid}.${slotName}.${startIndex + i}`;
                this.#recursiveUpdateSid(child, newSid);
            }

            child.#detachFromParentSlot();
        }

        let slot = this.slotManager.attachToSlot(slotName, ...components);

        if (this.#isConnected) {
            slot.mount();
        }
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

        tagName = tagName.toLowerCase().trim();

        /** @type {Element[]} */
        let filteredElements = [];

        walkDomScope(
            this.$internals.root,
            node => {
                if (node.nodeType === Config.window.Node.ELEMENT_NODE) {
                    let el = /** @type {Element} */ (node);
                    if (tagName === '*') {
                        filteredElements.push(el);
                    } else if (el.tagName.toLowerCase() === tagName) {
                        filteredElements.push(el);
                    }
                }
            },
            {
                scopeAttribute: ['data-slot', 'data-component-root'],
                refAttribute: 'data-ref',
                window: Config.window,
            }
        );

        return filteredElements;
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
     * @param {string} name - Имя телепорта из объекта teleports
     * @param {TeleportConfig} config - Конфигурация конкретного телепорта
     * @returns {Element}
     */
    #renderTeleport(name, config) {
        const result = resolveLayout(config.layout, this);
        const sid = this.$internals.sid;

        // 1. Always set the teleport name for identification
        result.setAttribute('data-component-teleport', name);

        // 2. Set the owner identification
        if (sid) {
            // We are in SSR or Hydration mode.
            // We need the stable SID so the client can find this node globally.
            result.setAttribute('data-parent-sid', sid);
        }

        // Always set the instanceId.
        // On the server, it will be the server-generated ID.
        // On the client, it will trigger the lazy getter and set the real ID.
        result.setAttribute('data-component-root', this.instanceId);

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
        const target =
            typeof config.target === 'function' ? config.target.call(this) : config.target;

        const rootElement = this.#insertToDOM(fragment, target, config.strategy);
        this.#registerRemoteRoot(name, rootElement);
    }

    /**
     * Mounts a fragment or element into a specified target using a given strategy.
     * @param {Element|DocumentFragment} fragment - The content to insert (result of resolveLayout).
     * @param {Element|string|(() => Element|null)} target - The destination: element, selector, or provider function.
     * @param {"prepend"|"append"|"replace"} [strategy="append"] - The insertion strategy.
     * @returns {Element|null} The root element of the inserted content.
     */
    #insertToDOM(fragment, target, strategy = 'append') {
        /** @type {Element|null} */
        let resolvedTarget = null;

        // 1. Resolve the target location
        if (typeof target === 'function') {
            // Bind 'this' to the component instance so it can access props/state
            resolvedTarget = target.call(this);
        } else if (typeof target === 'string') {
            resolvedTarget = document.querySelector(target);
        } else if (target instanceof Config.window.Element) {
            resolvedTarget = target;
        }

        if (!resolvedTarget) {
            throw new Error(
                `[Mounting Error] Target element not found for strategy "${strategy}".`
            );
        }

        // 2. Identify the root element for reference tracking
        // If it's a DocumentFragment, we take the first child; if it's an Element, it is the root.
        const rootElement =
            fragment instanceof Config.window.Element ? fragment : fragment.firstElementChild;

        // 3. Execute DOM manipulation based on the chosen strategy
        switch (strategy) {
            case 'prepend':
                resolvedTarget.prepend(fragment);
                break;
            case 'replace':
                // Clears all children and inserts the new fragment
                resolvedTarget.replaceChildren(fragment);
                break;
            case 'append':
            default:
                resolvedTarget.append(fragment);
                break;
        }

        return rootElement;
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
        if (!this.teleports) return;

        // During hydration, we must use the Server ID (sid)
        // because the client's instanceId won't match the one generated by the server.
        const searchId = this.$internals.sid;
        if (!searchId) return;

        for (const [name, config] of Object.entries(this.teleports)) {
            // Look for the teleport using the stable SID instead of the volatile instanceId
            const selector = `[data-parent-sid="${searchId}"][data-component-teleport="${name}"]`;
            const existingTeleport = document.querySelector(selector);

            if (existingTeleport) {
                // Found it! Register and "claim" it by switching to the current instanceId
                existingTeleport.setAttribute('data-component-root', this.instanceId);
                existingTeleport.removeAttribute('data-parent-sid'); // Clean up

                this.#registerRemoteRoot(name, existingTeleport);
            } else {
                // Fallback: If SSR missed it, mount normally
                console.warn(`[Hydration] Teleport "${name}" not found with SID "${searchId}".`);
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
        // 1. Update the current component's SID
        component.$internals.sid = newSid;

        // 2. Try to hydrate THIS component before going deeper
        // This ensures parent data is available before children try to hydrate
        if (!component.$internals.isHydrated) {
            component.#applyHydration();
        }

        // 3. Update all children in slots
        const slots = component.slotManager.getSlots();

        slots.forEach((slot, name) => {
            const subComponents = slot.getComponents();
            for (let j = 0; j < subComponents.length; j++) {
                const subChild = subComponents[j];
                const subSid = `${newSid}.${name}.${j}`;
                this.#recursiveUpdateSid(subChild, subSid);
            }
        });
    }

    /**
     * Finds a nested component by its string SID.
     * @param {string} targetSid - The SID to search for.
     * @returns {Component|null}
     */
    getComponentBySid(targetSid) {
        // 1. Quick check: is it me?
        if (this.$internals.sid === targetSid) {
            return this;
        }

        // 2. Optimization: if the targetSid doesn't start with my SID,
        // it's not in my branch.
        if (this.$internals.sid && !targetSid.startsWith(this.$internals.sid + '.')) {
            return null;
        }

        // 3. Search through all slots
        const slots = this.slotManager.getSlots();
        for (const [_, slot] of slots) {
            for (const child of slot.getComponents()) {
                const found = child.getComponentBySid(targetSid);
                if (found) return found;
            }
        }

        return null;
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

// @ts-check

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
     * @param {string} activeSlotName - The name of the slot that is currently active.
     */
    constructor(component, slotNames, activeSlotName) {
        this.component = component;
        this.#slotNames = slotNames.slice();
        this.#activeSlotName = activeSlotName;
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

// @ts-check

/**
 * @typedef {Object} ComponentMetadata
 * @property {string} className - The constructor name for class instantiation.
 * @property {Object} data - Serialized state from component.serialize().
 * @property {Record<string, string[]>} slots - Map of slot names to arrays of child instance IDs.
 */

/**
 * Generates a flat map of the component tree for SSR hydration.
 * * @param {...Component} rootComponents - The starting root components of the tree.
 * @returns {Record<string, ComponentMetadata>} A flat dictionary of component metadata indexed by instanceId.
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

            slot.components.forEach((child, index) => {
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
            data: typeof component.serialize === 'function' ? component.serialize() : {},
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

export { Component, Config, DOMReady, SlotToggler, Toggler, copyToClipboard, createManifestScript, createPaginationArray, createStorage, debounce, delegateEvent, escapeHtml, fadeIn, fadeOut, formatBytes, formatDate, formatDateTime, generateManifest, getDefaultLanguage, hideElements, html, injectCoreStyles, isDarkMode, local, onClickOutside, removeSpinnerFromButton, renderManifestHTML, renderPaginationElement, scrollToBottom, scrollToTop, session, showElements, showSpinnerInButton, sleep, throttle, ui_button_status_waiting_off, ui_button_status_waiting_off_html, ui_button_status_waiting_on, uniqueId, unixtime, unsafeHTML, withMinimumTime };
