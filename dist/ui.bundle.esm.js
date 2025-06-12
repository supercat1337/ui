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

// src/component/component.js
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
          children[y].mount(slotRef, "append");
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
var Component = class {
  /** @type {{eventEmitter: EventEmitter, disconnectController: AbortController, root: HTMLElement|null, textUpdateFunction: TextUpdateFunction|null, textResources: {[key:string]:any}, refs: {[key:string]:HTMLElement}, slotRefs: {[key:string]:HTMLElement}}} */
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
    slotRefs: {}
  };
  /** @type {LayoutFunction|string|null} */
  layout;
  /** @type {string[]} */
  slots;
  refsAnnotation;
  /** @type {Node|null} */
  #template = null;
  #connected = false;
  slotManager = new SlotManager(this);
  constructor() {
    let that = this;
    this.onConnect(() => {
      that.reloadText();
      try {
        that.connectedCallback();
      } catch (e) {
        console.error("Error in connectedCallback:", e);
      }
    });
    this.onUnmount(() => {
      try {
        that.disconnectedCallback();
      } catch (e) {
        console.error("Error in disconnectedCallback:", e);
      }
    });
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
    let layout = this.layout || this.constructor.layout || null;
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
    this.layout = layout;
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
    return this.$internals.eventEmitter.emit(event, ...args);
  }
  /**
   * Emits the "beforeConnect" event.
   * This event is emitted just before the component is connected to the DOM.
   * @param {(component: this, clonedTemplate: Node) => void} callback - The callback function to be executed when the event is triggered.
   * The callback is called with the component instance as the this value. The second argument is the clonedTemplate - the cloned template node.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onBeforeConnect(callback) {
    return this.$internals.eventEmitter.on("beforeConnect", callback);
  }
  /**
   * Subscribes to the "connect" event.
   * This event is emitted just after the component is connected to the DOM.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * The callback is called with the component instance as the this value.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onConnect(callback) {
    return this.$internals.eventEmitter.on("connect", callback);
  }
  /**
   * Subscribes to the "mount" event.
   * This event is emitted after the component is mounted to the DOM.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onMount(callback) {
    return this.$internals.eventEmitter.on("mount", callback);
  }
  /**
   * Subscribes to the "beforeUnmount" event.
   * This event is emitted just before the component is unmounted from the DOM.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onBeforeUnmount(callback) {
    return this.$internals.eventEmitter.on("beforeUnmount", callback);
  }
  /**
   * Subscribes to the "unmount" event.
   * This event is emitted after the component is unmounted from the DOM.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onUnmount(callback) {
    return this.$internals.eventEmitter.on("unmount", callback);
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
    this.$internals.eventEmitter.emit("connect", this);
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
    this.$internals.eventEmitter.emit(
      "beforeConnect",
      this,
      clonedTemplate
    );
    let componentRoot = (
      /** @type {HTMLElement} */
      // @ts-ignore
      clonedTemplate.firstElementChild
    );
    if (mode === "replace") container.replaceChildren(clonedTemplate);
    else if (mode === "append") container.append(clonedTemplate);
    else if (mode === "prepend") container.prepend(clonedTemplate);
    this.connect(componentRoot);
    this.slotManager.mountChildren();
    this.$internals.eventEmitter.emit("mount", this);
  }
  /**
   * Unmounts the component from the DOM.
   * Emits "beforeUnmount" and "unmount" events through the event emitter.
   * Disconnects the component from the DOM and removes the root element.
   */
  unmount() {
    if (this.#connected === false) return;
    this.$internals.eventEmitter.emit("beforeUnmount", this);
    this.disconnect();
    this.slotManager.unmountChildren();
    this.$internals.root?.remove();
    this.$internals.eventEmitter.emit("unmount", this);
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
    this.slotManager.removeChildComponent(childComponent);
  }
};
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

