import { createFromHTML, selectRefsExtended, checkRefs } from 'dom-scope';
import { EventEmitter } from '@supercat1337/event-emitter';
import { extractRPCResponse, RPCPagedResponse, RPCErrorResponse } from '@supercat1337/rpc';
import * as bsModal from 'bootstrap/js/src/modal.js';

// @ts-check

/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 */
function DOMReady(callback) {
    document.readyState === "interactive" || document.readyState === "complete"
        ? callback()
        : document.addEventListener("DOMContentLoaded", callback);
}

/**
 * Escapes the given string from HTML interpolation.
 * Replaces the characters &, <, ", and ' with their corresponding HTML entities.
 * @param {string} unsafe - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe) {
    return unsafe.replace(
        /[&<"']/g,
        (m) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                '"': "&quot;",
                "'": "&#39;", // ' -> &apos; for XML only
            }[m])
    );
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
        element.classList.add("d-none");
    }
}

/**
 * Removes the "d-none" class from the given elements, making them visible.
 * @param {...HTMLElement} elements - The elements to show.
 */
function showElements(...elements) {
    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        element.classList.remove("d-none");
    }
}

/**
 * Adds a spinner to the button (if it doesn't already have one).
 * The spinner is prepended to the button's contents.
 * @param {HTMLButtonElement} button - The button to add the spinner to.
 * @param {string|null} [customClassName] - The class name to use for the spinner.
 *                                      If not provided, 'spinner-border spinner-border-sm' is used.
 */
function showSpinnerInButton(button, customClassName = null) {
    if (button.getElementsByClassName("spinner-border")[0]) return;

    let spinner = document.createElement("span");

    if (customClassName) {
        spinner.className = customClassName;
    } else {
        spinner.className = "spinner-border spinner-border-sm";
    }

    button.prepend(spinner);
}

/**
 * Removes the spinner from the given button.
 * @param {HTMLButtonElement} button - The button which should have its spinner removed.
 */
function removeSpinnerFromButton(button) {
    let spinner = button.querySelector(".spinner-border");
    if (spinner) spinner.remove();
}

/**
 * Returns the current Unix time in seconds.
 * @returns {number}
 */
function unixtime() {
    return Math.floor(new Date().getTime() / 1000);
}

/**
 * Checks if the user prefers a dark color scheme.
 * Utilizes the `window.matchMedia` API to determine if the user's
 * system is set to a dark mode preference.
 * @returns {boolean} - Returns `true` if the user prefers dark mode, otherwise `false`.
 */
function isDarkMode() {
    if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
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
    let lang = m ? m[0] : "en";
    return lang;
}

/**
 * Formats the given number of bytes into a human-readable string.
 *
 * @param {number} bytes - The number of bytes to be formatted.
 * @param {number} [decimals] - The number of decimal places to be used in the formatted string. Defaults to 2.
 * @param {string} [lang] - The language to be used for the size units in the formatted string. Defaults to the user's default language.
 * @param {Object} [sizes] - An object containing the size units to be used in the formatted string. Defaults to the IEC standard units.
 * @returns {string} A human-readable string representation of the given number of bytes, in the form of a number followed by a unit of measurement (e.g. "3.5 KB", "1.2 GB", etc.).
 */
function formatBytes(bytes, decimals = 2, lang, sizes) {
    lang = lang || "en";

    sizes = sizes || {
        en: ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    };

    const get_size = sizes[lang] ? sizes[lang] : sizes["en"];

    if (bytes === 0) {
        return "0 " + get_size[0];
    }

    let minus_str = bytes < 0 ? "-" : "";
    bytes = Math.abs(bytes);

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
        minus_str +
        parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
        " " +
        get_size[i]
    );
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
 * Formats the given timestamp into a human-readable string representation of
 * a date and time. The date is formatted according to the user's locale, and
 * the time is formatted according to the user's locale with a 24-hour clock.
 * @param {number} timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date and time.
 */
function formatDateTime(timestamp) {
    var t = new Date(timestamp * 1000);
    return `${t.toLocaleDateString("en-GB")} ${t.toLocaleTimeString("en-GB")}`;
}

/**
 * Formats the given timestamp into a human-readable string representation of
 * a date. The date is formatted according to the user's locale.
 * @param {number} timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date.
 */
function formatDate(timestamp) {
    var t = new Date(timestamp * 1000);
    return `${t.toLocaleDateString("en-GB")}`;
}

class Toggler {
    /** @type {Map<string, { isActive: boolean, on: (itemName:string) => void, off: (itemName:string) => void }>} */
    items = new Map();

    /** @type {string} */
    #active;

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
}

// @ts-check


class SlotManager {
    /** @type {Set<string>} */
    #definedSlotNames = new Set();

    /** @type {Map<string, Set<Component>>} */
    #slotChildrenMap = new Map();

    /** @type {Set<Component>}  */
    #children = new Set();

    /** @type {Component} */
    #component;

    /**
     * @param {Component} component
     */
    constructor(component) {
        this.#component = component;
    }

