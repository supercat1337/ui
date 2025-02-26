// @ts-check

import { ItemList } from "../itemList/itemList.js";
import { Pagination } from "../pagination/pagination.js";
import { getHtmlLayout } from "./layout.js";
import { Component } from "../component/component.js";

/**
 * @template T
 */
export class PaginatedItemList extends Component {
  /** @type {ItemList<T>} */
  itemList;

  /** @type {Pagination} */
  pagination;

  /** @type {HTMLElement|null} */
  root_element;

  refsAnnotation = {
    title: HTMLSpanElement.prototype,
    add_data_button: HTMLButtonElement.prototype,
    update_data_button: HTMLButtonElement.prototype,
    itemList: HTMLElement.prototype,
    pagination_section: HTMLElement.prototype,
  };

  /** @type {typeof this.refsAnnotation} */
  refs;

  eventsDeclaration = /** @type {const} */ ([
    "connect",
    "refsConnected",
    "renderLayout",
  ]);

  #title = "";

  constructor() {
    super();

    this.itemList = new ItemList();
    this.pagination = new Pagination();

    this.setLayout(getHtmlLayout);

    this.on("refsConnected", () => {
      this.refs.title.innerText = this.#title;

      this.itemList.setRoot(this.refs.itemList);
      this.pagination.setRoot(this.refs.pagination_section);
    });

    this.on("renderLayout", () => {
      this.itemList.renderLayout();
      this.pagination.renderLayout();
    });
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
   * Gets the current status of the list items.
   * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the list items
   */
  get status() {
    return this.itemList.status;
  }

  /**
   * Sets the status of the list items.
   * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the list items
   * @param {string} [text] - the text to be shown in the list items when the status is "error"
   */
  setStatus(status, text) {
    if (this.isConnected()) {
      this.itemList.setStatus(status, text);
    }
  }

  /**
   * Sets the title of the data view.
   * @param {string} text - The new title text.
   */
  set title(text) {
    this.#title = text;
    if (this.isConnected()) {
      this.refs.title.innerText = this.#title;
    }
  }

  /**
   * Gets the title of the data view.
   * @returns {string} The current title text.
   */
  get title() {
    return this.#title;
  }

  /**
   * Renders the data view by invoking the render methods of the list items and pagination components.
   * @param {Object} resp - The response to be rendered in the data view.
   * If undefined, the list items and pagination will be set to their "loading" states.
   */
  render(resp) {
    this.itemList.render(resp);
    this.pagination.render(resp);
  }
}
