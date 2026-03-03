// @ts-check

import { checkRefs, selectRefsExtended, walkDomScope } from 'dom-scope';
import { SlotManager } from './slot-manager.js';
import { Internals } from './internals.js';
import { html } from '../utils/utils.js';

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

/**
 * @template {import("dom-scope").RefsAnnotation} [T=any]
 */
export class Component {
    /** @type {Internals} */
    $internals = new Internals();

    /** @type {LayoutFunction|string|null|Node} */
    layout = null;

    /** @type {T} */
    refsAnnotation;

    #isConnected = false;

    slotManager = new SlotManager(this);

    #isCollapsed = false;

    /** @type {string} */
    #instanceId;

    #cachedElement = null;

    /**
     * Initializes a new instance of the Component class.
     * @param {Object} [options] - An object with the following optional properties:
     * @param {string} [options.instanceId] - The instance ID of the component. If not provided, a unique ID will be generated.
     */
    constructor(
        options = {
            instanceId: undefined,
        }
    ) {
        this.#instanceId = options.instanceId || Internals.generateInstanceId();
        this.onConnect(onConnectDefault);
        this.onDisconnect(onDisconnectDefault);
    }

    /** @returns {string} */
    get instanceId() {
        return this.#instanceId;
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
     * Returns whether the component is currently running on a server or not.
     * @returns {boolean} True if the component is running on a server, false otherwise.
     */
    get isServer() {
        // @ts-ignore
        return typeof window !== 'undefined' && window.isServer === true;
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

    /**
     * Sets the layout of the component by assigning the template content.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
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
     * Sets the renderer for the component by assigning the template content.
     * This is a synonym for setLayout.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {T} [annotation] - An array of strings representing the names of the refs.
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
     * @returns {typeof this["refsAnnotation"]}
     */
    getRefs() {
        if (!this.#isConnected) {
            throw new Error('Component is not connected to the DOM');
        }

        return /** @type {any} */ (this.$internals.refs);
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

        // @ts-ignore
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

        let { refs, scopeRefs } = selectRefsExtended(componentRoot, null, {
            scopeAttribute: ['data-slot', 'data-component-root'],
            refAttribute: 'data-ref',
            window,
        });
        if (this.refsAnnotation) {
            checkRefs(refs, this.refsAnnotation);
        }

        for (let key in scopeRefs) {
            this.slotManager.registerSlot(key);
        }

        this.$internals.refs = refs;
        this.$internals.scopeRefs = scopeRefs;
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
     * Clears the refs and scopeRefs objects.
     * Aborts all event listeners attached with the $on method.
     * Emits "disconnect" event through the event emitter.
     */
    disconnect() {
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
     * Default implementation of template getter.
     * Can be overridden or rely on this.layout.
     * @returns {string|Function|Node}
     */
    template() {
        return this.layout || '';
    }

    /**
     * Internal rendering engine.
     * Separates static (cached) layouts from dynamic (functional) layouts.
     * Ensures a single root Element is always returned.
     * @returns {Element}
     */
    render() {
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

        /** @type {Node} */
        let template;

        // 2. Resolve content
        if (typeof layout === 'function') {
            // Dynamic: always execute the function. Cannot be cached as a whole.
            const returnValue = layout(this);
            if (returnValue instanceof window.Node) {
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

        if (template.nodeType === window.Node.ELEMENT_NODE) {
            result = /** @type {Element} */ (template);
        } else if (template.nodeType === window.Node.DOCUMENT_FRAGMENT_NODE) {
            const children = Array.from(template.childNodes).filter(
                node =>
                    node.nodeType === window.Node.ELEMENT_NODE ||
                    (node.nodeType === window.Node.TEXT_NODE && node.textContent.trim() !== '')
            );

            if (children.length === 1 && children[0].nodeType === window.Node.ELEMENT_NODE) {
                result = /** @type {Element} */ (children[0]);
            } else {
                result = document.createElement('html-fragment');
                result.appendChild(template);
            }
        } else {
            result = document.createElement('html-fragment');
            result.appendChild(template);
        }

        // 4. Set the data-component-root attribute
        if (this.instanceId && result.getAttribute('data-component-root') !== this.instanceId) {
            result.setAttribute('data-component-root', this.instanceId);
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
        // Validation
        if (!(container instanceof window.Element)) {
            throw new TypeError('Mount target must be a valid DOM Element.');
        }

        const validModes = ['replace', 'append', 'prepend', 'hydrate'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid mount mode "${mode}". Expected: ${validModes.join(', ')}`);
        }

        // Lifecycle & Re-mounting Logic
        // If already connected to this exact container, do nothing.
        // If moving to a DIFFERENT container, we unmount first to clean up.
        if (this.isConnected) {
            if (this.$internals.parentElement === container) return;
            this.unmount();
        }

        this.$internals.mountMode = mode === 'hydrate' ? 'replace' : mode;

        let componentRoot;

        if (mode === 'hydrate') {
            // Check if the container itself is the root
            const isRoot = container.getAttribute('data-component-root') === this.#instanceId;

            if (isRoot) {
                componentRoot = container;
            } else {
                // 2. Otherwise, look inside (as we planned before)
                componentRoot = container.querySelector(
                    `[data-component-root="${this.#instanceId}"]`
                );
            }

            if (!componentRoot) {
                throw new Error(`Hydration failed: Root ${this.#instanceId} not found.`);
            }
        } else {
            // --- STANDARD RENDER PATH ---
            // Get the fresh element from our optimized render()
            componentRoot = this.render();

            // 3. DOM Insertion
            if (mode === 'replace') container.replaceChildren(componentRoot);
            else if (mode === 'append') container.append(componentRoot);
            else if (mode === 'prepend') container.prepend(componentRoot);
        }

        // Finalize Connection
        this.$internals.root = componentRoot;
        this.$internals.parentElement = componentRoot.parentElement;

        this.emit('prepareRender', componentRoot);
        // Connect logic: collects refs, sets up event listeners via AbortController
        this.connect(/** @type {HTMLElement} */ (componentRoot));

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
     * Expands all components in the hierarchy, starting from the current component.
     * If a component is already connected, does nothing.
     * If a component does not have a parent component, does nothing.
     * Otherwise, mounts the component to the parent component's slot.
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

    /* DOM */

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
                if (node.nodeType === window.Node.ELEMENT_NODE) {
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
                window,
            }
        );

        return filteredElements;
    }

    /**
     * Returns an array of elements matching the given tag name, optionally filtered by a CSS selector.
     * If no query selector is given, all elements matching the tag name are returned.
     * If a query selector is given, only elements matching the tag name and the query selector are returned.
     * @param {string} tagName - The tag name to search for.
     * @param {string} [querySelector] - An optional CSS selector to filter the results by.
     * @returns {Element[]} An array of elements matching the tag name and query selector.
     */
    searchElements(tagName, querySelector = '') {
        let elements = this.#getElementsByTagName(tagName);
        if (querySelector === '') {
            return elements;
        } else {
            return elements.filter(el => el.matches(querySelector));
        }
    }
}
