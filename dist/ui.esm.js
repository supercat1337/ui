import { EventEmitter } from '@supercat1337/event-emitter';
import { selectRefs } from 'dom-scope';
import { extractRPCResponse, RPCPagedResponse, RPCErrorResponse } from '@supercat1337/rpc';

// @ts-check

/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 */
function DOMReady(callback) {
  document.readyState === "interactive" || document.readyState === "complete"
    ? callback()
    : document.addEventListener("DOMContentLoaded", callback);
}

/**
 * Escapes the given string from HTML interpolation.
 * Replaces the characters &, <, ", and ' with their corresponding HTML entities.
 * @param {string} unsafe - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe) {
  return unsafe.replace(
    /[&<"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        '"': "&quot;",
        "'": "&#39;", // ' -> &apos; for XML only
      }[m])
  );
}

/**
 * Sets the status of the button to "waiting" (i.e. disabled and showing a spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button while it is waiting.
 */
function ui_button_status_waiting_on(el, text) {
  el.disabled = true;
  el.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' +
    escapeHtml(text);
}

/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button.
 */
function ui_button_status_waiting_off(el, text) {
  el.disabled = false;
  el.innerText = text;
}

/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner)
 * and sets its innerHTML to the given HTML string.
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} html - The HTML string to be set as the button's innerHTML.
 */
function ui_button_status_waiting_off_html(el, html) {
  el.disabled = false;
  el.innerHTML = html;
}

// @ts-check


class Component {

    /**
     * Property that holds the layout function of the component.
     * @type {(this:ThisType)=>string|Node} 
     */
    layout

    /**
     * Emits an event with the given arguments.
     * @param {string} event - The name of the event to emit.
     * @param {...any} data - The arguments to be passed to the event handlers.
     */
    emit(event, ...data) {
        // @ts-ignore
        if (!this.eventEmitter) this["event" + "Emitter"] = new EventEmitter; 

        // @ts-ignore
        this.eventEmitter.emit(event, ...data);
    }

    /**
     * Subscribes to an event.
     * @param {string} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event, callback) {
        // @ts-ignore
        if (!this.eventEmitter) this["event" + "Emitter"] = new EventEmitter; 

        // @ts-ignore
        return this.eventEmitter.on(event, callback);
    }

    /**
     * Sets the root element of the component.
     * @param {HTMLElement} root_element - The root element to set.
     */
    setRoot(root_element) {
        this["root_" + "element"] = root_element;
    }
 
    /**
     * Connects the component to the specified root_element element.
     * @param {HTMLElement} [root_element] - The root_element element to connect the component to.
     * @throws {Error} If the root element is not set.
     */
    connect(root_element) {

        if (root_element) {
            this.setRoot(root_element);
        }

        // @ts-ignore
        if (!this.root_element) {
            throw new Error("Root element is not set");
        }

        // @ts-ignore
        this["re" + "fs"] = selectRefs(this.root_element, this.refsAnnotation);

        // @ts-ignore
        if (!this.refs) {
            throw new Error("Failed to connect DOM");
        }

        this.emit("refsConnected");

        this.emit("connect");
    }

    /**
     * Sets the layout of the component.
     * @param {(component: this) => string|Node} layout - The layout string to be used for the component.
     * The layout string will be called with the component instance as the this value.
     */
    setLayout(layout) {
        let that = this;
        this.layout = () => {
            return layout(that);
        };
    }

    /**
     * Renders the layout of the component.
     * This method is called when the component should re-render its layout.
     * @param {HTMLElement} [root_element] - The root element to render the layout in.
     * @throws {Error} If the root element is not set.
     */
    renderLayout(root_element) {
        if (root_element) {
            this.setRoot(root_element);
        }

        // @ts-ignore
        if (!this.root_element) {
            throw new Error("Root element is not set");
        }
        // @ts-ignore
        this.root_element.innerHTML = "";
        let layout = this.layout();

        if (typeof layout == "string") {
            // @ts-ignore
            this.root_element.innerHTML = layout;
        } else if (layout instanceof Node) {
            // @ts-ignore
            this.root_element.appendChild(layout);
        }

        // connect to DOM

        // @ts-ignore
        this["re" + "fs"] = selectRefs(this.root_element, this.refsAnnotation);
        this.emit("refsConnected");

        this.emit("renderLayout");

        this.emit("connect");
    }

