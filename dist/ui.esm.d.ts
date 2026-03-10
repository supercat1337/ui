/**
 * Valid lifecycle events for the Component class.
 */
export type ComponentLifecycleEvent = 
    | "connect" 
    | "disconnect" 
    | "mount" 
    | "unmount" 
    | "prepareRender" 
    | "collapse" 
    | "expand" 
    | "restore";

/**
 * Represents a component event name. 
 * Includes standard lifecycle events and allows custom string events with IDE autocomplete support.
 */
export type ComponentEvent = ComponentLifecycleEvent | (string & {});

/**
 * Strategy for inserting teleported content.
 */
export type TeleportStrategy = "append" | "prepend" | "replace";

/**
 * Configuration for a teleported fragment.
 */
export interface TeleportConfig {
    /** A function that returns a markup fragment for teleportation. */
    layout: () => DocumentFragment;
    /** A target element, selector, or function that returns an element. */
    target: Element | string | (() => Element | null);
    /** Insertion strategy (default is "append"). */
    strategy?: TeleportStrategy;
}

/**
 * A map of teleport names to their configurations.
 */
export type TeleportList = Record<string, TeleportConfig>;

/**
 * Serialized component data used for SSR and hydration.
 */
export interface ComponentMetadata {
    /** The constructor name for class instantiation. */
    className: string;
    /** Serialized state from component.serialize(). */
    data: any;
    /** Map of slot names to arrays of child instance IDs. */
    slots: Record<string, string[]>;
}

/**
 * Function responsible for updating text nodes within the component.
 */
export type TextUpdateFunction = (component: any) => void;

/**
 * Options for the Component constructor.
 */
export interface ComponentOptions {
    instanceId?: string;
    sid?: string;
    [key: string]: any; // Allow for custom state initialization
}

/**
 * Internal state and controllers.
 */
export interface Internals {
    instanceId: string;
    sid: string | null;
    eventEmitter: any; // Ideally import { EventEmitter } from '@supercat1337/event-emitter'
}

/**
 * Interface for DOM references annotation.
 */
export type RefsAnnotation = Record<string, any>;

/**
 * @template {import("dom-scope").RefsAnnotation} [T=any]
 */
