// @ts-check

import { checkRefs, createFromHTML, selectRefsExtended } from "dom-scope";
import { EventEmitter } from "@supercat1337/event-emitter";

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

export class Component {
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

export class SlotToggler {
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
