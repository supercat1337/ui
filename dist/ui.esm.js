import { createFromHTML, selectRefsExtended, checkRefs } from 'dom-scope';
import { EventEmitter } from '@supercat1337/event-emitter';

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

        if (event.target && event.target instanceof Element) {

            target = event.target;

            if (event.target.matches(targetElementSelector)) {
                (listenerFunction)(event, target);
            } else if (event.target.closest(targetElementSelector)) {
                target = event.target.closest(targetElementSelector);
                (listenerFunction)(event, target);
            }
        }
    });
}

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
        component.$internals.parentSlotName = this.name;
        this.components.add(component);
    }

    /**
     * Detaches a component from the slot.
     * This method sets the given component's parent component and parent slot name to null,
     * and removes the component from the slot's internal set of components.
     * @param {Component} component - The component to detach from the slot.
     */
    detach(component) {
        component.$internals.parentComponent = null;
        component.$internals.parentSlotName = '';
        this.components.delete(component);
    }

    /**
     * Detaches all components from the slot.
     * This method sets all components' parent component and parent slot name to null,
     * and removes all components from the slot's internal set of components.
     */
    detachAll() {
        this.components.forEach(component => {
            component.$internals.parentComponent = null;
            component.$internals.parentSlotName = '';
        });
        this.components.clear();
    }

    /**
     * Mounts all children components of the slot to the DOM.
     * This method first checks if the component is connected.
     * If not, it logs a warning and returns.
     * Then, it gets the root element of the slot from the component's internal slot refs map.
     * If the slot root element does not exist, it logs a warning and returns.
     * Finally, it iterates over all children components of the slot and calls their mount method with the slot root element and the "append" mode.
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

        let slotRoot = this.#component.$internals.slotRefs[this.name];
        if (!slotRoot) {
            console.warn(
                `Cannot get root element for Slot "${this.name}" does not exist in component "${
                    this.#component.constructor.name
                }"`
            );
            return;
        }

        this.components.forEach(childComponent => {
            if (!childComponent.isCollapsed) {
                childComponent.mount(slotRoot, 'append');
            }
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
                console.warn(
                    `Component ${component.constructor.name} is already assigned to slot ${usingSlot.name}.`
                );
                continue;
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

        return this.getSlot(component.$internals.parentSlotName);
    }
}

// @ts-check


/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */

class Internals {
    constructor() {
        /** @type {EventEmitter<any>} */
        this.eventEmitter = new EventEmitter();
        /** @type {AbortController} */
        this.disconnectController = new AbortController();
        /** @type {HTMLElement|null} */
        this.root = null;
        /** @type {TextUpdateFunction|null} */
        this.textUpdateFunction = null;
        /** @type {{[key:string]:any}}  */
        this.textResources = {};
        /** @type {{[key:string]:HTMLElement}} */
        this.refs = {};
        /** @type {{[key:string]:HTMLElement}} */
        this.slotRefs = {};
        /** @type {Component|null} */
        this.parentComponent = null;
        /** @type {string} */
        this.parentSlotName = "";
        /** @type {"replace"|"append"|"prepend"} */
        this.mountMode = "replace";
    }
}

// @ts-check


/**
 * @typedef {(component: any) => Node|string} LayoutFunction
 */

/**
 * @typedef {(component: Component) => void} _TextUpdateFunction
 */

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

class Component {
    /** @type {Internals} */
    $internals = new Internals();

    /** @type {LayoutFunction|string|undefined} */
    #layout = undefined;

    /** @type {LayoutFunction|string|undefined} */
    layout;

    /** @type {import("dom-scope").RefsAnnotation|undefined} */
    refsAnnotation;

    /** @type {Node|null} */
    #template = null;

    #isConnected = false;

    slotManager = new SlotManager(this);

    #isCollapsed = false;

