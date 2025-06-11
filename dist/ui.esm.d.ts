export type TypePageUrlRenderer = (page: string) => string;
export type LayoutFunction = (component: any) => Node | string;
export type TextUpdateFunction = (component: Component) => void;
export type TableRowRenderer<T> = (row: T, index: number) => HTMLTableRowElement;
export type Refs = {
    table: HTMLTableElement;
    pagination: HTMLElement;
};
/**
 * @typedef {(component: any) => Node|string} LayoutFunction
 */
/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */
export class Component {
    /** @type {{eventEmitter: EventEmitter, disconnectController: AbortController, root: HTMLElement|null, textUpdateFunction: TextUpdateFunction|null, textResources: {[key:string]:any}}} */
    $internals: {
        eventEmitter: EventEmitter<any>;
        disconnectController: AbortController;
        root: HTMLElement | null;
        textUpdateFunction: TextUpdateFunction | null;
        textResources: {
            [key: string]: any;
        };
    };
    slots: SlotManager;
    refsAnnotation: any;
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
     * @param {TextUpdateFunction|null} func - The text update function to set.
     * @returns {void}
     */
    setTextUpdateFunction(func: TextUpdateFunction | null): void;
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
     * This method does not emit any events.
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
     * Attaches an event listener to the specified element.
     * The event listener is automatically removed when the component is unmounted.
     * @param {HTMLElement|Element} element - The element to attach the event listener to.
     * @param {keyof HTMLElementEventMap} event - The name of the event to listen to.
     * @param {EventListenerOrEventListenerObject} callback - The function to be called when the event is triggered.
     * @returns {() => void} A function that can be called to remove the event listener.
     */
    $on(element: HTMLElement | Element, event: keyof HTMLElementEventMap, callback: EventListenerOrEventListenerObject): () => void;
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
    addChildComponent(slotName: string, ...components: Component[]): void;
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
export class Modal extends Component {
    /**
     * Indicates whether the submit button should be hidden when the content mode is active.
     * @type {boolean}
     * */
    hideSubmitButtonOnContentMode: boolean;
    toggler: Toggler;
    /** @returns {{modal_title: HTMLHeadingElement, close_x_button: HTMLButtonElement, modal_body: HTMLDivElement, close_button: HTMLButtonElement, submit_button: HTMLButtonElement, section_with_content: HTMLDivElement, section_error: HTMLDivElement, error_text: HTMLSpanElement, section_loading: HTMLDivElement, loading_text: HTMLSpanElement}} */
    getRefs(): {
        modal_title: HTMLHeadingElement;
        close_x_button: HTMLButtonElement;
        modal_body: HTMLDivElement;
        close_button: HTMLButtonElement;
        submit_button: HTMLButtonElement;
        section_with_content: HTMLDivElement;
        section_error: HTMLDivElement;
        error_text: HTMLSpanElement;
        section_loading: HTMLDivElement;
        loading_text: HTMLSpanElement;
    };
    /**
     * Displays the modal if the component is connected to the DOM.
     * Retrieves or creates a modal instance and calls its show method.
     * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
     */
    show(ctx?: object): void;
    /**
     * Displays the modal with the loading indicator if the component is connected to the DOM.
     * Retrieves or creates a modal instance, sets its backdrop to static, and calls its show method.
     * Emits the "show" event as well.
     * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
     */
    showLoading(ctx?: object): void;
    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContentMode(): void;
    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message and activate the loading toggler.
     */
    setLoadingMode(): void;
    /**
     * Sets the table view to its "error" state.
     * The table view will display an error message and activate the error toggler.
     */
    setErrorMode(): void;
    /**
     * Hides the modal if the component is connected to the DOM.
     * Retrieves or creates a modal instance and calls its hide method.
     */
    hide(): void;
    /**
     * Subscribes to the "show" event.
     * This event is emitted whenever the modal is shown.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onShow(callback: (modal: this, ctx: object) => void): () => void;
    /**
     * Subscribes to the "hide" event.
     * This event is emitted whenever the modal is hidden.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onHide(callback: (modal: this) => void): () => void;
    /**
     * Subscribes to the "response" event.
     * This event is emitted whenever the modal receives a response.
     * The callback is called with the component instance as the this value and the response as the second argument.
     * @param {(modal: this, response: Object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onResponse(callback: (modal: this, response: any) => void): () => void;
    /**
     * Emits the "response" event.
     * This event is emitted whenever the modal receives a response.
     * The callback is called with the component instance as the this value and the response as the second argument.
     * @param {Object} response - The response to be emitted.
     */
    emitResponse(response: any): void;
    /**
     * Subscribes to the "submit" event.
     * This event is emitted when the user clicks the submit button.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onSubmit(callback: (modal: this, ctx: object) => void): () => void;
    /**
     * Emits the "submit" event.
     * This event is emitted when the user clicks the submit button.
     * The callback is called with the component instance as the this value and the context object as the second argument.
     * @param {object} ctx - The context object to be passed to the callback.
     */
    emitSubmit(ctx: object): void;
    /**
     * Sets the title of the modal.
     * @param {string} title - The new title text.
     */
    setTitleText(title: string): void;
    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text: string): void;
    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text: string): void;
    /**
     * Sets the text of the submit button.
     * @param {string} text - The text to be shown as the submit button.
     */
    setSubmitButtonText(text: string): void;
    /**
     * Sets the text of the close button.
     * @param {string} text - The text to be shown as the close button.
     */
    setCloseButtonText(text: string): void;
    /**
     * Hides the close buttons of the modal.
     * If the component is not connected to the DOM, does nothing.
     */
    hideCloseButtons(): void;
    /**
     * Shows the close buttons of the modal.
     * If the component is not connected to the DOM, does nothing.
     */
    showCloseButtons(): void;
}
/** @typedef {{ table: HTMLTableElement, pagination: HTMLElement}} Refs */
/**
 * @template T
 */