export class Component<T extends import("dom-scope").RefsAnnotation = any> {
    /**
     * Initializes a new instance of the Component class.
     * @param {Object} [options] - An object with the following optional properties:
     * @param {string} [options.instanceId] - The instance ID of the component. If not provided, a unique ID will be generated.
     * @param {string} [options.sid]
     */
    constructor(options?: {
        instanceId?: string;
        sid?: string;
    });
    /** @type {Internals} */
    $internals: Internals;
    /** @type {((component: this) => Node|string)|string|null|Node} */
    layout: ((component: this) => Node | string) | string | null | Node;
    /** @type {TeleportList} */
    teleports: any;
    /** @type {T} */
    refsAnnotation: T;
    slotManager: SlotManager;
    /** @returns {string} */
    get instanceId(): string;
    /**
     * Checks if the component is connected to a root element.
     * @returns {boolean} True if the component is connected, false otherwise.
     */
    get isConnected(): boolean;
    /**
     * Triggers the text update logic by calling the registered text update function.
     * Use this to refresh translated strings, plural forms, or formatted labels
     * without rerendering the entire component structure.
     */
    reloadText(): void;
    /**
     * Registers a specialized function responsible for updating text nodes within the component.
     * This is particularly useful for i18n (internationalization) or when specific labels
     * depend on multiple state variables.
     * * @param {((component: this) => void) | null} func - The function to be called by `reloadText()`.
     */
    setTextUpdateFunction(func: ((component: this) => void) | null): void;
    /**
     * Sets the layout of the component by assigning the template content.
     * @param {((component: this) => Node|string)|string} layout - A function that returns a Node representing the layout.
     * @param {T} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setLayout(layout: ((component: this) => Node | string) | string, annotation?: T): void;
    /**
     * Returns the refs object.
     * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
     * The refs object is only available after the component has been connected to the DOM.
     * @returns {typeof this["refsAnnotation"]}
     */
    getRefs(): (typeof this)["refsAnnotation"];
    /**
     * Checks if a ref with the given name exists.
     * @param {string} refName - The name of the ref to check.
     * @returns {boolean} True if the ref exists, false otherwise.
     */
    hasRef(refName: string): boolean;
    /**
     * Manually rescans the component's DOM tree to update the `refs` object.
     * While this is called automatically during mounting and hydration, you should
     * call it manually if you've dynamically injected new HTML containing `data-ref`
     * attributes (e.g., via innerHTML) to ensure `getRefs()` returns the latest elements.
     * * @throws {Error} If the component is not currently connected to the DOM.
     * @returns {void}
     */
    updateRefs(): void;
    serialize(): {};
    /**
     * Subscribes to a specified event.
     * @param {ComponentEvent} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event: any, callback: Function): () => void;
    /**
     * Subscribes to a specified event and automatically unsubscribes after the first trigger.
     * @param {ComponentEvent} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function.
     * @returns {() => void} A function that can be called to unsubscribe the listener before it triggers.
     */
    once(event: any, callback: Function): () => void;
    /**
     * Emits an event with the given arguments.
     * @param {ComponentEvent} event - The name of the event to emit.
     * @param {...any} args - The arguments to be passed to the event handlers.
     */
    emit(event: any, ...args: any[]): void;
    /**
     * Attaches an event listener to the specified element.
     * The event listener is automatically removed when the component is unmounted.
     * @param {HTMLElement|Element} element - The element to attach the event listener to.
     * @param {keyof HTMLElementEventMap} event - The name of the event to listen to.
     * @param {EventListenerOrEventListenerObject} callback - The function to be called when the event is triggered.
     * @returns {() => void} A function that can be called to remove the event listener.
     */
    $on(element: HTMLElement | Element, event: keyof HTMLElementEventMap, callback: EventListenerOrEventListenerObject): () => void;
    /**
     * This method is called when the component is connected to the DOM.
     * It is an empty method and is intended to be overridden by the user.
     * @memberof Component
     */
    connectedCallback(): void;
    /**
     * This method is called when the component is disconnected from the DOM.
     * It is an empty method and is intended to be overridden by the user.
     * @memberof Component
     */
    disconnectedCallback(): void;
    /**
     * Called automatically during the hydration process to restore the component's state.
     * This method receives data serialized by `serialize()` on the server.
     * Use this to synchronize your internal `this.state` with server-provided data
     * before the component becomes interactive in the DOM.
     * * @param {any} data - The plain object retrieved from the hydration manifest (window.__HYDRATION_DATA__).
     * @returns {void}
     */
    restoreCallback(data: any): void;
    /**
     * Mounts the component to a DOM container or hydrates existing HTML.
     * @param {Element} container - The target DOM element (the "hole").
     * @param {"replace"|"append"|"prepend"|"hydrate"} mode - The mounting strategy.
     */
    mount(container: Element, mode?: "replace" | "append" | "prepend" | "hydrate"): void;
    /**
     * Unmounts the component from the DOM.
     * Emits "beforeUnmount" and "unmount" events through the event emitter.
     * Disconnects the component from the DOM and removes the root element.
     */
    unmount(): void;
    /**
     * Rerenders the component.
     * If the component is connected, it unmounts and mounts the component again.
     * If the component is not connected, it mounts the component to the parent component's slot.
     */
    rerender(): void;
    /**
     * Returns whether the component is currently in a collapsed state (replaced by a placeholder).
     * @returns {boolean}
     */
    get isCollapsed(): boolean;
    /**
     * Collapses the component by replacing its DOM content with a lightweight placeholder.
     * Unlike `unmount()`, this state is tracked by `isCollapsed`, allowing the component
     * to remember its exact position in the DOM tree for future restoration.
     */
    collapse(): void;
    /**
     * Re-mounts a collapsed component back into its original DOM position.
     * If the parent component is also collapsed, this may not result in immediate
     * visibility unless `expandForce()` is used.
     */
    expand(): void;
    /**
     * Forces the expansion of the entire component hierarchy from the current node up to the root.
     * Use this when you need to ensure a specific nested component is visible,
     * even if its ancestors were previously collapsed.
     */
    expandForce(): void;
    /**
     * Returns an array of the slot names defined in the component.
     * @returns {string[]}
     */
    getSlotNames(): string[];
    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The component to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentToSlot(slotName: string, ...components: Component[]): void;
    /**
     * Returns the parent component of the current component, or null if the current component is a root component.
     * @returns {Component | null} The parent component of the current component, or null if the current component is a root component.
     */
    get parentComponent(): Component | null;
    /**
     * Returns the root node of the component.
     * This is the node that the component is mounted to.
     * @returns {HTMLElement} The root node of the component.
     */
    getRootNode(): HTMLElement;
    /**
     * Removes an element from the DOM when the component is unmounted.
     * The element is stored in an internal set and removed from the DOM when the component is unmounted.
     * @param {...Element} elements - The elements to remove from the DOM when the component is unmounted.
     */
    removeOnUnmount(...elements: Element[]): void;
    /**
     * Returns an array of elements matching the given tag name within the component's scope.
     * Unlike standard querySelectorAll, this method respects component boundaries:
     * it ignores elements that belong to nested child components.
     * * @param {string} tagName - The tag name to search for (e.g., 'li', 'div').
     * @param {string} [querySelector] - An optional CSS selector to further filter the results.
     * @returns {Element[]} An array of elements belonging ONLY to the current component level.
     */
    queryLocal(tagName: string, querySelector?: string): Element[];
    /**
     * Finds a nested component by its string SID.
     * @param {string} targetSid - The SID to search for.
     * @returns {Component|null}
     */
    getComponentBySid(targetSid: string): Component | null;
    /**
     * Retrieves hydration data for this specific component instance from the global manifest.
     * Useful for accessing server-provided state BEFORE the component is mounted or hydrated.
     * While `restoreCallback` is triggered automatically during `mount('hydrate')`,
     * this method allows manual data retrieval at any time after instantiation.
     * @returns {any | null}
     */
    getHydrationData(): any | null;
    #private;
}
export const Config: ConfigManager;
/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 * @param {Document} [doc=window.document] - The document object to check the ready state of.
 */
