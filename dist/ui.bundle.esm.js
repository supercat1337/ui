// src/css-d-none-support.js
function enableDNoneSupport() {
  const css = (
    /* css */
    `
.d-none {
    display: none !important;
}
`
  );
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}

// src/utils.js
function DOMReady(callback) {
  document.readyState === "interactive" || document.readyState === "complete" ? callback() : document.addEventListener("DOMContentLoaded", callback);
}
function escapeHtml(unsafe) {
  return unsafe.replace(
    /[&<"']/g,
    (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      '"': "&quot;",
      "'": "&#39;"
      // ' -> &apos; for XML only
    })[m]
  );
}
function ui_button_status_waiting_on(el, text) {
  el.disabled = true;
  el.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' + escapeHtml(text);
}
function ui_button_status_waiting_off(el, text) {
  el.disabled = false;
  el.innerText = text;
}
function ui_button_status_waiting_off_html(el, html) {
  el.disabled = false;
  el.innerHTML = html;
}
function scrollToTop(element) {
  element.scrollTop = 0;
}
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}
function hideElements(...elements) {
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    element.classList.add("d-none");
  }
}
function showElements(...elements) {
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    element.classList.remove("d-none");
  }
}
function showSpinnerInButton(button, customClassName = null) {
  if (button.getElementsByClassName("spinner-border")[0]) return;
  let spinner = document.createElement("span");
  if (customClassName) {
    spinner.className = customClassName;
  } else {
    spinner.className = "spinner-border spinner-border-sm";
  }
  button.prepend(spinner);
}
function removeSpinnerFromButton(button) {
  let spinner = button.querySelector(".spinner-border");
  if (spinner) spinner.remove();
}
function unixtime() {
  return Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3);
}
function isDarkMode() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return true;
  }
  return false;
}
function getDefaultLanguage() {
  let m = navigator.language.match(/^[a-z]+/);
  let lang = m ? m[0] : "en";
  return lang;
}
function formatBytes(bytes, decimals = 2, lang, sizes) {
  lang = lang || "en";
  sizes = sizes || {
    en: ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  };
  const get_size = sizes[lang] ? sizes[lang] : sizes["en"];
  if (bytes === 0) {
    return "0 " + get_size[0];
  }
  let minus_str = bytes < 0 ? "-" : "";
  bytes = Math.abs(bytes);
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return minus_str + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + get_size[i];
}
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
function formatDateTime(timestamp) {
  var t = new Date(timestamp * 1e3);
  return `${t.toLocaleDateString("en-GB")} ${t.toLocaleTimeString("en-GB")}`;
}
function formatDate(timestamp) {
  var t = new Date(timestamp * 1e3);
  return `${t.toLocaleDateString("en-GB")}`;
}
var Toggler = class {
  /** @type {Map<string, { isActive: boolean, on: (itemName:string) => void, off: (itemName:string) => void }>} */
  items = /* @__PURE__ */ new Map();
  /** @type {string} */
  #active;
  /**
   * Adds an item to the toggler.
   * @param {string} itemName - The name of the item to be added.
   * @param {(itemName:string) => void} on - The function to be called when the item is set as active.
   * @param {(itemName:string) => void} off - The function to be called when the item is set as inactive.
   */
  addItem(itemName, on, off) {
    if (this.items.has(itemName)) {
      throw new Error("Item already exists");
    }
    this.items.set(itemName, { isActive: false, on, off });
  }
  /**
   * Removes the item with the given name from the toggler.
   * @param {string} itemName - The name of the item to be removed.
   */
  removeItem(itemName) {
    if (this.#active === itemName) {
      this.#active = "";
    }
    this.items.delete(itemName);
  }
  /**
   * Sets the active item to the given item name.
   * @param {string} active - The name of the item to be set as active.
   * @throws {Error} If the item does not exist in the toggler.
   */
  setActive(active) {
    if (!this.items.has(active)) {
      throw new Error("Item not found");
    }
    if (this.#active === active) {
      return;
    }
    for (const [key, value] of this.items) {
      if (key === active) {
        this.#active = key;
        if (!value.isActive) {
          value.isActive = true;
          value.on(key);
        }
      } else {
        if (value.isActive) {
          value.off(key);
        }
        value.isActive = false;
      }
    }
  }
  /**
   * Runs the callbacks for all items in the toggler.
   * If an item is active, the "on" callback is called with the item name as the argument.
   * If an item is inactive, the "off" callback is called with the item name as the argument.
   */
  runCallbacks() {
    for (const [key, value] of this.items) {
      if (value.isActive) {
        value.on(key);
      } else {
        value.off(key);
      }
    }
  }
};

