// @ts-check

import { checkRefs, selectRefsExtended, walkDomScope } from 'dom-scope';
import { SlotManager } from './slot-manager.js';
import { Internals } from './internals.js';
import { onConnectDefault, onDisconnectDefault, resolveLayout } from './helpers.js';

/**
 * @typedef {(component: Component) => void} _TextUpdateFunction
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
export class Component {
    /** @type {Internals} */
    $internals = new Internals();

    /** @type {((component: this) => Node|string)|string|null|Node} */
    layout = null;

    /**
     * @type {TeleportList}
     */
    teleports = {};

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

    /**
     * Sets the renderer for the component by assigning the template content.
     * This is a synonym for setLayout.
     * @param {((component: this) => Node|string)|string} layout - A function that returns a Node representing the layout.
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

        this.emit('before-update-refs');

        const allRoots =
            this.$internals.additionalRoots.length > 0
                ? [this.$internals.root, ...this.$internals.additionalRoots]
                : [this.$internals.root];

        let { refs, scopeRefs } = selectRefsExtended(allRoots, null, {
            scopeAttribute: ['data-slot', 'data-component-root'],
            refAttribute: 'data-ref',
            window,
        });

        let rootRefs = {};
        for (let i = 0; i < allRoots.length; i++) {
            let root = allRoots[i];
            if (root instanceof Element) {
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

        const result = resolveLayout(layout, this);

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
        if (this.#isCollapsed) return;

        // Validation
        if (!(container instanceof window.Element)) {
            throw new TypeError('Mount target must be a valid DOM Element.');
        }

        const validModes = ['replace', 'append', 'prepend', 'hydrate'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid mount mode "${mode}". Expected: ${validModes.join(', ')}`);
        }

        const isMoving = this.isConnected;

        // 2. Hydration Path
        if (mode === 'hydrate') {
            const componentRoot =
                container.getAttribute('data-component-root') === this.#instanceId
                    ? container
                    : container.querySelector(`[data-component-root="${this.#instanceId}"]`);

            if (!componentRoot) {
                throw new Error(`Hydration failed: Root ${this.#instanceId} not found.`);
            }

            this.$internals.root = componentRoot;
            this.#hydrateTeleports();

            // Standard finalization for hydration
            this.connect(/** @type {HTMLElement} */ (componentRoot));
            this.emit('mount');
            return;
        }

        // 3. Render or Reuse Path
        // If moving, we use the existing root. If new, we call render().
        const componentRoot = isMoving ? this.getRootNode() : this.render();

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
            this.connect(/** @type {HTMLElement} */ (componentRoot));
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

        this.disconnect();

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
        for (let i = 0; i < components.length; i++) {
            components[i].#detachFromParentSlot();
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

    /**
     * @param {string} name - Имя телепорта из объекта teleports
     * @param {TeleportConfig} config - Конфигурация конкретного телепорта
     * @returns {Element}
     */
    #renderTeleport(name, config) {
        const result = resolveLayout(config.layout, this);

        if (this.instanceId) {
            result.setAttribute('data-component-root', this.instanceId);
            result.setAttribute('data-component-teleport', name);
        }

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
        } else if (target instanceof window.Element) {
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
            fragment instanceof window.Element ? fragment : fragment.firstElementChild;

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

        for (const [name, config] of Object.entries(this.teleports)) {
            // Look for the specific teleport signature in the global DOM
            const selector = `[data-component-root="${this.#instanceId}"][data-component-teleport="${name}"]`;
            const existingTeleport = document.querySelector(selector);

            if (existingTeleport) {
                // Found it! Register it exactly like a freshly mounted one
                this.#registerRemoteRoot(name, existingTeleport);
            } else {
                // Fallback: If for some reason SSR missed a teleport, mount it now
                console.warn(`[Hydration] Teleport "${name}" not found in DOM. Mounting manually.`);
                this.#mountTeleport(name, config);
            }
        }
    }
}
