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
        let result;
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

async function runWithMinimumTime(promiseFunc, ms) {}

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

class SlotManager {
    /** @type {Set<string>} */
    #slotNames = new Set();

    /** @type {Map<string, Set<Component>>} */
    #namedSlotChildren = new Map();

    /** @type {Set<Component>}  */
    #childrenComponents = new Set();

    /** @type {Component} */
    #component;

    /** @type {boolean} */
    #slotStrictMode = false;

    /**
     * @param {Component} component
     */
    constructor(component) {
        this.#component = component;
    }

    /**
     * @param {boolean} mode
     */
    setSlotStrictMode(mode) {
        this.#slotStrictMode = mode;
    }

    /**
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "data-slot" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames) {
        const newSlotNames = new Set(slotNames);

        // Remove old slots that are not in the new list
        for (const existingSlotName of this.#slotNames) {
            if (!newSlotNames.has(existingSlotName)) {
                this.removeSlot(existingSlotName);
            }
        }

        // Add new slots
        for (const slotName of newSlotNames) {
            this.addSlot(slotName);
        }
    }

    /**
     * Adds a slot to the component.
     * This method is used to programmatically add a slot to the component.
     * @param {string} slotName - The name of the slot to add.
     */
    addSlot(slotName) {
        if (!this.#namedSlotChildren.has(slotName)) {
            this.#namedSlotChildren.set(slotName, new Set());
        }
        this.#slotNames.add(slotName);
    }

