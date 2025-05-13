// @ts-check

import { Table } from "../table/table.js";
import { Pagination } from "../pagination/pagination.js";
import { getHtmlLayout } from "./layout.js";
import { Component } from "../component/component.js";

/**
 * @template T
 */
export class PaginatedTable extends Component {
    /** @type {Table<T>} */
    tableView;

    /** @type {Pagination} */
    pagination;

    refsAnnotation = {
        title: HTMLSpanElement.prototype,
        add_data_button: HTMLButtonElement.prototype,
        update_data_button: HTMLButtonElement.prototype,
        table: HTMLTableElement.prototype,
        pagination_section: HTMLElement.prototype,
    };

    #title = "";

    constructor() {
        super();

        this.defineSlots("table", "pagination");
        this.setLayout(getHtmlLayout);

        this.table = new Table();
        this.pagination = new Pagination();

        this.addChildComponent("table", this.table);
        this.addChildComponent("pagination", this.pagination);

        let that = this;
        this.onConnect(() => {
            that.refs.title.innerText = that.#title;
        });
    }

    /** @returns {typeof this.refsAnnotation} */
    get refs() {
        return this.getRefs();
    }

    /**
     * Gets the current status of the table view.
     * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the table view
     */
    get state() {
        return this.table.state;
    }

    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message.
     */
    setLoading() {
        this.table.setLoading();
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent() {
        this.table.setContent();
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will show an error message.
     */
    setError() {
        this.table.setError();
    }

    /**
     * Sets the table view to its "no_content" state.
     * The table view will show a no content message.
     */
    setNoContent() {
        this.table.setNoContent();
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        this.table.setLoadingText(text);
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        this.table.setErrorText(text);
    }

    /**
     * Sets the text of the no content message in the table view.
     * @param {string} text - The text to be shown as the no content message.
     */
    setNoContentText(text) {
        this.table.setNoContentText(text);
    }

    /**
     * Sets the title of the data view.
     * @param {string} text - The new title text.
     */
    set title(text) {
        this.#title = text;
        if (!this.isConnected) return;

        this.refs.title.innerText = this.#title;
    }

    /**
     * Gets the title of the data view.
     * @returns {string} The current title text.
     */
    get title() {
        return this.#title;
    }

    /**
     * Renders the data view by invoking the render methods of the table view and pagination components.
     * @param {Object} resp - The response to be rendered in the data view.
     * If undefined, the table view and pagination will be set to their "loading" states.
     */
    setData(resp) {
        this.table.setData(resp);
        this.pagination.setData(resp);
    }

    /**
     * Subscribes to the "page-changed" event of the pagination component.
     * The event is triggered when the user changes the page by clicking on a page number or
     * by clicking on the previous or next buttons.
     * @param {(index: number)=>void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the index of the new page as the first argument.
     * @returns {Function} A function that removes the event listener.
     */
    onPageChanged(callback) {
        return this.pagination.onPageChanged(callback);
    }
}