    /**
    * Checks if the data view is connected to a root element.
    * @returns {boolean} True if the data view is connected, false otherwise.
    */
    isConnected() {
        // @ts-ignore
        return !!this.root_element && !!this.refs;
    }
}

// @ts-check

class Widget extends Component {

    /** @type {typeof this.refsAnnotation} */
    refs

    refsAnnotation = {
        section_with_content: HTMLElement.prototype,
        section_without_content: HTMLElement.prototype,
        section_error: HTMLElement.prototype,
        section_loading: HTMLElement.prototype,
        error_text: HTMLElement.prototype,
        loading_text: HTMLElement.prototype,
        no_content_text: HTMLElement.prototype
    };

    /** @type {"content"|"no_content"|"error"|"loading"} */
    #status = "loading"

    constructor() {
        super();
        this.on("connect", () => {
            this.setStatus(this.#status);
        });
    }

    /**
     * Sets the status of the table view.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the table view
     * @param {string} [text] - the text to be shown in the table view when the status is "error"
     */
    setStatus(status, text) {
        this.#status = status;
        if (!this.isConnected()) return;

        switch (this.#status) {
            case "content":

                this.refs.section_with_content.classList.toggle("d-none", false);
                this.refs.section_without_content.classList.toggle("d-none", true);
                this.refs.section_error.classList.toggle("d-none", true);
                this.refs.section_loading.classList.toggle("d-none", true);
                break;
            case "no_content":
                if (typeof text == "string") {
                    this.refs.no_content_text.innerText = text;
                }

                this.refs.section_with_content.classList.toggle("d-none", true);
                this.refs.section_without_content.classList.toggle("d-none", false);
                this.refs.section_error.classList.toggle("d-none", true);
                this.refs.section_loading.classList.toggle("d-none", true);
                break;
            case "error":
                if (typeof text == "string") {
                    this.refs.error_text.innerText = text;
                }

                this.refs.section_with_content.classList.toggle("d-none", true);
                this.refs.section_without_content.classList.toggle("d-none", true);
                this.refs.section_error.classList.toggle("d-none", false);
                this.refs.section_loading.classList.toggle("d-none", true);
                break;
            case "loading":
                if (typeof text == "string") {
                    this.refs.loading_text.innerText = text;
                }

                this.refs.section_with_content.classList.toggle("d-none", true);
                this.refs.section_without_content.classList.toggle("d-none", true);
                this.refs.section_error.classList.toggle("d-none", true);
                this.refs.section_loading.classList.toggle("d-none", false);
                break;
        }
    }

}

// @ts-check

/**
 * @typedef {(page:string)=>string} TypePageUrlRenderer
 */

class PaginationView {
  /**
   *
   * @param {number} current
   * @param {number} total
   * @param {number} delta
   * @param {string} [gap]
   * @returns {string[]}
   */
  static createPaginationArray(current, total, delta = 2, gap = "...") {
    if (total <= 1) return ["1"];

    const center = [current];

    // no longer O(1) but still very fast
    for (let i = 1; i <= delta; i++) {
      center.unshift(current - i);
      center.push(current + i);
    }

    const filteredCenter = center
      .filter((page) => page > 1 && page < total)
      .map((page) => page.toString());

    const includeLeftGap = current > 3 + delta;
    const includeLeftPages = current === 3 + delta;
    const includeRightGap = current < total - (2 + delta);
    const includeRightPages = current === total - (2 + delta);

    if (includeLeftPages) filteredCenter.unshift("2");
    if (includeRightPages) filteredCenter.push((total - 1).toString());

    if (includeLeftGap) filteredCenter.unshift(gap);
    if (includeRightGap) filteredCenter.push(gap);

    let total_str = total.toString();

    return ["1", ...filteredCenter, total_str];
  }

