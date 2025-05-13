// @ts-check

import { RPCPagedResponse, extractRPCResponse } from "@supercat1337/rpc";
import { Component } from "../component/component.js";
import { renderPagination, renderPaginationItems } from "./layout.js";

export class Pagination extends Component {
    /** @type {import("./layout.js").TypePageUrlRenderer|null} */
    pageUrlRenderer = null;

    #currentPage = 0;
    #totalPages = 0;

    constructor() {
        super();

        let that = this;
        this.setLayout(() => {
            return renderPagination(
                that.#currentPage,
                that.#totalPages,
                that.pageUrlRenderer
            );
        });

        this.onConnect(() => this.#render());
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
        return this.$internals.eventEmitter.on("page-changed", callback);
    }

    /**
     * Sets the config of the pagination component.
     * @param {{pageUrlRenderer:import("./layout.js").TypePageUrlRenderer}} config - The config object to be set.
     * The config object should contain the following properties:
     * - pageUrlRenderer {TypePageUrlRenderer} - The page url renderer function.
     */
    setConfig(config) {
        this.pageUrlRenderer = config.pageUrlRenderer;
    }

    /**
     * Sets the current page of the pagination component.
     * If the component is mounted, the component will be re-rendered.
     * @param {number} value - the new current page value
     */
    set currentPage(value) {
        this.#currentPage = value;

        this.#render();
    }

    /**
     * Gets the current page value.
     * @returns {number} - the current page value
     */
    get currentPage() {
        return this.#currentPage;
    }

    /**
     * Gets the total number of pages.
     * @returns {number} - the total number of pages
     */
    get totalPages() {
        return this.#totalPages;
    }

    #render() {
        if (!this.isConnected) return;
        let root_element = this.$internals.root;

        root_element.innerHTML = renderPaginationItems(
            this.#currentPage,
            this.#totalPages,
            this.pageUrlRenderer
        );

        let page_items = root_element.querySelectorAll(".page-item");

        let that = this;

        for (let i = 0; i < page_items.length; i++) {
            that.$on(page_items[i], "click", (e) => {
                e.preventDefault();

                if (!(e.target instanceof Element)) return;

                let element = e.target;
                if (element.tagName != "LI") {
                    // @ts-ignore
                    element = element.parentElement;
                    if (!(element instanceof Element)) return;
                }

                let pageValue = element.getAttribute("page-value");
                if (!pageValue) return;

                that.#currentPage = parseInt(pageValue);
                that.#render();

                that.emit("page-changed", that.#currentPage);
            });
        }
    }

    /**
     * @param {Object} [resp] - response object
     */
    setData(resp) {
        let response = extractRPCResponse(resp);

        if (response && response instanceof RPCPagedResponse) {
            this.#currentPage = response.result.current_page;
            this.#totalPages = response.result.total_pages;
        }

        this.#render();
    }
}
