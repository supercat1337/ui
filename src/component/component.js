// @ts-check

import { checkRefs, createFromHTML, selectRefsExtended } from "dom-scope";
import { EventEmitter } from "@supercat1337/event-emitter";
import { SlotManager } from "./slot-manager.js";

/**
 * @typedef {(component: any) => Node|string} LayoutFunction
 */

/**
 * @typedef {(component: Component) => void} TextUpdateFunction
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
        console.error("Error in connectedCallback:", e);
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
        console.error("Error in disconnectedCallback:", e);
    }
}

export class Component {
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

    /** @type {import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation|undefined} */
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
        return this.on("beforeConnect", callback);
    }

    /**
     * Subscribes to the "connect" event.
     * This event is emitted just after the component is connected to the DOM.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onConnect(callback) {
        return this.on("connect", callback);
    }

    /**
     * Subscribes to the "disconnect" event.
     * This event is emitted just before the component is disconnected from the DOM.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onDisconnect(callback) {
        return this.on("disconnect", callback);
    }

    /**
     * Subscribes to the "mount" event.
     * This event is emitted after the component is mounted to the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onMount(callback) {
        return this.on("mount", callback);
    }

    /**
     * Subscribes to the "beforeUnmount" event.
     * This event is emitted just before the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onBeforeUnmount(callback) {
        return this.on("beforeUnmount", callback);
    }

    /**
     * Subscribes to the "unmount" event.
     * This event is emitted after the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onUnmount(callback) {
        return this.on("unmount", callback);
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
        this.slotManager.mountChildren();
        this.emit("connect");
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
        this.emit("disconnect");
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
        if (!(container instanceof Element)) {
            throw new TypeError("Container must be a DOM Element");
        }

        const validModes = ["replace", "append", "prepend"];
        if (!validModes.includes(mode)) {
            throw new Error(
                `Invalid mode: ${mode}. Must be one of: ${validModes.join(
                    ", "
                )}`
            );
        }

        if (this.#template === null) {
            this.#loadTemplate();
        }

        if (this.#template === null) throw new Error("Template is not set");

        if (this.#connected === true) {
            return;
        }

        let clonedTemplate = this.#template.cloneNode(true);
        this.emit("beforeConnect", clonedTemplate);

        let componentRoot = /** @type {HTMLElement} */ (
            // @ts-ignore
            clonedTemplate.firstElementChild
        );

        if (mode === "replace") container.replaceChildren(clonedTemplate);
        else if (mode === "append") container.append(clonedTemplate);
        else if (mode === "prepend") container.prepend(clonedTemplate);

        this.connect(componentRoot);
        this.emit("mount");
    }

    /**
     * Unmounts the component from the DOM.
     * Emits "beforeUnmount" and "unmount" events through the event emitter.
     * Disconnects the component from the DOM and removes the root element.
     */
    unmount() {
        if (this.#connected === false) return;

        this.emit("beforeUnmount");
        this.disconnect();

        this.slotManager.unmountChildren();

        this.$internals.root?.remove();
        this.emit("unmount");
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
     * Shows the component.
     * If the component is not connected, it does nothing.
     * If the component is connected, it removes the "d-none" class from the root element.
     */
    show() {
        if (!this.isConnected) return;
        this.$internals.root?.classList.remove("d-none");
    }

    /**
     * Hides the component.
     * If the component is not connected, it does nothing.
     * If the component is connected, it adds the "d-none" class to the root element.
     */
    hide() {
        if (!this.isConnected) return;
        this.$internals.root?.classList.add("d-none");
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
        if (!components.every((comp) => comp instanceof Component)) {
            throw new Error("All components must be instances of Component");
        }

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
        childComponent.$internals.parentSlotName = "";

        this.slotManager.removeChildComponent(childComponent);
    }
}
