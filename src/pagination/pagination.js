// @ts-check

import { RPCPagedResponse, extractRPCResponse } from "@supercat1337/rpc";
import { Component } from "../component/component.js";
import { getHtmlLayout } from "./layout.js";

export class Pagination extends Component {
  /** @type {HTMLElement|null} */
  root_element;

  eventsDeclaration = /** @type {const} */ (["page-changed"]);

  /** @type {import("./layout.js").TypePageUrlRenderer|null} */
  page_url_rendrer;

  #current_page = 0;

  pages_count = 0;

  constructor() {
    super();

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
   * Sets the config of the pagination component.
   * @param {{page_url_rendrer:import("./layout.js").TypePageUrlRenderer}} config - The config object to be set.
   * The config object should contain the following properties:
   * - page_url_rendrer {TypePageUrlRenderer} - The page url renderer function.
   */
  setConfig(config) {
    this.page_url_rendrer = config.page_url_rendrer;
  }

  /**
   * Sets the current page of the pagination component.
   * If the root_element element is set, the component will be re-rendered.
   * @param {number} value - the new current page value
   */
  set current_page(value) {
    this.#current_page = value;

    if (this.root_element) {
      this.render();
    }
  }

  /**
   * Gets the current page value.
   * @returns {number} - the current page value
   */
  get current_page() {
    return this.#current_page;
  }

  /**
   * Renders the pagination component with the given current page and total pages count.
   * @param {number} [current_page]
   * @param {number} [pages_count] - if not provided, uses the existing value of pages_count
   */
  #render(current_page, pages_count) {
    if (!this.root_element) {
      throw new Error("Pagination root_element element is not set");
    }

    if (typeof pages_count != "undefined") {
      this.pages_count = pages_count;
    }

    if (typeof current_page != "undefined") {
      this.#current_page = current_page;
    }

    this.root_element.innerHTML = getHtmlLayout(this);

    let page_items = this.root_element.querySelectorAll(".page-item");

    let that = this;

    for (let i = 0; i < page_items.length; i++) {
      page_items[i].addEventListener("click", (e) => {
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

        that.#current_page = parseInt(pageValue);
        that.#render();

        super.emit("page-changed", that.#current_page);
      });
    }
  }

  /**
   * @param {Object} [resp] - response object
   */
  render(resp) {
    let response = extractRPCResponse(resp);

    if (response && response instanceof RPCPagedResponse) {
      this.#render(response.result.current_page, response.result.total_pages);
      return;
    } else {
      this.#render(this.#current_page, this.pages_count);
    }
  }
}