// node_modules/dom-scope/dist/dom-scope.esm.js
var SCOPE_ATTR_NAME = "scope-ref";
var SCOPE_AUTO_NAME_PREFIX = "$";
var REF_ATTR_NAME = "ref";
function isScopeElement(element, settings) {
  var value;
  if (settings.is_scope_element) {
    value = settings.is_scope_element(element, settings);
  } else {
    value = element.getAttribute(SCOPE_ATTR_NAME);
  }
  if (value === null) return false;
  return value;
}
function getConfig(settings) {
  let init_data = {
    ref_attr_name: REF_ATTR_NAME,
    window: globalThis.window,
    is_scope_element: void 0,
    include_root: false
  };
  let config = Object.assign({}, init_data, settings);
  if (!config.window) {
    throw new Error("settings.window is not defined");
  }
  return config;
}
function selectRefsExtended(root_element, custom_callback, settings = {}) {
  var refs = {};
  var scope_refs = {};
  var unnamed_scopes = [];
  var config = getConfig(settings);
  function callback(currentNode) {
    var ref_name = currentNode.getAttribute(config.ref_attr_name);
    if (ref_name != null) {
      if (ref_name != "") {
        if (!refs[ref_name]) {
          refs[ref_name] = currentNode;
        } else {
          if (globalThis.window) {
            console.warn(`Element has reference #${ref_name} which is already used
`, `
element: `, currentNode, `
reference #${ref_name}: `, refs[ref_name], `
scope root: `, root_element);
          } else {
            console.warn(`Element has reference #${ref_name} which is already used
`);
          }
        }
      }
    }
    if (currentNode != root_element) {
      var ref_scope_name = isScopeElement(currentNode, config);
      if (typeof ref_scope_name != "string") return;
      if (ref_scope_name != "") {
        if (!scope_refs[ref_scope_name]) {
          scope_refs[ref_scope_name] = currentNode;
        } else {
          if (globalThis.window) {
            console.warn(`scope #${ref_scope_name} is already used`, currentNode);
          } else {
            console.warn(`scope #${ref_scope_name} is already used`);
          }
          unnamed_scopes.push(currentNode);
        }
      } else {
        unnamed_scopes.push(currentNode);
      }
    }
    if (custom_callback) custom_callback(currentNode);
  }
  if (config.include_root === true) {
    if (root_element instanceof config.window.HTMLElement) {
      refs.root = /** @type {HTMLElement} */
      root_element;
      if (custom_callback) {
        custom_callback(
          /** @type {HTMLElement} */
          root_element
        );
      }
    }
  }
  walkDomScope(root_element, callback, config);
  var index = 0;
  unnamed_scopes.forEach((unnamed_scope_element) => {
    while (scope_refs[SCOPE_AUTO_NAME_PREFIX + index.toString()]) {
      index++;
    }
    scope_refs[SCOPE_AUTO_NAME_PREFIX + index.toString()] = unnamed_scope_element;
  });
  return { refs, scope_refs };
}
function walkDomScope(root_element, callback, settings) {
  var config = getConfig(settings);
  function scope_filter(_node) {
    var node = (
      /** @type {HTMLElement} */
      _node
    );
    var parentElement = node.parentElement;
    if (parentElement && parentElement != root_element && isScopeElement(parentElement, config) !== false) {
      return (
        /* NodeFilter.FILTER_REJECT */
        2
      );
    }
    return (
      /* NodeFilter.FILTER_ACCEPT */
      1
    );
  }
  const tw = config.window.document.createTreeWalker(
    root_element,
    /* NodeFilter.SHOW_ELEMENT */
    1,
    scope_filter
  );
  var currentNode;
  if (config.include_root === true) {
    if (root_element instanceof config.window.HTMLElement) {
      callback(
        /** @type {HTMLElement} */
        root_element
      );
    }
  }
  while (currentNode = /** @type {HTMLElement} */
  tw.nextNode()) {
    callback(currentNode);
  }
}
function checkRefs(refs, annotation) {
  for (let prop in annotation) {
    let ref = refs[prop];
    if (!ref) {
      throw new Error(`Missing ref: ${prop}`);
    }
    const type = typeof annotation[prop] === "function" ? annotation[prop].prototype : annotation[prop];
    if (type.isPrototypeOf(ref) === false) {
      throw new Error(`The ref "${prop}" must be an instance of ${type.constructor.name} (actual: ${ref.constructor.name})`);
    }
  }
}
function createFromHTML(html, options) {
  if (typeof html !== "string") {
    throw new Error("html must be a string");
  }
  let wnd = options?.window || globalThis.window;
  if (!wnd) {
    throw new Error("window is not defined");
  }
  const doc = (
    /** @type {Document} */
    wnd.document
  );
  const template = doc.createElement("template");
  template.innerHTML = html;
  return template.content;
}