// node_modules/@supercat1337/rpc/dist/rpc.esm.js
var RPC_PARSE_ERROR = {
  code: -32700,
  message: "Parse error"
};
var RPCErrorData = class {
  code = 0;
  message = "";
  data = {};
  /**
   * @param {IErrorResponseMessage|string|Error} data
   */
  constructor(data) {
    if (data instanceof Error) {
      this.message = data.message;
      this.data = data;
    } else if (typeof data == "string") {
      this.message = data;
    } else {
      this.code = data.code || 0;
      this.message = data.message || "";
      this.data = data.data || {};
    }
  }
};
var RPCErrorResponse = class {
  /** @type {RPCErrorData} */
  error;
  /** @type {null|string} */
  id;
  /**
   * Constructs a new RPCErrorResponse instance.
   * @param {string|Error|IErrorResponseMessage} error - The error information to be used.
   * @param {string|null} [id] - The optional identifier associated with the error.
   */
  constructor(error, id) {
    this.error = new RPCErrorData(error);
    this.id = id || null;
  }
};
var RPCDataResponse = class {
  /** @type {T} */
  result;
  /** @type {null|string} */
  id;
  /**
   * Constructs a new instance of RPCDataResponse.
   * @param {T} data - The result data for the response.
   * @param {string|null} [id] - The optional identifier for the response.
   */
  constructor(data, id) {
    this.result = data;
    this.id = id || null;
  }
};
var PagedData = class {
  /** @type {T[]} */
  data = [];
  // total count of all data
  total = 0;
  page_size = 0;
  current_page = 0;
  total_pages = 0;
  /**
   * Constructs an instance of PagedData.
   * @param {Object} param0 - An object containing data list properties.
   * @param {T[]} param0.data - The array of data items.
   * @param {number} param0.total - The total count of all data.
   * @param {number} param0.page_size - The size of each page.
   * @param {number} param0.current_page - The current page number.
   * @param {number} param0.total_pages - The total number of pages.
   */
  constructor(param0) {
    if (!Array.isArray(param0.data)) {
      console.error(param0);
      throw new Error("data must be an array");
    }
    let total = typeof param0.total == "number" ? param0.total : parseInt(param0.total);
    let page_size = typeof param0.page_size == "number" ? param0.page_size : parseInt(param0.page_size);
    let current_page = typeof param0.current_page == "number" ? param0.current_page : parseInt(param0.current_page);
    let total_pages = typeof param0.total_pages == "number" ? param0.total_pages : parseInt(param0.total_pages);
    if (isNaN(total)) {
      console.error(param0);
      throw new Error("total must be a number");
    }
    if (isNaN(page_size)) {
      console.error(param0);
      throw new Error("page_size must be a number");
    }
    if (isNaN(current_page)) {
      console.error(param0);
      throw new Error("current_page must be a number");
    }
    if (isNaN(total_pages)) {
      console.error(param0);
      throw new Error("total_pages must be a number");
    }
    this.data = param0.data;
    this.total = param0.total;
    this.page_size = param0.page_size;
    this.current_page = param0.current_page;
    this.total_pages = param0.total_pages;
  }
};
var RPCPagedResponse = class {
  /** @type {PagedData<T>} */
  result;
  /** @type {null|string} */
  id;
  /**
   * Constructs an instance of RPCPagedResponse.
   * @param {Object} data - An object containing data list properties.
   * @param {T[]} data.data - The array of data items.
   * @param {number} data.total - The total count of all data.
   * @param {number} data.page_size - The size of each page.
   * @param {number} data.current_page - The current page number.
   * @param {number} data.total_pages - The total number of pages.
   * @param {string|null} [id] - An optional identifier for the response.
   */
  constructor(data, id) {
    this.result = new PagedData(data);
    this.id = id || null;
  }
};
var ResponseEventHandler = class {
  #eventEmitter = new EventEmitter();
  /**
   * Subscribes to the response event with the given response_id and runs the
   * callback when the response is received.
   * @param {string} response_id - The id of the response to subscribe to.
   * @param {Function} callback - The callback to run when the response is
   * received. The callback will be given the response as an argument.
   * @returns {void}
   */
  on(response_id, callback) {
    this.#eventEmitter.on(response_id, callback);
  }
  /**
   * Notify all subscribers of the given response.
   * @param {Object} response - The response to notify subscribers of.
   * @returns {void}
   */
  notify(response) {
    if (response && response.id && typeof response.id == "string") {
      if (response.hasOwnProperty("error") || response.hasOwnProperty("result")) {
        setTimeout(() => this.#eventEmitter.emit(response.id, response), 0);
      }
    }
  }
};
var responseEventHandler = new ResponseEventHandler();
function isResponse(response) {
  return response && (response.hasOwnProperty("error") || response.hasOwnProperty("result"));
}
function extractErrorResponse(response, id = null) {
  if (!isResponse(response)) {
    console.error(response);
    return new RPCErrorResponse(RPC_PARSE_ERROR, id);
  }
  if (response.error) {
    return new RPCErrorResponse(response.error, response.id || id);
  }
  if (response.result) {
    return false;
  }
}
function extractPagedResponse(response, id = null) {
  if (!isResponse(response)) {
    console.error(response);
    return new RPCErrorResponse(RPC_PARSE_ERROR, id);
  }
  let errorResponse = extractErrorResponse(response);
  if (errorResponse) {
    return errorResponse;
  }
  try {
    return new RPCPagedResponse(response.result, response.id);
  } catch (e) {
    console.error(e);
    return new RPCErrorResponse(e, response.id || id);
  }
}
function isPagedResponse(response) {
  if (!isResponse(response)) {
    console.error(response);
    return false;
  }
  if (response.error) {
    return false;
  }
  if (response.result) {
    return response.result.hasOwnProperty("total_pages") && response.result.hasOwnProperty("current_page") && response.result.hasOwnProperty("page_size") && response.result.hasOwnProperty("total") && response.result.hasOwnProperty("data");
  }
}
function extractDataResponse(response, id) {
  if (!isResponse(response)) {
    console.error(response);
    return new RPCErrorResponse(RPC_PARSE_ERROR, id);
  }
  let errorResponse = extractErrorResponse(response);
  if (errorResponse) {
    return errorResponse;
  }
  return new RPCDataResponse(response.result, response.id || id);
}
function getResponseType(response) {
  if (response.error) {
    return "error";
  }
  if (response.result) {
    if (isPagedResponse(response)) {
      return "pagedData";
    }
    return "data";
  }
  return "error";
}
function extractRPCResponse(object = {}, rpcOptions = {}) {
  rpcOptions.notify = rpcOptions.hasOwnProperty("notify") ? rpcOptions.notify : true;
  if (!isResponse(object)) {
    return new RPCErrorResponse(RPC_PARSE_ERROR, rpcOptions.id);
  }
  const responseType = getResponseType(object);
  let response;
  if (responseType === "error") {
    response = new RPCErrorResponse(object.error, object.id || rpcOptions.id);
  } else if (responseType === "data") {
    response = extractDataResponse(object, object.id || rpcOptions.id);
  } else if (responseType === "pagedData") {
    response = extractPagedResponse(object, object.id || rpcOptions.id);
  }
  if (rpcOptions.notify) {
    responseEventHandler.notify(response);
  }
  return response;
}

// src/pagination/layout.js
function createPaginationArray(current, total, delta = 2, gap = "...") {
  if (total <= 1) return ["1"];
  const center = [current];
  for (let i = 1; i <= delta; i++) {
    center.unshift(current - i);
    center.push(current + i);
  }
  const filteredCenter = center.filter((page) => page > 1 && page < total).map((page) => page.toString());
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
function renderPaginationItems(currentPage, total, pageUrlRenderer) {
  let currentPage_str = currentPage.toString();
  let items = createPaginationArray(currentPage, total);
  items = items.map(function(item) {
    let activeClass = currentPage_str == item ? "active" : "";
    let page_url = pageUrlRenderer ? pageUrlRenderer(item) : "#";
    if (item != "...")
      return `<li class="page-item ${activeClass}" page-value="${item}"><a class="page-link" href="${page_url}">${item}</a></li>`;
    return `<li class="page-item"><span class="page-link">${item}</span></li>`;
  });
  return items.join("\n");
}
function renderPagination(currentPage, total, pageUrlRenderer) {
  let code = renderPaginationItems(currentPage, total, pageUrlRenderer);
  return `
  <ul class="pagination">
  ${code}
  </ul>`;
}

// src/pagination/pagination.js
var Pagination = class extends Component {
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
    if (!root_element) return;
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
};

// src/table/layout.js
function getHtmlLayout() {
  let html = (
    /* html */
    `
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
                Error
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
`
  );
  return html;
}

// src/table/table.js
function defaultTableRowRenderer(data, index) {
  let row = document.createElement("tr");
  row.setAttribute("data-row-index", index.toString());
  let cell = document.createElement("td");
  cell.setAttribute("ref", "index");
  cell.innerText = (index + 1).toString();
  row.appendChild(cell);
  for (let key in data) {
    let cell2 = document.createElement("td");
    cell2.setAttribute("ref", key);
    cell2.innerText = data[key];
    row.appendChild(cell2);
  }
  return row;
}
var refsAnnotation = {
  section_with_content: HTMLTableSectionElement.prototype,
  section_without_content: HTMLTableSectionElement.prototype,
  section_error: HTMLTableSectionElement.prototype,
  section_loading: HTMLTableSectionElement.prototype,
  header_row: HTMLTableRowElement.prototype,
  error_text: HTMLElement.prototype,
  loading_text: HTMLElement.prototype,
  no_content_text: HTMLElement.prototype
};
var textResources_default = {
  no_content_text: "No items",
  error_text: "Error",
  loading_text: "Loading...",
  invalid_response: "Invalid response"
};
function textUpdater(component) {
  let refs = component.getRefs();
  let textResources = component.$internals.textResources;
  refs.error_text.innerText = textResources.error_text;
  refs.loading_text.innerText = textResources.loading_text;
  refs.no_content_text.innerText = textResources.no_content_text;
}
var Table = class extends Component {
  #headerHTML = "";
  /** @type {TableRowRenderer<T>} */
  #tableRowRenderer = defaultTableRowRenderer;
  /** @type {"content"|"no_content"|"error"|"loading"} */
  #state = "loading";
  /** @type {T[]} */
  #rows = [];
  constructor() {
    super();
    this.$internals.textResources = textResources_default;
    this.setTextUpdateFunction(textUpdater);
    let that = this;
    this.toggler = new Toggler();
    this.toggler.addItem(
      "content",
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        that.#renderRows();
        showElements(refs.section_with_content);
      },
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        refs.section_with_content.innerHTML = "";
        hideElements(refs.section_with_content);
      }
    );
    this.toggler.addItem(
      "no_content",
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        showElements(refs.section_without_content);
      },
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        hideElements(refs.section_without_content);
      }
    );
    this.toggler.addItem(
      "error",
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        showElements(refs.section_error);
      },
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        hideElements(refs.section_error);
      }
    );
    this.toggler.addItem(
      "loading",
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        showElements(refs.section_loading);
      },
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        hideElements(refs.section_loading);
      }
    );
    this.toggler.setActive("loading");
    this.onConnect(() => {
      let refs = this.getRefs();
      refs.header_row.innerHTML = that.#headerHTML;
    });
    this.onConnect(() => {
      that.toggler.runCallbacks();
    });
    this.setLayout(getHtmlLayout, refsAnnotation);
  }
  /**
   * @returns {{header_row:HTMLTableRowElement, section_with_content:HTMLTableSectionElement, section_without_content:HTMLTableSectionElement, section_error:HTMLTableSectionElement, section_loading:HTMLTableSectionElement, error_text:HTMLElement, loading_text:HTMLElement, no_content_text:HTMLElement}} - the refs object
   */
  getRefs() {
    return super.getRefs();
  }
  /**
   * @param {Object} config - config
   * @param {TableRowRenderer<T>} [config.tableRowRenderer] - the table row renderer function
   * @param {string} [config.headerHTML] - the table row header string
   */
  setConfig(config) {
    if (config.tableRowRenderer) {
      this.#tableRowRenderer = config.tableRowRenderer;
    }
    if (config.headerHTML) {
      this.#headerHTML = config.headerHTML;
    }
  }
  /**
   * Gets the current state of the table view.
   * @returns {"content"|"no_content"|"error"|"loading"} - the current state of the table view
   */
  get state() {
    return this.#state;
  }
  /**
   * Sets the table view to its "content" state.
   * The table view will show its content.
   */
  setContent() {
    this.#state = "content";
    this.#renderRows();
    this.toggler.setActive("content");
    this.$internals.eventEmitter.emit("content", this);
  }
  /**
   * Sets the table view to its "loading" state.
   * The table view will display a loading message and activate the loading toggler.
   */
  setLoading() {
    this.#state = "loading";
    this.toggler.setActive("loading");
    this.$internals.eventEmitter.emit("loading", this);
  }
  /**
   * Sets the table view to its "error" state.
   * The table view will display an error message and activate the error toggler.
   */
  setError() {
    this.#state = "error";
    this.toggler.setActive("error");
    this.$internals.eventEmitter.emit("error", this);
  }
  /**
   * Sets the table view to its "no_content" state.
   * The table view will display a no content message and activate the no content toggler.
   */
  setNoContent() {
    this.#state = "no_content";
    this.toggler.setActive("no_content");
    this.$internals.eventEmitter.emit("no_content", this);
  }
  /**
   * Subscribes to the "loading" event.
   * This event is emitted when the view is set to "loading" state.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onLoading(callback) {
    return this.$internals.eventEmitter.on("loading", callback);
  }
  /**
   * Subscribes to the "error" event.
   * This event is emitted when the view is set to the "error" state.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onError(callback) {
    return this.$internals.eventEmitter.on("error", callback);
  }
  /**
   * Subscribes to the "no_content" event.
   * This event is emitted when the view is set to the "no_content" state.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onNoContent(callback) {
    return this.$internals.eventEmitter.on("no_content", callback);
  }
  /**
   * Subscribes to the "content" event.
   * This event is emitted when the view is set to the "content" state.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onContent(callback) {
    return this.$internals.eventEmitter.on("content", callback);
  }
  /**
   * Sets the text of the loading message in the table view.
   * @param {string} text - The text to be shown as the loading message.
   */
  setLoadingText(text) {
    let textResources = (
      /** @type {typeof textResources_default} */
      this.$internals.textResources
    );
    textResources.loading_text = text;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.loading_text.textContent = text;
  }
  /**
   * Sets the text of the error message in the table view.
   * @param {string} text - The text to be shown as the error message.
   */
  setErrorText(text) {
    let textResources = (
      /** @type {typeof textResources_default} */
      this.$internals.textResources
    );
    textResources.error_text = text;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.error_text.textContent = text;
  }
  /**
   * Sets the text of the no content message in the table view.
   * @param {string} text - The text to be shown as the no content message.
   */
  setNoContentText(text) {
    let textResources = (
      /** @type {typeof textResources_default} */
      this.$internals.textResources
    );
    textResources.no_content_text = text;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.no_content_text.textContent = text;
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
      this.setErrorText(this.$internals.textResources.invalid_response);
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
    let refs = this.getRefs();
    refs.section_with_content.innerHTML = "";
    let rows = this.#rows;
    for (let i = 0; i < rows.length; i++) {
      let row = this.#tableRowRenderer(rows[i], i);
      refs.section_with_content.appendChild(row);
    }
  }
  /**
   * Gets the rows of the table view.
   * @returns {T[]} - The rows of the table view.
   */
  get rows() {
    return this.#rows;
  }
};

