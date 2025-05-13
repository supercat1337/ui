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

/**
 * @template T
 */
export class Table extends Component {
    #headerHTML = "";

    /** @type {TableRowRenderer<T>} */
    #tableRowRenderer = defaultTableRowRenderer;

    /** @type {"content"|"no_content"|"error"|"loading"} */
    #state = "loading";

    #error_text = "";
    #loading_text = "Loading...";
    #no_content_text = "No items";

    /** @returns {typeof refsAnnotation} */
    get refs() {
        return this.getRefs();
    }

    /** @type {T[]} */
    #rows = [];

    constructor() {
        super();

        this.toggler = new Toggler();

        let that = this;

        this.toggler.addItem(
            "content",
            (key) => {
                if (!that.isConnected) return false;

                that.#renderRows();
                showElements(that.refs.section_with_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                this.refs.section_with_content.innerHTML = "";
                hideElements(that.refs.section_with_content);
            }
        );

        this.toggler.addItem(
            "no_content",
            (key) => {
                if (!that.isConnected) return false;

                showElements(that.refs.section_without_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                hideElements(that.refs.section_without_content);
            }
        );

        this.toggler.addItem(
            "error",
            (key) => {
                if (!that.isConnected) return false;

                showElements(that.refs.section_error);
            },
            (key) => {
                if (!that.isConnected) return false;

                hideElements(that.refs.section_error);
            }
        );

        this.toggler.addItem(
            "loading",
            (key) => {
                if (!that.isConnected) return false;

                showElements(that.refs.section_loading);
            },
            (key) => {
                if (!that.isConnected) return false;

                hideElements(that.refs.section_loading);
            }
        );

        this.toggler.setActive("loading");

        this.onConnect(() => {
            that.refs.header_row.innerHTML = that.#headerHTML;
            that.refs.error_text.innerHTML = that.#error_text;
            that.refs.loading_text.innerHTML = that.#loading_text;
            that.refs.no_content_text.innerHTML = that.#no_content_text;
        });

        this.onConnect(() => {
            that.toggler.runCallbacks();
        });

        this.setLayout(getHtmlLayout, refsAnnotation);
    }

    /**
     * @param {Object} [config] - config
     * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
     * @param {string} [config.headerHTML] - the table row header string
     */
    setConfig(config) {
        /** @type {{tableRowRenderer:TableRowRenderer<T>, headerHTML:string|null}} */
        let _config = Object.assign(
            {
                tableRowRenderer: defaultTableRowRenderer,
                headerHTML: null,
            },
            config
        );

        if (_config.tableRowRenderer) {
            this.#tableRowRenderer = _config.tableRowRenderer;
        }

        if (_config.headerHTML) {
            this.#headerHTML = _config.headerHTML;
        }
    }

    /**
     * Gets the current state of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current state of the table view
     */
    get state() {
        return this.#state;
    }

    setContent() {
        this.#state = "content";

        this.#renderRows();
        this.toggler.setActive("content");
    }

    setLoading() {
        this.#state = "loading";
        this.toggler.setActive("loading");
    }

    setError() {
        this.#state = "error";
        this.toggler.setActive("error");
    }

    setNoContent() {
        this.#state = "no_content";
        this.toggler.setActive("no_content");
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        this.#loading_text = text;

        if (!this.isConnected) return;
        this.refs.loading_text.innerHTML = text;
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        this.#error_text = text;

        if (!this.isConnected) return;
        this.refs.error_text.innerHTML = text;
    }

    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text) {
        this.#no_content_text = text;

        if (!this.isConnected) return;
        this.refs.no_content_text.innerHTML = text;
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
            this.setErrorText("Invalid response");
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

        this.refs.section_with_content.innerHTML = "";

        let rows = this.#rows;

        for (let i = 0; i < rows.length; i++) {
            let row = this.#tableRowRenderer(rows[i], i);
            this.refs.section_with_content.appendChild(row);
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