    /**
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "scope-ref" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames) {
        let keysToDelete = [];

        let currentSlotNames = Array.from(this.#definedSlotNames);

        for (let i = 0; i < currentSlotNames.length; i++) {
            if (slotNames.indexOf(currentSlotNames[i]) == -1) {
                keysToDelete.push(currentSlotNames[i]);
            }
        }

        for (let i = 0; i < keysToDelete.length; i++) {
            this.removeSlot(keysToDelete[i]);
        }

        for (let i = 0; i < slotNames.length; i++) {
            if (!this.#slotChildrenMap.has(slotNames[i])) {
                this.#slotChildrenMap.set(slotNames[i], new Set());
            }
        }

        this.#definedSlotNames = new Set(slotNames);
    }

    /**
     * Removes the given slot name from the component.
     * This method first unmounts all children components of the given slot name,
     * then removes the slot name from the component's internal maps.
     * @param {string} slotName - The name of the slot to remove.
     */
    removeSlot(slotName) {
        let slotChildren = this.#slotChildrenMap.get(slotName);
        if (slotChildren) {
            let children = Array.from(slotChildren);
            for (let i = 0; i < children.length; i++) {
                this.#component.removeChildComponent(children[i]);
                children[i].unmount();
                this.#children.delete(children[i]);
            }

            this.#slotChildrenMap.delete(slotName);
        }

        this.#definedSlotNames.delete(slotName);
    }