// src/paginatedTable/layout.js
function getHtmlLayout2(paginatedTable) {
  return (
    /* html */
    `
<div style="display: contents;">    
    <table class="table table-striped" ref="table" scope-ref="table"></table>
    <div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination" scope-ref="pagination"></div>
</div>
`
  );
}

// src/paginatedTable/paginatedTable.js
var refsAnnotation2 = {
  table: HTMLTableElement.prototype,
  pagination: HTMLElement.prototype
};
var PaginatedTable = class extends Component {
  /** @type {Table<T>} */
  table;
  /** @type {Pagination} */
  pagination;
  constructor() {
    super();
    this.defineSlots("table", "pagination");
    this.setLayout(getHtmlLayout2, refsAnnotation2);
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
};

// src/modal/layout.js
function getHtml() {
  let html = (
    /* html */
    `
<div class="modal fade" data-bs-backdrop="static" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" ref="modal_title">Modal name</h5>
                <button type="button" ref="close_x_button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" ref="modal_body">
                <div scope-ref="modal_body" ref="section_with_content" class="d-none">
                </div>
                <div ref="section_error" class="text-center d-none">

                    <div class="d-flex justify-content-center align-items-center fs-5 text-danger" style="min-height: 25vh">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/>
                            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                        </svg>
                        <span ref="error_text" class="ms-3"
                            style="white-space: initial; word-wrap: break-word;">
                            Error text
                        </span>
                    </div>
                </div>

                <div ref="section_loading" class="d-none">
                    <div class="d-flex justify-content-center align-items-center" style="min-height: 25vh">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span ref="loading_text" class="ms-3 fs-5"
                            style="white-space: initial; word-wrap: break-word;">
                            Loading...
                        </span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" ref="close_button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" ref="submit_button" class="btn btn-primary">Add</button>
            </div>
        </div>
    </div>
</div>
`
  );
  return html;
}

// node_modules/bootstrap/js/src/dom/data.js
var elementMap = /* @__PURE__ */ new Map();
var data_default = {
  set(element, key, instance) {
    if (!elementMap.has(element)) {
      elementMap.set(element, /* @__PURE__ */ new Map());
    }
    const instanceMap = elementMap.get(element);
    if (!instanceMap.has(key) && instanceMap.size !== 0) {
      console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
      return;
    }
    instanceMap.set(key, instance);
  },
  get(element, key) {
    if (elementMap.has(element)) {
      return elementMap.get(element).get(key) || null;
    }
    return null;
  },
  remove(element, key) {
    if (!elementMap.has(element)) {
      return;
    }
    const instanceMap = elementMap.get(element);
    instanceMap.delete(key);
    if (instanceMap.size === 0) {
      elementMap.delete(element);
    }
  }
};

// node_modules/bootstrap/js/src/util/index.js
var MILLISECONDS_MULTIPLIER = 1e3;
var TRANSITION_END = "transitionend";
var parseSelector = (selector) => {
  if (selector && window.CSS && window.CSS.escape) {
    selector = selector.replace(/#([^\s"#']+)/g, (match, id) => `#${CSS.escape(id)}`);
  }
  return selector;
};
var toType = (object) => {
  if (object === null || object === void 0) {
    return `${object}`;
  }
  return Object.prototype.toString.call(object).match(/\s([a-z]+)/i)[1].toLowerCase();
};
var getTransitionDurationFromElement = (element) => {
  if (!element) {
    return 0;
  }
  let { transitionDuration, transitionDelay } = window.getComputedStyle(element);
  const floatTransitionDuration = Number.parseFloat(transitionDuration);
  const floatTransitionDelay = Number.parseFloat(transitionDelay);
  if (!floatTransitionDuration && !floatTransitionDelay) {
    return 0;
  }
  transitionDuration = transitionDuration.split(",")[0];
  transitionDelay = transitionDelay.split(",")[0];
  return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
};
var triggerTransitionEnd = (element) => {
  element.dispatchEvent(new Event(TRANSITION_END));
};
var isElement = (object) => {
  if (!object || typeof object !== "object") {
    return false;
  }
  if (typeof object.jquery !== "undefined") {
    object = object[0];
  }
  return typeof object.nodeType !== "undefined";
};
var getElement = (object) => {
  if (isElement(object)) {
    return object.jquery ? object[0] : object;
  }
  if (typeof object === "string" && object.length > 0) {
    return document.querySelector(parseSelector(object));
  }
  return null;
};
var isVisible = (element) => {
  if (!isElement(element) || element.getClientRects().length === 0) {
    return false;
  }
  const elementIsVisible = getComputedStyle(element).getPropertyValue("visibility") === "visible";
  const closedDetails = element.closest("details:not([open])");
  if (!closedDetails) {
    return elementIsVisible;
  }
  if (closedDetails !== element) {
    const summary = element.closest("summary");
    if (summary && summary.parentNode !== closedDetails) {
      return false;
    }
    if (summary === null) {
      return false;
    }
  }
  return elementIsVisible;
};
var isDisabled = (element) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return true;
  }
  if (element.classList.contains("disabled")) {
    return true;
  }
  if (typeof element.disabled !== "undefined") {
    return element.disabled;
  }
  return element.hasAttribute("disabled") && element.getAttribute("disabled") !== "false";
};
var reflow = (element) => {
  element.offsetHeight;
};
var getjQuery = () => {
  if (window.jQuery && !document.body.hasAttribute("data-bs-no-jquery")) {
    return window.jQuery;
  }
  return null;
};
var DOMContentLoadedCallbacks = [];
var onDOMContentLoaded = (callback) => {
  if (document.readyState === "loading") {
    if (!DOMContentLoadedCallbacks.length) {
      document.addEventListener("DOMContentLoaded", () => {
        for (const callback2 of DOMContentLoadedCallbacks) {
          callback2();
        }
      });
    }
    DOMContentLoadedCallbacks.push(callback);
  } else {
    callback();
  }
};
var isRTL = () => document.documentElement.dir === "rtl";
var defineJQueryPlugin = (plugin) => {
  onDOMContentLoaded(() => {
    const $ = getjQuery();
    if ($) {
      const name = plugin.NAME;
      const JQUERY_NO_CONFLICT = $.fn[name];
      $.fn[name] = plugin.jQueryInterface;
      $.fn[name].Constructor = plugin;
      $.fn[name].noConflict = () => {
        $.fn[name] = JQUERY_NO_CONFLICT;
        return plugin.jQueryInterface;
      };
    }
  });
};
var execute = (possibleCallback, args = [], defaultValue = possibleCallback) => {
  return typeof possibleCallback === "function" ? possibleCallback.call(...args) : defaultValue;
};
var executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
  if (!waitForTransition) {
    execute(callback);
    return;
  }
  const durationPadding = 5;
  const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
  let called = false;
  const handler = ({ target }) => {
    if (target !== transitionElement) {
      return;
    }
    called = true;
    transitionElement.removeEventListener(TRANSITION_END, handler);
    execute(callback);
  };
  transitionElement.addEventListener(TRANSITION_END, handler);
  setTimeout(() => {
    if (!called) {
      triggerTransitionEnd(transitionElement);
    }
  }, emulatedDuration);
};