export function DOMReady(callback: () => void, doc?: Document): void;
export class SlotToggler {
    /**
     * Creates a new instance of SlotToggler.
     * @param {Component} component - The component that owns the slots.
     * @param {string[]} slotNames - The names of the slots.
     * @param {string} activeSlotName - The name of the slot that is currently active.
     */
    constructor(component: Component, slotNames: string[], activeSlotName: string);
    /** @type {Component} */
    component: Component;
    get slotNames(): string[];
    get activeSlotName(): string;
    init(): void;
    /**
     * Toggles the active slot to the given slot name.
     * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
     * @param {string} slotName - The name of the slot to toggle to.
     */
    /**
     * Toggles the active slot to the given slot name.
     * @param {string} slotName - The name of the slot to activate.
     */
    toggle(slotName: string): void;
    destroy(): void;
    #private;
}
export class Toggler {
    /** @type {Map<string, { isActive: boolean, on: (itemName:string) => void, off: (itemName:string) => void }>} */
    items: Map<string, {
        isActive: boolean;
        on: (itemName: string) => void;
        off: (itemName: string) => void;
    }>;
    /**
     * Adds an item to the toggler.
     * @param {string} itemName - The name of the item to be added.
     * @param {(itemName:string) => void} on - The function to be called when the item is set as active.
     * @param {(itemName:string) => void} off - The function to be called when the item is set as inactive.
     */
    addItem(itemName: string, on: (itemName: string) => void, off: (itemName: string) => void): void;
    /**
     * Removes the item with the given name from the toggler.
     * @param {string} itemName - The name of the item to be removed.
     */
    removeItem(itemName: string): void;
    /**
     * Sets the active item to the given item name.
     * @param {string} active - The name of the item to be set as active.
     * @throws {Error} If the item does not exist in the toggler.
     */
    setActive(active: string): void;
    /**
     * Runs the callbacks for all items in the toggler.
     * If an item is active, the "on" callback is called with the item name as the argument.
     * If an item is inactive, the "off" callback is called with the item name as the argument.
     */
    runCallbacks(): void;
    /**
     * Initializes the toggler with the given active item name.
     * Sets the active item to the given item name and runs the callbacks for all items in the toggler.
     * @param {string} active - The name of the item to be set as active.
     */
    init(active: string): void;
    #private;
}
/**
 * Copies the given text to the clipboard using the Clipboard API.
 * @param {string} text - The text to be copied to the clipboard.
 * @returns {Promise<void>} A promise that resolves when the text has been successfully copied.
 */
