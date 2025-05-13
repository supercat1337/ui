import Modal from 'bootstrap/js/src/modal.js';
import { createFromHTML, selectRefsExtended, checkRefs } from 'dom-scope';
import { EventEmitter } from '@supercat1337/event-emitter';
import { extractRPCResponse, RPCPagedResponse, RPCErrorResponse } from '@supercat1337/rpc';

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
 * @param {string} [customClassName] - The class name to use for the spinner.
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
 * Hides the given modal element.
 * @param {Element} modal_element - The modal element to hide.
 */
function hideModal(modal_element) {
    /*
  let modal = Modal.getOrCreateInstance(modal_element);
  modal.hide();
  let modal_backdrop = document.querySelector(".modal-backdrop");
  if (modal_backdrop) {
      modal_backdrop.classList.remove("show");

      setTimeout(() => {
          modal_backdrop.remove();
      }, 500);
  }*/

    let close_button = /** @type {HTMLButtonElement} */ (
        modal_element.querySelector('[data-bs-dismiss="modal"]')
    );
    close_button?.click();
}

/**
 * Displays the given modal element by creating or retrieving its instance
 * and calling the show method on it.
 * @param {Element} modal_element - The modal element to be displayed.
 */
function showModal(modal_element) {
    // @ts-ignore
    let modal = Modal.getOrCreateInstance(modal_element);
    modal.show();
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

    /** @type {{[key:string]:HTMLElement}} */
    #slotRefs = {};

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
                children[i].unmount();
                this.#children.delete(children[i]);
            }

            this.#slotChildrenMap.delete(slotName);
        }

        this.#definedSlotNames.delete(slotName);

        delete this.#slotRefs[slotName];
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
     * Sets the slot refs object.
     * This object is a map of HTML elements with the keys being the names of the slots.
     * The slot refs object is set by the component automatically when the component is connected to the DOM.
     * @param {{[key:string]:HTMLElement}} scope_refs - The slot refs object.
     */
    setSlotRefs(scope_refs) {
        this.#slotRefs = {};

        let that = this;
        this.#definedSlotNames.forEach((slotName) => {
            if (!scope_refs[slotName]) {
                throw new Error(`Slot "${slotName}" not found`);
            }

            that.#slotRefs[slotName] = scope_refs[slotName];
        });
    }

    /**
     * Returns the HTML element reference of the given slot name.
     * @param {string} slotName - The name of the slot to get the reference for.
     * @returns {HTMLElement|null} The HTML element reference of the slot, or null if the slot does not exist.
     */
    getSlotRef(slotName) {
        return this.#slotRefs[slotName] || null;
    }

    /**
     * Clears the slot refs object.
     * This is usually done when the component is disconnected from the DOM.
     */
    clearSlotRefs() {
        this.#slotRefs = {};
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
            for (let y = 0; y < children.length; y++) {
                children[y].mount(this.#slotRefs[slotNames[i]], "append");
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

class Component {
    /** @type {{eventEmitter: EventEmitter, disconnectController: AbortController, root: HTMLElement|null}} */
    $internals = {
        eventEmitter: new EventEmitter(),
        /** @type {AbortController} */
        disconnectController: new AbortController(),
        /** @type {HTMLElement|null} */
        root: null,
    };

    /** @type {Node|null} */
    #template = null;

    #connected = false;

    /** @type {{[key:string]:HTMLElement}} */
    #refs;

    slots = new SlotManager();

    refsAnnotation;

    /**
     * Sets the layout of the component by assigning the template content.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation} [refsAnnotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setLayout(layout, refsAnnotation) {
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

        if (refsAnnotation) {
            this.refsAnnotation = refsAnnotation;
        }
    }

    /**
     * Returns the refs object.
     * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
     * The refs object is only available after the component has been connected to the DOM.
     * @returns {any} The refs object.
     */
    getRefs() {
        return this.#refs;
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

        this.#refs = refs;

        this.slots.setSlotRefs(scope_refs);

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
        this.#refs = {};
    }

    /**
     * Mounts the component to the specified container.
     * @param {Element} container - The container to mount the component to.
     * @param {"replace"|"append"|"prepend"} [mode="replace"] - The mode to use to mount the component.
     * If "replace", the container's content is replaced.
     * If "append", the component is appended to the container.
     * If "prepend", the component is prepended to the container.
     */
    mount(container, mode = "replace") {
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

        this.slots.mountChildren();

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

        this.slots.unmountChildren();
        this.slots.clearSlotRefs();

        this.$internals.root?.remove();
        this.$internals.eventEmitter.emit("unmount", this);
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
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "data-slot" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames) {
        this.slots.defineSlots(...slotNames);
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The component to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addChildComponent(slotName, ...components) {
        if (this.slots.slotExists(slotName) === false) {
            throw new Error("Slot does not exist");
        }

        this.slots.addChildComponent(slotName, ...components);

        if (this.#connected) {
            this.slots.mountChildren(slotName);
        }
    }

    /**
     * Removes the specified child component from all slots.
     * Delegates the removal to the SlotManager instance.
     * @param {Component} childComponent - The child component to be removed.
     */
    removeChildComponent(childComponent) {
        this.slots.removeChildComponent(childComponent);
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
        for (let i = 0; i < slotNames.length; i++) {
            if (component.slots.slotExists(slotNames[i]) === false) {
                throw new Error(
                    `Slot ${slotNames[i]} does not exist in component`
                );
            }
        }

        if (component.slots.slotExists(activeSlotName) === false) {
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
                this.component.slots.mountChildren(slotName);
                this.activeSlotName = slotName;
            } else {
                this.component.slots.unmountChildren(this.slotNames[i]);
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

const refsAnnotation = {
    section_with_content: HTMLTableSectionElement.prototype,
    section_without_content: HTMLTableSectionElement.prototype,
    section_error: HTMLTableSectionElement.prototype,
    section_loading: HTMLTableSectionElement.prototype,
    header_row: HTMLTableRowElement.prototype,
    error_text: HTMLElement.prototype,
    loading_text: HTMLElement.prototype,
    no_content_text: HTMLElement.prototype,
};

/**
 * @template T
 */
class Table extends Component {
    #headerHTML = "";

    /** @type {TableRowRenderer<T>} */
    #tableRowRenderer = defaultTableRowRenderer;

    /** @type {"content"|"no_content"|"error"|"loading"} */
    #state = "loading";

    #error_text = "";
    #loading_text = "Loading...";
    #no_content_text = "No items";

    /** @returns {typeof refsAnnotation} */
    get refs() {
        return this.getRefs();
    }

    /** @type {T[]} */
    #rows = [];

    constructor() {
        super();

        this.toggler = new Toggler();

        let that = this;

        this.toggler.addItem(
            "content",
            (key) => {
                if (!that.isConnected) return false;

                that.#renderRows();
                showElements(that.refs.section_with_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                this.refs.section_with_content.innerHTML = "";
                hideElements(that.refs.section_with_content);
            }
        );

        this.toggler.addItem(
            "no_content",
            (key) => {
                if (!that.isConnected) return false;

                showElements(that.refs.section_without_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                hideElements(that.refs.section_without_content);
            }
        );

        this.toggler.addItem(
            "error",
            (key) => {
                if (!that.isConnected) return false;

                showElements(that.refs.section_error);
            },
            (key) => {
                if (!that.isConnected) return false;

                hideElements(that.refs.section_error);
            }
        );

        this.toggler.addItem(
            "loading",
            (key) => {
                if (!that.isConnected) return false;

                showElements(that.refs.section_loading);
            },
            (key) => {
                if (!that.isConnected) return false;

                hideElements(that.refs.section_loading);
            }
        );

        this.toggler.setActive("loading");

        this.onConnect(() => {
            that.refs.header_row.innerHTML = that.#headerHTML;
            that.refs.error_text.innerHTML = that.#error_text;
            that.refs.loading_text.innerHTML = that.#loading_text;
            that.refs.no_content_text.innerHTML = that.#no_content_text;
        });

        this.onConnect(() => {
            that.toggler.runCallbacks();
        });

        this.setLayout(getHtmlLayout$1, refsAnnotation);
    }

    /**
     * @param {Object} [config] - config
     * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
     * @param {string} [config.headerHTML] - the table row header string
     */
    setConfig(config) {
        /** @type {{tableRowRenderer:TableRowRenderer<T>, headerHTML:string|null}} */
        let _config = Object.assign(
            {
                tableRowRenderer: defaultTableRowRenderer,
                headerHTML: null,
            },
            config
        );

        if (_config.tableRowRenderer) {
            this.#tableRowRenderer = _config.tableRowRenderer;
        }

        if (_config.headerHTML) {
            this.#headerHTML = _config.headerHTML;
        }
    }

    /**
     * Gets the current state of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current state of the table view
     */
    get state() {
        return this.#state;
    }

    setContent() {
        this.#state = "content";

        this.#renderRows();
        this.toggler.setActive("content");
    }

    setLoading() {
        this.#state = "loading";
        this.toggler.setActive("loading");
    }

    setError() {
        this.#state = "error";
        this.toggler.setActive("error");
    }

    setNoContent() {
        this.#state = "no_content";
        this.toggler.setActive("no_content");
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        this.#loading_text = text;

        if (!this.isConnected) return;
        this.refs.loading_text.innerHTML = text;
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        this.#error_text = text;

        if (!this.isConnected) return;
        this.refs.error_text.innerHTML = text;
    }

    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text) {
        this.#no_content_text = text;

        if (!this.isConnected) return;
        this.refs.no_content_text.innerHTML = text;
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
            this.setErrorText("Invalid response");
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

        this.refs.section_with_content.innerHTML = "";

        let rows = this.#rows;

        for (let i = 0; i < rows.length; i++) {
            let row = this.#tableRowRenderer(rows[i], i);
            this.refs.section_with_content.appendChild(row);
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
    <div class="d-flex flex-column" style="min-height: 75vh">
        <div class="flex-grow-1 mt-3">
            <h1 class="display-6 mb-3">
                <span ref="title">${escapeHtml(paginatedTable.title)}</span>
                <button class="btn btn-outline-secondary btn-sm ms-2" ref="add_data_button">
                    Add
                </button>

                <button class="btn btn-outline-secondary btn-sm ms-2" ref="update_data_button">
                    Update
                </button>
            </h1>
        
            <table class="table table-striped" ref="table" scope-ref="table">
            </table>

        </div>
    </div>
    <div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination_section" scope-ref="pagination">
    </div>
</div>
`;
}

// @ts-check


/**
 * @template T
 */
class PaginatedTable extends Component {
    /** @type {Table<T>} */
    tableView;

    /** @type {Pagination} */
    pagination;

    refsAnnotation = {
        title: HTMLSpanElement.prototype,
        add_data_button: HTMLButtonElement.prototype,
        update_data_button: HTMLButtonElement.prototype,
        table: HTMLTableElement.prototype,
        pagination_section: HTMLElement.prototype,
    };

    #title = "";

    constructor() {
        super();

        this.defineSlots("table", "pagination");
        this.setLayout(getHtmlLayout);

        this.table = new Table();
        this.pagination = new Pagination();

        this.addChildComponent("table", this.table);
        this.addChildComponent("pagination", this.pagination);

        let that = this;
        this.onConnect(() => {
            that.refs.title.innerText = that.#title;
        });
    }

    /** @returns {typeof this.refsAnnotation} */
    get refs() {
        return this.getRefs();
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
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent() {
        this.table.setContent();
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will show an error message.
     */
    setError() {
        this.table.setError();
    }

    /**
     * Sets the table view to its "no_content" state.
     * The table view will show a no content message.
     */
    setNoContent() {
        this.table.setNoContent();
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
     * Sets the title of the data view.
     * @param {string} text - The new title text.
     */
    set title(text) {
        this.#title = text;
        if (!this.isConnected) return;

        this.refs.title.innerText = this.#title;
    }

    /**
     * Gets the title of the data view.
     * @returns {string} The current title text.
     */
    get title() {
        return this.#title;
    }

    /**
     * Renders the data view by invoking the render methods of the table view and pagination components.
     * @param {Object} resp - The response to be rendered in the data view.
     * If undefined, the table view and pagination will be set to their "loading" states.
     */
    setData(resp) {
        this.table.setData(resp);
        this.pagination.setData(resp);
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
}

export { Component, DOMReady, PaginatedTable, Pagination, SlotToggler, Table, Toggler, copyToClipboard, escapeHtml, formatBytes, formatDate, formatDateTime, getDefaultLanguage, hideElements, hideModal, isDarkMode, removeSpinnerFromButton, scrollToBottom, scrollToTop, showElements, showModal, showSpinnerInButton, ui_button_status_waiting_off, ui_button_status_waiting_off_html, ui_button_status_waiting_on, unixtime };