// node_modules/bootstrap/js/src/dom/event-handler.js
var namespaceRegex = /[^.]*(?=\..*)\.|.*/;
var stripNameRegex = /\..*/;
var stripUidRegex = /::\d+$/;
var eventRegistry = {};
var uidEvent = 1;
var customEvents = {
  mouseenter: "mouseover",
  mouseleave: "mouseout"
};
var nativeEvents = /* @__PURE__ */ new Set([
  "click",
  "dblclick",
  "mouseup",
  "mousedown",
  "contextmenu",
  "mousewheel",
  "DOMMouseScroll",
  "mouseover",
  "mouseout",
  "mousemove",
  "selectstart",
  "selectend",
  "keydown",
  "keypress",
  "keyup",
  "orientationchange",
  "touchstart",
  "touchmove",
  "touchend",
  "touchcancel",
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointerleave",
  "pointercancel",
  "gesturestart",
  "gesturechange",
  "gestureend",
  "focus",
  "blur",
  "change",
  "reset",
  "select",
  "submit",
  "focusin",
  "focusout",
  "load",
  "unload",
  "beforeunload",
  "resize",
  "move",
  "DOMContentLoaded",
  "readystatechange",
  "error",
  "abort",
  "scroll"
]);
function makeEventUid(element, uid) {
  return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
}
function getElementEvents(element) {
  const uid = makeEventUid(element);
  element.uidEvent = uid;
  eventRegistry[uid] = eventRegistry[uid] || {};
  return eventRegistry[uid];
}
function bootstrapHandler(element, fn) {
  return function handler(event) {
    hydrateObj(event, { delegateTarget: element });
    if (handler.oneOff) {
      EventHandler.off(element, event.type, fn);
    }
    return fn.apply(element, [event]);
  };
}
function bootstrapDelegationHandler(element, selector, fn) {
  return function handler(event) {
    const domElements = element.querySelectorAll(selector);
    for (let { target } = event; target && target !== this; target = target.parentNode) {
      for (const domElement of domElements) {
        if (domElement !== target) {
          continue;
        }
        hydrateObj(event, { delegateTarget: target });
        if (handler.oneOff) {
          EventHandler.off(element, event.type, selector, fn);
        }
        return fn.apply(target, [event]);
      }
    }
  };
}
function findHandler(events, callable, delegationSelector = null) {
  return Object.values(events).find((event) => event.callable === callable && event.delegationSelector === delegationSelector);
}
function normalizeParameters(originalTypeEvent, handler, delegationFunction) {
  const isDelegated = typeof handler === "string";
  const callable = isDelegated ? delegationFunction : handler || delegationFunction;
  let typeEvent = getTypeEvent(originalTypeEvent);
  if (!nativeEvents.has(typeEvent)) {
    typeEvent = originalTypeEvent;
  }
  return [isDelegated, callable, typeEvent];
}
function addHandler(element, originalTypeEvent, handler, delegationFunction, oneOff) {
  if (typeof originalTypeEvent !== "string" || !element) {
    return;
  }
  let [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
  if (originalTypeEvent in customEvents) {
    const wrapFunction = (fn2) => {
      return function(event) {
        if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
          return fn2.call(this, event);
        }
      };
    };
    callable = wrapFunction(callable);
  }
  const events = getElementEvents(element);
  const handlers = events[typeEvent] || (events[typeEvent] = {});
  const previousFunction = findHandler(handlers, callable, isDelegated ? handler : null);
  if (previousFunction) {
    previousFunction.oneOff = previousFunction.oneOff && oneOff;
    return;
  }
  const uid = makeEventUid(callable, originalTypeEvent.replace(namespaceRegex, ""));
  const fn = isDelegated ? bootstrapDelegationHandler(element, handler, callable) : bootstrapHandler(element, callable);
  fn.delegationSelector = isDelegated ? handler : null;
  fn.callable = callable;
  fn.oneOff = oneOff;
  fn.uidEvent = uid;
  handlers[uid] = fn;
  element.addEventListener(typeEvent, fn, isDelegated);
}
function removeHandler(element, events, typeEvent, handler, delegationSelector) {
  const fn = findHandler(events[typeEvent], handler, delegationSelector);
  if (!fn) {
    return;
  }
  element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
  delete events[typeEvent][fn.uidEvent];
}
function removeNamespacedHandlers(element, events, typeEvent, namespace) {
  const storeElementEvent = events[typeEvent] || {};
  for (const [handlerKey, event] of Object.entries(storeElementEvent)) {
    if (handlerKey.includes(namespace)) {
      removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
    }
  }
}
function getTypeEvent(event) {
  event = event.replace(stripNameRegex, "");
  return customEvents[event] || event;
}
var EventHandler = {
  on(element, event, handler, delegationFunction) {
    addHandler(element, event, handler, delegationFunction, false);
  },
  one(element, event, handler, delegationFunction) {
    addHandler(element, event, handler, delegationFunction, true);
  },
  off(element, originalTypeEvent, handler, delegationFunction) {
    if (typeof originalTypeEvent !== "string" || !element) {
      return;
    }
    const [isDelegated, callable, typeEvent] = normalizeParameters(originalTypeEvent, handler, delegationFunction);
    const inNamespace = typeEvent !== originalTypeEvent;
    const events = getElementEvents(element);
    const storeElementEvent = events[typeEvent] || {};
    const isNamespace = originalTypeEvent.startsWith(".");
    if (typeof callable !== "undefined") {
      if (!Object.keys(storeElementEvent).length) {
        return;
      }
      removeHandler(element, events, typeEvent, callable, isDelegated ? handler : null);
      return;
    }
    if (isNamespace) {
      for (const elementEvent of Object.keys(events)) {
        removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
      }
    }
    for (const [keyHandlers, event] of Object.entries(storeElementEvent)) {
      const handlerKey = keyHandlers.replace(stripUidRegex, "");
      if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
        removeHandler(element, events, typeEvent, event.callable, event.delegationSelector);
      }
    }
  },
  trigger(element, event, args) {
    if (typeof event !== "string" || !element) {
      return null;
    }
    const $ = getjQuery();
    const typeEvent = getTypeEvent(event);
    const inNamespace = event !== typeEvent;
    let jQueryEvent = null;
    let bubbles = true;
    let nativeDispatch = true;
    let defaultPrevented = false;
    if (inNamespace && $) {
      jQueryEvent = $.Event(event, args);
      $(element).trigger(jQueryEvent);
      bubbles = !jQueryEvent.isPropagationStopped();
      nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
      defaultPrevented = jQueryEvent.isDefaultPrevented();
    }
    const evt = hydrateObj(new Event(event, { bubbles, cancelable: true }), args);
    if (defaultPrevented) {
      evt.preventDefault();
    }
    if (nativeDispatch) {
      element.dispatchEvent(evt);
    }
    if (evt.defaultPrevented && jQueryEvent) {
      jQueryEvent.preventDefault();
    }
    return evt;
  }
};
function hydrateObj(obj, meta = {}) {
  for (const [key, value] of Object.entries(meta)) {
    try {
      obj[key] = value;
    } catch {
      Object.defineProperty(obj, key, {
        configurable: true,
        get() {
          return value;
        }
      });
    }
  }
  return obj;
}
var event_handler_default = EventHandler;

