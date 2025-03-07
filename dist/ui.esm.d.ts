export type TypePageUrlRenderer = (page: string) => string;
export type ListItemRenderer<T> = (row: T, index: number) => HTMLDivElement;
export type TableRowRenderer<T> = (row: T, index: number) => HTMLTableRowElement;
export class Component {
    /**
     * Property that holds the layout function of the component.
     * @type {(this:ThisType)=>string|Node}
     */
    layout: (this: ThisType<any>) => string | Node;
    /**
     * Emits an event with the given arguments.
     * @param {string} event - The name of the event to emit.
     * @param {...any} data - The arguments to be passed to the event handlers.
     */
    emit(event: string, ...data: any[]): void;
    /**
     * Subscribes to an event.
     * @param {string} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event: string, callback: Function): () => void;
    /**
     * Sets the root element of the component.
     * @param {HTMLElement} root_element - The root element to set.
     */
    setRoot(root_element: HTMLElement): void;
    /**
     * Connects the component to the specified root_element element.
     * @param {HTMLElement} [root_element] - The root_element element to connect the component to.
     * @throws {Error} If the root element is not set.
     */
    connect(root_element?: HTMLElement): void;
    /**
     * Sets the layout of the component.
     * @param {(component: this) => string|Node} layout - The layout string to be used for the component.
     * The layout string will be called with the component instance as the this value.
     */
    setLayout(layout: (component: this) => string | Node): void;
    /**
     * Renders the layout of the component.
     * This method is called when the component should re-render its layout.
     * @param {HTMLElement} [root_element] - The root element to render the layout in.
     * @throws {Error} If the root element is not set.
     */
    renderLayout(root_element?: HTMLElement): void;
    /**
    * Checks if the data view is connected to a root element.
    * @returns {boolean} True if the data view is connected, false otherwise.
    */
    isConnected(): boolean;
}
/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 */
export function DOMReady(callback: () => void): void;
/**
 * @template T
 * @typedef {(row:T, index:number)=>HTMLDivElement} ListItemRenderer
 */
/**
 * @template T
 */
export class ItemList<T> extends Component {
    constructor();
    /** @type {HTMLElement|null} */
    root_element: HTMLElement | null;
    eventsDeclaration: readonly ["connect"];
    /** @type {typeof this.refsAnnotation} */
    refs: typeof this.refsAnnotation;
    refsAnnotation: {
        section_with_content: HTMLDivElement;
        section_without_content: HTMLDivElement;
        section_error: HTMLDivElement;
        section_loading: HTMLDivElement;
        header_row: HTMLDivElement;
        error_text: HTMLElement;
        loading_text: HTMLElement;
        no_content_text: HTMLElement;
    };
    list_row_header_string: string;
    widget: Widget;
    /**
     * Subscribes to an event.
     * @param {typeof this.eventsDeclaration[number]} event - The name of the event to subscribe to.
     * @param {Function} listener - The callback function to be executed when the event is triggered.
     */
    on(event: (typeof this.eventsDeclaration)[number], listener: Function): () => void;
    /**
     * @param {Object} [config] - config
     * @param {HTMLElement} [config.root_element] - the list element to render the list view into
     * @param {ListItemRenderer<T>} [config.listItemRenderer] - the list item renderer function
     * @param {string} [config.list_row_header_string] - the list item header string
     */
    setConfig(config?: {
        root_element?: HTMLElement;
        listItemRenderer?: ListItemRenderer<T>;
        list_row_header_string?: string;
    }): void;
    /**
     * Gets the current status of the list view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the list view
     */
    get status(): "content" | "no_content" | "error" | "loading";
    /**
     * Sets the header string for the list items.
     * @param {string} string - The header string to be set for the list items.
     */
    setListItemHeaderString(string: string): void;
    /**
     * Sets the status of the list view.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the list view
     * @param {string} [text] - the text to be shown in the list view when the status is "error"
     */
    setStatus(status: "content" | "no_content" | "error" | "loading", text?: string): void;
    /**
     * Renders the list view by setting its inner HTML and connecting its elements.
     * If a response is provided, it will be rendered in the list view.
     * @param {Object} resp - The response to be rendered in the list view.
     * If undefined, the list view will be set to the "loading" status.
     */
    render(resp: any): void;
    #private;
}
/**
 * @template T
 */