export function copyToClipboard(text: string): Promise<void>;
/**
 * Creates an HTMLScriptElement containing the hydration manifest.
 * Useful for DOM-based environments or JSDOM on the server.
 * * @param {Record<string, ComponentMetadata>} manifest - The hydration map.
 * @param {string} variableName - Global variable name (default: __HYDRATION_DATA__).
 * @returns {HTMLScriptElement}
 */
export function createManifestScript(manifest: Record<string, any>, variableName?: string): HTMLScriptElement;
/**
 * Creates an array of page numbers to be displayed in a pagination list.
 * @param {number} current
 * @param {number} total
 * @param {number} delta
 * @param {string} [gap]
 * @returns {string[]}
 */
export function createPaginationArray(current: number, total: number, delta?: number, gap?: string): string[];
/**
 * Creates a wrapper around a Storage object (localStorage or sessionStorage)
 * with automatic JSON serialization and change subscription.
 *
 * @param {Storage} storage - The storage object to wrap (e.g. localStorage, sessionStorage).
 * @returns {{
 *   get: (key: string) => any,
 *   set: (key: string, value: any) => void,
 *   remove: (key: string) => void,
 *   clear: () => void,
 *   on: (key: string, callback: (newValue: any, oldValue: any) => void) => () => void
 * }} An object with storage methods.
 */
export function createStorage(storage: Storage): {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
    clear: () => void;
    on: (key: string, callback: (newValue: any, oldValue: any) => void) => () => void;
};
/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @template {Function} T
 * @param {T} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @param {boolean} [immediate=false] - Whether to invoke the function on the leading edge instead of the trailing.
 * @returns {T & { cancel(): void }} A new debounced function with a `cancel` method.
 */
export function debounce<T extends Function>(func: T, wait: number, immediate?: boolean): T & {
    cancel(): void;
};
/**
 * Attaches a listener to an event on the given ancestor element that targets the given target element selector.
 * @param {string} eventType
 * @param {Element} ancestorElement
 * @param {string} targetElementSelector
 * @param {*} listenerFunction
 */
export function delegateEvent(eventType: string, ancestorElement: Element, targetElementSelector: string, listenerFunction: any): void;
/**
 * Escapes the given string from HTML interpolation.
 * Replaces the characters &, <, ", and ' with their corresponding HTML entities.
 * @param {string} unsafe - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHtml(unsafe: string): string;
/**
 * Fades in the given element with the given duration.
 * The element is set to be block level and its opacity is set to 0.
 * The function then repeatedly adjusts the opacity of the element until it is 1.
 * The time between each adjustment is the given duration.
 * @param {HTMLElement} element - The element to fade in.
 * @param {number} [duration=400] - The duration of the fade in in milliseconds.
 * @param {Window} [wnd=window] - The window object to use for the requestAnimationFrame method.
 */
export function fadeIn(element: HTMLElement, duration?: number, wnd?: Window): void;
/**
 * Fades out the given element with the given duration.
 * The element is set to be block level and its opacity is set to 1.
 * The function then repeatedly adjusts the opacity of the element until it is 0.
 * The time between each adjustment is the given duration.
 * @param {HTMLElement} element - The element to fade out.
 * @param {number} [duration=400] - The duration of the fade out in milliseconds.
 * @param {Window} [wnd=window] - The window object to use for the requestAnimationFrame method.
 */
export function fadeOut(element: HTMLElement, duration?: number, wnd?: Window): void;
/**
 * Formats the given number of bytes into a human-readable string.
 *
 * @param {number} bytes - The number of bytes to be formatted.
 * @param {number} [decimals] - The number of decimal places to be used in the formatted string. Defaults to 2.
 * @param {string} [lang] - The language to be used for the size units in the formatted string. Defaults to the user's default language.
 * @param {{[key:string]: string[]}} [sizes] - An object containing the size units to be used in the formatted string. Defaults to the IEC standard units.
 * @returns {string} A human-readable string representation of the given number of bytes, in the form of a number followed by a unit of measurement (e.g. "3.5 KB", "1.2 GB", etc.).
 */
