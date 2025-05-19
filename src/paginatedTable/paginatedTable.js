// @ts-check

import { Table } from "../table/table.js";
import { Pagination } from "../pagination/pagination.js";
import { getHtmlLayout } from "./layout.js";
import { Component } from "../component/component.js";

const refsAnnotation = {
    table: HTMLTableElement.prototype,
    pagination: HTMLElement.prototype,
};

/** @typedef {{ table: HTMLTableElement, pagination: HTMLElement}} Refs */

/**
 * @template T
 */
export class PaginatedTable extends Component {
    /** @type {Table<T>} */
    table;

    /** @type {Pagination} */
    pagination;

    constructor() {
        super();

        this.defineSlots("table", "pagination");
        this.setLayout(getHtmlLayout, refsAnnotation);

        this.table = new Table();
        this.pagination = new Pagination();

        this.addChildComponent("table", this.table);
        this.addChildComponent("pagination", this.pagination);
    }

    /** @returns {{ table: HTMLTableElement, pagination: HTMLElement}} */
    getRefs() {
        return super.getRefs();
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

        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "hidden";
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContent() {
        this.table.setContent();

        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will show an error message.
     */
    setError() {
        this.table.setError();
        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
    }

    /**
     * Sets the table view to its "no_content" state.
     * The table view will show a no content message.
     */
    setNoContent() {
        this.table.setNoContent();
        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
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
     * Renders the data view by invoking the render methods of the table view and pagination components.
     * @param {Object} resp - The response to be rendered in the data view.
     * If undefined, the table view and pagination will be set to their "loading" states.
     */
    setData(resp) {
        this.table.setData(resp);
        this.pagination.setData(resp);

        if (!this.isConnected) return;

        let refs = this.getRefs();
        refs.pagination.style.visibility = "visible";
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

    /**
     * Subscribes to the "loading" event of the table view.
     * The event is triggered when the table view is set to its "loading" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onLoading(callback) {
        let that = this;
        return this.table.onLoading(() => {
            callback(that);
        });
    }

    /**
     * Subscribes to the "content" event of the table view.
     * The event is triggered when the table view is set to its "content" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onContent(callback) {
        let that = this;
        return this.table.onContent(() => {
            callback(that);
        });
    }

    /**
     * Subscribes to the "error" event of the table view.
     * The event is triggered when the table view is set to its "error" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onError(callback) {
        let that = this;
        return this.table.onError(() => {
            callback(that);
        });
    }

    /**
     * Subscribes to the "no_content" event of the table view.
     * The event is triggered when the table view is set to its "no_content" state.
     * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
     * The callback function receives the component instance as the this value.
     * @returns {()=>void} A function that removes the event listener.
     */
    onNoContent(callback) {
        let that = this;
        return this.table.onNoContent(() => {
            callback(that);
        });
    }
}