export class PaginatedItemList<T> extends Component {
    constructor();
    /** @type {ItemList<T>} */
    itemList: ItemList<T>;
    /** @type {Pagination} */
    pagination: Pagination;
    /** @type {HTMLElement|null} */
    root_element: HTMLElement | null;
    refsAnnotation: {
        title: HTMLSpanElement;
        add_data_button: HTMLButtonElement;
        update_data_button: HTMLButtonElement;
        itemList: HTMLElement;
        pagination_section: HTMLElement;
    };
    /** @type {typeof this.refsAnnotation} */
    refs: typeof this.refsAnnotation;
    eventsDeclaration: readonly ["connect", "refsConnected", "renderLayout"];
    /**
     * Subscribes to an event.
     * @param {typeof this.eventsDeclaration[number]} event - The name of the event to subscribe to.
     * @param {Function} listener - The callback function to be executed when the event is triggered.
     */
    on(event: (typeof this.eventsDeclaration)[number], listener: Function): () => void;
    /**
     * Gets the current status of the list items.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the list items
     */
    get status(): "content" | "no_content" | "error" | "loading";
    /**
     * Sets the status of the list items.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the list items
     * @param {string} [text] - the text to be shown in the list items when the status is "error"
     */
    setStatus(status: "content" | "no_content" | "error" | "loading", text?: string): void;
    /**
     * Sets the title of the data view.
     * @param {string} text - The new title text.
     */
    set title(text: string);
    /**
     * Gets the title of the data view.
     * @returns {string} The current title text.
     */
    get title(): string;
    /**
     * Renders the data view by invoking the render methods of the list items and pagination components.
     * @param {Object} resp - The response to be rendered in the data view.
     * If undefined, the list items and pagination will be set to their "loading" states.
     */
    render(resp: any): void;
    #private;
}
/**
 * @template T
 */
export class PaginatedTable<T> extends Component {
    constructor();
    /** @type {TableView<T>} */
    tableView: TableView<T>;
    /** @type {Pagination} */
    pagination: Pagination;
    /** @type {HTMLElement|null} */
    root_element: HTMLElement | null;
    refsAnnotation: {
        title: HTMLSpanElement;
        add_data_button: HTMLButtonElement;
        update_data_button: HTMLButtonElement;
        table: HTMLTableElement;
        pagination_section: HTMLElement;
    };
    /** @type {typeof this.refsAnnotation} */
    refs: typeof this.refsAnnotation;
    eventsDeclaration: readonly ["connect", "refsConnected", "renderLayout"];
    /**
     * Subscribes to an event.
     * @param {typeof this.eventsDeclaration[number]} event - The name of the event to subscribe to.
     * @param {Function} listener - The callback function to be executed when the event is triggered.
     */
    on(event: (typeof this.eventsDeclaration)[number], listener: Function): () => void;
    /**
     * Gets the current status of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the table view
     */
    get status(): "content" | "no_content" | "error" | "loading";
    /**
     * Sets the status of the table view.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the table view
     * @param {string} [text] - the text to be shown in the table view when the status is "error"
     */
    setStatus(status: "content" | "no_content" | "error" | "loading", text?: string): void;
    /**
     * Sets the title of the data view.
     * @param {string} text - The new title text.
     */
    set title(text: string);
    /**
     * Gets the title of the data view.
     * @returns {string} The current title text.
     */
    get title(): string;
    /**
     * Renders the data view by invoking the render methods of the table view and pagination components.
     * @param {Object} resp - The response to be rendered in the data view.
     * If undefined, the table view and pagination will be set to their "loading" states.
     */
    render(resp: any): void;
    #private;
}
export class Pagination extends Component {
    /** @type {HTMLElement|null} */
    root_element: HTMLElement | null;
    eventsDeclaration: readonly ["page-changed"];
    /** @type {import("./layout.js").TypePageUrlRenderer|null} */
    page_url_rendrer: any | null;
    pages_count: number;
    /**
     * Subscribes to an event.
     * @param {typeof this.eventsDeclaration[number]} event - The name of the event to subscribe to.
     * @param {Function} listener - The callback function to be executed when the event is triggered.
     */
    on(event: (typeof this.eventsDeclaration)[number], listener: Function): () => void;
    /**
     * Sets the config of the pagination component.
     * @param {{page_url_rendrer:import("./layout.js").TypePageUrlRenderer}} config - The config object to be set.
     * The config object should contain the following properties:
     * - page_url_rendrer {TypePageUrlRenderer} - The page url renderer function.
     */
    setConfig(config: {
        page_url_rendrer: any;
    }): void;
    /**
     * Sets the current page of the pagination component.
     * If the root_element element is set, the component will be re-rendered.
     * @param {number} value - the new current page value
     */
    set current_page(value: number);
    /**
     * Gets the current page value.
     * @returns {number} - the current page value
     */
    get current_page(): number;
    /**
     * @param {Object} [resp] - response object
     */
    render(resp?: any): void;
    #private;
}
/**
 * @template T
 * @typedef {(row:T, index:number)=>HTMLTableRowElement} TableRowRenderer
 */
