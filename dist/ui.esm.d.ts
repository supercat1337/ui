export type LayoutFunction = (component: any) => Node | string;
export type TextUpdateFunction = (component: Component) => void;
export class Component {
    /** @type {Internals} */
    $internals: Internals;
    /** @type {LayoutFunction|string|undefined} */
    layout: LayoutFunction | string | undefined;
    /** @type {string[]|undefined} */
    slots: string[] | undefined;
    /** @type {import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation|undefined} */
    refsAnnotation: import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation | undefined;
    slotManager: SlotManager;
    isCollapsed: boolean;
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
     * @param {import("./internals.js").TextUpdateFunction|null} func - The text update function to set.
     * @returns {void}
     */
    setTextUpdateFunction(func: any | null): void;
    /**
     * Sets the layout of the component by assigning the template content.
     * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
     * @param {import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
     * The function is called with the component instance as the this value.
     */
    setLayout(layout: LayoutFunction | string, annotation?: import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation): void;
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
     * Emits the "beforeConnect" event.
     * This event is emitted just before the component is connected to the DOM.
     * @param {(component: this, clonedTemplate: Node) => void} callback - The callback function to be executed when the event is triggered.
     * The callback is called with the component instance as the this value. The second argument is the clonedTemplate - the cloned template node.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onBeforeConnect(callback: (component: this, clonedTemplate: Node) => void): () => void;
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
     * Checks if the component is connected to a root element.
     * @returns {boolean} True if the component is connected, false otherwise.
     */
    get isConnected(): boolean;
    /**
     * Connects the component to the specified componentRoot element.
     * Initializes the refs object and sets the component's root element.
     * Emits "connect" event through the event emitter.
     * @param {HTMLElement} componentRoot - The root element to connect the component to.
     */
    connect(componentRoot: HTMLElement): void;
    /**
     * Disconnects the component from the DOM.
     * Sets the component's #connected flag to false.
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
     * @param {"replace"|"append"|"prepend"} [mode="replace"] - The mode to use to mount the component.
     * If "replace", the container's content is replaced.
     * If "append", the component is appended to the container.
     * If "prepend", the component is prepended to the container.
     */
    mount(container: Element, mode?: "replace" | "append" | "prepend"): void;
    /**
     * Unmounts the component from the DOM.
     * Emits "beforeUnmount" and "unmount" events through the event emitter.
     * Disconnects the component from the DOM and removes the root element.
     */
    unmount(): void;
    /**
     * Collapses the component by unmounting it from the DOM.
     * Sets the isCollapsed flag to true.
     */
    collapse(): void;
    /**
     * Expands the component by mounting it to the DOM.
     * Sets the isCollapsed flag to false.
     * If the component is already connected, does nothing.
     * If the component does not have a parent component, does nothing.
     * Otherwise, mounts the component to the parent component's slot.
     */
    expand(): void;
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
     * Attaches an event listener to the specified element.
     * The event listener is automatically removed when the component is unmounted.
     * @param {HTMLElement|Element} element - The element to attach the event listener to.
     * @param {keyof HTMLElementEventMap} event - The name of the event to listen to.
     * @param {EventListenerOrEventListenerObject} callback - The function to be called when the event is triggered.
     * @returns {() => void} A function that can be called to remove the event listener.
     */
    $on(element: HTMLElement | Element, event: keyof HTMLElementEventMap, callback: EventListenerOrEventListenerObject): () => void;
    /**
     * Returns an array of the slot names defined in the component.
     * @returns {string[]}
     */
    getSlotNames(): string[];
    /**
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "data-slot" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames: string[]): void;
    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The component to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentToSlot(slotName: string, ...components: Component[]): void;
    /**
     * Removes the specified child component from all slots.
     * Delegates the removal to the SlotManager instance.
     * @param {Component} childComponent - The child component to be removed.
     */
    removeChildComponent(childComponent: Component): void;
    #private;
}
/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 */
export function DOMReady(callback: () => void): void;
export class SlotToggler {
    /**
     * Creates a new instance of SlotToggler.
     * @param {Component} component - The component that owns the slots.
     * @param {string[]} slotNames - The names of the slots.
     * @param {string} activeSlotName - The name of the slot that is currently active.
     */
    constructor(component: Component, slotNames: string[], activeSlotName: string);
    component: Component;
    slotNames: string[];
    activeSlotName: string;
    /**
     * Toggles the active slot to the given slot name.
     * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
     * @param {string} slotName - The name of the slot to toggle to.
     */
    toggle(slotName: string): void;
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
    #private;
}
/**
 * Copies the given text to the clipboard using the Clipboard API.
 * @param {string} text - The text to be copied to the clipboard.
 * @returns {Promise<void>} A promise that resolves when the text has been successfully copied.
 */