export function formatBytes(bytes: number, decimals?: number, lang?: string, sizes?: {
    [key: string]: string[];
}): string;
/**
 * Formats the given timestamp into a human-readable string representation of
 * a date. The date is formatted according to the user's locale.
 * @param {number} unix_timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date.
 */
export function formatDate(unix_timestamp: number): string;
/**
 * Formats the given timestamp into a human-readable string representation of
 * a date and time. The date is formatted according to the user's locale, and
 * the time is formatted according to the user's locale with a 24-hour clock.
 * @param {number} unix_timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date and time.
 */
export function formatDateTime(unix_timestamp: number): string;
/**
 * Generates a flat map of the component tree for SSR hydration.
 * * @param {...Component} rootComponents - The starting root components of the tree.
 * @returns {Record<string, ComponentMetadata>} A flat dictionary of component metadata indexed by instanceId.
 */
export function generateManifest(...rootComponents: Component[]): Record<string, any>;
/**
 * Returns the user's default language, or "en" if none can be determined.
 * @returns {string} The user's default language, in the form of a two-letter
 *   language code (e.g. "en" for English, "fr" for French, etc.).
 */
export function getDefaultLanguage(): string;
/**
 * Adds the "d-none" class to the given elements, hiding them from view.
 * @param {...HTMLElement} elements - The elements to hide.
 */
export function hideElements(...elements: HTMLElement[]): void;
/**
 * Creates a DocumentFragment from a template string.
 * Supports arrays, SafeHTML objects, and automatic escaping of untrusted values.
 * * @param {TemplateStringsArray} strings - Template strings from the tagged template.
 * @param {...any} values - Values to interpolate.
 * @returns {DocumentFragment}
 */
/**
 * Creates a DocumentFragment from a template string or a tagged template.
 * High-performance: uses <template> and handles arrays/SafeHTML.
 * * @param {TemplateStringsArray | string} strings - Template strings array or a single string.
 * @param {...any} values - Values to interpolate.
 * @returns {DocumentFragment}
 */
export function html(strings: TemplateStringsArray | string, ...values: any[]): DocumentFragment;
/**
 * Injects the core CSS styles into the document.
 * The core styles include support for the "d-none" class, which is commonly used in Bootstrap to hide elements.
 * The core styles also include support for the "html-fragment" element, which is used as a container for HTML fragments.
 * @param {Document|null} [doc=window.document] - The document to inject the styles into. Defaults to the global document.
 * @returns {void}
 */
export function injectCoreStyles(doc?: Document | null): void;
/**
 * Checks if the user prefers a dark color scheme.
 * Utilizes the `window.matchMedia` API to determine if the user's
 * system is set to a dark mode preference.
 * @returns {boolean} - Returns `true` if the user prefers dark mode, otherwise `false`.
 */
export function isDarkMode(wnd?: Window & typeof globalThis): boolean;
export const local: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
    clear: () => void;
    on: (key: string, callback: (newValue: any, oldValue: any) => void) => () => void;
};
/**
 * Sets up a listener that calls a callback when a click occurs outside the specified element.
 *
 * @param {Element} element - The DOM element to detect outside clicks for.
 * @param {(event: MouseEvent) => void} callback - Function to call when an outside click is detected.
 * @returns {() => void} A function that removes the event listener.
 */
export function onClickOutside(element: Element, callback: (event: MouseEvent) => void): () => void;
/**
 * Removes the spinner from the given button.
 * @param {HTMLButtonElement} button - The button which should have its spinner removed.
 */
export function removeSpinnerFromButton(button: HTMLButtonElement): void;
/**
 * Alternative for pure string-based SSR (Node.js without JSDOM)
 * @param {Record<string, ComponentMetadata>} manifest
 * @param {string} variableName
 * @returns {string}
 */
export function renderManifestHTML(manifest: Record<string, any>, variableName?: string): string;
/**
 * Renders a pagination list with the given parameters.
 * @param {number} currentPageNumber - The current page number.
 * @param {number} totalPages - The total number of pages.
 * @param {(page:number)=>string} [itemUrlRenderer] - The function to generate the URL for each page item.
 * @param {(page:number)=>void|boolean} [onClickCallback] - The callback function to be called when a page item is clicked.
 * @returns {HTMLUListElement} - The rendered pagination list.
 */
