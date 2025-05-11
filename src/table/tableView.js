// @ts-check

import { getHtmlLayout } from "./layout.js";
import { Component } from "../component/component.js";
import { Widget } from "../widget/widget.js";
import {
    extractRPCResponse,
    RPCErrorResponse,
    RPCPagedResponse,
} from "@supercat1337/rpc";

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

/**
 * @template T
 */
export class TableView extends Component {
    /** @type {HTMLElement|null} */
    root_element = null;

    eventsDeclaration = /** @type {const} */ (["connect", "refsConnected"]);

    /** @type {typeof this.refsAnnotation} */
    refs;

    refsAnnotation = {
        section_with_content: HTMLTableSectionElement.prototype,
        section_without_content: HTMLTableSectionElement.prototype,
        section_error: HTMLTableSectionElement.prototype,
        section_loading: HTMLTableSectionElement.prototype,
        header_row: HTMLTableRowElement.prototype,
        error_text: HTMLElement.prototype,
        loading_text: HTMLElement.prototype,
        no_content_text: HTMLElement.prototype,
    };

    #table_row_header_string = "";

    /** @type {TableRowRenderer<T>} */
    #tableRowRenderer = defaultTableRowRenderer;

    /** @type {"content"|"no_content"|"error"|"loading"} */
    #status = "loading";

    constructor() {
        super();
        this.widget = new Widget();

        let that = this;
        this.on("refsConnected", () => {
            that.widget.connect(that.root_element);
            that.widget.setStatus(that.status);
            that.refs.header_row.innerHTML = that.#table_row_header_string;
        });

        this.setLayout(getHtmlLayout);
    }

    /**
     * Subscribes to an event.
     * @param {typeof this.eventsDeclaration[number]} event - The name of the event to subscribe to.
     * @param {Function} listener - The callback function to be executed when the event is triggered.
     */
    on(event, listener) {
        return super.on(event, listener);
    }

    /**
     * @param {Object} [config] - config
     * @param {HTMLTableElement} [config.root_element] - the table element to render the table view into
     * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
     * @param {string} [config.table_row_header_string] - the table row header string
     */
    setConfig(config) {
        /** @type {{tableRowRenderer:TableRowRenderer<T>, table_row_header_string:string|null}} */
        let _config = Object.assign(
            {
                tableRowRenderer: defaultTableRowRenderer,
                table_row_header_string: null,
            },
            config
        );

        if (_config.tableRowRenderer) {
            this.#tableRowRenderer = _config.tableRowRenderer;
        }

        if (_config.table_row_header_string) {
            this.#table_row_header_string = _config.table_row_header_string;
        }
    }

    /**
     * Gets the current status of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the table view
     */
    get status() {
        return this.#status;
    }

    /**
     * Sets the status of the table view.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the table view
     * @param {string} [text] - the text to be shown in the table view when the status is "error"
     */
    setStatus(status, text) {
        this.#status = status;
        this.widget.setStatus(status, text);
    }

    /**
     * Renders the table view by setting its inner HTML and connecting its elements.
     * If a response is provided, it will be rendered in the table view.
     * @param {Object} resp - The response to be rendered in the table view.
     * If undefined, the table view will be set to the "loading" status.
     */
    render(resp) {
        if (!this.refs) return;

        let response = extractRPCResponse(resp);

        this.refs.section_with_content.innerHTML = "";
        if (response instanceof RPCErrorResponse) {
            this.setStatus("error", response.error.message);
            return;
        }

        if (!(response instanceof RPCPagedResponse)) {
            this.setStatus("error", "Invalid response");
            return;
        }

        let rows = response.result.data;

        if (rows.length == 0) {
            this.setStatus("no_content");
            return;
        }

        this.#renderRows(rows);
        this.setStatus("content");
    }

    /**
     * Renders the given rows in the table view.
     * @param {T[]} rows - The rows to be rendered in the table view.
     */
    #renderRows(rows) {
        if (!this.refs) return;

        this.refs.section_with_content.innerHTML = "";

        for (let i = 0; i < rows.length; i++) {
            let row = this.#tableRowRenderer(rows[i], i);
            this.refs.section_with_content.appendChild(row);
        }
    }
}