// node_modules/@supercat1337/event-emitter/dist/event-emitter.esm.js
var EventEmitter = class {
  /** @type {Object.<string, Function[]>} */
  events = {};
  /**
   * on is used to add a callback function that's going to be executed when the event is triggered
   * @param {T|"#has-listeners"|"#no-listeners"} event
   * @param {Function} listener
   * @returns {()=>void}
   */
  on(event, listener) {
    if (typeof this.events[event] !== "object") {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    let that = this;
    let unsubscriber = function() {
      that.removeListener(event, listener);
    };
    if (!/^(#has-listeners|#no-listeners)$/.test(event) && this.events[event].length == 1) {
      this.emit("#has-listeners", event);
    }
    return unsubscriber;
  }
  /**
   * Remove an event listener from an event
   * @param {T|"#has-listeners"|"#no-listeners"} event
   * @param {Function} listener
   */
  removeListener(event, listener) {
    var idx;
    if (typeof this.events[event] === "object") {
      idx = this.events[event].indexOf(listener);
      if (idx > -1) {
        this.events[event].splice(idx, 1);
        if (!/^(#has-listeners|#no-listeners)$/.test(event) && this.events[event].length == 0) {
          this.emit("#no-listeners", event);
        }
      }
    }
  }
  /**
   * emit is used to trigger an event
   * @param {T|"#has-listeners"|"#no-listeners"} event
   */
  emit(event) {
    if (typeof this.events[event] !== "object") return;
    var i, listeners, length, args = [].slice.call(arguments, 1);
    listeners = this.events[event].slice();
    length = listeners.length;
    for (i = 0; i < length; i++) {
      try {
        listeners[i].apply(this, args);
      } catch (e) {
        console.error(event, args);
        console.error(e);
      }
    }
  }
  /**
   * Add a one-time listener
   * @param {T|"#has-listeners"|"#no-listeners"} event
   * @param {Function} listener
   * @returns {()=>void}
   */
  once(event, listener) {
    return this.on(event, function g() {
      this.removeListener(event, g);
      listener.apply(this, arguments);
    });
  }
  /**
   * Wait for an event to be emitted
   * @param {T} event
   * @param {number} [max_wait_ms=0] - Maximum time to wait in ms. If 0, the function will wait indefinitely.
   * @returns {Promise<boolean>} - Resolves with true if the event was emitted, false if the time ran out.
   */
  waitForEvent(event, max_wait_ms = 0) {
    return new Promise((resolve) => {
      let timeout;
      let unsubscriber = this.on(event, () => {
        if (max_wait_ms > 0) {
          clearTimeout(timeout);
        }
        unsubscriber();
        resolve(true);
      });
      if (max_wait_ms > 0) {
        timeout = setTimeout(() => {
          unsubscriber();
          resolve(false);
        }, max_wait_ms);
      }
    });
  }
  /**
   * Wait for any of the specified events to be emitted
   * @param {T[]} events - Array of event names to wait for
   * @param {number} [max_wait_ms=0] - Maximum time to wait in ms. If 0, the function will wait indefinitely.
   * @returns {Promise<boolean>} - Resolves with true if any event was emitted, false if the time ran out.
   */
  waitForAnyEvent(events, max_wait_ms = 0) {
    return new Promise((resolve) => {
      let timeout;
      let unsubscribers = [];
      const main_unsubscriber = () => {
        if (max_wait_ms > 0) {
          clearTimeout(timeout);
        }
        unsubscribers.forEach((unsubscriber) => {
          unsubscriber();
        });
        resolve(true);
      };
      events.forEach((event) => {
        unsubscribers.push(this.on(event, main_unsubscriber));
      });
      if (max_wait_ms > 0) {
        timeout = setTimeout(() => {
          main_unsubscriber();
          resolve(false);
        }, max_wait_ms);
      }
    });
  }
  /**
   * Clear all events
   */
  clear() {
    this.events = {};
  }
  /**
   * Destroys the event emitter, clearing all events and listeners.
   * @alias clear
   */
  destroy() {
    this.clear();
  }
  /**
   * Clears all listeners for a specified event.
   * @param {T|"#has-listeners"|"#no-listeners"} event - The event for which to clear all listeners.
   */
  clearEventListeners(event) {
    let listeners = this.events[event] || [];
    let listenersCount = listeners.length;
    if (listenersCount > 0) {
      this.events[event] = [];
      this.emit("#no-listeners", event);
    }
  }
  /**
   * onHasEventListeners() is used to subscribe to the "#has-listeners" event. This event is emitted when the number of listeners for any event (except "#has-listeners" and "#no-listeners") goes from 0 to 1.
   * @param {Function} callback
   * @returns {()=>void}
   */
  onHasEventListeners(callback) {
    return this.on("#has-listeners", callback);
  }
  /**
   * onNoEventListeners() is used to subscribe to the "#no-listeners" event. This event is emitted when the number of listeners for any event (except "#has-listeners" and "#no-listeners") goes from 1 to 0.
   * @param {Function} callback
   * @returns {()=>void}
   */
  onNoEventListeners(callback) {
    return this.on("#no-listeners", callback);
  }
};

// src/component/slot-manager.js
var SlotManager = class {
  /** @type {Set<string>} */
  #definedSlotNames = /* @__PURE__ */ new Set();
  /** @type {Map<string, Set<Component>>} */
  #slotChildrenMap = /* @__PURE__ */ new Map();
  /** @type {Set<Component>}  */
  #children = /* @__PURE__ */ new Set();
  /** @type {Component} */
  #component;
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.#component = component;
  }
  /**
   * Defines the names of the slots in the component.
   * The slots are declared in the component's template using the "scope-ref" attribute.
   * The slot names are used to access the children components of the component.
   * @param {...string} slotNames - The names of the slots.
   */
  defineSlots(...slotNames) {
    let keysToDelete = [];
    let currentSlotNames = Array.from(this.#definedSlotNames);
    for (let i = 0; i < currentSlotNames.length; i++) {
      if (slotNames.indexOf(currentSlotNames[i]) == -1) {
        keysToDelete.push(currentSlotNames[i]);
      }
    }
    for (let i = 0; i < keysToDelete.length; i++) {
      this.removeSlot(keysToDelete[i]);
    }
    for (let i = 0; i < slotNames.length; i++) {
      if (!this.#slotChildrenMap.has(slotNames[i])) {
        this.#slotChildrenMap.set(slotNames[i], /* @__PURE__ */ new Set());
      }
    }
    this.#definedSlotNames = new Set(slotNames);
  }
  /**
   * Removes the given slot name from the component.
   * This method first unmounts all children components of the given slot name,
   * then removes the slot name from the component's internal maps.
   * @param {string} slotName - The name of the slot to remove.
   */
  removeSlot(slotName) {
    let slotChildren = this.#slotChildrenMap.get(slotName);
    if (slotChildren) {
      let children = Array.from(slotChildren);
      for (let i = 0; i < children.length; i++) {
        this.#component.removeChildComponent(children[i]);
        children[i].unmount();
        this.#children.delete(children[i]);
      }
      this.#slotChildrenMap.delete(slotName);
    }
    this.#definedSlotNames.delete(slotName);
  }
  /**
   * Returns an array of slot names defined in the component.
   * @type {string[]}
   */
  get slotNames() {
    let arr = Array.from(this.#definedSlotNames);
    return arr;
  }
  /**
   * Checks if the given slot name exists in the component.
   * @param {string} slotName - The name of the slot to check.
   * @returns {boolean} True if the slot exists, false otherwise.
   */
  slotExists(slotName) {
    return this.#definedSlotNames.has(slotName);
  }
  /**
   * Adds a child component to a slot.
   * @param {string} slotName - The name of the slot to add the component to.
   * @param {...Component} children - The components to add to the slot.
   * @throws {Error} If the slot does not exist.
   */
  addChildComponent(slotName, ...children) {
    if (this.slotExists(slotName) === false) {
      throw new Error(`Slot "${slotName}" does not exist`);
    }
    let childrenSet = this.#slotChildrenMap.get(slotName);
    if (!childrenSet) {
      childrenSet = /* @__PURE__ */ new Set();
      this.#slotChildrenMap.set(slotName, childrenSet);
    }
    for (let i = 0; i < children.length; i++) {
      this.#children.add(children[i]);
      childrenSet.add(children[i]);
    }
  }
  /**
   * Removes the given child component from all slots.
   * @param {Component} childComponent - The child component to remove.
   */
  removeChildComponent(childComponent) {
    this.#children.delete(childComponent);
    for (let [slotName, childrenSet] of this.#slotChildrenMap) {
      if (!childrenSet.has(childComponent)) continue;
      childrenSet.delete(childComponent);
      break;
    }
  }
  /**
   * Returns the children components of the component.
   * @type {Set<Component>}
   */
  get children() {
    return this.#children;
  }
  /**
   * Mounts all children components of the given slot name to the DOM.
   * The children components are mounted to the slot ref element with the "append" mode.
   * If no slot name is given, all children components of all slots are mounted to the DOM.
   * @param {string} [slotName] - The name of the slot to mount children components for.
   */
  mountChildren(slotName) {
    let slotNames = slotName ? [slotName] : Array.from(this.#definedSlotNames);
    for (let i = 0; i < slotNames.length; i++) {
      let children = Array.from(
        this.#slotChildrenMap.get(slotNames[i]) || []
      );
      let slotRef = this.#component.$internals.slotRefs[slotNames[i]];
      if (slotRef)
        for (let y = 0; y < children.length; y++) {
          if (children[y].isCollapsed == false) {
            children[y].mount(slotRef, "append");
          }
        }
    }
  }
  /**
   * Unmounts all children components of the given slot name.
   * This method iterates over the children components of the given slot name and calls their unmount method.
   * @param {string} [slotName] - The name of the slot to unmount the children components for.
   * if no slot name is given, all children components of all slots are unmounted.
   */
  unmountChildren(slotName) {
    let slotNames = slotName ? [slotName] : Array.from(this.#definedSlotNames);
    for (let i = 0; i < slotNames.length; i++) {
      let children = Array.from(
        this.#slotChildrenMap.get(slotNames[i]) || []
      );
      for (let y = 0; y < children.length; y++) {
        children[y].unmount();
      }
    }
  }
};

// src/component/component.js
function onConnectDefault(component) {
  component.reloadText();
  try {
    component.connectedCallback();
  } catch (e) {
    console.error("Error in connectedCallback:", e);
  }
}
function onUnmountDefault(component) {
  try {
    component.disconnectedCallback();
  } catch (e) {
    console.error("Error in disconnectedCallback:", e);
  }
}
var Component = class {
  /** @type {{eventEmitter: EventEmitter, disconnectController: AbortController, root: HTMLElement|null, textUpdateFunction: TextUpdateFunction|null, textResources: {[key:string]:any}, refs: {[key:string]:HTMLElement}, slotRefs: {[key:string]:HTMLElement}, parentComponent: Component|null, parentSlotName: string}} */
  $internals = {
    eventEmitter: new EventEmitter(),
    /** @type {AbortController} */
    disconnectController: new AbortController(),
    /** @type {HTMLElement|null} */
    root: null,
    /** @type {TextUpdateFunction|null} */
    textUpdateFunction: null,
    /** @type {{[key:string]:any}}  */
    textResources: {},
    /** @type {{[key:string]:HTMLElement}} */
    refs: {},
    /** @type {{[key:string]:HTMLElement}} */
    slotRefs: {},
    parentComponent: null,
    parentSlotName: ""
  };
  /** @type {LayoutFunction|string|null} */
  #layout = null;
  /** @type {LayoutFunction|string|null} */
  layout;
  /** @type {string[]|undefined} */
  slots;
  /** @type {import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation|undefined} */
  refsAnnotation;
  /** @type {Node|null} */
  #template = null;
  #connected = false;
  slotManager = new SlotManager(this);
  isCollapsed = false;
  constructor() {
    this.onConnect(onConnectDefault);
    this.onUnmount(onUnmountDefault);
  }
  /**
   * Reloads the text content of the component by calling the text update function if it is set.
   * This method is useful when the component's text content depends on external data that may change.
   * @returns {void}
   */
  reloadText() {
    if (this.$internals.textUpdateFunction) {
      this.$internals.textUpdateFunction(this);
    }
  }
  /**
   * Sets the text update function for the component.
   * The text update function is a function that is called when the reloadText method is called.
   * The function receives the component instance as the this value.
   * @param {TextUpdateFunction|null} func - The text update function to set.
   * @returns {void}
   */
  setTextUpdateFunction(func) {
    this.$internals.textUpdateFunction = func;
  }
  #loadTemplate() {
    if (this.layout) {
      this.#layout = this.layout;
      this.layout = null;
    }
    let layout = this.#layout || null;
    if (layout == null) return;
    let template;
    if (typeof layout === "function") {
      let _template = layout(this);
      if (_template instanceof Node) {
        template = _template;
      } else {
        template = createFromHTML(_template);
      }
    } else {
      template = createFromHTML(layout);
    }
    let count = 0;
    for (let i = 0; i < template.childNodes.length; i++) {
      if (template.childNodes[i].nodeType === 1) count++;
    }
    if (count !== 1) {
      throw new Error("Layout must have exactly one root element");
    }
    this.#template = template;
  }
  /**
   * Sets the layout of the component by assigning the template content.
   * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
   * @param {import("dom-scope/dist/dom-scope.esm.js").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
   * The function is called with the component instance as the this value.
   */
  setLayout(layout, annotation) {
    this.#layout = layout;
    this.#template = null;
    if (annotation) {
      this.refsAnnotation = annotation;
    }
  }
  /**
   * Returns the refs object.
   * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
   * The refs object is only available after the component has been connected to the DOM.
   * @returns {any} The refs object.
   */
  getRefs() {
    if (!this.#connected) {
      throw new Error("Component is not connected to the DOM");
    }
    return this.$internals.refs;
  }
  /**
   * Subscribes to a specified event.
   * @param {string} event - The name of the event to subscribe to.
   * @param {Function} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  on(event, callback) {
    return this.$internals.eventEmitter.on(event, callback);
  }
  /**
   * Emits an event with the given arguments.
   * @param {string} event - The name of the event to emit.
   * @param {...any} args - The arguments to be passed to the event handlers.
   */
  emit(event, ...args) {
    return this.$internals.eventEmitter.emit(event, this, ...args);
  }
  /**
   * Emits the "beforeConnect" event.
   * This event is emitted just before the component is connected to the DOM.
   * @param {(component: this, clonedTemplate: Node) => void} callback - The callback function to be executed when the event is triggered.
   * The callback is called with the component instance as the this value. The second argument is the clonedTemplate - the cloned template node.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onBeforeConnect(callback) {
    return this.on("beforeConnect", callback);
  }
  /**
   * Subscribes to the "connect" event.
   * This event is emitted just after the component is connected to the DOM.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * The callback is called with the component instance as the this value.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onConnect(callback) {
    return this.on("connect", callback);
  }
  /**
   * Subscribes to the "mount" event.
   * This event is emitted after the component is mounted to the DOM.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onMount(callback) {
    return this.on("mount", callback);
  }
  /**
   * Subscribes to the "beforeUnmount" event.
   * This event is emitted just before the component is unmounted from the DOM.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onBeforeUnmount(callback) {
    return this.on("beforeUnmount", callback);
  }
  /**
   * Subscribes to the "unmount" event.
   * This event is emitted after the component is unmounted from the DOM.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onUnmount(callback) {
    return this.on("unmount", callback);
  }
  /**
   * Checks if the component is connected to a root element.
   * @returns {boolean} True if the component is connected, false otherwise.
   */
  get isConnected() {
    return this.#connected;
  }
  /**
   * Connects the component to the specified componentRoot element.
   * Initializes the refs object and sets the component's root element.
   * Emits "connect" event through the event emitter.
   * @param {HTMLElement} componentRoot - The root element to connect the component to.
   */
  connect(componentRoot) {
    if (this.#connected === true) {
      throw new Error("Component is already connected");
    }
    this.$internals.root = componentRoot;
    let { refs, scope_refs } = selectRefsExtended(componentRoot);
    if (this.refsAnnotation) {
      checkRefs(refs, this.refsAnnotation);
    }
    this.$internals.refs = refs;
    this.$internals.slotRefs = scope_refs;
    this.$internals.disconnectController = new AbortController();
    this.#connected = true;
    this.slotManager.mountChildren();
    this.emit("connect");
  }
  /**
   * Disconnects the component from the DOM.
   * Sets the component's #connected flag to false.
   * This method does not emit any events.
   */
  disconnect() {
    if (this.#connected === false) return;
    this.#connected = false;
    this.$internals.disconnectController.abort();
    this.$internals.refs = {};
    this.$internals.slotRefs = {};
  }
  /**
   * This method is called when the component is connected to the DOM.
   * It is an empty method and is intended to be overridden by the user.
   * @memberof Component
   */
  connectedCallback() {
  }
  /**
   * This method is called when the component is disconnected from the DOM.
   * It is an empty method and is intended to be overridden by the user.
   * @memberof Component
   */
  disconnectedCallback() {
  }
  /**
   * Mounts the component to the specified container.
   * @param {Element} container - The container to mount the component to.
   * @param {"replace"|"append"|"prepend"} [mode="replace"] - The mode to use to mount the component.
   * If "replace", the container's content is replaced.
   * If "append", the component is appended to the container.
   * If "prepend", the component is prepended to the container.
   */
  mount(container, mode = "replace") {
    if (this.#template === null) {
      this.#loadTemplate();
    }
    if (this.#template === null) throw new Error("Template is not set");
    if (this.#connected === true) {
      return;
    }
    let clonedTemplate = this.#template.cloneNode(true);
    this.emit("beforeConnect", clonedTemplate);
    let componentRoot = (
      /** @type {HTMLElement} */
      // @ts-ignore
      clonedTemplate.firstElementChild
    );
    if (mode === "replace") container.replaceChildren(clonedTemplate);
    else if (mode === "append") container.append(clonedTemplate);
    else if (mode === "prepend") container.prepend(clonedTemplate);
    this.connect(componentRoot);
    this.emit("mount");
  }
  /**
   * Unmounts the component from the DOM.
   * Emits "beforeUnmount" and "unmount" events through the event emitter.
   * Disconnects the component from the DOM and removes the root element.
   */
  unmount() {
    if (this.#connected === false) return;
    this.emit("beforeUnmount");
    this.disconnect();
    this.slotManager.unmountChildren();
    this.$internals.root?.remove();
    this.emit("unmount");
  }
  /**
   * Collapses the component by unmounting it from the DOM.
   * Sets the isCollapsed flag to true.
   */
  collapse() {
    this.unmount();
    this.isCollapsed = true;
  }
  /**
   * Expands the component by mounting it to the DOM.
   * Sets the isCollapsed flag to false.
   * If the component is already connected, does nothing.
   * If the component does not have a parent component, does nothing.
   * Otherwise, mounts the component to the parent component's slot.
   */
  expand() {
    this.isCollapsed = false;
    if (this.#connected === true) return;
    if (this.$internals.parentComponent === null) return;
    this.$internals.parentComponent.addChildComponent(
      this.$internals.parentSlotName,
      this
    );
  }
  /**
   * Shows the component.
   * If the component is not connected, it does nothing.
   * If the component is connected, it removes the "d-none" class from the root element.
   */
  show() {
    if (!this.isConnected) return;
    let root = this.$internals.root;
    if (root) {
      root.classList.remove("d-none");
    }
  }
  /**
   * Hides the component.
   * If the component is not connected, it does nothing.
   * If the component is connected, it adds the "d-none" class to the root element.
   */
  hide() {
    if (!this.isConnected) return;
    let root = this.$internals.root;
    if (root) {
      root.classList.add("d-none");
    }
  }
  /**
   * Attaches an event listener to the specified element.
   * The event listener is automatically removed when the component is unmounted.
   * @param {HTMLElement|Element} element - The element to attach the event listener to.
   * @param {keyof HTMLElementEventMap} event - The name of the event to listen to.
   * @param {EventListenerOrEventListenerObject} callback - The function to be called when the event is triggered.
   * @returns {() => void} A function that can be called to remove the event listener.
   */
  $on(element, event, callback) {
    element.addEventListener(event, callback, {
      signal: this.$internals.disconnectController.signal
    });
    return () => element.removeEventListener(event, callback);
  }
  /**
   * Returns an array of the slot names defined in the component.
   * @returns {string[]}
   */
  getSlotNames() {
    return this.slotManager.slotNames;
  }
  /**
   * Defines the names of the slots in the component.
   * The slots are declared in the component's template using the "data-slot" attribute.
   * The slot names are used to access the children components of the component.
   * @param {...string} slotNames - The names of the slots.
   */
  defineSlots(...slotNames) {
    this.slotManager.defineSlots(...slotNames);
  }
  /**
   * Adds a child component to a slot.
   * @param {string} slotName - The name of the slot to add the component to.
   * @param {...Component} components - The component to add to the slot.
   * @throws {Error} If the slot does not exist.
   */
  addChildComponent(slotName, ...components) {
    if (typeof this.slots !== "undefined") {
      this.defineSlots(...this.slots);
      this.slots = void 0;
    }
    if (this.slotManager.slotExists(slotName) === false) {
      throw new Error("Slot does not exist");
    }
    this.slotManager.addChildComponent(slotName, ...components);
    for (let i = 0; i < components.length; i++) {
      components[i].$internals.parentComponent = this;
      components[i].$internals.parentSlotName = slotName;
    }
    if (this.#connected) {
      this.slotManager.mountChildren(slotName);
    }
  }
  /**
   * Removes the specified child component from all slots.
   * Delegates the removal to the SlotManager instance.
   * @param {Component} childComponent - The child component to be removed.
   */
  removeChildComponent(childComponent) {
    if (childComponent.$internals.parentComponent !== this) {
      return;
    }
    childComponent.$internals.parentComponent = null;
    childComponent.$internals.parentSlotName = "";
    this.slotManager.removeChildComponent(childComponent);
  }
};

// src/slot-toggler.js
var SlotToggler = class {
  /**
   * Creates a new instance of SlotToggler.
   * @param {Component} component - The component that owns the slots.
   * @param {string[]} slotNames - The names of the slots.
   * @param {string} activeSlotName - The name of the slot that is currently active.
   */
  constructor(component, slotNames, activeSlotName) {
    if (typeof component.slots !== "undefined") {
      component.defineSlots(...component.slots);
      component.slots = void 0;
    }
    for (let i = 0; i < slotNames.length; i++) {
      if (component.slotManager.slotExists(slotNames[i]) === false) {
        throw new Error(
          `Slot ${slotNames[i]} does not exist in component`
        );
      }
    }
    if (component.slotManager.slotExists(activeSlotName) === false) {
      throw new Error(
        `Slot ${activeSlotName} does not exist in component`
      );
    }
    this.component = component;
    this.slotNames = slotNames;
    this.activeSlotName = activeSlotName;
  }
  /**
   * Toggles the active slot to the given slot name.
   * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
   * @param {string} slotName - The name of the slot to toggle to.
   */
  toggle(slotName) {
    if (this.slotNames.indexOf(slotName) === -1) {
      throw new Error(`Slot ${slotName} is not defined in SlotToggler`);
    }
    if (slotName == this.activeSlotName) return;
    for (let i = 0; i < this.slotNames.length; i++) {
      if (this.slotNames[i] == slotName) {
        this.component.slotManager.mountChildren(slotName);
        this.activeSlotName = slotName;
      } else {
        this.component.slotManager.unmountChildren(this.slotNames[i]);
      }
    }
  }
};

// src/index.js
enableDNoneSupport();
export {
  Component,
  DOMReady,
  SlotToggler,
  Toggler,
  copyToClipboard,
  escapeHtml,
  formatBytes,
  formatDate,
  formatDateTime,
  getDefaultLanguage,
  hideElements,
  isDarkMode,
  removeSpinnerFromButton,
  scrollToBottom,
  scrollToTop,
  showElements,
  showSpinnerInButton,
  ui_button_status_waiting_off,
  ui_button_status_waiting_off_html,
  ui_button_status_waiting_on,
  unixtime
};
