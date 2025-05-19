// @ts-check

import { getHtmlLayout } from "./layout.js";
import { Component } from "../component/component.js";
import {
    extractRPCResponse,
    RPCErrorResponse,
    RPCPagedResponse,
} from "@supercat1337/rpc";
import { hideElements, showElements, Toggler } from "../utils.js";

/**
 * Default table row renderer function.
 * @param {Object} data - The row data.
 * @param {number} index - The row index.
 * @returns {HTMLTableRowElement} The rendered table row.
 */
function defaultTableRowRenderer(data, index) {
    let row = document.createElement("tr");
    row.setAttribute("data-row-index", index.toString());

    let cell = document.createElement("td");
    cell.setAttribute("ref", "index");
    cell.innerText = (index + 1).toString();
    row.appendChild(cell);

    for (let key in data) {
        let cell = document.createElement("td");
        cell.setAttribute("ref", key);
        cell.innerText = data[key];
        row.appendChild(cell);
    }

    return row;
}

/**
 * @template T
 * @typedef {(row:T, index:number)=>HTMLTableRowElement} TableRowRenderer
 */

const refsAnnotation = {
    section_with_content: HTMLTableSectionElement.prototype,
    section_without_content: HTMLTableSectionElement.prototype,
    section_error: HTMLTableSectionElement.prototype,
    section_loading: HTMLTableSectionElement.prototype,
    header_row: HTMLTableRowElement.prototype,
    error_text: HTMLElement.prototype,
    loading_text: HTMLElement.prototype,
    no_content_text: HTMLElement.prototype,
};

const textResources_default = {
    no_content_text: "No items",
    error_text: "Error",
    loading_text: "Loading...",
    invalid_response: "Invalid response",
};

/**
 * Updates the text content of the component's elements.
 * @param {Table} component - The component to update.
 * @returns {void}
 */
function textUpdater(component) {
    let refs = component.getRefs();
    let textResources = component.$internals.textResources;

    refs.error_text.innerText = textResources.error_text;
    refs.loading_text.innerText = textResources.loading_text;
    refs.no_content_text.innerText = textResources.no_content_text;
}

/**
 * @template T
 */
export class Table extends Component {
    #headerHTML = "";

    /** @type {TableRowRenderer<T>} */
    #tableRowRenderer = defaultTableRowRenderer;

    /** @type {"content"|"no_content"|"error"|"loading"} */
    #state = "loading";

    /** @type {T[]} */
    #rows = [];