    constructor() {
        this.onConnect(onConnectDefault);
        this.onDisconnect(onDisconnectDefault);
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
     * Returns whether the component is currently collapsed or not.
     * @returns {boolean} True if the component is collapsed, false otherwise.
     */
    get isCollapsed() {
        return this.#isCollapsed;
    }

    /**
     * Reloads the text content of the component by calling the text update function if it is set.
     * This method is useful when the component's text content depends on external data that may change.
     * @returns {void}
     */
    reloadText() {
        if (this.$internals.textUpdateFunction) {
            this.$internals.textUpdateFunction(this);
        }
    }

    /**
     * Sets the text update function for the component.
     * The text update function is a function that is called when the reloadText method is called.
     * The function receives the component instance as the this value.
     * @param {_TextUpdateFunction|null} func - The text update function to set.
     * @returns {void}
     */
    setTextUpdateFunction(func) {
        this.$internals.textUpdateFunction = func;
    }

    #loadTemplate() {
        if (this.layout) {
            this.#layout = this.layout;
            this.layout = undefined;
        }

        let layout = this.#layout || undefined;
        if (layout == undefined) return;

        let template;

        if (typeof layout === 'function') {
            let _template = layout(this);

            if (_template instanceof Node) {
                template = _template;
            } else {
                template = createFromHTML(_template);
            }
        } else {
            template = createFromHTML(layout);
        }

        let count = 0;
        for (let i = 0; i < template.childNodes.length; i++) {
            if (template.childNodes[i].nodeType === 1) count++;
        }

        if (count !== 1) {
            throw new Error('Layout must have exactly one root element');
        }

        this.#template = template;
    }

    /**
     * Sets the layout of the component by assigning the template content.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setLayout(layout, annotation) {
        this.#layout = layout;
        this.#template = null;

        if (annotation) {
            this.refsAnnotation = annotation;
        }
    }

    /**
     * Sets the renderer for the component by assigning the template content.
     * This is a synonym for setLayout.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setRenderer(layout, annotation) {
        this.setLayout(layout, annotation);
    }

    /* Refs */

    /**
     * Returns the refs object.
     * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
     * The refs object is only available after the component has been connected to the DOM.
     * @returns {any} The refs object.
     */
    getRefs() {
        if (!this.#isConnected) {
            throw new Error('Component is not connected to the DOM');
        }

        return this.$internals.refs;
    }