export function renderPaginationElement(currentPageNumber: number, totalPages: number, itemUrlRenderer?: (page: number) => string, onClickCallback?: (page: number) => void | boolean): HTMLUListElement;
/**
 * Scrolls the specified element to the bottom.
 * Sets the scrollTop property to the element's scrollHeight,
 * effectively scrolling to the bottom of the content.
 * @param {HTMLElement} element - The element to scroll to the bottom.
 */
export function scrollToBottom(element: HTMLElement): void;
/**
 * Scrolls the specified element to the top.
 * Sets the scrollTop property to 0, effectively
 * scrolling to the top of the content.
 * @param {HTMLElement} element - The element to scroll to the top.
 */
export function scrollToTop(element: HTMLElement): void;
export const session: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
    clear: () => void;
    on: (key: string, callback: (newValue: any, oldValue: any) => void) => () => void;
};
/**
 * Removes the "d-none" class from the given elements, making them visible.
 * @param {...HTMLElement} elements - The elements to show.
 */
export function showElements(...elements: HTMLElement[]): void;
/**
 * Adds a spinner to the button (if it doesn't already have one).
 * The spinner is prepended to the button's contents.
 * @param {HTMLButtonElement} button - The button to add the spinner to.
 * @param {string|null} [customClassName] - The class name to use for the spinner.
 *                                      If not provided, 'spinner-border spinner-border-sm' is used.
 * @param {Document} [doc=window.document] - The document object to create the spinner element in.
 */
export function showSpinnerInButton(button: HTMLButtonElement, customClassName?: string | null, doc?: Document): void;
/**
 * Sleeps for the given number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep for.
 * @returns {Promise<void>} A promise that resolves when the sleep is over.
 */
export function sleep(ms: number): Promise<void>;
/**
 * Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds.
 *
 * @template {Function} T
 * @param {T} func - The function to throttle.
 * @param {number} wait - The number of milliseconds to throttle invocations to.
 * @param {Object} [options] - Options object.
 * @param {boolean} [options.leading=true] - Whether to invoke on the leading edge.
 * @param {boolean} [options.trailing=true] - Whether to invoke on the trailing edge.
 * @returns {T & { cancel(): void }} A new throttled function with a `cancel` method.
 */
export function throttle<T extends Function>(func: T, wait: number, options?: {
    leading?: boolean;
    trailing?: boolean;
}): T & {
    cancel(): void;
};
/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button.
 */
export function ui_button_status_waiting_off(el: HTMLButtonElement, text: string): void;
/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner)
 * and sets its innerHTML to the given HTML string.
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} html - The HTML string to be set as the button's innerHTML.
 */
export function ui_button_status_waiting_off_html(el: HTMLButtonElement, html: string): void;
/**
 * Sets the status of the button to "waiting" (i.e. disabled and showing a spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button while it is waiting.
 */
export function ui_button_status_waiting_on(el: HTMLButtonElement, text: string): void;
/**
 * Generates a unique ID with an optional prefix.
 *
 * @param {string} [prefix=''] - The prefix to prepend to the ID.
 * @returns {string} The generated unique ID.
 */
export function uniqueId(prefix?: string): string;
/**
 * Returns the current Unix time in seconds.
 * @param {Date} [dateObject=new Date()] - The date object to get the Unix time from. Defaults to the current date and time.
 * @returns {number}
 */
export function unixtime(dateObject?: Date): number;
/**
 * Marks a string as safe HTML to avoid escaping.
 * @param {string} html
 * @returns {SafeHTML}
 */
export function unsafeHTML(html: string): SafeHTML;
/**
 * Ensures that a promise resolves or rejects after at least the given minimum time has elapsed.
 * If the promise resolves or rejects before the minimum time has elapsed, the result or error is stored and
 * the promise returned by this function resolves or rejects with the stored result or error when the minimum time has elapsed.
 * @param {Promise<T>} promise - The promise to wait for.
 * @param {number} minTime - The minimum time to wait in milliseconds.
 * @template T
 * @returns {Promise<T>} A promise that resolves or rejects after at least the given minimum time has elapsed.
 */