export function copyToClipboard(text: string): Promise<void>;
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
 */
export function fadeIn(element: HTMLElement, duration?: number): void;
/**
 * Fades out the given element with the given duration.
 * The element is set to be block level and its opacity is set to 1.
 * The function then repeatedly adjusts the opacity of the element until it is 0.
 * The time between each adjustment is the given duration.
 * @param {HTMLElement} element - The element to fade out.
 * @param {number} [duration=400] - The duration of the fade out in milliseconds.
 */
export function fadeOut(element: HTMLElement, duration?: number): void;
/**
 * Formats the given number of bytes into a human-readable string.
 *
 * @param {number} bytes - The number of bytes to be formatted.
 * @param {number} [decimals] - The number of decimal places to be used in the formatted string. Defaults to 2.
 * @param {string} [lang] - The language to be used for the size units in the formatted string. Defaults to the user's default language.
 * @param {Object} [sizes] - An object containing the size units to be used in the formatted string. Defaults to the IEC standard units.
 * @returns {string} A human-readable string representation of the given number of bytes, in the form of a number followed by a unit of measurement (e.g. "3.5 KB", "1.2 GB", etc.).
 */
export function formatBytes(bytes: number, decimals?: number, lang?: string, sizes?: any): string;
/**
 * Formats the given timestamp into a human-readable string representation of
 * a date. The date is formatted according to the user's locale.
 * @param {number} timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date.
 */
export function formatDate(timestamp: number): string;
/**
 * Formats the given timestamp into a human-readable string representation of
 * a date and time. The date is formatted according to the user's locale, and
 * the time is formatted according to the user's locale with a 24-hour clock.
 * @param {number} timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date and time.
 */
export function formatDateTime(timestamp: number): string;
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
 * Checks if the user prefers a dark color scheme.
 * Utilizes the `window.matchMedia` API to determine if the user's
 * system is set to a dark mode preference.
 * @returns {boolean} - Returns `true` if the user prefers dark mode, otherwise `false`.
 */
export function isDarkMode(): boolean;
/**
 * Removes the spinner from the given button.
 * @param {HTMLButtonElement} button - The button which should have its spinner removed.
 */
export function removeSpinnerFromButton(button: HTMLButtonElement): void;
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
 */
export function showSpinnerInButton(button: HTMLButtonElement, customClassName?: string | null): void;
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
 * @returns {number}
 */
export function unixtime(): number;
/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */
declare class Internals {
    /** @type {EventEmitter} */
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
    parentSlotName: string;
}
declare class SlotManager {
    /**
     * @param {Component} component
     */
    constructor(component: Component);
    /**
     * @param {boolean} mode
     */
    setSlotStrictMode(mode: boolean): void;
    /**
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "scope-ref" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames: string[]): void;
    /**
     * Adds a slot to the component.
     * This method is used to programmatically add a slot to the component.
     * @param {string} slotName - The name of the slot to add.
     */
    addSlot(slotName: string): void;
    /**
     * Removes the given slot name from the component.
     * This method first unmounts all children components of the given slot name,
     * then removes the slot name from the component's internal maps.
     * @param {string} slotName - The name of the slot to remove.
     */
    removeSlot(slotName: string): void;
    /**
     * Returns an array of slot names defined in the component.
     * @type {string[]}
     */
    get slotNames(): string[];
    /**
     * Checks if the given slot name exists in the component.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot exists, false otherwise.
     */
    slotExists(slotName: string): boolean;
    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The components to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentsToSlot(slotName: string, ...components: Component[]): void;
    /**
     * Removes the given child component from all slots.
     * @param {Component} childComponent - The child component to remove.
     */
    removeChildComponent(childComponent: Component): void;
    /**
     * Returns the children components of the component.
     * @type {Set<Component>}
     */
    get children(): Set<Component>;
    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     * If no slot name is given, all children components of all slots are mounted to the DOM.
     * @param {string} [slotName] - The name of the slot to mount children components for.
     */
    mountChildren(slotName?: string): void;
    /**
     * Unmounts all children components of the given slot name.
     * This method iterates over the children components of the given slot name and calls their unmount method.
     * @param {string} [slotName] - The name of the slot to unmount the children components for.
     * if no slot name is given, all children components of all slots are unmounted.
     */
    unmountChildren(slotName?: string): void;
    #private;
}
import { EventEmitter } from '@supercat1337/event-emitter';
export {};