  /**
   *
   * @param {number} current_page
   * @param {number} total
   * @param {TypePageUrlRenderer|null} [page_url_rendrer]
   */
  static renderPaginationItems(current_page, total, page_url_rendrer) {
    let current_page_str = current_page.toString();

    let items = PaginationView.createPaginationArray(current_page, total);
    items = items.map(function (item) {
      let activeClass = current_page_str == item ? "active" : "";

      let page_url = page_url_rendrer ? page_url_rendrer(item) : "#"; //page_url_mask.replace(/:page/, item);

      if (item != "...")
        return `<li class="page-item ${activeClass}" page-value="${item}"><a class="page-link" href="${page_url}">${item}</a></li>`;

      return `<li class="page-item"><span class="page-link">${item}</span></li>`;
    });

    return items.join("\n");
  }

  /**
   *
   * @param {number} current_page
   * @param {number} total
   * @param {TypePageUrlRenderer|null} [page_url_rendrer]
   */
  static renderPagination(current_page, total, page_url_rendrer) {
    let code = PaginationView.renderPaginationItems(
      current_page,
      total,
      page_url_rendrer
    );
    return `
  <ul class="pagination">
  ${code}
  </ul>`;
  }
}

/**
 * Generates an HTML layout string for a pagination component.
 * This layout includes a navigation bar (previous, next, first, last) and a
 * list of page numbers.
 * @param {import('./pagination.js').Pagination} pagination - The pagination object used to generate the layout.
 * @returns {string} The HTML layout string.
 */
function getHtmlLayout$4(pagination) {
  return PaginationView.renderPagination(
    pagination.current_page,
    pagination.pages_count,
    pagination.page_url_rendrer
  );
}

// @ts-check


class Pagination extends Component {
  /** @type {HTMLElement|null} */
  root_element;

  eventsDeclaration = /** @type {const} */ (["page-changed"]);

  /** @type {import("./layout.js").TypePageUrlRenderer|null} */
  page_url_rendrer;

  #current_page = 0;

  pages_count = 0;