/**
 * @template T
 */
export class TableView<T> extends Component {
    constructor();
    /** @type {HTMLElement|null} */
    root_element: HTMLElement | null;
    eventsDeclaration: readonly ["connect", "refsConnected"];
    /** @type {typeof this.refsAnnotation} */
    refs: typeof this.refsAnnotation;
    refsAnnotation: {
        section_with_content: HTMLTableSectionElement;
        section_without_content: HTMLTableSectionElement;
        section_error: HTMLTableSectionElement;
        section_loading: HTMLTableSectionElement;
        header_row: HTMLTableRowElement;
        error_text: HTMLElement;
        loading_text: HTMLElement;
        no_content_text: HTMLElement;
    };
    widget: Widget;
    /**
     * Subscribes to an event.
     * @param {typeof this.eventsDeclaration[number]} event - The name of the event to subscribe to.
     * @param {Function} listener - The callback function to be executed when the event is triggered.
     */
    on(event: (typeof this.eventsDeclaration)[number], listener: Function): () => void;
    /**
     * @param {Object} [config] - config
     * @param {HTMLTableElement} [config.root_element] - the table element to render the table view into
     * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
     * @param {string} [config.table_row_header_string] - the table row header string
     */
    setConfig(config?: {
        root_element?: HTMLTableElement;
        tableRowRenderer?: TableRowRenderer<T>;
        table_row_header_string?: string;
    }): void;
    /**
     * Gets the current status of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the table view
     */
    get status(): "content" | "no_content" | "error" | "loading";
    /**
     * Sets the status of the table view.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the table view
     * @param {string} [text] - the text to be shown in the table view when the status is "error"
     */
    setStatus(status: "content" | "no_content" | "error" | "loading", text?: string): void;
    /**
     * Renders the table view by setting its inner HTML and connecting its elements.
     * If a response is provided, it will be rendered in the table view.
     * @param {Object} resp - The response to be rendered in the table view.
     * If undefined, the table view will be set to the "loading" status.
     */
    render(resp: any): void;
    #private;
}
export class Widget extends Component {
    /** @type {typeof this.refsAnnotation} */
    refs: typeof this.refsAnnotation;
    refsAnnotation: {
        section_with_content: HTMLElement;
        section_without_content: HTMLElement;
        section_error: HTMLElement;
        section_loading: HTMLElement;
        error_text: HTMLElement;
        loading_text: HTMLElement;
        no_content_text: HTMLElement;
    };
    /**
     * Sets the status of the table view.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the table view
     * @param {string} [text] - the text to be shown in the table view when the status is "error"
     */
    setStatus(status: "content" | "no_content" | "error" | "loading", text?: string): void;
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
 * Hides the given modal element.
 * @param {Element} modal_element - The modal element to hide.
 */
export function hideModal(modal_element: Element): void;
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
 * Displays the given modal element by creating or retrieving its instance
 * and calling the show method on it.
 * @param {Element} modal_element - The modal element to be displayed.
 */
export function showModal(modal_element: Element): void;
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
