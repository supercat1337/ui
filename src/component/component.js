// @ts-check

import { checkRefs, selectRefsExtended, walkDomScope } from 'dom-scope';
import { SlotManager } from './slot-manager.js';
import { Internals } from './internals.js';
import { onConnectDefault, onDisconnectDefault, resolveLayout } from './helpers.js';
import { Config } from './config.js';
import { UI_COMPONENT_SHEET } from './style.js';

import { updateComponentTreeSid } from './internals/hydration-utils.js';
import { filterElementsByTagName, insertToDOM } from './internals/dom-utils.js';
import {
    prepareTeleportNode,
    findExistingTeleport,
    claimTeleportNode,
} from './internals/teleport-utils.js';
import { createComponentStyleSheet, injectSheet } from './internals/style-utils.js';
import { prepareRenderResult, getCloneFromCache } from './internals/render-utils.js';
import { scanRootsForRefs } from './internals/ref-utils.js';
import { findComponentBySid, collectComponentAncestors } from './internals/tree-utils.js';
import { validateMountArgs, findHydrationRoot } from './internals/mounting-utils.js';

const sharedTemplates = new WeakMap();

/**
 * @template {import("dom-scope").RefsAnnotation} [T=any]
 */
export class Component {
    /** @type {string | CSSStyleSheet | null} */
    static styles = null;
    static _stylesInjected = false;

    /** @type {Internals} */
    $internals = new Internals();

    /**
     * Shared template for all instances of this class.
     * Best for performance as it's cached globally.
     * @type {string|undefined}
     */
    static layout;

    /**
     * Instance-specific layout. Overrides static layout.
     * Use a function for dynamic structures or a string/Node for unique instances.
     * @type {((component: any) => Node|string)|string|null|Node}
     */
    layout = null;

    /** @type {import('./types.d.ts').TeleportList} */
    teleports = {};

    /** @type {T} */
    refsAnnotation;

    #isConnected = false;

    slotManager = new SlotManager(this);

    #isCollapsed = false;

    #cachedElement = null;

    /** @type {Function[]} */
    #disposers = [];

    /**
     * Initializes a new instance of the Component class.
     * @param {Object} [options] - An object with the following optional properties:
     * @param {string} [options.instanceId] - The instance ID of the component. If not provided, a unique ID will be generated.
     * @param {string} [options.sid]
     */
    constructor(options = {}) {
        const { instanceId = null, sid = null } = options;
        this.$internals = new Internals();

        if (instanceId) this.$internals.instanceId = instanceId;

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

    #ensureStylesInjected() {
        const ctor = /** @type {typeof Component} */ (this.constructor);

        if (ctor._stylesInjected) return;

        if (Config.window.document.getElementById('ui-ssr-styles')) {
            ctor._stylesInjected = true;
            return;
        }

        if (ctor.styles) {
            this.#injectStaticStyles(ctor.styles);
        }

        ctor._stylesInjected = true;
    }

    /**
     *
     * @param {string | CSSStyleSheet | null} styles
     * @returns
     */
    #injectStaticStyles(styles) {
        // Use the utility to create the sheet
        const sheet = createComponentStyleSheet(styles, UI_COMPONENT_SHEET, Config.window);