    /**
     * Removes the given slot name from the component.
     * This method first unmounts all children components of the given slot name,
     * then removes the slot name from the component's internal maps.
     * @param {string} slotName - The name of the slot to remove.
     */
    removeSlot(slotName) {
        if (!this.#slotNames.has(slotName)) return;

        let slotChildren = this.#namedSlotChildren.get(slotName);
        if (slotChildren) {
            slotChildren.forEach((childComponent) => {
                this.#component.removeChildComponent(childComponent);
                childComponent.unmount();
                this.#childrenComponents.delete(childComponent);
            });

            this.#namedSlotChildren.delete(slotName);
        }

        this.#slotNames.delete(slotName);
    }

    /**
     * Returns an array of slot names defined in the component.
     * @type {string[]}
     */
    get slotNames() {
        let arr = Array.from(this.#slotNames);
        return arr;
    }

    /**
     * Checks if the given slot name exists in the component.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot exists, false otherwise.
     */
    slotExists(slotName) {
        return this.#slotNames.has(slotName);
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The components to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentsToSlot(slotName, ...components) {
        if (!this.slotExists(slotName)) {
            if (this.#slotStrictMode) {
                throw new Error(`Slot "${slotName}" does not exist`);
            } else {
                console.warn(
                    `Warning: Slot "${slotName}" does not exist in component "${
                        this.#component.constructor.name
                    }". It will be created automatically.`
                );
            }
        }

        let childrenComponentsSet = this.#namedSlotChildren.get(slotName);
        if (!childrenComponentsSet) {
            childrenComponentsSet = new Set();
            this.#namedSlotChildren.set(slotName, childrenComponentsSet);
        }

        for (let i = 0; i < components.length; i++) {
            this.#childrenComponents.add(components[i]);
            childrenComponentsSet.add(components[i]);
        }
    }

    /**
     * Removes the given child component from all slots.
     * @param {Component} childComponent - The child component to remove.
     */
    removeChildComponent(childComponent) {
        this.#childrenComponents.delete(childComponent);
        for (let [slotName, childrenComponentsSet] of this.#namedSlotChildren) {
            if (!childrenComponentsSet.has(childComponent)) continue;
            childrenComponentsSet.delete(childComponent);
            break;
        }
    }

    /**
     * Returns the children components of the component.
     * @type {Set<Component>}
     */
    get children() {
        return this.#childrenComponents;
    }

    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     * If no slot name is given, all children components of all slots are mounted to the DOM.
     * @param {string} [slotName] - The name of the slot to mount children components for.
     */
    mountChildren(slotName) {
        if (this.#component.isConnected !== true) return;

        /** @type {string[]} */
        const slotNames = slotName ? [slotName] : Array.from(this.#slotNames);

        let hasInvalidSlot = slotNames.some(
            (name) => !this.#component.$internals.slotRefs[name]
        );

        if (hasInvalidSlot) {
            if (this.#slotStrictMode) {
                throw new Error(
                    `One or more slot names do not exist in component "${
                        this.#component.constructor.name
                    }"`
                );
            } else {
                this.#component.updateRefs();
                let hasInvalidSlot_2 = slotNames.some(
                    (name) => !this.#component.$internals.slotRefs[name]
                );

                if (hasInvalidSlot_2) {
                    console.warn(
                        `One or more slot names do not exist in component "${
                            this.#component.constructor.name
                        }"`
                    );
                    return;
                }
            }
        }

        for (const currentSlotName of slotNames) {
            const children = this.#namedSlotChildren.get(currentSlotName);
            const slotRef =
                this.#component.$internals.slotRefs[currentSlotName];

            if (!children || !slotRef) continue;

            for (const child of children) {
                if (!child.isCollapsed) {
                    child.mount(slotRef, "append");
                }
            }
        }
    }

    /**
     * Unmounts all children components of the given slot name.
     * This method iterates over the children components of the given slot name and calls their unmount method.
     * @param {string} [slotName] - The name of the slot to unmount the children components for.
     * if no slot name is given, all children components of all slots are unmounted.
     */
    unmountChildren(slotName) {
        /** @type {string[]} */
        let slotNames = slotName ? [slotName] : Array.from(this.#slotNames);
        for (let i = 0; i < slotNames.length; i++) {
            let children = Array.from(
                this.#namedSlotChildren.get(slotNames[i]) || []
            );
            for (let y = 0; y < children.length; y++) {
                children[y].unmount();
            }
        }
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
    }
}

// @ts-check


/**
 * @typedef {(component: any) => Node|string} LayoutFunction
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

    /** @type {string[]|undefined} */
    slots;

    /** @type {import("dom-scope").RefsAnnotation|undefined} */
    refsAnnotation;

    /** @type {Node|null} */

    #template = null;

    #connected = false;

    slotManager = new SlotManager(this);

    isCollapsed = false;

    constructor() {
        this.onConnect(onConnectDefault);
        this.onDisconnect(onDisconnectDefault);
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
     * @param {import("./internals.js").TextUpdateFunction|null} func - The text update function to set.
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
     * Returns the refs object.
     * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
     * The refs object is only available after the component has been connected to the DOM.
     * @returns {any} The refs object.
     */
    getRefs() {
        if (!this.#connected) {
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
            this.slotManager.addSlot(key);
        }

        this.$internals.refs = refs;
        this.$internals.slotRefs = scope_refs;
    }

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

    /**
     * Checks if the component is connected to a root element.
     * @returns {boolean} True if the component is connected, false otherwise.
     */
    get isConnected() {
        return this.#connected;
    }

    /**
     * Connects the component to the specified componentRoot element.
     * Initializes the refs object and sets the component's root element.
     * Emits "connect" event through the event emitter.
     * @param {HTMLElement} componentRoot - The root element to connect the component to.
     */
    connect(componentRoot) {
        if (this.#connected === true) {
            throw new Error('Component is already connected');
        }

        this.$internals.root = componentRoot;

        this.updateRefs();

        this.$internals.disconnectController = new AbortController();
        this.#connected = true;
        this.slotManager.mountChildren();
        this.emit('connect');
    }

    /**
     * Disconnects the component from the DOM.
     * Sets the component's #connected flag to false.
     * Clears the refs and slotRefs objects.
     * Aborts all event listeners attached with the $on method.
     * Emits "disconnect" event through the event emitter.
     */
    disconnect() {
        if (this.#connected === false) return;

        this.#connected = false;
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
     * @param {"replace"|"append"|"prepend"} [mode="replace"] - The mode to use to mount the component.
     * If "replace", the container's content is replaced.
     * If "append", the component is appended to the container.
     * If "prepend", the component is prepended to the container.
     */
    mount(container, mode = 'replace') {
        if (!(container instanceof Element)) {
            throw new TypeError('Container must be a DOM Element');
        }

        const validModes = ['replace', 'append', 'prepend'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
        }

        if (this.#template === null) {
            this.#loadTemplate();
        }

        if (this.#template === null) throw new Error('Template is not set');

        if (this.#connected === true) {
            return;
        }

        let clonedTemplate = this.#template.cloneNode(true);
        this.emit('beforeConnect', clonedTemplate);

        let componentRoot = /** @type {HTMLElement} */ (
            // @ts-ignore
            clonedTemplate.firstElementChild
        );

        if (mode === 'replace') container.replaceChildren(clonedTemplate);
        else if (mode === 'append') container.append(clonedTemplate);
        else if (mode === 'prepend') container.prepend(clonedTemplate);

        this.connect(componentRoot);
        this.emit('mount');
    }

    /**
     * Unmounts the component from the DOM.
     * Emits "beforeUnmount" and "unmount" events through the event emitter.
     * Disconnects the component from the DOM and removes the root element.
     */
    unmount() {
        if (this.#connected === false) return;

        this.emit('beforeUnmount');
        this.slotManager.unmountChildren();

        this.disconnect();
        this.$internals.root?.remove();

        this.emit('unmount');
    }

    /**
     * Collapses the component by unmounting it from the DOM.
     * Sets the isCollapsed flag to true.
     */
    collapse() {
        this.unmount();
        this.isCollapsed = true;
        this.emit('collapse');
    }

    /**
     * Expands the component by mounting it to the DOM.
     * Sets the isCollapsed flag to false.
     * If the component is already connected, does nothing.
     * If the component does not have a parent component, does nothing.
     * Otherwise, mounts the component to the parent component's slot.
     */
    expand() {
        this.isCollapsed = false;
        if (this.#connected === true) return;
        if (this.$internals.parentComponent === null) return;

        this.$internals.parentComponent.addComponentToSlot(this.$internals.parentSlotName, this);
        this.emit('expand');
    }

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
     * Returns an array of the slot names defined in the component.
     * @returns {string[]}
     */
    getSlotNames() {
        return this.slotManager.slotNames;
    }

    /**
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "data-slot" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames) {
        this.slotManager.defineSlots(...slotNames);
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The component to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentToSlot(slotName, ...components) {
        if (!components.every(comp => comp instanceof Component)) {
            throw new Error('All components must be instances of Component');
        }

        if (typeof this.slots !== 'undefined') {
            this.defineSlots(...this.slots);
        }

        this.slotManager.addComponentsToSlot(slotName, ...components);

        for (let i = 0; i < components.length; i++) {
            components[i].$internals.parentComponent = this;
            components[i].$internals.parentSlotName = slotName;
        }

        if (this.#connected) {
            this.slotManager.mountChildren(slotName);
        }
    }

    /**
     * Removes the specified child component from all slots.
     * Delegates the removal to the SlotManager instance.
     * @param {Component} childComponent - The child component to be removed.
     */
    removeChildComponent(childComponent) {
        if (childComponent.$internals.parentComponent !== this) {
            return;
        }

        childComponent.$internals.parentComponent = null;
        childComponent.$internals.parentSlotName = '';

        this.slotManager.removeChildComponent(childComponent);
    }
}

// @ts-check

class SlotToggler {
    /**
     * Creates a new instance of SlotToggler.
     * @param {Component} component - The component that owns the slots.
     * @param {string[]} slotNames - The names of the slots.
     * @param {string} activeSlotName - The name of the slot that is currently active.
     */
    constructor(component, slotNames, activeSlotName) {
        if (typeof component.slots !== "undefined") {
            component.defineSlots(...component.slots);
            component.slots = undefined;
        }

        for (let i = 0; i < slotNames.length; i++) {
            if (component.slotManager.slotExists(slotNames[i]) === false) {
                throw new Error(
                    `Slot ${slotNames[i]} does not exist in component`
                );
            }
        }

        if (component.slotManager.slotExists(activeSlotName) === false) {
            throw new Error(
                `Slot ${activeSlotName} does not exist in component`
            );
        }

        this.component = component;
        this.slotNames = slotNames;
        this.activeSlotName = activeSlotName;
    }

    /**
     * Toggles the active slot to the given slot name.
     * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
     * @param {string} slotName - The name of the slot to toggle to.
     */
    toggle(slotName) {
        if (this.slotNames.indexOf(slotName) === -1) {
            throw new Error(`Slot ${slotName} is not defined in SlotToggler`);
        }

        if (slotName == this.activeSlotName) return;

        for (let i = 0; i < this.slotNames.length; i++) {
            if (this.slotNames[i] == slotName) {
                this.component.slotManager.mountChildren(slotName);
                this.activeSlotName = slotName;
            } else {
                this.component.slotManager.unmountChildren(this.slotNames[i]);
            }
        }
    }
}

// @ts-check


if (globalThis.hasOwnProperty("document")) {
    injectCoreStyles(globalThis.document);
}

export { Component, DOMReady, SlotToggler, Toggler, copyToClipboard, escapeHtml, fadeIn, fadeOut, formatBytes, formatDate, formatDateTime, getDefaultLanguage, hideElements, injectCoreStyles, isDarkMode, removeSpinnerFromButton, runWithMinimumTime, scrollToBottom, scrollToTop, showElements, showSpinnerInButton, sleep, ui_button_status_waiting_off, ui_button_status_waiting_off_html, ui_button_status_waiting_on, unixtime, withMinimumTime };