    /**
     * Returns the ref element with the given name.
     * @param {string} refName - The name of the ref to retrieve.
     * @returns {HTMLElement} The ref element with the given name.
     * @throws {Error} If the ref does not exist.
     */
    getRef(refName) {
        let refs = this.getRefs();
        if (!(refName in refs)) {
            throw new Error(`Ref "${refName}" does not exist`);
        }
        return refs[refName];
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
     * Updates the refs object with the current state of the DOM.
     * This method is usually called internally when the component is connected or disconnected.
     * @throws {Error} If the component is not connected to the DOM.
     * @returns {void}
     */
    updateRefs() {
        if (!this.$internals.root) {
            throw new Error('Component is not connected to the DOM');
        }

        let componentRoot = /** @type {HTMLElement} */ (this.$internals.root);

        let { refs, scope_refs } = selectRefsExtended(componentRoot, null, {
            scope_ref_attr_name: 'data-slot',
            ref_attr_name: 'data-ref',
        });
        if (this.refsAnnotation) {
            checkRefs(refs, this.refsAnnotation);
        }

        for (let key in scope_refs) {
            this.slotManager.registerSlot(key);
        }

        this.$internals.refs = refs;
        this.$internals.slotRefs = scope_refs;
    }

    /* Events */

    /**
     * Subscribes to a specified event.
     * @param {string} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event, callback) {
        return this.$internals.eventEmitter.on(event, callback);
    }

    /**
     * Emits an event with the given arguments.
     * @param {string} event - The name of the event to emit.
     * @param {...any} args - The arguments to be passed to the event handlers.
     */
    emit(event, ...args) {
        return this.$internals.eventEmitter.emit(event, this, ...args);
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

    /**
     * Emits the "beforeConnect" event.
     * This event is emitted just before the component is connected to the DOM.
     * @param {(component: this, clonedTemplate: Node) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value. The second argument is the clonedTemplate - the cloned template node.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onBeforeConnect(callback) {
        return this.on('beforeConnect', callback);
    }

    /**
     * Subscribes to the "connect" event.
     * This event is emitted just after the component is connected to the DOM.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onConnect(callback) {
        return this.on('connect', callback);
    }

    /**
     * Subscribes to the "disconnect" event.
     * This event is emitted just before the component is disconnected from the DOM.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onDisconnect(callback) {
        return this.on('disconnect', callback);
    }

    /**
     * Subscribes to the "mount" event.
     * This event is emitted after the component is mounted to the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onMount(callback) {
        return this.on('mount', callback);
    }

    /**
     * Subscribes to the "beforeUnmount" event.
     * This event is emitted just before the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onBeforeUnmount(callback) {
        return this.on('beforeUnmount', callback);
    }

    /**
     * Subscribes to the "unmount" event.
     * This event is emitted after the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onUnmount(callback) {
        return this.on('unmount', callback);
    }

    /**
     * Subscribes to the "collapse" event.
     * This event is emitted after the component has collapsed.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onCollapse(callback) {
        return this.on('collapse', callback);
    }

    /**
     * Subscribes to the "expand" event.
     * This event is emitted after the component has expanded.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onExpand(callback) {
        return this.on('expand', callback);
    }

    /* Lifecycle methods */

    /**
     * Connects the component to the specified componentRoot element.
     * Initializes the refs object and sets the component's root element.
     * Emits "connect" event through the event emitter.
     * @param {HTMLElement} componentRoot - The root element to connect the component to.
     */
    connect(componentRoot) {
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
     * Clears the refs and slotRefs objects.
     * Aborts all event listeners attached with the $on method.
     * Emits "disconnect" event through the event emitter.
     */
    disconnect() {
        if (this.#isConnected === false) return;

        this.#isConnected = false;
        this.$internals.disconnectController.abort();
        this.$internals.refs = {};
        this.$internals.slotRefs = {};
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
     * Mounts the component to the specified container.
     * @param {Element} container - The container to mount the component to.
     * @param {"replace"|"append"|"prepend"} [mountMode="replace"] - The mode to use to mount the component.
     * If "replace", the container's content is replaced.
     * If "append", the component is appended to the container.
     * If "prepend", the component is prepended to the container.
     */
    mount(container, mountMode = 'replace') {
        if (!(container instanceof Element)) {
            throw new TypeError('Container must be a DOM Element');
        }

        const validModes = ['replace', 'append', 'prepend'];
        if (!validModes.includes(mountMode)) {
            throw new Error(`Invalid mode: ${mountMode}. Must be one of: ${validModes.join(', ')}`);
        }

        if (this.#template === null) {
            this.#loadTemplate();
        }

        if (this.#template === null) throw new Error('Template is not set');

        this.$internals.mountMode = mountMode;

        if (this.#isConnected === true) {
            return;
        }

        let clonedTemplate = this.#template.cloneNode(true);
        this.emit('beforeConnect', clonedTemplate);

        let componentRoot = /** @type {HTMLElement} */ (
            // @ts-ignore
            clonedTemplate.firstElementChild
        );

        if (mountMode === 'replace') container.replaceChildren(clonedTemplate);
        else if (mountMode === 'append') container.append(clonedTemplate);
        else if (mountMode === 'prepend') container.prepend(clonedTemplate);

        this.connect(componentRoot);
        this.emit('mount');
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

        this.disconnect();
        this.$internals.root?.remove();

        this.emit('unmount');
    }

    /**
     * Rerenders the component.
     * If the component is connected, it unmounts and mounts the component again.
     * If the component is not connected, it mounts the component to the parent component's slot.
     */
    rerender() {
        let parentComponent = this.$internals.parentComponent || null;

        if (this.isConnected) {
            let container = this.$internals.root.parentElement;
            this.unmount();
            this.mount(container, this.$internals.mountMode);
        } else {
            if (parentComponent === null) {
                console.error(
                    'Cannot rerender a disconnected component without a parent component'
                );
                return;
            }

            if (parentComponent.isConnected === false) {
                console.error('Cannot rerender a disconnected parent component');
                return;
            }

            let container =
                parentComponent.$internals.slotRefs[this.$internals.parentSlotName] || null;
            if (!container) {
                console.error(
                    'Cannot find a rendered slot with name ' +
                        this.$internals.parentSlotName +
                        ' in the parent component'
                );
                return;
            }

            this.mount(container, this.$internals.mountMode);
        }
    }

    /**
     * This method is called when the component is updated.
     * It is an empty method and is intended to be overridden by the user.
     */
    update() {}

    /* Visibility */

    /**
     * Shows the component.
     * If the component is not connected, it does nothing.
     * If the component is connected, it removes the "d-none" class from the root element.
     */
    show() {
        if (!this.isConnected) return;
        this.$internals.root?.classList.remove('d-none');
    }

    /**
     * Hides the component.
     * If the component is not connected, it does nothing.
     * If the component is connected, it adds the "d-none" class to the root element.
     */
    hide() {
        if (!this.isConnected) return;
        this.$internals.root?.classList.add('d-none');
    }

    /**
     * Collapses the component by unmounting it from the DOM.
     * Sets the #isCollapsed flag to true.
     */
    collapse() {
        this.unmount();
        this.#isCollapsed = true;
        this.emit('collapse');
    }

    /**
     * Expands the component by mounting it to the DOM.
     * Sets the #isCollapsed flag to false.
     * If the component is already connected, does nothing.
     * If the component does not have a parent component, does nothing.
     * Otherwise, mounts the component to the parent component's slot.
     */
    expand() {
        this.#isCollapsed = false;
        if (this.#isConnected === true) return;
        if (this.$internals.parentComponent === null) return;

        this.$internals.parentComponent.addComponentToSlot(this.$internals.parentSlotName, this);
        this.emit('expand');
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
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The component to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentToSlot(slotName, ...components) {
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
}

// @ts-check

class SlotToggler {
    #isDestroyed = false;

    /** @type {string[]} */
    slotNames;

    /** @type {string} */
    activeSlotName;

    /** @type {Component} */
    component;

    /**
     * Creates a new instance of SlotToggler.
     * @param {Component} component - The component that owns the slots.
     * @param {string[]} slotNames - The names of the slots.
     * @param {string} activeSlotName - The name of the slot that is currently active.
     */
    constructor(component, slotNames, activeSlotName) {
        let slotManager = component.slotManager;

        for (let i = 0; i < slotNames.length; i++) {
            if (!slotManager.hasSlot(slotNames[i])) {
                throw new Error(`Slot ${slotNames[i]} does not exist in component`);
            }
        }

        this.component = component;
        this.slotNames = slotNames.slice();
        this.activeSlotName = activeSlotName;
    }

    /**
     * Toggles the active slot to the given slot name.
     * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
     * @param {string} slotName - The name of the slot to toggle to.
     */
    toggle(slotName) {
        if (this.#isDestroyed) {
            throw new Error('SlotToggler is destroyed');
        }

        if (this.slotNames.indexOf(slotName) === -1) {
            throw new Error(`Slot ${slotName} is not defined in SlotToggler`);
        }

        if (slotName == this.activeSlotName) return;

        for (let i = 0; i < this.slotNames.length; i++) {
            if (this.slotNames[i] == slotName) {
                this.component.slotManager.mountSlot(slotName);
                this.activeSlotName = slotName;
            } else {
                this.component.slotManager.unmountSlot(this.slotNames[i]);
            }
        }
    }

    destroy() {
        this.#isDestroyed = true;
        // @ts-ignore
        this.component = null;
        this.slotNames = [];
        this.activeSlotName = '';
    }
}

export { Component, DOMReady, SlotToggler, Toggler, copyToClipboard, createPaginationArray, delegateEvent, escapeHtml, fadeIn, fadeOut, formatBytes, formatDate, formatDateTime, getDefaultLanguage, hideElements, injectCoreStyles, isDarkMode, removeSpinnerFromButton, renderPaginationElement, scrollToBottom, scrollToTop, showElements, showSpinnerInButton, sleep, ui_button_status_waiting_off, ui_button_status_waiting_off_html, ui_button_status_waiting_on, unixtime, withMinimumTime };