        if (sheet) {
            // Inject it into the global document
            injectSheet(document, sheet);
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

        // 1. Prepare roots
        const allRoots = /** @type {Element[]} */ (
            this.$internals.additionalRoots.length > 0
                ? [this.$internals.root, ...this.$internals.additionalRoots]
                : [this.$internals.root]
        );

        // 2. Delegate "heavy" scanning to pure utility
        const { refs, scopeRefs } = scanRootsForRefs(allRoots, selectRefsExtended, {
            scopeAttribute: ['data-slot', 'data-component-root'],
            refAttribute: 'data-ref',
            window: Config.window,
        });

        // 3. Post-processing (Orchestration)
        for (const key in scopeRefs) {
            this.slotManager.registerSlot(key);
        }

        this.$internals.refs = refs;
        this.$internals.scopeRefs = scopeRefs;

        // 4. Validation
        if (Config.checkRefsFlag && this.refsAnnotation) {
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
     * @param {any} data - The data object to be passed to the event handlers.
     */
    emit(event, data) {
        return this.$internals.eventEmitter.emit(event, data, this);
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
        this.$internals.root = componentRoot;
        this.updateRefs();

        this.$internals.disconnectController = new (
            Config.window.AbortController || AbortController
        )();
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
        this.#runDisposers();
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
        const ctor = /** @type {typeof Component} */ (this.constructor);

        const layout = this.layout || ctor.layout;
        if (!layout) throw new Error('Layout is not defined.');

        const isFunction = typeof layout === 'function';
        const shouldClone = this.$internals.cloneTemplateOnRender;

        if (!isFunction && layout === ctor.layout) {
            let cached = sharedTemplates.get(ctor);
            if (!cached) {
                cached = resolveLayout(layout, this);
                sharedTemplates.set(ctor, cached);
            }
            return /** @type {Element} */ (cached.cloneNode(true));
        }

        if (!isFunction) {
            const cached = getCloneFromCache(this.#cachedElement, shouldClone);
            if (cached) return cached;
        }

        const result = resolveLayout(layout, this);

        prepareRenderResult(result, {
            instanceId: this.instanceId,
            sid: this.$internals.sid,
            isSSR: Config.isSSR,
        });

        // Cache the result ONLY if it was a static layout
        if (!isFunction && shouldClone) {
            this.#cachedElement = result;
            return /** @type {Element} */ (result.cloneNode(true));
        }

        return result;
    }

    /**
     * Mounts the component to a DOM container or hydrates existing HTML.
     * @param {string|HTMLElement|(() => HTMLElement)} container - The target (selector, element, or provider).
     * @param {"replace"|"append"|"prepend"|"hydrate"} mode - The mounting strategy.
     */
    mount(container, mode = 'replace') {
        if (this.isCollapsed) return;

        // Resolve the container to a guaranteed Element before validation
        const resolvedContainer = this.#resolveTarget(container);

        // Validate using the guaranteed Element
        validateMountArgs(resolvedContainer, mode, Config.window);

        if (mode === 'hydrate') {
            return this.#handleHydration(resolvedContainer);
        }

        if (this.isConnected) {
            this.#handleMove(resolvedContainer, mode);
        } else {
            this.#handleInitialMount(resolvedContainer, mode);
        }
    }

    /**
     * @param {Element} container
     */
    #handleHydration(container) {
        this.#ensureStylesInjected();
        const sid = this.$internals.sid;

        if (!sid) throw new Error('Hydration failed: No SID assigned.');

        const root = findHydrationRoot(container, sid);
        if (!root) throw new Error(`Hydration failed: SID "${sid}" not found.`);

        root.removeAttribute('data-sid');
        root.setAttribute('data-component-root', this.instanceId);

        this.$internals.root = root;
        this.$internals.parentElement = root.parentElement;
        this.$internals.mountMode = 'replace';

        this.#applyHydration();
        this.#connect(/** @type {HTMLElement} */ (root));
        this.emit('mount');
    }

    /**
     * @param {Element} container
     * @param {"replace"|"append"|"prepend"} mode
     */
    #handleInitialMount(container, mode) {
        const root = this.#render();

        if (mode === 'replace') container.replaceChildren(root);
        else if (mode === 'append') container.append(root);
        else if (mode === 'prepend') container.prepend(root);

        this.$internals.root = root;
        this.$internals.parentElement = container;
        this.$internals.mountMode = mode;

        this.#ensureStylesInjected();
        this.#mountTeleports();
        this.emit('prepareRender', root);
        this.#connect(/** @type {HTMLElement} */ (root));
        this.emit('mount');
    }

    /**
     * @param {Element} container
     * @param {"replace"|"append"|"prepend"} mode
     */
    #handleMove(container, mode) {
        const root = this.getRootNode();

        if (mode === 'replace') container.replaceChildren(root);
        else if (mode === 'append') container.append(root);
        else if (mode === 'prepend') container.prepend(root);

        this.$internals.parentElement = container;
        this.$internals.mountMode = mode;
        this.emit('move', { to: container });
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
        this.$internals.root = null;

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
     */
    expand() {
        this.#isCollapsed = false;

        // 1. If already connected, nothing to do
        if (this.#isConnected) return;

        const parent = this.$internals.parentComponent;

        // 2. Delegate to specific resolution logic
        const target = parent ? this.#resolveSlotTarget(parent) : this.#resolveStandaloneTarget();

        if (!target) return;

        // 3. Perform the mount and notify
        this.mount(target, this.$internals.mountMode);
        this.emit('expand');
    }

    /**
     * Resolves the target element for a standalone component.
     * @returns {HTMLElement|null}
     */
    #resolveStandaloneTarget() {
        const el = this.$internals.parentElement;

        if (!el) {
            console.warn('[Expand] Cannot expand: no parent element specified.');
            return null;
        }

        if (!el.isConnected) {
            console.warn('[Expand] Cannot expand: parent element is disconnected from DOM.');
            return null;
        }

        return /** @type {HTMLElement} */ (el);
    }

    /**
     * Resolves the target slot in a parent component.
     * @param {Component} parent
     * @returns {HTMLElement|null}
     */
    #resolveSlotTarget(parent) {
        if (!parent.isConnected) {
            console.warn('[Expand] Cannot expand: parent component is not connected.');
            return null;
        }

        const slotName = this.$internals.assignedSlotName;
        const slotRef = parent.$internals.scopeRefs[slotName];

        if (!slotRef) {
            console.warn(`[Expand] Cannot find slot "${slotName}" in parent component.`);
            return null;
        }

        return slotRef;
    }