export function withMinimumTime<T>(promise: Promise<T>, minTime: number): Promise<T>;
declare class Internals {
    /** @type {number} */
    static "__#private@#instanceIdCounter": number;
    static "__#private@#sessionPrefix": string;
    /**
     * Generates a unique instance ID.
     * @returns {string} The unique instance ID.
     */
    static generateInstanceId(): string;
    /** * The server-side identifier used for hydration.
     * @type {string|null}
     */
    sid: string | null;
    /**
     * Allows manual override of the instanceId.
     * @param {string} value
     */
    set instanceId(value: string);
    /**
     * Lazy getter for the instanceId.
     * Generates a unique ID only when first requested.
     */
    get instanceId(): string;
    /** @type {EventEmitter<any>} */
    eventEmitter: EventEmitter<any>;
    /** @type {AbortController} */
    disconnectController: AbortController;
    /** @type {Element|null} */
    root: Element | null;
    /** @type {TextUpdateFunction|null} */
    textUpdateFunction: any | null;
    /** @type {Record<string, any>} */
    textResources: Record<string, any>;
    /** @type {Record<string, HTMLElement>} */
    refs: Record<string, HTMLElement>;
    /** @type {Record<string, HTMLElement>} */
    scopeRefs: Record<string, HTMLElement>;
    /** @type {Component|null} */
    parentComponent: Component | null;
    /** @type {string} */
    assignedSlotName: string;
    /** @type {"replace"|"append"|"prepend"|"hydrate"} */
    mountMode: "replace" | "append" | "prepend" | "hydrate";
    /** @type {boolean} */
    cloneTemplateOnRender: boolean;
    /** @type {Element|null} */
    parentElement: Element | null;
    /** @type {Set<Element>} */
    elementsToRemove: Set<Element>;
    /** @type {Map<string, Element>} */
    teleportRoots: Map<string, Element>;
    /** @type {import('dom-scope').ScopeRoot[]} */
    additionalRoots: import("dom-scope").ScopeRoot[];
    /** @type {boolean} */
    isHydrated: boolean;
    #private;
}
declare class SlotManager {
    /**
     * @param {Component} component
     */
    constructor(component: Component);
    /** @type {Map<string, Slot>} */
    slots: Map<string, Slot>;
    /**
     * Adds a slot to the component.
     * This method is used to programmatically add a slot to the component.
     * If the slot already exists, it is returned as is.
     * Otherwise, a new slot is created and added to the component's internal maps.
     * @param {string} slotName - The name of the slot to add.
     * @returns {Slot} Returns the slot.
     */
    registerSlot(slotName: string): Slot;
    /**
     * @param {string} slotName
     * @returns {Slot | null}
     */
    getSlot(slotName: string): Slot | null;
    /**
     *
     * @param {string} slotName
     * @returns {HTMLElement|null}
     */
    getSlotElement(slotName: string): HTMLElement | null;
    /**
     * Checks if the given slot name exists in the component.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot exists, false otherwise.
     */
    hasSlot(slotName: string): boolean;
    /**
     * Removes the given slot name from the component.
     * This method first unmounts all children components of the given slot name,
     * then removes the slot name from the component's internal maps.
     * @param {string} slotName - The name of the slot to remove.
     */
    removeSlot(slotName: string): void;
    /**
     * Checks if the given slot name has any children components associated with it.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot has children components, false otherwise.
     */
    hasSlotContent(slotName: string): boolean;
    /**
     * Clears the given slot name of all its children components.
     * This method first removes all children components of the given slot name from the component,
     * then unmounts them and finally removes them from the component's internal maps.
     * @param {string} slotName - The name of the slot to clear.
     * @returns {boolean} True if the slot was cleared, false otherwise.
     */
    clearSlotContent(slotName: string): boolean;
    /**
     * Returns an array of slot names defined in the component.
     * @type {string[]}
     */
    get slotNames(): string[];
    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     */
    mountAllSlots(): void;
    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     * If no slot name is given, all children components of all slots are mounted to the DOM.
     * @param {string} slotName - The name of the slot to mount children components for.
     */
    mountSlot(slotName: string): void;
    /**
     * Unmounts all children components of the component from the DOM.
     * This method iterates over all children components of the component and calls their unmount method.
     */
    unmountAll(): void;
    /**
     * Unmounts all children components of the given slot name from the DOM.
     * @param {string} slotName - The name of the slot to unmount children components for.
     */
    unmountSlot(slotName: string): void;
    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The components to add to the slot.
     * @returns {Slot} Returns the slot.
     */
    attachToSlot(slotName: string, ...components: Component[]): Slot;
    /**
     * Removes the given child component from all slots.
     * This method first checks if the child component exists in the component's internal maps.
     * If it does, it removes the child component from the set of all children components and
     * from the sets of children components of all slots.
     * @param {Component} childComponent - The child component to remove.
     * @returns {boolean} True if the child component was removed, false otherwise.
     */
    removeComponent(childComponent: Component): boolean;
    /**
     * Finds the slot associated with the given child component.
     * @param {Component} component - The child component to find the slot for.
     * @returns {Slot | null} The slot associated with the child component, or null if no slot is found.
     */
    findSlotByComponent(component: Component): Slot | null;
    /**
     * Finds a direct child by its SID.
     * @param {string} sid
     * @returns {Component|null}
     */
    findChildBySid(sid: string): Component | null;
    /**
     *
     * @param {string} slotName
     * @returns {number}
     */
    getSlotLength(slotName: string): number;
    getSlots(): Map<string, Slot>;
    #private;
}
/**
 * Configuration Manager for UI Library.
 * Handles SSR flags and hydration data access.
 */