export class PaginatedTable<T> extends Component {
    constructor();
    /** @type {Table<T>} */
    table: Table<T>;
    /** @type {Pagination} */
    pagination: Pagination;
    /** @returns {{ table: HTMLTableElement, pagination: HTMLElement}} */
    getRefs(): {
        table: HTMLTableElement;
        pagination: HTMLElement;
    };
    /**
     * Gets the current status of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the table view
     */
    get state(): "content" | "no_content" | "error" | "loading";
    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message.
     */
    setLoading(): void;
    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent(): void;
    /**
     * Sets the table view to its "error" state.
     * The table view will show an error message.
     */
    setError(): void;
    /**
     * Sets the table view to its "no_content" state.
     * The table view will show a no content message.
     */
    setNoContent(): void;
    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text: string): void;
    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text: string): void;
    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text: string): void;
    /**
     * Renders the data view by invoking the render methods of the table view and pagination components.
     * @param {Object} resp - The response to be rendered in the data view.
     * If undefined, the table view and pagination will be set to their "loading" states.
     */
    setData(resp: any): void;
    /**
     * Subscribes to the "page-changed" event of the pagination component.
     * The event is triggered when the user changes the page by clicking on a page number or
     * by clicking on the previous or next buttons.
     * @param {(index: number)=>void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the index of the new page as the first argument.
     * @returns {Function} A function that removes the event listener.
     */
    onPageChanged(callback: (index: number) => void): Function;
    /**
     * Subscribes to the "loading" event of the table view.
     * The event is triggered when the table view is set to its "loading" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onLoading(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "content" event of the table view.
     * The event is triggered when the table view is set to its "content" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onContent(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "error" event of the table view.
     * The event is triggered when the table view is set to its "error" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onError(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "no_content" event of the table view.
     * The event is triggered when the table view is set to its "no_content" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onNoContent(callback: (component: this) => void): () => void;
}
export class Pagination extends Component {
    /** @type {import("./layout.js").TypePageUrlRenderer|null} */
    pageUrlRenderer: any | null;
    /**
     * Subscribes to the "page-changed" event of the pagination component.
     * The event is triggered when the user changes the page by clicking on a page number or
     * by clicking on the previous or next buttons.
     * @param {(index: number)=>void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the index of the new page as the first argument.
     * @returns {Function} A function that removes the event listener.
     */
    onPageChanged(callback: (index: number) => void): Function;
    /**
     * Sets the config of the pagination component.
     * @param {{pageUrlRenderer:import("./layout.js").TypePageUrlRenderer}} config - The config object to be set.
     * The config object should contain the following properties:
     * - pageUrlRenderer {TypePageUrlRenderer} - The page url renderer function.
     */
    setConfig(config: {
        pageUrlRenderer: any;
    }): void;
    /**
     * Sets the current page of the pagination component.
     * If the component is mounted, the component will be re-rendered.
     * @param {number} value - the new current page value
     */
    set currentPage(value: number);
    /**
     * Gets the current page value.
     * @returns {number} - the current page value
     */
    get currentPage(): number;
    /**
     * Gets the total number of pages.
     * @returns {number} - the total number of pages
     */
    get totalPages(): number;
    /**
     * @param {Object} [resp] - response object
     */
    setData(resp?: any): void;
    #private;
}
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
/**
 * @template T
 */