// node_modules/bootstrap/js/src/dom/manipulator.js
function normalizeData(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === Number(value).toString()) {
    return Number(value);
  }
  if (value === "" || value === "null") {
    return null;
  }
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return value;
  }
}
function normalizeDataKey(key) {
  return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
}
var Manipulator = {
  setDataAttribute(element, key, value) {
    element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
  },
  removeDataAttribute(element, key) {
    element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
  },
  getDataAttributes(element) {
    if (!element) {
      return {};
    }
    const attributes = {};
    const bsKeys = Object.keys(element.dataset).filter((key) => key.startsWith("bs") && !key.startsWith("bsConfig"));
    for (const key of bsKeys) {
      let pureKey = key.replace(/^bs/, "");
      pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1);
      attributes[pureKey] = normalizeData(element.dataset[key]);
    }
    return attributes;
  },
  getDataAttribute(element, key) {
    return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
  }
};
var manipulator_default = Manipulator;

// node_modules/bootstrap/js/src/util/config.js
var Config = class {
  // Getters
  static get Default() {
    return {};
  }
  static get DefaultType() {
    return {};
  }
  static get NAME() {
    throw new Error('You have to implement the static method "NAME", for each component!');
  }
  _getConfig(config) {
    config = this._mergeConfigObj(config);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  _configAfterMerge(config) {
    return config;
  }
  _mergeConfigObj(config, element) {
    const jsonConfig = isElement(element) ? manipulator_default.getDataAttribute(element, "config") : {};
    return {
      ...this.constructor.Default,
      ...typeof jsonConfig === "object" ? jsonConfig : {},
      ...isElement(element) ? manipulator_default.getDataAttributes(element) : {},
      ...typeof config === "object" ? config : {}
    };
  }
  _typeCheckConfig(config, configTypes = this.constructor.DefaultType) {
    for (const [property, expectedTypes] of Object.entries(configTypes)) {
      const value = config[property];
      const valueType = isElement(value) ? "element" : toType(value);
      if (!new RegExp(expectedTypes).test(valueType)) {
        throw new TypeError(
          `${this.constructor.NAME.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`
        );
      }
    }
  }
};
var config_default = Config;

// node_modules/bootstrap/js/src/base-component.js
var VERSION = "5.3.6";
var BaseComponent = class extends config_default {
  constructor(element, config) {
    super();
    element = getElement(element);
    if (!element) {
      return;
    }
    this._element = element;
    this._config = this._getConfig(config);
    data_default.set(this._element, this.constructor.DATA_KEY, this);
  }
  // Public
  dispose() {
    data_default.remove(this._element, this.constructor.DATA_KEY);
    event_handler_default.off(this._element, this.constructor.EVENT_KEY);
    for (const propertyName of Object.getOwnPropertyNames(this)) {
      this[propertyName] = null;
    }
  }
  // Private
  _queueCallback(callback, element, isAnimated = true) {
    executeAfterTransition(callback, element, isAnimated);
  }
  _getConfig(config) {
    config = this._mergeConfigObj(config, this._element);
    config = this._configAfterMerge(config);
    this._typeCheckConfig(config);
    return config;
  }
  // Static
  static getInstance(element) {
    return data_default.get(getElement(element), this.DATA_KEY);
  }
  static getOrCreateInstance(element, config = {}) {
    return this.getInstance(element) || new this(element, typeof config === "object" ? config : null);
  }
  static get VERSION() {
    return VERSION;
  }
  static get DATA_KEY() {
    return `bs.${this.NAME}`;
  }
  static get EVENT_KEY() {
    return `.${this.DATA_KEY}`;
  }
  static eventName(name) {
    return `${name}${this.EVENT_KEY}`;
  }
};
var base_component_default = BaseComponent;

// node_modules/bootstrap/js/src/dom/selector-engine.js
var getSelector = (element) => {
  let selector = element.getAttribute("data-bs-target");
  if (!selector || selector === "#") {
    let hrefAttribute = element.getAttribute("href");
    if (!hrefAttribute || !hrefAttribute.includes("#") && !hrefAttribute.startsWith(".")) {
      return null;
    }
    if (hrefAttribute.includes("#") && !hrefAttribute.startsWith("#")) {
      hrefAttribute = `#${hrefAttribute.split("#")[1]}`;
    }
    selector = hrefAttribute && hrefAttribute !== "#" ? hrefAttribute.trim() : null;
  }
  return selector ? selector.split(",").map((sel) => parseSelector(sel)).join(",") : null;
};
var SelectorEngine = {
  find(selector, element = document.documentElement) {
    return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
  },
  findOne(selector, element = document.documentElement) {
    return Element.prototype.querySelector.call(element, selector);
  },
  children(element, selector) {
    return [].concat(...element.children).filter((child) => child.matches(selector));
  },
  parents(element, selector) {
    const parents = [];
    let ancestor = element.parentNode.closest(selector);
    while (ancestor) {
      parents.push(ancestor);
      ancestor = ancestor.parentNode.closest(selector);
    }
    return parents;
  },
  prev(element, selector) {
    let previous = element.previousElementSibling;
    while (previous) {
      if (previous.matches(selector)) {
        return [previous];
      }
      previous = previous.previousElementSibling;
    }
    return [];
  },
  // TODO: this is now unused; remove later along with prev()
  next(element, selector) {
    let next = element.nextElementSibling;
    while (next) {
      if (next.matches(selector)) {
        return [next];
      }
      next = next.nextElementSibling;
    }
    return [];
  },
  focusableChildren(element) {
    const focusables = [
      "a",
      "button",
      "input",
      "textarea",
      "select",
      "details",
      "[tabindex]",
      '[contenteditable="true"]'
    ].map((selector) => `${selector}:not([tabindex^="-"])`).join(",");
    return this.find(focusables, element).filter((el) => !isDisabled(el) && isVisible(el));
  },
  getSelectorFromElement(element) {
    const selector = getSelector(element);
    if (selector) {
      return SelectorEngine.findOne(selector) ? selector : null;
    }
    return null;
  },
  getElementFromSelector(element) {
    const selector = getSelector(element);
    return selector ? SelectorEngine.findOne(selector) : null;
  },
  getMultipleElementsFromSelector(element) {
    const selector = getSelector(element);
    return selector ? SelectorEngine.find(selector) : [];
  }
};
var selector_engine_default = SelectorEngine;

// node_modules/bootstrap/js/src/util/backdrop.js
var NAME = "backdrop";
var CLASS_NAME_FADE = "fade";
var CLASS_NAME_SHOW = "show";
var EVENT_MOUSEDOWN = `mousedown.bs.${NAME}`;
var Default = {
  className: "modal-backdrop",
  clickCallback: null,
  isAnimated: false,
  isVisible: true,
  // if false, we use the backdrop helper without adding any element to the dom
  rootElement: "body"
  // give the choice to place backdrop under different elements
};
var DefaultType = {
  className: "string",
  clickCallback: "(function|null)",
  isAnimated: "boolean",
  isVisible: "boolean",
  rootElement: "(element|string)"
};
var Backdrop = class extends config_default {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
    this._isAppended = false;
    this._element = null;
  }
  // Getters
  static get Default() {
    return Default;
  }
  static get DefaultType() {
    return DefaultType;
  }
  static get NAME() {
    return NAME;
  }
  // Public
  show(callback) {
    if (!this._config.isVisible) {
      execute(callback);
      return;
    }
    this._append();
    const element = this._getElement();
    if (this._config.isAnimated) {
      reflow(element);
    }
    element.classList.add(CLASS_NAME_SHOW);
    this._emulateAnimation(() => {
      execute(callback);
    });
  }
  hide(callback) {
    if (!this._config.isVisible) {
      execute(callback);
      return;
    }
    this._getElement().classList.remove(CLASS_NAME_SHOW);
    this._emulateAnimation(() => {
      this.dispose();
      execute(callback);
    });
  }
  dispose() {
    if (!this._isAppended) {
      return;
    }
    event_handler_default.off(this._element, EVENT_MOUSEDOWN);
    this._element.remove();
    this._isAppended = false;
  }
  // Private
  _getElement() {
    if (!this._element) {
      const backdrop = document.createElement("div");
      backdrop.className = this._config.className;
      if (this._config.isAnimated) {
        backdrop.classList.add(CLASS_NAME_FADE);
      }
      this._element = backdrop;
    }
    return this._element;
  }
  _configAfterMerge(config) {
    config.rootElement = getElement(config.rootElement);
    return config;
  }
  _append() {
    if (this._isAppended) {
      return;
    }
    const element = this._getElement();
    this._config.rootElement.append(element);
    event_handler_default.on(element, EVENT_MOUSEDOWN, () => {
      execute(this._config.clickCallback);
    });
    this._isAppended = true;
  }
  _emulateAnimation(callback) {
    executeAfterTransition(callback, this._getElement(), this._config.isAnimated);
  }
};
var backdrop_default = Backdrop;