    /**
     * Returns an array of slot names defined in the component.
     * @type {string[]}
     */
    get slotNames() {
        let arr = Array.from(this.#definedSlotNames);
        return arr;
    }

    /**
     * Checks if the given slot name exists in the component.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot exists, false otherwise.
     */
    slotExists(slotName) {
        return this.#definedSlotNames.has(slotName);
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} children - The components to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addChildComponent(slotName, ...children) {
        if (this.slotExists(slotName) === false) {
            throw new Error(`Slot "${slotName}" does not exist`);
        }

        let childrenSet = this.#slotChildrenMap.get(slotName);
        if (!childrenSet) {
            childrenSet = new Set();
            this.#slotChildrenMap.set(slotName, childrenSet);
        }

        for (let i = 0; i < children.length; i++) {
            this.#children.add(children[i]);
            childrenSet.add(children[i]);
        }
    }

    /**
     * Removes the given child component from all slots.
     * @param {Component} childComponent - The child component to remove.
     */
    removeChildComponent(childComponent) {
        this.#children.delete(childComponent);
        for (let [slotName, childrenSet] of this.#slotChildrenMap) {
            if (!childrenSet.has(childComponent)) continue;
            childrenSet.delete(childComponent);
            break;
        }
    }

    /**
     * Returns the children components of the component.
     * @type {Set<Component>}
     */
    get children() {
        return this.#children;
    }

    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     * If no slot name is given, all children components of all slots are mounted to the DOM.
     * @param {string} [slotName] - The name of the slot to mount children components for.
     */
    mountChildren(slotName) {
        /** @type {string[]} */
        let slotNames = slotName
            ? [slotName]
            : Array.from(this.#definedSlotNames);

        for (let i = 0; i < slotNames.length; i++) {
            let children = Array.from(
                this.#slotChildrenMap.get(slotNames[i]) || []
            );
            let slotRef = this.#component.$internals.slotRefs[slotNames[i]];

            if (slotRef)
                for (let y = 0; y < children.length; y++) {
                    if (children[y].isCollapsed == false) {
                        children[y].mount(slotRef, "append");
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
        let slotNames = slotName
            ? [slotName]
            : Array.from(this.#definedSlotNames);
        for (let i = 0; i < slotNames.length; i++) {
            let children = Array.from(
                this.#slotChildrenMap.get(slotNames[i]) || []
            );
            for (let y = 0; y < children.length; y++) {
                children[y].unmount();
            }
        }
    }
}

/**
 * @typedef {(component: any) => Node|string} LayoutFunction
 */

/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */

class Component {
    /** @type {{eventEmitter: EventEmitter, disconnectController: AbortController, root: HTMLElement|null, textUpdateFunction: TextUpdateFunction|null, textResources: {[key:string]:any}, refs: {[key:string]:HTMLElement}, slotRefs: {[key:string]:HTMLElement}, parentComponent: Component|null, parentSlotName: string}} */
    $internals = {
        eventEmitter: new EventEmitter(),
        /** @type {AbortController} */
        disconnectController: new AbortController(),
        /** @type {HTMLElement|null} */
        root: null,
        /** @type {TextUpdateFunction|null} */
        textUpdateFunction: null,
        /** @type {{[key:string]:any}}  */
        textResources: {},
        /** @type {{[key:string]:HTMLElement}} */
        refs: {},
        /** @type {{[key:string]:HTMLElement}} */
        slotRefs: {},
        parentComponent: null,
        parentSlotName: "",
    };

    /** @type {LayoutFunction|string|null} */
    #layout = null;

    /** @type {LayoutFunction|string|null} */
    layout;

    /** @type {string[]|undefined} */
    slots;

    refsAnnotation;

    /** @type {Node|null} */

    #template = null;

    #connected = false;

    slotManager = new SlotManager(this);

    isCollapsed = false;

    constructor() {
        let that = this;

        this.onConnect(() => {
            that.reloadText();
            try {
                that.connectedCallback();
            } catch (e) {
                console.error("Error in connectedCallback:", e);
            }
        });
        this.onUnmount(() => {
            try {
                that.disconnectedCallback();
            } catch (e) {
                console.error("Error in disconnectedCallback:", e);
            }
        });
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
     * @param {TextUpdateFunction|null} func - The text update function to set.
     * @returns {void}
     */
    setTextUpdateFunction(func) {
        this.$internals.textUpdateFunction = func;
    }

    #loadTemplate() {
        if (this.layout) {
            this.#layout = this.layout;
            this.layout = null;
        }

        let layout = this.#layout || null;
        if (layout == null) return;

        let template;

        if (typeof layout === "function") {
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
            throw new Error("Layout must have exactly one root element");
        }

        this.#template = template;
    }

    /**
     * Sets the layout of the component by assigning the template content.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
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
            throw new Error("Component is not connected to the DOM");
        }

        return this.$internals.refs;
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
        return this.$internals.eventEmitter.emit(event, ...args);
    }

    /**
     * Emits the "beforeConnect" event.
     * This event is emitted just before the component is connected to the DOM.
     * @param {(component: this, clonedTemplate: Node) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value. The second argument is the clonedTemplate - the cloned template node.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onBeforeConnect(callback) {
        return this.$internals.eventEmitter.on("beforeConnect", callback);
    }

    /**
     * Subscribes to the "connect" event.
     * This event is emitted just after the component is connected to the DOM.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onConnect(callback) {
        return this.$internals.eventEmitter.on("connect", callback);
    }

    /**
     * Subscribes to the "mount" event.
     * This event is emitted after the component is mounted to the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onMount(callback) {
        return this.$internals.eventEmitter.on("mount", callback);
    }

    /**
     * Subscribes to the "beforeUnmount" event.
     * This event is emitted just before the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onBeforeUnmount(callback) {
        return this.$internals.eventEmitter.on("beforeUnmount", callback);
    }

    /**
     * Subscribes to the "unmount" event.
     * This event is emitted after the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onUnmount(callback) {
        return this.$internals.eventEmitter.on("unmount", callback);
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
            throw new Error("Component is already connected");
        }

        this.$internals.root = componentRoot;

        let { refs, scope_refs } = selectRefsExtended(componentRoot);
        if (this.refsAnnotation) {
            checkRefs(refs, this.refsAnnotation);
        }

        this.$internals.refs = refs;
        this.$internals.slotRefs = scope_refs;

        this.$internals.disconnectController = new AbortController();
        this.#connected = true;

        this.$internals.eventEmitter.emit("connect", this);
    }

    /**
     * Disconnects the component from the DOM.
     * Sets the component's #connected flag to false.
     * This method does not emit any events.
     */
    disconnect() {
        if (this.#connected === false) return;

        this.#connected = false;
        this.$internals.disconnectController.abort();
        this.$internals.refs = {};
        this.$internals.slotRefs = {};
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
    mount(container, mode = "replace") {
        if (this.#template === null) {
            this.#loadTemplate();
        }

        if (this.#template === null) throw new Error("Template is not set");

        if (this.#connected === true) {
            return;
        }

        let clonedTemplate = this.#template.cloneNode(true);
        this.$internals.eventEmitter.emit(
            "beforeConnect",
            this,
            clonedTemplate
        );

        let componentRoot = /** @type {HTMLElement} */ (
            // @ts-ignore
            clonedTemplate.firstElementChild
        );

        if (mode === "replace") container.replaceChildren(clonedTemplate);
        else if (mode === "append") container.append(clonedTemplate);
        else if (mode === "prepend") container.prepend(clonedTemplate);

        this.connect(componentRoot);

        this.slotManager.mountChildren();

        this.$internals.eventEmitter.emit("mount", this);
    }

    /**
     * Unmounts the component from the DOM.
     * Emits "beforeUnmount" and "unmount" events through the event emitter.
     * Disconnects the component from the DOM and removes the root element.
     */
    unmount() {
        if (this.#connected === false) return;

        this.$internals.eventEmitter.emit("beforeUnmount", this);
        this.disconnect();

        this.slotManager.unmountChildren();

        this.$internals.root?.remove();
        this.$internals.eventEmitter.emit("unmount", this);
    }

    /**
     * Collapses the component by unmounting it from the DOM.
     * Sets the isCollapsed flag to true.
     */
    collapse() {
        this.unmount();
        this.isCollapsed = true;
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

        this.$internals.parentComponent.addChildComponent(
            this.$internals.parentSlotName,
            this
        );
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
    addChildComponent(slotName, ...components) {
        if (typeof this.slots !== "undefined") {
            this.defineSlots(...this.slots);
            this.slots = undefined;
        }
        if (this.slotManager.slotExists(slotName) === false) {
            throw new Error("Slot does not exist");
        }

        this.slotManager.addChildComponent(slotName, ...components);

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
        childComponent.$internals.parentSlotName = null;

        this.slotManager.removeChildComponent(childComponent);
    }
}

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

/**
 * @typedef {(page:string)=>string} TypePageUrlRenderer
 */

/**
 *
 * @param {number} current
 * @param {number} total
 * @param {number} delta
 * @param {string} [gap]
 * @returns {string[]}
 */
function createPaginationArray(current, total, delta = 2, gap = "...") {
    if (total <= 1) return ["1"];

    const center = [current];

    // no longer O(1) but still very fast
    for (let i = 1; i <= delta; i++) {
        center.unshift(current - i);
        center.push(current + i);
    }

    const filteredCenter = center
        .filter((page) => page > 1 && page < total)
        .map((page) => page.toString());

    const includeLeftGap = current > 3 + delta;
    const includeLeftPages = current === 3 + delta;
    const includeRightGap = current < total - (2 + delta);
    const includeRightPages = current === total - (2 + delta);

    if (includeLeftPages) filteredCenter.unshift("2");
    if (includeRightPages) filteredCenter.push((total - 1).toString());

    if (includeLeftGap) filteredCenter.unshift(gap);
    if (includeRightGap) filteredCenter.push(gap);

    let total_str = total.toString();

    return ["1", ...filteredCenter, total_str];
}

/**
 *
 * @param {number} currentPage
 * @param {number} total
 * @param {TypePageUrlRenderer|null} [pageUrlRenderer]
 */
function renderPaginationItems(currentPage, total, pageUrlRenderer) {
    let currentPage_str = currentPage.toString();

    let items = createPaginationArray(currentPage, total);
    items = items.map(function (item) {
        let activeClass = currentPage_str == item ? "active" : "";

        let page_url = pageUrlRenderer ? pageUrlRenderer(item) : "#"; //page_url_mask.replace(/:page/, item);

        if (item != "...")
            return `<li class="page-item ${activeClass}" page-value="${item}"><a class="page-link" href="${page_url}">${item}</a></li>`;

        return `<li class="page-item"><span class="page-link">${item}</span></li>`;
    });

    return items.join("\n");
}

/**
 *
 * @param {number} currentPage
 * @param {number} total
 * @param {TypePageUrlRenderer|null} [pageUrlRenderer]
 */
function renderPagination(currentPage, total, pageUrlRenderer) {
    let code = renderPaginationItems(currentPage, total, pageUrlRenderer);
    return `
  <ul class="pagination">
  ${code}
  </ul>`;
}

// @ts-check


class Pagination extends Component {
    /** @type {import("./layout.js").TypePageUrlRenderer|null} */
    pageUrlRenderer = null;

    #currentPage = 0;
    #totalPages = 0;

    constructor() {
        super();

        let that = this;
        this.setLayout(() => {
            return renderPagination(
                that.#currentPage,
                that.#totalPages,
                that.pageUrlRenderer
            );
        });

        this.onConnect(() => this.#render());
    }

    /**
     * Subscribes to the "page-changed" event of the pagination component.
     * The event is triggered when the user changes the page by clicking on a page number or
     * by clicking on the previous or next buttons.
     * @param {(index: number)=>void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the index of the new page as the first argument.
     * @returns {Function} A function that removes the event listener.
     */
    onPageChanged(callback) {
        return this.$internals.eventEmitter.on("page-changed", callback);
    }

    /**
     * Sets the config of the pagination component.
     * @param {{pageUrlRenderer:import("./layout.js").TypePageUrlRenderer}} config - The config object to be set.
     * The config object should contain the following properties:
     * - pageUrlRenderer {TypePageUrlRenderer} - The page url renderer function.
     */
    setConfig(config) {
        this.pageUrlRenderer = config.pageUrlRenderer;
    }

    /**
     * Sets the current page of the pagination component.
     * If the component is mounted, the component will be re-rendered.
     * @param {number} value - the new current page value
     */
    set currentPage(value) {
        this.#currentPage = value;

        this.#render();
    }

    /**
     * Gets the current page value.
     * @returns {number} - the current page value
     */
    get currentPage() {
        return this.#currentPage;
    }

    /**
     * Gets the total number of pages.
     * @returns {number} - the total number of pages
     */
    get totalPages() {
        return this.#totalPages;
    }

    #render() {
        if (!this.isConnected) return;
        let root_element = this.$internals.root;
        if (!root_element) return;
        root_element.innerHTML = renderPaginationItems(
            this.#currentPage,
            this.#totalPages,
            this.pageUrlRenderer
        );

        let page_items = root_element.querySelectorAll(".page-item");

        let that = this;

        for (let i = 0; i < page_items.length; i++) {
            that.$on(page_items[i], "click", (e) => {
                e.preventDefault();

                if (!(e.target instanceof Element)) return;

                let element = e.target;
                if (element.tagName != "LI") {
                    // @ts-ignore
                    element = element.parentElement;
                    if (!(element instanceof Element)) return;
                }

                let pageValue = element.getAttribute("page-value");
                if (!pageValue) return;

                that.#currentPage = parseInt(pageValue);
                that.#render();

                that.emit("page-changed", that.#currentPage);
            });
        }
    }

    /**
     * @param {Object} [resp] - response object
     */
    setData(resp) {
        let response = extractRPCResponse(resp);

        if (response && response instanceof RPCPagedResponse) {
            this.#currentPage = response.result.current_page;
            this.#totalPages = response.result.total_pages;
        }

        this.#render();
    }
}

// @ts-check

function getHtmlLayout$1() {
    let html = /* html */ `
<table class="table table-striped">
    <thead>
        <tr ref="header_row">

        </tr>
    </thead>
    <tbody ref="section_with_content" class="d-none">
    </tbody>
    <tbody ref="section_without_content" class="d-none">
        <tr>
            <td ref="no_content_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                No items
            </td>
        </tr>
    </tbody>
    <tbody ref="section_error" class="d-none">
        <tr>
            <td ref="error_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                Error
            </td>
        </tr>
    </tbody>
    <tbody ref="section_loading" class="">
        <tr>
            <td ref="loading_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                Loading...
            </td>
        </tr>
    </tbody>

</table>
`;

    return html;
}

// @ts-check


/**
 * Default table row renderer function.
 * @param {Object} data - The row data.
 * @param {number} index - The row index.
 * @returns {HTMLTableRowElement} The rendered table row.
 */
function defaultTableRowRenderer(data, index) {
    let row = document.createElement("tr");
    row.setAttribute("data-row-index", index.toString());

    let cell = document.createElement("td");
    cell.setAttribute("ref", "index");
    cell.innerText = (index + 1).toString();
    row.appendChild(cell);

    for (let key in data) {
        let cell = document.createElement("td");
        cell.setAttribute("ref", key);
        cell.innerText = data[key];
        row.appendChild(cell);
    }

    return row;
}

/**
 * @template T
 * @typedef {(row:T, index:number)=>HTMLTableRowElement} TableRowRenderer
 */

const refsAnnotation$2 = {
    section_with_content: HTMLTableSectionElement.prototype,
    section_without_content: HTMLTableSectionElement.prototype,
    section_error: HTMLTableSectionElement.prototype,
    section_loading: HTMLTableSectionElement.prototype,
    header_row: HTMLTableRowElement.prototype,
    error_text: HTMLElement.prototype,
    loading_text: HTMLElement.prototype,
    no_content_text: HTMLElement.prototype,
};

const textResources_default$1 = {
    no_content_text: "No items",
    error_text: "Error",
    loading_text: "Loading...",
    invalid_response: "Invalid response",
};

/**
 * Updates the text content of the component's elements.
 * @param {Table} component - The component to update.
 * @returns {void}
 */
function textUpdater$1(component) {
    let refs = component.getRefs();
    let textResources = component.$internals.textResources;

    refs.error_text.innerText = textResources.error_text;
    refs.loading_text.innerText = textResources.loading_text;
    refs.no_content_text.innerText = textResources.no_content_text;
}

/**
 * @template T
 */
class Table extends Component {
    #headerHTML = "";

    /** @type {TableRowRenderer<T>} */
    #tableRowRenderer = defaultTableRowRenderer;

    /** @type {"content"|"no_content"|"error"|"loading"} */
    #state = "loading";

    /** @type {T[]} */
    #rows = [];

    constructor() {
        super();

        this.$internals.textResources = textResources_default$1;
        this.setTextUpdateFunction(textUpdater$1);

        let that = this;

        this.toggler = new Toggler();
        this.toggler.addItem(
            "content",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                that.#renderRows();
                showElements(refs.section_with_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                let refs = this.getRefs();
                refs.section_with_content.innerHTML = "";
                hideElements(refs.section_with_content);
            }
        );

        this.toggler.addItem(
            "no_content",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                showElements(refs.section_without_content);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_without_content);
            }
        );

        this.toggler.addItem(
            "error",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                showElements(refs.section_error);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_error);
            }
        );

        this.toggler.addItem(
            "loading",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                showElements(refs.section_loading);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_loading);
            }
        );

        this.toggler.setActive("loading");

        this.onConnect(() => {
            let refs = this.getRefs();
            refs.header_row.innerHTML = that.#headerHTML;
        });

        this.onConnect(() => {
            that.toggler.runCallbacks();
        });

        this.setLayout(getHtmlLayout$1, refsAnnotation$2);
    }

    /**
     * @returns {{header_row:HTMLTableRowElement, section_with_content:HTMLTableSectionElement, section_without_content:HTMLTableSectionElement, section_error:HTMLTableSectionElement, section_loading:HTMLTableSectionElement, error_text:HTMLElement, loading_text:HTMLElement, no_content_text:HTMLElement}} - the refs object
     */
    getRefs() {
        return super.getRefs();
    }

    /**
     * @param {Object} config - config
     * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
     * @param {string} [config.headerHTML] - the table row header string
     */
    setConfig(config) {
        if (config.tableRowRenderer) {
            this.#tableRowRenderer = config.tableRowRenderer;
        }

        if (config.headerHTML) {
            this.#headerHTML = config.headerHTML;
        }
    }

    /**
     * Gets the current state of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current state of the table view
     */
    get state() {
        return this.#state;
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent() {
        this.#state = "content";

        this.#renderRows();
        this.toggler.setActive("content");
        this.$internals.eventEmitter.emit("content", this);
    }

    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message and activate the loading toggler.
     */
    setLoading() {
        this.#state = "loading";
        this.toggler.setActive("loading");
        this.$internals.eventEmitter.emit("loading", this);
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will display an error message and activate the error toggler.
     */
    setError() {
        this.#state = "error";
        this.toggler.setActive("error");
        this.$internals.eventEmitter.emit("error", this);
    }

    /**
     * Sets the table view to its "no_content" state.
     * The table view will display a no content message and activate the no content toggler.
     */
    setNoContent() {
        this.#state = "no_content";
        this.toggler.setActive("no_content");
        this.$internals.eventEmitter.emit("no_content", this);
    }

    /**
     * Subscribes to the "loading" event.
     * This event is emitted when the view is set to "loading" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onLoading(callback) {
        return this.$internals.eventEmitter.on("loading", callback);
    }

    /**
     * Subscribes to the "error" event.
     * This event is emitted when the view is set to the "error" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onError(callback) {
        return this.$internals.eventEmitter.on("error", callback);
    }

    /**
     * Subscribes to the "no_content" event.
     * This event is emitted when the view is set to the "no_content" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onNoContent(callback) {
        return this.$internals.eventEmitter.on("no_content", callback);
    }

    /**
     * Subscribes to the "content" event.
     * This event is emitted when the view is set to the "content" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onContent(callback) {
        return this.$internals.eventEmitter.on("content", callback);
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        let textResources = /** @type {typeof textResources_default} */ (
            this.$internals.textResources
        );
        textResources.loading_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.loading_text.textContent = text;
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        let textResources = /** @type {typeof textResources_default} */ (
            this.$internals.textResources
        );
        textResources.error_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.error_text.textContent = text;
    }

    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text) {
        let textResources = /** @type {typeof textResources_default} */ (
            this.$internals.textResources
        );
        textResources.no_content_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.no_content_text.textContent = text;
    }

    /**
     * Renders the table view by setting its inner HTML and connecting its elements.
     * If a response is provided, it will be rendered in the table view.
     * @param {Object} resp - The response to be rendered in the table view.
     * If undefined, the table view will be set to the "loading" state.
     */
    setData(resp) {
        let response = extractRPCResponse(resp);

        if (response instanceof RPCErrorResponse) {
            this.#rows = [];
            this.setErrorText(response.error.message);
            this.setError();
            return;
        }

        if (!(response instanceof RPCPagedResponse)) {
            this.#rows = [];
            this.setErrorText(this.$internals.textResources.invalid_response);
            this.setError();
            return;
        }

        let rows = response.result.data;

        if (rows.length == 0) {
            this.#rows = [];
            this.setNoContent();
            return;
        }

        this.#rows = rows;
        this.setContent();
    }

    #renderRows() {
        if (!this.isConnected) return;
        let refs = this.getRefs();

        refs.section_with_content.innerHTML = "";

        let rows = this.#rows;

        for (let i = 0; i < rows.length; i++) {
            let row = this.#tableRowRenderer(rows[i], i);
            refs.section_with_content.appendChild(row);
        }
    }

    /**
     * Gets the rows of the table view.
     * @returns {T[]} - The rows of the table view.
     */
    get rows() {
        return this.#rows;
    }
}

// @ts-check


/**
 * Generates an HTML layout string for a paginated table component.
 * The layout includes a title, add and update buttons, a table, and a pagination section.
 * @param {import('./paginatedTable.js').PaginatedTable} paginatedTable - The paginated table object used to generate the layout.
 * @returns {string} The HTML layout string.
 */

function getHtmlLayout(paginatedTable) {
    return /* html */ `
<div style="display: contents;">    
    <table class="table table-striped" ref="table" scope-ref="table"></table>
    <div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination" scope-ref="pagination"></div>
</div>
`;
}

// @ts-check


const refsAnnotation$1 = {
    table: HTMLTableElement.prototype,
    pagination: HTMLElement.prototype,
};

/** @typedef {{ table: HTMLTableElement, pagination: HTMLElement}} Refs */

/**
 * @template T
 */
class PaginatedTable extends Component {
    /** @type {Table<T>} */
    table;

    /** @type {Pagination} */
    pagination;

    constructor() {
        super();

        this.defineSlots("table", "pagination");
        this.setLayout(getHtmlLayout, refsAnnotation$1);

        this.table = new Table();
        this.pagination = new Pagination();

        this.addChildComponent("table", this.table);
        this.addChildComponent("pagination", this.pagination);
    }

    /** @returns {{ table: HTMLTableElement, pagination: HTMLElement}} */
    getRefs() {
        return super.getRefs();
    }

    /**
     * Gets the current status of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the table view
     */
    get state() {
        return this.table.state;
    }

    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message.
     */
    setLoading() {
        this.table.setLoading();

        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "hidden";
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent() {
        this.table.setContent();

        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will show an error message.
     */
    setError() {
        this.table.setError();
        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
    }

    /**
     * Sets the table view to its "no_content" state.
     * The table view will show a no content message.
     */
    setNoContent() {
        this.table.setNoContent();
        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        this.table.setLoadingText(text);
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        this.table.setErrorText(text);
    }

    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text) {
        this.table.setNoContentText(text);
    }

    /**
     * Renders the data view by invoking the render methods of the table view and pagination components.
     * @param {Object} resp - The response to be rendered in the data view.
     * If undefined, the table view and pagination will be set to their "loading" states.
     */
    setData(resp) {
        this.table.setData(resp);
        this.pagination.setData(resp);

        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
    }

    /**
     * Subscribes to the "page-changed" event of the pagination component.
     * The event is triggered when the user changes the page by clicking on a page number or
     * by clicking on the previous or next buttons.
     * @param {(index: number)=>void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the index of the new page as the first argument.
     * @returns {Function} A function that removes the event listener.
     */
    onPageChanged(callback) {
        return this.pagination.onPageChanged(callback);
    }

    /**
     * Subscribes to the "loading" event of the table view.
     * The event is triggered when the table view is set to its "loading" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onLoading(callback) {
        let that = this;
        return this.table.onLoading(() => {
            callback(that);
        });
    }

    /**
     * Subscribes to the "content" event of the table view.
     * The event is triggered when the table view is set to its "content" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onContent(callback) {
        let that = this;
        return this.table.onContent(() => {
            callback(that);
        });
    }

    /**
     * Subscribes to the "error" event of the table view.
     * The event is triggered when the table view is set to its "error" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onError(callback) {
        let that = this;
        return this.table.onError(() => {
            callback(that);
        });
    }

    /**
     * Subscribes to the "no_content" event of the table view.
     * The event is triggered when the table view is set to its "no_content" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onNoContent(callback) {
        let that = this;
        return this.table.onNoContent(() => {
            callback(that);
        });
    }
}

// layout.js
// @ts-check

/**
 * @returns {string}
 */
function getHtml() {
    let html = /* html */ `
<div class="modal fade" data-bs-backdrop="static" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" ref="modal_title">Modal name</h5>
                <button type="button" ref="close_x_button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" ref="modal_body">
                <div scope-ref="modal_body" ref="section_with_content" class="d-none">
                </div>
                <div ref="section_error" class="text-center d-none">

                    <div class="d-flex justify-content-center align-items-center fs-5 text-danger" style="min-height: 25vh">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/>
                            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                        </svg>
                        <span ref="error_text" class="ms-3"
                            style="white-space: initial; word-wrap: break-word;">
                            Error text
                        </span>
                    </div>
                </div>

                <div ref="section_loading" class="d-none">
                    <div class="d-flex justify-content-center align-items-center" style="min-height: 25vh">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span ref="loading_text" class="ms-3 fs-5"
                            style="white-space: initial; word-wrap: break-word;">
                            Loading...
                        </span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" ref="close_button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" ref="submit_button" class="btn btn-primary">Add</button>
            </div>
        </div>
    </div>
</div>
`;

    return html;
}

// @ts-check

/**
 * @typedef {Object} Refs
 * @property {HTMLHeadingElement} modal_title
 * @property {HTMLButtonElement} close_x_button
 * @property {HTMLDivElement} modal_body
 * @property {HTMLDivElement} section_with_content
 * @property {HTMLDivElement} section_error
 * @property {HTMLSpanElement} error_text
 * @property {HTMLDivElement} section_loading
 * @property {HTMLSpanElement} loading_text
 * @property {HTMLButtonElement} close_button
 * @property {HTMLButtonElement} submit_button
 */

const refsAnnotation = {
    modal_title: HTMLHeadingElement.prototype,
    close_x_button: HTMLButtonElement.prototype,
    modal_body: HTMLDivElement.prototype,
    section_with_content: HTMLDivElement.prototype,
    section_error: HTMLDivElement.prototype,
    error_text: HTMLSpanElement.prototype,
    section_loading: HTMLDivElement.prototype,
    loading_text: HTMLSpanElement.prototype,
    close_button: HTMLButtonElement.prototype,
    submit_button: HTMLButtonElement.prototype,
};

/**
 * Updates the text content of the component's elements.
 * @param {Modal} component - The component to update.
 * @returns {void}
 */
function textUpdater(component) {
    let refs = component.getRefs();
    let textResources = component.$internals.textResources;

    refs.modal_title.textContent = textResources.modal_title_text;
    refs.close_x_button.setAttribute(
        "aria-label",
        textResources.close_x_button_aria_label
    );
    refs.loading_text.textContent = textResources.loading_text_text;
    refs.close_button.textContent = textResources.close_button_text;
    refs.submit_button.textContent = textResources.submit_button_text;
}

let textResources_default = {
    modal_title_text: "Modal name",
    close_x_button_aria_label: "Close",
    loading_text_text: "Loading...",
    close_button_text: "Close",
    submit_button_text: "Add",
};

class Modal extends Component {
    /**
     * Indicates whether the submit button should be hidden when the content mode is active.
     * @type {boolean}
     * */
    hideSubmitButtonOnContentMode = false;

    constructor() {
        super();
        this.defineSlots("modal_body");
        this.setLayout(getHtml(), refsAnnotation);

        this.$internals.textResources = textResources_default;
        this.setTextUpdateFunction(textUpdater);

        let that = this;

        this.toggler = new Toggler();
        this.toggler.addItem(
            "content",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                if (that.hideSubmitButtonOnContentMode) {
                    hideElements(refs.submit_button);
                } else {
                    showElements(refs.submit_button);
                }
                showElements(refs.section_with_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                let refs = this.getRefs();
                hideElements(refs.section_with_content);
            }
        );

        this.toggler.addItem(
            "error",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                refs.error_text.textContent =
                    this.$internals.textResources.error_text;
                hideElements(refs.submit_button);
                showElements(refs.section_error);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_error);
            }
        );

        this.toggler.addItem(
            "loading",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                refs.loading_text.textContent =
                    this.$internals.textResources.loading_text;
                hideElements(refs.submit_button);
                showElements(refs.section_loading);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_loading);
            }
        );

        this.toggler.setActive("content");

        this.onConnect(() => {
            that.toggler.runCallbacks();

            let root = /** @type {Element} */ (that.$internals.root);

            // @ts-ignore
            that.$on(root, "hide.bs.modal", () => {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }

                that.$internals.eventEmitter.emit("hide", that);
            });
        });
    }

    /** @returns {{modal_title: HTMLHeadingElement, close_x_button: HTMLButtonElement, modal_body: HTMLDivElement, close_button: HTMLButtonElement, submit_button: HTMLButtonElement, section_with_content: HTMLDivElement, section_error: HTMLDivElement, error_text: HTMLSpanElement, section_loading: HTMLDivElement, loading_text: HTMLSpanElement}} */
    getRefs() {
        return super.getRefs();
    }

    /**
     * Displays the modal if the component is connected to the DOM.
     * Retrieves or creates a modal instance and calls its show method.
     * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
     */
    show(ctx = {}) {
        if (!this.isConnected) return;

        this.toggler.setActive("content");
        this.$internals.eventEmitter.emit("show", this, ctx);

        let modal_element = /** @type {Element} */ (this.$internals.root);
        // @ts-ignore
        let modal = bsModal.default.getOrCreateInstance(modal_element);
        modal.show();
    }

    /**
     * Displays the modal with the loading indicator if the component is connected to the DOM.
     * Retrieves or creates a modal instance, sets its backdrop to static, and calls its show method.
     * Emits the "show" event as well.
     * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
     */
    showLoading(ctx = {}) {
        if (!this.isConnected) return;

        this.toggler.setActive("loading");
        this.$internals.eventEmitter.emit("show", this, ctx);
        let modal_element = /** @type {Element} */ (this.$internals.root);
        // @ts-ignore
        let modal = bsModal.default.getOrCreateInstance(modal_element);
        modal.show();
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContentMode() {
        this.toggler.setActive("content");
    }

    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message and activate the loading toggler.
     */
    setLoadingMode() {
        this.toggler.setActive("loading");
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will display an error message and activate the error toggler.
     */
    setErrorMode() {
        this.toggler.setActive("error");
    }

    /**
     * Hides the modal if the component is connected to the DOM.
     * Retrieves or creates a modal instance and calls its hide method.
     */
    hide() {
        if (!this.isConnected) return;

        let modal_element = /** @type {Element} */ (this.$internals.root);
        let close_button = /** @type {HTMLButtonElement} */ (
            modal_element.querySelector('[data-bs-dismiss="modal"]')
        );
        close_button?.click();
    }

    /**
     * Subscribes to the "show" event.
     * This event is emitted whenever the modal is shown.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onShow(callback) {
        return this.$internals.eventEmitter.on("show", callback);
    }

    /**
     * Subscribes to the "hide" event.
     * This event is emitted whenever the modal is hidden.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onHide(callback) {
        return this.$internals.eventEmitter.on("hide", callback);
    }

    /**
     * Subscribes to the "response" event.
     * This event is emitted whenever the modal receives a response.
     * The callback is called with the component instance as the this value and the response as the second argument.
     * @param {(modal: this, response: Object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onResponse(callback) {
        return this.$internals.eventEmitter.on("response", callback);
    }

    /**
     * Emits the "response" event.
     * This event is emitted whenever the modal receives a response.
     * The callback is called with the component instance as the this value and the response as the second argument.
     * @param {Object} response - The response to be emitted.
     */
    emitResponse(response) {
        this.$internals.eventEmitter.emit("response", this, response);
    }

    /**
     * Subscribes to the "submit" event.
     * This event is emitted when the user clicks the submit button.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onSubmit(callback) {
        return this.$internals.eventEmitter.on("submit", callback);
    }

    /**
     * Emits the "submit" event.
     * This event is emitted when the user clicks the submit button.
     * The callback is called with the component instance as the this value and the context object as the second argument.
     * @param {object} ctx - The context object to be passed to the callback.
     */
    emitSubmit(ctx) {
        this.$internals.eventEmitter.emit("submit", this, ctx);
    }

    /**
     * Sets the title of the modal.
     * @param {string} title - The new title text.
     */
    setTitleText(title) {
        this.$internals.textResources.modal_title_text = title;

        if (!this.isConnected) return;

        let refs = this.getRefs();

        refs.modal_title.textContent = title;
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        this.$internals.textResources.loading_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.loading_text.textContent = text;
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        this.$internals.textResources.error_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.error_text.textContent = text;
    }

    /**
     * Sets the text of the submit button.
     * @param {string} text - The text to be shown as the submit button.
     */
    setSubmitButtonText(text) {
        this.$internals.textResources.submit_button_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.submit_button.textContent = text;
    }

    /**
     * Sets the text of the close button.
     * @param {string} text - The text to be shown as the close button.
     */
    setCloseButtonText(text) {
        this.$internals.textResources.close_button_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.close_button.textContent = text;
    }

    /**
     * Hides the close buttons of the modal.
     * If the component is not connected to the DOM, does nothing.
     */
    hideCloseButtons() {
        if (!this.isConnected) return;
        let refs = this.getRefs();

        refs.close_x_button.setAttribute("aria-hidden", "true");
        refs.close_x_button.style.visibility = "hidden";
        refs.close_button.setAttribute("aria-hidden", "true");
        refs.close_button.style.visibility = "hidden";
    }

    /**
     * Shows the close buttons of the modal.
     * If the component is not connected to the DOM, does nothing.
     */
    showCloseButtons() {
        if (!this.isConnected) return;
        let refs = this.getRefs();

        refs.close_x_button.removeAttribute("aria-hidden");
        refs.close_x_button.style.visibility = "visible";
        refs.close_button.removeAttribute("aria-hidden");
        refs.close_button.style.visibility = "visible";
    }
}

export { Component, DOMReady, Modal, PaginatedTable, Pagination, SlotToggler, Table, Toggler, copyToClipboard, escapeHtml, formatBytes, formatDate, formatDateTime, getDefaultLanguage, hideElements, isDarkMode, removeSpinnerFromButton, scrollToBottom, scrollToTop, showElements, showSpinnerInButton, ui_button_status_waiting_off, ui_button_status_waiting_off_html, ui_button_status_waiting_on, unixtime };