export class Table<T> extends Component {
    constructor();
    toggler: Toggler;
    /**
     * @returns {{header_row:HTMLTableRowElement, section_with_content:HTMLTableSectionElement, section_without_content:HTMLTableSectionElement, section_error:HTMLTableSectionElement, section_loading:HTMLTableSectionElement, error_text:HTMLElement, loading_text:HTMLElement, no_content_text:HTMLElement}} - the refs object
     */
    getRefs(): {
        header_row: HTMLTableRowElement;
        section_with_content: HTMLTableSectionElement;
        section_without_content: HTMLTableSectionElement;
        section_error: HTMLTableSectionElement;
        section_loading: HTMLTableSectionElement;
        error_text: HTMLElement;
        loading_text: HTMLElement;
        no_content_text: HTMLElement;
    };
    /**
     * @param {Object} config - config
     * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
     * @param {string} [config.headerHTML] - the table row header string
     */
    setConfig(config: {
        tableRowRenderer?: TableRowRenderer<T>;
        headerHTML?: string;
    }): void;
    /**
     * Gets the current state of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current state of the table view
     */
    get state(): "content" | "no_content" | "error" | "loading";
    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent(): void;
    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message and activate the loading toggler.
     */
    setLoading(): void;
    /**
     * Sets the table view to its "error" state.
     * The table view will display an error message and activate the error toggler.
     */
    setError(): void;
    /**
     * Sets the table view to its "no_content" state.
     * The table view will display a no content message and activate the no content toggler.
     */
    setNoContent(): void;
    /**
     * Subscribes to the "loading" event.
     * This event is emitted when the view is set to "loading" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onLoading(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "error" event.
     * This event is emitted when the view is set to the "error" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onError(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "no_content" event.
     * This event is emitted when the view is set to the "no_content" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onNoContent(callback: (component: this) => void): () => void;
    /**
     * Subscribes to the "content" event.
     * This event is emitted when the view is set to the "content" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onContent(callback: (component: this) => void): () => void;
    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text: string): void;
    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text: string): void;
    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text: string): void;
    /**
     * Renders the table view by setting its inner HTML and connecting its elements.
     * If a response is provided, it will be rendered in the table view.
     * @param {Object} resp - The response to be rendered in the table view.
     * If undefined, the table view will be set to the "loading" state.
     */
    setData(resp: any): void;
    /**
     * Gets the rows of the table view.
     * @returns {T[]} - The rows of the table view.
     */
    get rows(): T[];
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
 * @param {string} [customClassName] - The class name to use for the spinner.
 *                                      If not provided, 'spinner-border spinner-border-sm' is used.
 */
export function showSpinnerInButton(button: HTMLButtonElement, customClassName?: string): void;
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
import { EventEmitter } from '@supercat1337/event-emitter';
declare class SlotManager {
    /**
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "scope-ref" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames: string[]): void;
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
     * Sets the slot refs object.
     * This object is a map of HTML elements with the keys being the names of the slots.
     * The slot refs object is set by the component automatically when the component is connected to the DOM.
     * @param {{[key:string]:HTMLElement}} scope_refs - The slot refs object.
     */
    setSlotRefs(scope_refs: {
        [key: string]: HTMLElement;
    }): void;
    /**
     * Returns the HTML element reference of the given slot name.
     * @param {string} slotName - The name of the slot to get the reference for.
     * @returns {HTMLElement|null} The HTML element reference of the slot, or null if the slot does not exist.
     */
    getSlotRef(slotName: string): HTMLElement | null;
    /**
     * Clears the slot refs object.
     * This is usually done when the component is disconnected from the DOM.
     */
    clearSlotRefs(): void;
    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} children - The components to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addChildComponent(slotName: string, ...children: Component[]): void;
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
export {};
