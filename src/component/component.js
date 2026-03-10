// @ts-check

import { checkRefs, selectRefsExtended, walkDomScope } from 'dom-scope';
import { SlotManager } from './slot-manager.js';
import { Internals } from './internals.js';
import { onConnectDefault, onDisconnectDefault, resolveLayout } from './helpers.js';
import { Config } from './config.js';

/**
 * @template {import("dom-scope").RefsAnnotation} [T=any]
 */
export class Component {
    /** @type {Internals} */
    $internals = new Internals();

    /** @type {((component: this) => Node|string)|string|null|Node} */
    layout = null;

    /** @type {import('./types.d.ts').TeleportList} */
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

        this.$internals.instanceId = instanceId || Internals.generateInstanceId();
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

                let slotName = root.getAttribute('data-slot');
                if (slotName) {
                    scopeRefs[slotName] = /** @type {HTMLElement } */ (root);
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
     * @param {import('./types.d.ts').ComponentEvent} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event, callback) {
        return this.$internals.eventEmitter.on(event, callback);
    }

    /**
     * Subscribes to a specified event and automatically unsubscribes after the first trigger.
     * @param {import('./types.d.ts').ComponentEvent} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function.
     * @returns {() => void} A function that can be called to unsubscribe the listener before it triggers.
     */
    once(event, callback) {
        return this.$internals.eventEmitter.once(event, callback);
    }

    /**
     * Emits an event with the given arguments.
     * @param {import('./types.d.ts').ComponentEvent} event - The name of the event to emit.
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

        const sid = this.$internals.sid;

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
            this.$internals.parentElement = componentRoot.parentElement;
            this.$internals.mountMode = 'replace'; // Hydration is logically a replacement of SSR content
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

        this.$internals.parentElement = container;
        this.$internals.mountMode = mode;

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
     * @param {import('./types.d.ts').TeleportConfig} config - Конфигурация конкретного телепорта
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
     * @param {import('./types.d.ts').TeleportConfig} config
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
