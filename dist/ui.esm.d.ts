export type LayoutFunction = (component: any) => Node | string;
export type _TextUpdateFunction = (component: Component) => void;
export type TextUpdateFunction = (component: Component) => void;
export class Component {
    /** @type {Internals} */
    $internals: Internals;
    /** @type {LayoutFunction|string|undefined} */
    layout: LayoutFunction | string | undefined;
    /** @type {import("dom-scope").RefsAnnotation|undefined} */
    refsAnnotation: import("dom-scope").RefsAnnotation | undefined;
    slotManager: SlotManager;
    /**
     * Checks if the component is connected to a root element.
     * @returns {boolean} True if the component is connected, false otherwise.
     */
    get isConnected(): boolean;
    /**
     * Returns whether the component is currently collapsed or not.
     * @returns {boolean} True if the component is collapsed, false otherwise.
     */
    get isCollapsed(): boolean;
    /**
     * Reloads the text content of the component by calling the text update function if it is set.
     * This method is useful when the component's text content depends on external data that may change.
     * @returns {void}
     */
    reloadText(): void;
    /**
     * Sets the text update function for the component.
     * The text update function is a function that is called when the reloadText method is called.
     * The function receives the component instance as the this value.
     * @param {_TextUpdateFunction|null} func - The text update function to set.
     * @returns {void}
     */
    setTextUpdateFunction(func: _TextUpdateFunction | null): void;
    /**
     * Sets the layout of the component by assigning the template content.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setLayout(layout: LayoutFunction | string, annotation?: import("dom-scope").RefsAnnotation): void;
    /**
     * Sets the renderer for the component by assigning the template content.
     * This is a synonym for setLayout.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setRenderer(layout: LayoutFunction | string, annotation?: import("dom-scope").RefsAnnotation): void;
    /**
     * Returns the refs object.
     * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
     * The refs object is only available after the component has been connected to the DOM.
     * @returns {any} The refs object.
     */
    getRefs(): any;
    /**
     * Returns the ref element with the given name.
     * @param {string} refName - The name of the ref to retrieve.
     * @returns {HTMLElement} The ref element with the given name.
     * @throws {Error} If the ref does not exist.
     */
    getRef(refName: string): HTMLElement;
    /**
     * Checks if a ref with the given name exists.
     * @param {string} refName - The name of the ref to check.
     * @returns {boolean} True if the ref exists, false otherwise.
     */
    hasRef(refName: string): boolean;
    /**
     * Updates the refs object with the current state of the DOM.
     * This method is usually called internally when the component is connected or disconnected.
     * @throws {Error} If the component is not connected to the DOM.
     * @returns {void}
     */
    updateRefs(): void;
    /**
     * Subscribes to a specified event.
     * @param {string} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event: string, callback: Function): () => void;
    /**
     * Emits an event with the given arguments.
     * @param {string} event - The name of the event to emit.
     * @param {...any} args - The arguments to be passed to the event handlers.
     */
    emit(event: string, ...args: any[]): void;
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
     * Subscribes to the "prepareRender" event.
     * This event is emitted just before the component is about to render its layout.
     * The callback is called with the component instance as the this value.
     * @param {(component: this, template: Node) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onPrepareRender(callback: (component: this, template: Node) => void): () => void;
    /**
     * Subscribes to the "connect" event.
     * This event is emitted just after the component is connected to the DOM.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onConnect(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "disconnect" event.
     * This event is emitted just before the component is disconnected from the DOM.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onDisconnect(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "mount" event.
     * This event is emitted after the component is mounted to the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onMount(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "beforeUnmount" event.
     * This event is emitted just before the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onBeforeUnmount(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "unmount" event.
     * This event is emitted after the component is unmounted from the DOM.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onUnmount(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "collapse" event.
     * This event is emitted after the component has collapsed.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onCollapse(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "expand" event.
     * This event is emitted after the component has expanded.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onExpand(callback: (component: this) => void): () => void;
    /**
     * Connects the component to the specified componentRoot element.
     * Initializes the refs object and sets the component's root element.
     * Emits "connect" event through the event emitter.
     * @param {HTMLElement} componentRoot - The root element to connect the component to.
     */
    connect(componentRoot: HTMLElement): void;
    /**
     * Disconnects the component from the DOM.
     * Sets the component's #isConnected flag to false.
     * Clears the refs and slotRefs objects.
     * Aborts all event listeners attached with the $on method.
     * Emits "disconnect" event through the event emitter.
     */
    disconnect(): void;
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
     * Mounts the component to the specified container.
     * @param {Element} container - The container to mount the component to.
     * @param {"replace"|"append"|"prepend"} [mountMode="replace"] - The mode to use to mount the component.
     * If "replace", the container's content is replaced.
     * If "append", the component is appended to the container.
     * If "prepend", the component is prepended to the container.
     */
    mount(container: Element, mountMode?: "replace" | "append" | "prepend"): void;
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
     * This method is called when the component is updated.
     * It is an empty method and is intended to be overridden by the user.
     * @param {...*} args
     */
    update(...args: any[]): void;
    /**
     * Shows the component.
     * If the component is not connected, it does nothing.
     * If the component is connected, it removes the "d-none" class from the root element.
     */
    show(): void;
    /**
     * Hides the component.
     * If the component is not connected, it does nothing.
     * If the component is connected, it adds the "d-none" class to the root element.
     */
    hide(): void;
    /**
     * Collapses the component by unmounting it from the DOM.
     * Sets the #isCollapsed flag to true.
     */
    collapse(): void;
    /**
     * Expands the component by mounting it to the DOM.
     * Sets the #isCollapsed flag to false.
     * If the component is already connected, does nothing.
     * If the component does not have a parent component, does nothing.
     * Otherwise, mounts the component to the parent component's slot.
     */
    expand(): void;
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
    #private;
}
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
    /** @type {string[]} */
    slotNames: string[];
    /** @type {string} */
    activeSlotName: string;
    /** @type {Component} */
    component: Component;
    /**
     * Toggles the active slot to the given slot name.
     * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
     * @param {string} slotName - The name of the slot to toggle to.
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
 * Creates an array of page numbers to be displayed in a pagination list.
 * @param {number} current
 * @param {number} total
 * @param {number} delta
 * @param {string} [gap]
 * @returns {string[]}
 */
export function createPaginationArray(current: number, total: number, delta?: number, gap?: string): string[];
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
/**
 * Removes the spinner from the given button.
 * @param {HTMLButtonElement} button - The button which should have its spinner removed.
 */
export function removeSpinnerFromButton(button: HTMLButtonElement): void;
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
 * Returns the current Unix time in seconds.
 * @param {Date} [dateObject=new Date()] - The date object to get the Unix time from. Defaults to the current date and time.
 * @returns {number}
 */
export function unixtime(dateObject?: Date): number;
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
/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */
declare class Internals {
    /** @type {EventEmitter<any>} */
    eventEmitter: EventEmitter<any>;
    /** @type {AbortController} */
    disconnectController: AbortController;
    /** @type {HTMLElement|null} */
    root: HTMLElement | null;
    /** @type {TextUpdateFunction|null} */
    textUpdateFunction: TextUpdateFunction | null;
    /** @type {{[key:string]:any}}  */
    textResources: {
        [key: string]: any;
    };
    /** @type {{[key:string]:HTMLElement}} */
    refs: {
        [key: string]: HTMLElement;
    };
    /** @type {{[key:string]:HTMLElement}} */
    slotRefs: {
        [key: string]: HTMLElement;
    };
    /** @type {Component|null} */
    parentComponent: Component | null;
    /** @type {string} */
    assignedSlotName: string;
    /** @type {"replace"|"append"|"prepend"} */
    mountMode: "replace" | "append" | "prepend";
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
    #private;
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
     */
    detach(component: Component): void;
    /**
     * Detaches all components from the slot.
     * This method sets all components' parent component and parent slot name to null,
     * and removes all components from the slot's internal set of components.
     */
    detachAll(): void;
    /**
     * Mounts all children components of the slot to the DOM.
     * This method first checks if the component is connected.
     * If not, it logs a warning and returns.
     * Then, it gets the root element of the slot from the component's internal slot refs map.
     * If the slot root element does not exist, it logs a warning and returns.
     * Finally, it iterates over all children components of the slot and calls their mount method with the slot root element and the "append" mode.
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
    #private;
}
export {};