declare class ConfigManager {
    /** @type {boolean} Indicates if we are currently in Server-Side Rendering mode. */
    isSSR: boolean;
    /** @type {string} The global key where hydration data is stored. */
    hydrationDataKey: string;
    /** * Safe reference to the global object (window in browser, global in Node).
     * @type {globalThis}
     */
    window: typeof globalThis;
    /**
     * Safely retrieves the hydration manifest from the global environment.
     * @returns {{[key:string]:ComponentMetadata}|null}
     */
    getManifest(): {
        [key: string]: any;
    } | null;
    /**
     * Extracts state for a specific SID.
     * @param {string} sid - Server ID
     * @returns {any|null}
     */
    getHydrationData(sid: string): any | null;
    /**
     * Clears the manifest to free up memory.
     */
    destroyManifest(): void;
}
/**
 * A wrapper class for strings that should not be escaped.
 */
declare class SafeHTML {
    /** @param {string} html */
    constructor(html: string);
    html: string;
    toString(): string;
}
import { EventEmitter } from '@supercat1337/event-emitter';
declare class Slot {
    /**
     * Initializes a new instance of the Slot class.
     * @param {string} name - The name of the slot.
     * @param {Component} component
     */
    constructor(name: string, component: Component);
    /** @type {string} */
    name: string;
    /** @type {Set<Component>} */
    components: Set<Component>;
    /**
     * Attaches a component to the slot.
     * This method sets the given component's parent component and parent slot name,
     * and adds the component to the slot's internal set of components.
     * @param {Component} component - The component to attach to the slot.
     */
    attach(component: Component): void;
    /**
     * Detaches a component from the slot.
     * This method sets the given component's parent component and parent slot name to null,
     * and removes the component from the slot's internal set of components.
     * @param {Component} component - The component to detach from the slot.
     * @returns {boolean}
     */
    detach(component: Component): boolean;
    /**
     * Detaches all components from the slot.
     * This method sets all components' parent component and parent slot name to null,
     * and removes all components from the slot's internal set of components.
     */
    detachAll(): void;
    /**
     * Mounts all children components of the slot to the DOM.
     */
    mount(): void;
    /**
     * Unmounts all children components of the slot from the DOM.
     * This method iterates over all children components of the slot and calls their unmount method.
     */
    unmount(): void;
    /**
     * Clears the slot of all its children components.
     * This method first unmounts all children components of the slot, then detaches them from the slot.
     */
    clear(): void;
    getLength(): number;
    /**
     *
     * @returns {Component[]}
     */
    getComponents(): Component[];
    #private;
}
export {};