    /**
     * Forces the expansion of the entire component hierarchy from the current node up to the root.
     * Use this when you need to ensure a specific nested component is visible,
     * even if its ancestors were previously collapsed.
     */
    expandForce() {
        /** @type {Component[]} */
        const ancestors = collectComponentAncestors(this);

        for (let i = ancestors.length - 1; i >= 0; i--) {
            ancestors[i].expand();
        }
    }

    /**
     * Registers a cleanup function to be executed when the component is unmounted.
     * * This is the recommended way to manage third-party resources (like MobX disposers,
     * timers, or external library instances) to ensure they are properly cleaned up
     * without manually overriding `disconnectedCallback`.
     *
     * @param {() => void} fn - The cleanup function to register.
     * @example
     * connectedCallback() {
     * // Example: Auto-cleanup for a timer
     * const timerId = setInterval(() => this.tick(), 1000);
     * this.addDisposer(() => clearInterval(timerId));
     * * // Example: Auto-cleanup for a third-party library
     * const chart = new Chart(this.getRefs().canvas, config);
     * this.addDisposer(() => chart.destroy());
     * }
     */
    addDisposer(fn) {
        if (typeof fn === 'function') {
            this.#disposers.push(fn);
        }
    }

    #runDisposers() {
        this.#disposers.forEach(dispose => {
            try {
                dispose();
            } catch (e) {
                console.error(`Error in disposer:`, e);
            }
        });
        this.#disposers = [];
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
     * Clears the given slot name of all its children components.
     * This method first removes all children components of the given slot name from the component,
     * then unmounts them and finally removes them from the component's internal maps.
     * @param {string} slotName - The name of the slot to clear.
     * @returns {boolean} True if the slot was cleared, false otherwise.
     */
    clearSlotContent(slotName) {
        return this.slotManager.clearSlotContent(slotName);
    }

    /**
     * Checks if the given slot name has any children components associated with it.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot has children components, false otherwise.
     */
    hasSlotContent(slotName) {
        return this.slotManager.hasSlotContent(slotName);
    }

    /**
     * Detaches a component from the slot.
     * @returns {boolean}
     */
    detachFromSlot() {
        let oldParentComponent = this.parentComponent;
        if (oldParentComponent && this.$internals.assignedSlotName) {
            //let slot = oldParentComponent.slotManager.findSlotByComponent(this);
            let slot = oldParentComponent.slotManager.getSlot(this.$internals.assignedSlotName);
            if (!slot) return false;

            return slot.detach(this);
        }
        return false;
    }

    /**
     * Returns a slot element
     * @param {string} slotName
     * @returns {HTMLElement|null}
     */
    getSlotElement(slotName) {
        return this.slotManager.getSlotElement(slotName);
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {Component|Component[]} componentOrComponents - The component to add to the slot.
     * @param {"append"|"replace"|"prepend"} [mode="append"]
     * @returns {Component<T>}
     * @throws {Error} If the slot does not exist.
     */
    addToSlot(slotName, componentOrComponents, mode = 'append') {
        /** @type {Component[]} */
        const components = Array.isArray(componentOrComponents)
            ? componentOrComponents
            : [componentOrComponents];

        const validModes = new Set(['append', 'replace', 'prepend']);
        if (!validModes.has(mode)) mode = 'append';

        const oldLength = this.slotManager.getSlotLength(slotName);
        const slot = this.slotManager.attachToSlot(slotName, components, mode);

        const parentSid = this.$internals.sid;
        if (parentSid) {
            const allComponents = slot.getComponents();
            let startIndex = 0;

            if (mode === 'append') {
                startIndex = oldLength;
            }

            for (let i = startIndex; i < allComponents.length; i++) {
                const child = allComponents[i];
                const newSid = `${parentSid}.${slotName}.${i}`;
                this.#recursiveUpdateSid(child, newSid);
            }
        }

        if (this.#isConnected) {
            if (mode == 'replace') {
                slot.unmount();
                slot.mount();
            } else {
                const slotRoot = this.slotManager.getSlotElement(slotName);
                if (!slotRoot) {
                    console.warn(`Slot root for "${slotName}" not found, cannot mount children`);
                    return this;
                }

                if (mode == 'append') {
                    for (let i = 0; i < components.length; i++) {
                        let child = components[i];
                        child.mount(slotRoot, 'append');
                    }
                } else if (mode == 'prepend') {
                    for (let i = components.length - 1; i >= 0; i--) {
                        let child = components[i];
                        child.mount(slotRoot, 'prepend');
                    }
                }
            }
        }

        return this;
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

        return filterElementsByTagName(this.$internals.root, tagName, walkDomScope, {
            scopeAttribute: ['data-slot', 'data-component-root'],
            refAttribute: 'data-ref',
            window: Config.window,
        });
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
     * @param {string} name - teleport name
     * @param {import('./types.d.ts').TeleportConfig} config - teleport config
     * @returns {Element}
     */
    #renderTeleport(name, config) {
        const result = resolveLayout(config.layout, this);

        prepareTeleportNode(result, name, this.$internals.sid, this.instanceId);

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

        // Resolve the target to a guaranteed HTMLElement
        const resolvedTarget = this.#resolveTarget(config.target);

        // Now #insertToDOM only deals with Element and Fragment
        const rootElement = this.#insertToDOM(fragment, resolvedTarget, config.strategy);
        this.#registerRemoteRoot(name, rootElement);
    }

    /**
     * Resolves a target (string, function, or Element) into a guaranteed HTMLElement.
     * @param {any} target
     * @returns {HTMLElement}
     * @throws {Error}
     */
    #resolveTarget(target) {
        let element = null;

        if (typeof target === 'function') {
            element = target.call(this);
        } else if (typeof target === 'string') {
            element = document.querySelector(target);
        } else if (target instanceof Config.window.Element) {
            element = target;
        }

        if (!element) {
            throw new Error(`[Mounting Error] Target element not found for: ${target}`);
        }

        return element;
    }

    /**
     * Mounts a fragment or element into a specified target using a given strategy.
     * @param {Element|DocumentFragment} fragment - The content to insert (result of resolveLayout).
     * @param {HTMLElement} target - The destination: element, selector, or provider function.
     * @param {"prepend"|"append"|"replace"} [strategy="append"] - The insertion strategy.
     * @returns {Element|null} The root element of the inserted content.
     */
    #insertToDOM(fragment, target, strategy = 'append') {
        // We can still keep a small safety check, but the heavy lifting is done in #resolveTarget
        return insertToDOM(fragment, target, strategy, Config.window);
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
        if (!this.teleports || !this.$internals.sid) return;

        for (const [name, config] of Object.entries(this.teleports)) {
            const existing = findExistingTeleport(document, this.$internals.sid, name);

            if (existing) {
                claimTeleportNode(existing, this.instanceId);
                this.#registerRemoteRoot(name, existing);
            } else {
                console.warn(`[Hydration] Teleport "${name}" not found. Falling back to mount.`);
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
        updateComponentTreeSid(component, newSid, {
            onUpdateSid: (comp, sid) => {
                comp.$internals.sid = sid;
            },
            onApplyHydration: comp => {
                comp.#applyHydration();
            },
            getSlots: comp => {
                return comp.slotManager.getSlots();
            },
        });
    }

    /**
     * Finds a nested component by its string SID.
     * @param {string} targetSid - The SID to search for.
     * @returns {Component|null}
     */
    getComponentBySid(targetSid) {
        return findComponentBySid(this, targetSid);
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
