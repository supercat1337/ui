// @ts-check

import { checkRefs, createFromHTML, selectRefsExtended } from 'dom-scope';
import { SlotManager } from './slot-manager.js';
import { Internals } from './internals.js';

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

export class Component {
    /** @type {Internals} */
    $internals = new Internals();

    /** @type {LayoutFunction|string|undefined} */
    #layout = undefined;

    /** @type {LayoutFunction|string|undefined} */
    layout;

    /** @type {import("dom-scope").RefsAnnotation|undefined} */
    refsAnnotation;

    /** @type {Node|null} */
    #loadedTemplate = null;

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
                template = createFromHTML(_template.trim());
            }
        } else {
            template = createFromHTML(layout.trim());
        }

        if (template instanceof DocumentFragment) {
            let count = template.children.length;

            if (count !== 1) {
                throw new Error('Layout must have exactly one root element');
            }

            template = template.children[0];
        }

        this.#loadedTemplate = template;
    }

    /**
     * Sets the layout of the component by assigning the template content.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setLayout(layout, annotation) {
        this.#layout = layout;
        this.#loadedTemplate = null;

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
     * Subscribes to the "prepareRender" event.
     * This event is emitted just before the component is about to render its layout.
     * The callback is called with the component instance as the this value.
     * @param {(component: this, template: Node) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onPrepareRender(callback) {
        return this.on('prepareRender', callback);
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

        if (this.#loadedTemplate === null) {
            this.#loadTemplate();
        }

        if (this.#loadedTemplate === null) throw new Error('Template is not set');

        this.$internals.mountMode = mountMode;

        if (this.#isConnected === true) {
            return;
        }

        let clonedTemplate = this.#loadedTemplate.cloneNode(true);
        this.emit('prepareRender', clonedTemplate);

        let componentRoot = /** @type {HTMLElement} */ (clonedTemplate);

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
        if (this.isConnected) {
            let container = this.$internals.root.parentElement;
            this.unmount();
            this.mount(container, this.$internals.mountMode);
        } else {
            let parentComponent = this.$internals.parentComponent || null;

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
                parentComponent.$internals.slotRefs[this.$internals.assignedSlotName] || null;
            if (!container) {
                console.error(
                    'Cannot find a rendered slot with name ' +
                        this.$internals.assignedSlotName +
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
     * @param {...*} args
     */
    update(...args) {}

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

        this.$internals.parentComponent.addComponentToSlot(this.$internals.assignedSlotName, this);
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

    /**
     * Returns the root node of the component.
     * This is the node that the component is mounted to.
     * @returns {HTMLElement} The root node of the component.
     */
    getRootNode() {
        if (!this.#isConnected) {
            throw new Error('Component is not connected to the DOM');
        }

        return /** @type {HTMLElement} */ (this.$internals.root);
    }
}