  constructor() {
    super();

    this.setLayout(getHtmlLayout$4);
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

    this.root_element.innerHTML = getHtmlLayout$4(this);

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

// @ts-check


function getHtmlLayout$3() {
    let html = /* html */`
<table class="table table-striped">
    <thead>
        <tr ref="header_row">

        </tr>
    </thead>
    <tbody ref="section_with_content" class="d-none">
    </tbody>
    <tbody ref="section_without_content" class="d-none">
        <tr>
            <td ref="no_content_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                No items
            </td>
        </tr>
    </tbody>
    <tbody ref="section_error" class="d-none">
        <tr>
            <td ref="error_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">

            </td>
        </tr>
    </tbody>
    <tbody ref="section_loading" class="">
        <tr>
            <td ref="loading_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                Loading...
            </td>
        </tr>
    </tbody>

</table>
`;

    return html;
}

// @ts-check


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
class ItemList extends Component {
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

    this.setLayout(getHtmlLayout$3);
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

// @ts-check


function getHtmlLayout$2() {
    let html = /* html */`
<table class="table table-striped">
    <thead>
        <tr ref="header_row">

        </tr>
    </thead>
    <tbody ref="section_with_content" class="d-none">
    </tbody>
    <tbody ref="section_without_content" class="d-none">
        <tr>
            <td ref="no_content_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                No items
            </td>
        </tr>
    </tbody>
    <tbody ref="section_error" class="d-none">
        <tr>
            <td ref="error_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">

            </td>
        </tr>
    </tbody>
    <tbody ref="section_loading" class="">
        <tr>
            <td ref="loading_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                Loading...
            </td>
        </tr>
    </tbody>

</table>
`;

    return html;
}

// @ts-check


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
class TableView extends Component {
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

    this.setLayout(getHtmlLayout$2);
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

// @ts-check


/**
 * Generates an HTML layout string for a paginated item list component.
 * The layout includes a title, add and update buttons, a section for the list items, and a pagination section.
 * @param {import('./paginatedItemList.js').PaginatedItemList} paginatedItemList - The paginated item list object used to generate the layout.
 * @returns {string} The HTML layout string.
 */

function getHtmlLayout$1(paginatedItemList) {
    return /* html */ `
<div class="d-flex flex-column" style="min-height: 80vh">
    <div class="flex-grow-1 mt-3">
        <h1 class="display-6">
            <span ref="title">${escapeHtml(paginatedItemList.title)}</span>
            <button class="btn btn-outline-secondary btn-sm ms-2" ref="add_data_button">
                Add
            </button>

            <button class="btn btn-outline-secondary btn-sm ms-2" ref="update_data_button">
                Update
            </button>
        </h1>
    
        <div ref="listItems" scope-ref="listItems">
        </div>

    </div>
</div>
<div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination_section" scope-ref="pagination">
</div>
`;
}

// @ts-check


/**
 * @template T
 */
class PaginatedItemList extends Component {
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

    this.setLayout(getHtmlLayout$1);

    this.on("renderLayout", () => {
      this.itemList.renderLayout(this.refs.itemList);
      this.pagination.renderLayout(this.refs.pagination_section);
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

// @ts-check


/**
 * Generates an HTML layout string for a paginated table component.
 * The layout includes a title, add and update buttons, a table, and a pagination section.
 * @param {import('./paginatedTable.js').PaginatedTable} paginatedTable - The paginated table object used to generate the layout.
 * @returns {string} The HTML layout string.
 */

function getHtmlLayout(paginatedTable) {
    return /* html */ `
<div class="d-flex flex-column" style="min-height: 80vh">
    <div class="flex-grow-1 mt-3">
        <h1 class="display-6">
            <span ref="title">${escapeHtml(paginatedTable.title)}</span>
            <button class="btn btn-outline-secondary btn-sm ms-2" ref="add_data_button">
                Add
            </button>

            <button class="btn btn-outline-secondary btn-sm ms-2" ref="update_data_button">
                Update
            </button>
        </h1>
    
        <table class="table table-striped" ref="table" scope-ref="table">
        </table>

    </div>
</div>
<div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination_section" scope-ref="pagination">
</div>
`;
}

// @ts-check


/**
 * @template T
 */
class PaginatedTable extends Component {
  /** @type {TableView<T>} */
  tableView;

  /** @type {Pagination} */
  pagination;

  /** @type {HTMLElement|null} */
  root_element;

  refsAnnotation = {
    title: HTMLSpanElement.prototype,
    add_data_button: HTMLButtonElement.prototype,
    update_data_button: HTMLButtonElement.prototype,
    table: HTMLTableElement.prototype,
    pagination_section: HTMLElement.prototype,
  };

  /** @type {typeof this.refsAnnotation} */
  refs;

  eventsDeclaration = /** @type {const} */ (["connect", "refsConnected", "renderLayout"]);

  #title = "";

  constructor() {
    super();

    this.tableView = new TableView();
    this.pagination = new Pagination();

    this.setLayout(getHtmlLayout);

    this.on("refsConnected", () => {
      this.refs.title.innerText = this.#title;
    });

    this.on("renderLayout", () => {
      this.tableView.renderLayout(this.refs.table);
      this.pagination.renderLayout(this.refs.pagination_section);
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
   * Gets the current status of the table view.
   * @returns {"content"|"no_content"|"error"|"loading"} - the current status of the table view
   */
  get status() {
    return this.tableView.status;
  }

  /**
   * Sets the status of the table view.
   * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the table view
   * @param {string} [text] - the text to be shown in the table view when the status is "error"
   */
  setStatus(status, text) {
    if (this.isConnected()) {
      this.tableView.setStatus(status, text);
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
   * Renders the data view by invoking the render methods of the table view and pagination components.
   * @param {Object} resp - The response to be rendered in the data view.
   * If undefined, the table view and pagination will be set to their "loading" states.
   */
  render(resp) {
    this.tableView.render(resp);
    this.pagination.render(resp);
  }
}

export { Component, DOMReady, ItemList, PaginatedItemList, PaginatedTable, Pagination, TableView, Widget, escapeHtml, ui_button_status_waiting_off, ui_button_status_waiting_off_html, ui_button_status_waiting_on };