// node_modules/bootstrap/js/src/util/component-functions.js
var enableDismissTrigger = (component, method = "hide") => {
  const clickEvent = `click.dismiss${component.EVENT_KEY}`;
  const name = component.NAME;
  event_handler_default.on(document, clickEvent, `[data-bs-dismiss="${name}"]`, function(event) {
    if (["A", "AREA"].includes(this.tagName)) {
      event.preventDefault();
    }
    if (isDisabled(this)) {
      return;
    }
    const target = selector_engine_default.getElementFromSelector(this) || this.closest(`.${name}`);
    const instance = component.getOrCreateInstance(target);
    instance[method]();
  });
};

// node_modules/bootstrap/js/src/util/focustrap.js
var NAME2 = "focustrap";
var DATA_KEY = "bs.focustrap";
var EVENT_KEY = `.${DATA_KEY}`;
var EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
var EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY}`;
var TAB_KEY = "Tab";
var TAB_NAV_FORWARD = "forward";
var TAB_NAV_BACKWARD = "backward";
var Default2 = {
  autofocus: true,
  trapElement: null
  // The element to trap focus inside of
};
var DefaultType2 = {
  autofocus: "boolean",
  trapElement: "element"
};
var FocusTrap = class extends config_default {
  constructor(config) {
    super();
    this._config = this._getConfig(config);
    this._isActive = false;
    this._lastTabNavDirection = null;
  }
  // Getters
  static get Default() {
    return Default2;
  }
  static get DefaultType() {
    return DefaultType2;
  }
  static get NAME() {
    return NAME2;
  }
  // Public
  activate() {
    if (this._isActive) {
      return;
    }
    if (this._config.autofocus) {
      this._config.trapElement.focus();
    }
    event_handler_default.off(document, EVENT_KEY);
    event_handler_default.on(document, EVENT_FOCUSIN, (event) => this._handleFocusin(event));
    event_handler_default.on(document, EVENT_KEYDOWN_TAB, (event) => this._handleKeydown(event));
    this._isActive = true;
  }
  deactivate() {
    if (!this._isActive) {
      return;
    }
    this._isActive = false;
    event_handler_default.off(document, EVENT_KEY);
  }
  // Private
  _handleFocusin(event) {
    const { trapElement } = this._config;
    if (event.target === document || event.target === trapElement || trapElement.contains(event.target)) {
      return;
    }
    const elements = selector_engine_default.focusableChildren(trapElement);
    if (elements.length === 0) {
      trapElement.focus();
    } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
      elements[elements.length - 1].focus();
    } else {
      elements[0].focus();
    }
  }
  _handleKeydown(event) {
    if (event.key !== TAB_KEY) {
      return;
    }
    this._lastTabNavDirection = event.shiftKey ? TAB_NAV_BACKWARD : TAB_NAV_FORWARD;
  }
};
var focustrap_default = FocusTrap;

// node_modules/bootstrap/js/src/util/scrollbar.js
var SELECTOR_FIXED_CONTENT = ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";
var SELECTOR_STICKY_CONTENT = ".sticky-top";
var PROPERTY_PADDING = "padding-right";
var PROPERTY_MARGIN = "margin-right";
var ScrollBarHelper = class {
  constructor() {
    this._element = document.body;
  }
  // Public
  getWidth() {
    const documentWidth = document.documentElement.clientWidth;
    return Math.abs(window.innerWidth - documentWidth);
  }
  hide() {
    const width = this.getWidth();
    this._disableOverFlow();
    this._setElementAttributes(this._element, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
    this._setElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING, (calculatedValue) => calculatedValue + width);
    this._setElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN, (calculatedValue) => calculatedValue - width);
  }
  reset() {
    this._resetElementAttributes(this._element, "overflow");
    this._resetElementAttributes(this._element, PROPERTY_PADDING);
    this._resetElementAttributes(SELECTOR_FIXED_CONTENT, PROPERTY_PADDING);
    this._resetElementAttributes(SELECTOR_STICKY_CONTENT, PROPERTY_MARGIN);
  }
  isOverflowing() {
    return this.getWidth() > 0;
  }
  // Private
  _disableOverFlow() {
    this._saveInitialAttribute(this._element, "overflow");
    this._element.style.overflow = "hidden";
  }
  _setElementAttributes(selector, styleProperty, callback) {
    const scrollbarWidth = this.getWidth();
    const manipulationCallBack = (element) => {
      if (element !== this._element && window.innerWidth > element.clientWidth + scrollbarWidth) {
        return;
      }
      this._saveInitialAttribute(element, styleProperty);
      const calculatedValue = window.getComputedStyle(element).getPropertyValue(styleProperty);
      element.style.setProperty(styleProperty, `${callback(Number.parseFloat(calculatedValue))}px`);
    };
    this._applyManipulationCallback(selector, manipulationCallBack);
  }
  _saveInitialAttribute(element, styleProperty) {
    const actualValue = element.style.getPropertyValue(styleProperty);
    if (actualValue) {
      manipulator_default.setDataAttribute(element, styleProperty, actualValue);
    }
  }
  _resetElementAttributes(selector, styleProperty) {
    const manipulationCallBack = (element) => {
      const value = manipulator_default.getDataAttribute(element, styleProperty);
      if (value === null) {
        element.style.removeProperty(styleProperty);
        return;
      }
      manipulator_default.removeDataAttribute(element, styleProperty);
      element.style.setProperty(styleProperty, value);
    };
    this._applyManipulationCallback(selector, manipulationCallBack);
  }
  _applyManipulationCallback(selector, callBack) {
    if (isElement(selector)) {
      callBack(selector);
      return;
    }
    for (const sel of selector_engine_default.find(selector, this._element)) {
      callBack(sel);
    }
  }
};
var scrollbar_default = ScrollBarHelper;

// node_modules/bootstrap/js/src/modal.js
var NAME3 = "modal";
var DATA_KEY2 = "bs.modal";
var EVENT_KEY2 = `.${DATA_KEY2}`;
var DATA_API_KEY = ".data-api";
var ESCAPE_KEY = "Escape";
var EVENT_HIDE = `hide${EVENT_KEY2}`;
var EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY2}`;
var EVENT_HIDDEN = `hidden${EVENT_KEY2}`;
var EVENT_SHOW = `show${EVENT_KEY2}`;
var EVENT_SHOWN = `shown${EVENT_KEY2}`;
var EVENT_RESIZE = `resize${EVENT_KEY2}`;
var EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY2}`;
var EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY2}`;
var EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY2}`;
var EVENT_CLICK_DATA_API = `click${EVENT_KEY2}${DATA_API_KEY}`;
var CLASS_NAME_OPEN = "modal-open";
var CLASS_NAME_FADE2 = "fade";
var CLASS_NAME_SHOW2 = "show";
var CLASS_NAME_STATIC = "modal-static";
var OPEN_SELECTOR = ".modal.show";
var SELECTOR_DIALOG = ".modal-dialog";
var SELECTOR_MODAL_BODY = ".modal-body";
var SELECTOR_DATA_TOGGLE = '[data-bs-toggle="modal"]';
var Default3 = {
  backdrop: true,
  focus: true,
  keyboard: true
};
var DefaultType3 = {
  backdrop: "(boolean|string)",
  focus: "boolean",
  keyboard: "boolean"
};
var Modal = class _Modal extends base_component_default {
  constructor(element, config) {
    super(element, config);
    this._dialog = selector_engine_default.findOne(SELECTOR_DIALOG, this._element);
    this._backdrop = this._initializeBackDrop();
    this._focustrap = this._initializeFocusTrap();
    this._isShown = false;
    this._isTransitioning = false;
    this._scrollBar = new scrollbar_default();
    this._addEventListeners();
  }
  // Getters
  static get Default() {
    return Default3;
  }
  static get DefaultType() {
    return DefaultType3;
  }
  static get NAME() {
    return NAME3;
  }
  // Public
  toggle(relatedTarget) {
    return this._isShown ? this.hide() : this.show(relatedTarget);
  }
  show(relatedTarget) {
    if (this._isShown || this._isTransitioning) {
      return;
    }
    const showEvent = event_handler_default.trigger(this._element, EVENT_SHOW, {
      relatedTarget
    });
    if (showEvent.defaultPrevented) {
      return;
    }
    this._isShown = true;
    this._isTransitioning = true;
    this._scrollBar.hide();
    document.body.classList.add(CLASS_NAME_OPEN);
    this._adjustDialog();
    this._backdrop.show(() => this._showElement(relatedTarget));
  }
  hide() {
    if (!this._isShown || this._isTransitioning) {
      return;
    }
    const hideEvent = event_handler_default.trigger(this._element, EVENT_HIDE);
    if (hideEvent.defaultPrevented) {
      return;
    }
    this._isShown = false;
    this._isTransitioning = true;
    this._focustrap.deactivate();
    this._element.classList.remove(CLASS_NAME_SHOW2);
    this._queueCallback(() => this._hideModal(), this._element, this._isAnimated());
  }
  dispose() {
    event_handler_default.off(window, EVENT_KEY2);
    event_handler_default.off(this._dialog, EVENT_KEY2);
    this._backdrop.dispose();
    this._focustrap.deactivate();
    super.dispose();
  }
  handleUpdate() {
    this._adjustDialog();
  }
  // Private
  _initializeBackDrop() {
    return new backdrop_default({
      isVisible: Boolean(this._config.backdrop),
      // 'static' option will be translated to true, and booleans will keep their value,
      isAnimated: this._isAnimated()
    });
  }
  _initializeFocusTrap() {
    return new focustrap_default({
      trapElement: this._element
    });
  }
  _showElement(relatedTarget) {
    if (!document.body.contains(this._element)) {
      document.body.append(this._element);
    }
    this._element.style.display = "block";
    this._element.removeAttribute("aria-hidden");
    this._element.setAttribute("aria-modal", true);
    this._element.setAttribute("role", "dialog");
    this._element.scrollTop = 0;
    const modalBody = selector_engine_default.findOne(SELECTOR_MODAL_BODY, this._dialog);
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
    reflow(this._element);
    this._element.classList.add(CLASS_NAME_SHOW2);
    const transitionComplete = () => {
      if (this._config.focus) {
        this._focustrap.activate();
      }
      this._isTransitioning = false;
      event_handler_default.trigger(this._element, EVENT_SHOWN, {
        relatedTarget
      });
    };
    this._queueCallback(transitionComplete, this._dialog, this._isAnimated());
  }
  _addEventListeners() {
    event_handler_default.on(this._element, EVENT_KEYDOWN_DISMISS, (event) => {
      if (event.key !== ESCAPE_KEY) {
        return;
      }
      if (this._config.keyboard) {
        this.hide();
        return;
      }
      this._triggerBackdropTransition();
    });
    event_handler_default.on(window, EVENT_RESIZE, () => {
      if (this._isShown && !this._isTransitioning) {
        this._adjustDialog();
      }
    });
    event_handler_default.on(this._element, EVENT_MOUSEDOWN_DISMISS, (event) => {
      event_handler_default.one(this._element, EVENT_CLICK_DISMISS, (event2) => {
        if (this._element !== event.target || this._element !== event2.target) {
          return;
        }
        if (this._config.backdrop === "static") {
          this._triggerBackdropTransition();
          return;
        }
        if (this._config.backdrop) {
          this.hide();
        }
      });
    });
  }
  _hideModal() {
    this._element.style.display = "none";
    this._element.setAttribute("aria-hidden", true);
    this._element.removeAttribute("aria-modal");
    this._element.removeAttribute("role");
    this._isTransitioning = false;
    this._backdrop.hide(() => {
      document.body.classList.remove(CLASS_NAME_OPEN);
      this._resetAdjustments();
      this._scrollBar.reset();
      event_handler_default.trigger(this._element, EVENT_HIDDEN);
    });
  }
  _isAnimated() {
    return this._element.classList.contains(CLASS_NAME_FADE2);
  }
  _triggerBackdropTransition() {
    const hideEvent = event_handler_default.trigger(this._element, EVENT_HIDE_PREVENTED);
    if (hideEvent.defaultPrevented) {
      return;
    }
    const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
    const initialOverflowY = this._element.style.overflowY;
    if (initialOverflowY === "hidden" || this._element.classList.contains(CLASS_NAME_STATIC)) {
      return;
    }
    if (!isModalOverflowing) {
      this._element.style.overflowY = "hidden";
    }
    this._element.classList.add(CLASS_NAME_STATIC);
    this._queueCallback(() => {
      this._element.classList.remove(CLASS_NAME_STATIC);
      this._queueCallback(() => {
        this._element.style.overflowY = initialOverflowY;
      }, this._dialog);
    }, this._dialog);
    this._element.focus();
  }
  /**
   * The following methods are used to handle overflowing modals
   */
  _adjustDialog() {
    const isModalOverflowing = this._element.scrollHeight > document.documentElement.clientHeight;
    const scrollbarWidth = this._scrollBar.getWidth();
    const isBodyOverflowing = scrollbarWidth > 0;
    if (isBodyOverflowing && !isModalOverflowing) {
      const property = isRTL() ? "paddingLeft" : "paddingRight";
      this._element.style[property] = `${scrollbarWidth}px`;
    }
    if (!isBodyOverflowing && isModalOverflowing) {
      const property = isRTL() ? "paddingRight" : "paddingLeft";
      this._element.style[property] = `${scrollbarWidth}px`;
    }
  }
  _resetAdjustments() {
    this._element.style.paddingLeft = "";
    this._element.style.paddingRight = "";
  }
  // Static
  static jQueryInterface(config, relatedTarget) {
    return this.each(function() {
      const data = _Modal.getOrCreateInstance(this, config);
      if (typeof config !== "string") {
        return;
      }
      if (typeof data[config] === "undefined") {
        throw new TypeError(`No method named "${config}"`);
      }
      data[config](relatedTarget);
    });
  }
};
event_handler_default.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function(event) {
  const target = selector_engine_default.getElementFromSelector(this);
  if (["A", "AREA"].includes(this.tagName)) {
    event.preventDefault();
  }
  event_handler_default.one(target, EVENT_SHOW, (showEvent) => {
    if (showEvent.defaultPrevented) {
      return;
    }
    event_handler_default.one(target, EVENT_HIDDEN, () => {
      if (isVisible(this)) {
        this.focus();
      }
    });
  });
  const alreadyOpen = selector_engine_default.findOne(OPEN_SELECTOR);
  if (alreadyOpen) {
    Modal.getInstance(alreadyOpen).hide();
  }
  const data = Modal.getOrCreateInstance(target);
  data.toggle(this);
});
enableDismissTrigger(Modal);
defineJQueryPlugin(Modal);
var modal_default = Modal;

// src/modal/modal.js
var refsAnnotation3 = {
  modal_title: HTMLHeadingElement.prototype,
  close_x_button: HTMLButtonElement.prototype,
  modal_body: HTMLDivElement.prototype,
  section_with_content: HTMLDivElement.prototype,
  section_error: HTMLDivElement.prototype,
  error_text: HTMLSpanElement.prototype,
  section_loading: HTMLDivElement.prototype,
  loading_text: HTMLSpanElement.prototype,
  close_button: HTMLButtonElement.prototype,
  submit_button: HTMLButtonElement.prototype
};
function textUpdater2(component) {
  let refs = component.getRefs();
  let textResources = component.$internals.textResources;
  refs.modal_title.textContent = textResources.modal_title_text;
  refs.close_x_button.setAttribute(
    "aria-label",
    textResources.close_x_button_aria_label
  );
  refs.loading_text.textContent = textResources.loading_text_text;
  refs.close_button.textContent = textResources.close_button_text;
  refs.submit_button.textContent = textResources.submit_button_text;
}
var textResources_default2 = {
  modal_title_text: "Modal name",
  close_x_button_aria_label: "Close",
  loading_text_text: "Loading...",
  close_button_text: "Close",
  submit_button_text: "Add"
};
var Modal2 = class extends Component {
  /**
   * Indicates whether the submit button should be hidden when the content mode is active.
   * @type {boolean}
   * */
  hideSubmitButtonOnContentMode = false;
  constructor() {
    super();
    this.defineSlots("modal_body");
    this.setLayout(getHtml(), refsAnnotation3);
    this.$internals.textResources = textResources_default2;
    this.setTextUpdateFunction(textUpdater2);
    let that = this;
    this.toggler = new Toggler();
    this.toggler.addItem(
      "content",
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        if (that.hideSubmitButtonOnContentMode) {
          hideElements(refs.submit_button);
        } else {
          showElements(refs.submit_button);
        }
        showElements(refs.section_with_content);
      },
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        hideElements(refs.section_with_content);
      }
    );
    this.toggler.addItem(
      "error",
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        refs.error_text.textContent = this.$internals.textResources.error_text;
        hideElements(refs.submit_button);
        showElements(refs.section_error);
      },
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        hideElements(refs.section_error);
      }
    );
    this.toggler.addItem(
      "loading",
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        refs.loading_text.textContent = this.$internals.textResources.loading_text;
        hideElements(refs.submit_button);
        showElements(refs.section_loading);
      },
      (key) => {
        if (!that.isConnected) return false;
        let refs = this.getRefs();
        hideElements(refs.section_loading);
      }
    );
    this.toggler.setActive("content");
    this.onConnect(() => {
      that.toggler.runCallbacks();
      let root = (
        /** @type {Element} */
        that.$internals.root
      );
      that.$on(root, "hide.bs.modal", () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        that.$internals.eventEmitter.emit("hide", that);
      });
    });
  }
  /** @returns {{modal_title: HTMLHeadingElement, close_x_button: HTMLButtonElement, modal_body: HTMLDivElement, close_button: HTMLButtonElement, submit_button: HTMLButtonElement, section_with_content: HTMLDivElement, section_error: HTMLDivElement, error_text: HTMLSpanElement, section_loading: HTMLDivElement, loading_text: HTMLSpanElement}} */
  getRefs() {
    return super.getRefs();
  }
  /**
   * Displays the modal if the component is connected to the DOM.
   * Retrieves or creates a modal instance and calls its show method.
   * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
   */
  show(ctx = {}) {
    if (!this.isConnected) return;
    this.toggler.setActive("content");
    this.$internals.eventEmitter.emit("show", this, ctx);
    let modal_element = (
      /** @type {Element} */
      this.$internals.root
    );
    let modal = modal_default.getOrCreateInstance(modal_element);
    modal.show();
  }
  /**
   * Displays the modal with the loading indicator if the component is connected to the DOM.
   * Retrieves or creates a modal instance, sets its backdrop to static, and calls its show method.
   * Emits the "show" event as well.
   * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
   */
  showLoading(ctx = {}) {
    if (!this.isConnected) return;
    this.toggler.setActive("loading");
    this.$internals.eventEmitter.emit("show", this, ctx);
    let modal_element = (
      /** @type {Element} */
      this.$internals.root
    );
    let modal = modal_default.getOrCreateInstance(modal_element);
    modal.show();
  }
  /**
   * Sets the table view to its "content" state.
   * The table view will show its content.
   */
  setContentMode() {
    this.toggler.setActive("content");
  }
  /**
   * Sets the table view to its "loading" state.
   * The table view will display a loading message and activate the loading toggler.
   */
  setLoadingMode() {
    this.toggler.setActive("loading");
  }
  /**
   * Sets the table view to its "error" state.
   * The table view will display an error message and activate the error toggler.
   */
  setErrorMode() {
    this.toggler.setActive("error");
  }
  /**
   * Hides the modal if the component is connected to the DOM.
   * Retrieves or creates a modal instance and calls its hide method.
   */
  hide() {
    if (!this.isConnected) return;
    let modal_element = (
      /** @type {Element} */
      this.$internals.root
    );
    let close_button = (
      /** @type {HTMLButtonElement} */
      modal_element.querySelector('[data-bs-dismiss="modal"]')
    );
    close_button?.click();
  }
  /**
   * Subscribes to the "show" event.
   * This event is emitted whenever the modal is shown.
   * The callback is called with the component instance as the this value.
   * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onShow(callback) {
    return this.$internals.eventEmitter.on("show", callback);
  }
  /**
   * Subscribes to the "hide" event.
   * This event is emitted whenever the modal is hidden.
   * The callback is called with the component instance as the this value.
   * @param {(modal: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onHide(callback) {
    return this.$internals.eventEmitter.on("hide", callback);
  }
  /**
   * Subscribes to the "response" event.
   * This event is emitted whenever the modal receives a response.
   * The callback is called with the component instance as the this value and the response as the second argument.
   * @param {(modal: this, response: Object) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onResponse(callback) {
    return this.$internals.eventEmitter.on("response", callback);
  }
  /**
   * Emits the "response" event.
   * This event is emitted whenever the modal receives a response.
   * The callback is called with the component instance as the this value and the response as the second argument.
   * @param {Object} response - The response to be emitted.
   */
  emitResponse(response) {
    this.$internals.eventEmitter.emit("response", this, response);
  }
  /**
   * Subscribes to the "submit" event.
   * This event is emitted when the user clicks the submit button.
   * The callback is called with the component instance as the this value.
   * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onSubmit(callback) {
    return this.$internals.eventEmitter.on("submit", callback);
  }
  /**
   * Emits the "submit" event.
   * This event is emitted when the user clicks the submit button.
   * The callback is called with the component instance as the this value and the context object as the second argument.
   * @param {object} ctx - The context object to be passed to the callback.
   */
  emitSubmit(ctx) {
    this.$internals.eventEmitter.emit("submit", this, ctx);
  }
  /**
   * Sets the title of the modal.
   * @param {string} title - The new title text.
   */
  setTitleText(title) {
    this.$internals.textResources.modal_title_text = title;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.modal_title.textContent = title;
  }
  /**
   * Sets the text of the loading message in the table view.
   * @param {string} text - The text to be shown as the loading message.
   */
  setLoadingText(text) {
    this.$internals.textResources.loading_text = text;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.loading_text.textContent = text;
  }
  /**
   * Sets the text of the error message in the table view.
   * @param {string} text - The text to be shown as the error message.
   */
  setErrorText(text) {
    this.$internals.textResources.error_text = text;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.error_text.textContent = text;
  }
  /**
   * Sets the text of the submit button.
   * @param {string} text - The text to be shown as the submit button.
   */
  setSubmitButtonText(text) {
    this.$internals.textResources.submit_button_text = text;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.submit_button.textContent = text;
  }
  /**
   * Sets the text of the close button.
   * @param {string} text - The text to be shown as the close button.
   */
  setCloseButtonText(text) {
    this.$internals.textResources.close_button_text = text;
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.close_button.textContent = text;
  }
  /**
   * Hides the close buttons of the modal.
   * If the component is not connected to the DOM, does nothing.
   */
  hideCloseButtons() {
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.close_x_button.setAttribute("aria-hidden", "true");
    refs.close_x_button.style.visibility = "hidden";
    refs.close_button.setAttribute("aria-hidden", "true");
    refs.close_button.style.visibility = "hidden";
  }
  /**
   * Shows the close buttons of the modal.
   * If the component is not connected to the DOM, does nothing.
   */
  showCloseButtons() {
    if (!this.isConnected) return;
    let refs = this.getRefs();
    refs.close_x_button.removeAttribute("aria-hidden");
    refs.close_x_button.style.visibility = "visible";
    refs.close_button.removeAttribute("aria-hidden");
    refs.close_button.style.visibility = "visible";
  }
};
export {
  Component,
  DOMReady,
  Modal2 as Modal,
  PaginatedTable,
  Pagination,
  SlotToggler,
  Table,
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