    constructor() {
        super();

        this.$internals.textResources = textResources_default;
        this.setTextUpdateFunction(textUpdater);

        let that = this;

        this.toggler = new Toggler();
        this.toggler.addItem(
            "content",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                that.#renderRows();
                showElements(refs.section_with_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                let refs = this.getRefs();
                refs.section_with_content.innerHTML = "";
                hideElements(refs.section_with_content);
            }
        );

        this.toggler.addItem(
            "no_content",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                showElements(refs.section_without_content);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_without_content);
            }
        );

        this.toggler.addItem(
            "error",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                showElements(refs.section_error);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_error);
            }
        );

        this.toggler.addItem(
            "loading",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                showElements(refs.section_loading);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_loading);
            }
        );

        this.toggler.setActive("loading");

        this.onConnect(() => {
            let refs = this.getRefs();
            refs.header_row.innerHTML = that.#headerHTML;
        });

        this.onConnect(() => {
            that.toggler.runCallbacks();
        });

        this.setLayout(getHtmlLayout, refsAnnotation);
    }

    /**
     * @returns {{header_row:HTMLTableRowElement, section_with_content:HTMLTableSectionElement, section_without_content:HTMLTableSectionElement, section_error:HTMLTableSectionElement, section_loading:HTMLTableSectionElement, error_text:HTMLElement, loading_text:HTMLElement, no_content_text:HTMLElement}} - the refs object
     */
    getRefs() {
        return super.getRefs();
    }

    /**
     * @param {Object} config - config
     * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
     * @param {string} [config.headerHTML] - the table row header string
     */
    setConfig(config) {
        if (config.tableRowRenderer) {
            this.#tableRowRenderer = config.tableRowRenderer;
        }

        if (config.headerHTML) {
            this.#headerHTML = config.headerHTML;
        }
    }

    /**
     * Gets the current state of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current state of the table view
     */
    get state() {
        return this.#state;
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent() {
        this.#state = "content";

        this.#renderRows();
        this.toggler.setActive("content");
        this.$internals.eventEmitter.emit("content", this);
    }

    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message and activate the loading toggler.
     */
    setLoading() {
        this.#state = "loading";
        this.toggler.setActive("loading");
        this.$internals.eventEmitter.emit("loading", this);
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will display an error message and activate the error toggler.
     */
    setError() {
        this.#state = "error";
        this.toggler.setActive("error");
        this.$internals.eventEmitter.emit("error", this);
    }

    /**
     * Sets the table view to its "no_content" state.
     * The table view will display a no content message and activate the no content toggler.
     */
    setNoContent() {
        this.#state = "no_content";
        this.toggler.setActive("no_content");
        this.$internals.eventEmitter.emit("no_content", this);
    }

    /**
     * Subscribes to the "loading" event.
     * This event is emitted when the view is set to "loading" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onLoading(callback) {
        return this.$internals.eventEmitter.on("loading", callback);
    }

    /**
     * Subscribes to the "error" event.
     * This event is emitted when the view is set to the "error" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onError(callback) {
        return this.$internals.eventEmitter.on("error", callback);
    }

    /**
     * Subscribes to the "no_content" event.
     * This event is emitted when the view is set to the "no_content" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onNoContent(callback) {
        return this.$internals.eventEmitter.on("no_content", callback);
    }

    /**
     * Subscribes to the "content" event.
     * This event is emitted when the view is set to the "content" state.
     * The callback is called with the component instance as the this value.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onContent(callback) {
        return this.$internals.eventEmitter.on("content", callback);
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        let textResources = /** @type {typeof textResources_default} */ (
            this.$internals.textResources
        );
        textResources.loading_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.loading_text.textContent = text;
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        let textResources = /** @type {typeof textResources_default} */ (
            this.$internals.textResources
        );
        textResources.error_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.error_text.textContent = text;
    }

    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text) {
        let textResources = /** @type {typeof textResources_default} */ (
            this.$internals.textResources
        );
        textResources.no_content_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.no_content_text.textContent = text;
    }

    /**
     * Renders the table view by setting its inner HTML and connecting its elements.
     * If a response is provided, it will be rendered in the table view.
     * @param {Object} resp - The response to be rendered in the table view.
     * If undefined, the table view will be set to the "loading" state.
     */
    setData(resp) {
        let response = extractRPCResponse(resp);

        if (response instanceof RPCErrorResponse) {
            this.#rows = [];
            this.setErrorText(response.error.message);
            this.setError();
            return;
        }

        if (!(response instanceof RPCPagedResponse)) {
            this.#rows = [];
            this.setErrorText(this.$internals.textResources.invalid_response);
            this.setError();
            return;
        }

        let rows = response.result.data;

        if (rows.length == 0) {
            this.#rows = [];
            this.setNoContent();
            return;
        }

        this.#rows = rows;
        this.setContent();
    }

    #renderRows() {
        if (!this.isConnected) return;
        let refs = this.getRefs();

        refs.section_with_content.innerHTML = "";

        let rows = this.#rows;

        for (let i = 0; i < rows.length; i++) {
            let row = this.#tableRowRenderer(rows[i], i);
            refs.section_with_content.appendChild(row);
        }
    }

    /**
     * Gets the rows of the table view.
     * @returns {T[]} - The rows of the table view.
     */
    get rows() {
        return this.#rows;
    }
}
