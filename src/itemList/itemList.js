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
 * Default list item renderer function.
 * @param {Object} data - The row data.
 * @param {number} index - The row index.
 * @returns {HTMLDivElement} The rendered list item.
 */
function defaultListItemRenderer(data, index) {
  let row = document.createElement("div");
  row.setAttribute("data-row-index", index.toString());

  let cell = document.createElement("span");
  cell.setAttribute("ref", "index");
  cell.innerText = (index + 1).toString();
  row.appendChild(cell);

  for (let key in data) {
    let cell = document.createElement("span");
    cell.setAttribute("ref", key);
    cell.innerText = data[key];
    row.appendChild(cell);
  }

  return row;
}

/**
 * @template T
 * @typedef {(row:T, index:number)=>HTMLDivElement} ListItemRenderer
 */

/**
 * @template T
 */
export class ItemList extends Component {
  /** @type {HTMLElement|null} */
  root_element = null;

  eventsDeclaration = /** @type {const} */ (["connect"]);

  /** @type {typeof this.refsAnnotation} */
  refs;

  refsAnnotation = {
    section_with_content: HTMLDivElement.prototype,
    section_without_content: HTMLDivElement.prototype,
    section_error: HTMLDivElement.prototype,
    section_loading: HTMLDivElement.prototype,
    header_row: HTMLDivElement.prototype,
    error_text: HTMLElement.prototype,
    loading_text: HTMLElement.prototype,
    no_content_text: HTMLElement.prototype,
  };

  list_row_header_string = "";

  /** @type {ListItemRenderer<T>} */
  #listItemRenderer = defaultListItemRenderer;

  /** @type {"content"|"no_content"|"error"|"loading"} */
  #status = "loading";

  constructor() {
    super();
    this.widget = new Widget();

    let that = this;
    this.on("connect", () => {
      if (that.root_element) {
        that.widget.connect(that.root_element);
      }

      that.widget.setStatus(that.status);
      that.refs.header_row.innerHTML = that.list_row_header_string;
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
   * @param {HTMLElement} [config.root_element] - the list element to render the list view into
   * @param {ListItemRenderer<T>} [config.listItemRenderer] - the list item renderer function
   * @param {string} [config.list_row_header_string] - the list item header string
   */
  setConfig(config) {
    /** @type {{listItemRenderer:ListItemRenderer<T>, list_row_header_string:string|null}} */
    let _config = Object.assign(
      {
        listItemRenderer: defaultListItemRenderer,
        list_row_header_string: null,
      },
      config
    );

    if (_config.listItemRenderer) {
      this.#listItemRenderer = _config.listItemRenderer;
    }

    if (_config.list_row_header_string) {
      this.list_row_header_string = _config.list_row_header_string;
    }
  }

  /**
   * Gets the current status of the list view.
   * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the list view
   */
  get status() {
    return this.#status;
  }

  /**
   * Sets the header string for the list items.
   * @param {string} string - The header string to be set for the list items.
   */
  setListItemHeaderString(string) {
    this.list_row_header_string = string;
  }

  /**
   * Sets the status of the list view.
   * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the list view
   * @param {string} [text] - the text to be shown in the list view when the status is "error"
   */
  setStatus(status, text) {
    this.#status = status;
    this.widget.setStatus(status, text);
  }

  /**
   * Renders the list view by setting its inner HTML and connecting its elements.
   * If a response is provided, it will be rendered in the list view.
   * @param {Object} resp - The response to be rendered in the list view.
   * If undefined, the list view will be set to the "loading" status.
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

    this.#renderItems(rows);
    this.setStatus("content");
  }

  /**
   * Renders the given rows in the list view.
   * @param {T[]} rows - The rows to be rendered in the list view.
   */
  #renderItems(rows) {
    if (!this.refs) return;

    this.refs.section_with_content.innerHTML = "";

    for (let i = 0; i < rows.length; i++) {
      let row = this.#listItemRenderer(rows[i], i);
      this.refs.section_with_content.appendChild(row);
    }
  }
}
