// src/utils/utils.js
function DOMReady(callback, doc = window.document) {
  doc.readyState === "interactive" || doc.readyState === "complete" ? callback() : doc.addEventListener("DOMContentLoaded", callback);
}
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"']/g, function(m) {
    let charset = {
      "&": "&amp;",
      "<": "&lt;",
      '"': "&quot;",
      "'": "&#39;"
      // ' -> &apos; for XML only
    };
    return charset[
      /** @type {'&' | '<' | '"' | "'"} */
      m
    ];
  });
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
function showSpinnerInButton(button, customClassName = null, doc = window.document) {
  if (button.getElementsByClassName("spinner-border")[0]) return;
  let spinner = doc.createElement("span");
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
function isDarkMode(wnd = window) {
  if (wnd.matchMedia && wnd.matchMedia("(prefers-color-scheme: dark)").matches) {
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
function fadeIn(element, duration = 400, wnd = window) {
  element.style.opacity = "0";
  element.style.display = "block";
  let last = +/* @__PURE__ */ new Date();
  const tick = () => {
    let date = +/* @__PURE__ */ new Date();
    element.style.opacity = String(+element.style.opacity + (date - last) / duration);
    last = +/* @__PURE__ */ new Date();
    if (+element.style.opacity < 1) {
      wnd.requestAnimationFrame && wnd.requestAnimationFrame(tick) || setTimeout(tick, 16);
    }
  };
  tick();
}
function fadeOut(element, duration = 400, wnd = window) {
  element.style.opacity = "1";
  let last = +/* @__PURE__ */ new Date();
  const tick = () => {
    let date = +/* @__PURE__ */ new Date();
    element.style.opacity = String(+element.style.opacity - (date - last) / duration);
    last = +/* @__PURE__ */ new Date();
    if (+element.style.opacity > 0) {
      wnd.requestAnimationFrame && wnd.requestAnimationFrame(tick) || setTimeout(tick, 16);
    }
  };
  tick();
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function withMinimumTime(promise, minTime) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let promiseFinished = false;
    let timerFinished = false;
    let result;
    let error;
    const timerId = setTimeout(() => {
      timerFinished = true;
      if (promiseFinished) {
        if (error) reject(error);
        else resolve(result);
      }
    }, minTime);
    promise.then((res) => {
      result = res;
      promiseFinished = true;
      const elapsed = Date.now() - startTime;
      if (elapsed >= minTime && timerFinished) {
        resolve(res);
      }
    }).catch((err) => {
      error = err;
      promiseFinished = true;
      const elapsed = Date.now() - startTime;
      if (elapsed >= minTime && timerFinished) {
        reject(err);
      }
    });
  });
}
async function runWithMinimumTime(promiseFunc, ms) {
}

// src/utils/date-time.js
function formatDateTime(unix_timestamp) {
  var t = new Date(unix_timestamp * 1e3);
  return `${t.toLocaleDateString("en-GB")} ${t.toLocaleTimeString("en-GB")}`;
}
function formatDate(unix_timestamp) {
  var t = new Date(unix_timestamp * 1e3);
  return `${t.toLocaleDateString("en-GB")}`;
}
function unixtime(dateObject = /* @__PURE__ */ new Date()) {
  return Math.floor(dateObject.getTime() / 1e3);
}

// src/utils/toggler.js
var Toggler = class {
  /** @type {Map<string, { isActive: boolean, on: (itemName:string) => void, off: (itemName:string) => void }>} */
  items = /* @__PURE__ */ new Map();
  /** @type {string} */
  #active = "";
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
  /**
   * Initializes the toggler with the given active item name.
   * Sets the active item to the given item name and runs the callbacks for all items in the toggler.
   * @param {string} active - The name of the item to be set as active.
   */
  init(active) {
    this.setActive(active);
    this.runCallbacks();
  }
};

// src/utils/core-styles.js
function injectCoreStyles(doc = window.document) {
  if (!doc) {
    throw new Error("Document is null. Cannot inject core styles.");
  }
  const css = (
    /* css */
    `
.d-none {
    display: none !important;
}

html-fragment {
    display: contents;
}
`
  );
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
}

// node_modules/dom-scope/dist/dom-scope.esm.js
var SCOPE_ATTR_NAME = "data-scope";
var SCOPE_AUTO_NAME_PREFIX = "unnamed-scope";
var REF_ATTR_NAME = "data-ref";
var ScopeConfig = class {
  /** @type {string} */
  ref_attr_name;
  /** @type {string} */
  scope_ref_attr_name;
  /** @type {*} */
  window;
  /** @type {TypeIsScopeElement|null} */
  isScopeElement;
  /** @type {boolean} */
  includeRoot;
  /** @type {string} */
  scope_auto_name_prefix;
  constructor() {
    this.ref_attr_name = REF_ATTR_NAME;
    this.scope_ref_attr_name = SCOPE_ATTR_NAME;
    this.window = globalThis.window;
    this.isScopeElement = null;
    this.includeRoot = false;
    this.scope_auto_name_prefix = SCOPE_AUTO_NAME_PREFIX;
  }
  toString() {
    return `ScopeConfig(ref_attr_name=${this.ref_attr_name}, scope_ref_attr_name=${this.scope_ref_attr_name}, includeRoot=${this.includeRoot}, scope_auto_name_prefix=${this.scope_auto_name_prefix}, window=${this.window ? "defined" : "undefined"}, isScopeElement=${this.isScopeElement})`;
  }
};
var defaultConfig = new ScopeConfig();
function isScopeElement(element, config) {
  var value = null;
  if (!config) config = defaultConfig;
  let scope_ref_attr_name = config.scope_ref_attr_name || SCOPE_ATTR_NAME;
  let isScopeElementFunc = config.isScopeElement;
  if (isScopeElementFunc) {
    value = isScopeElementFunc(element, config);
  } else {
    value = element.getAttribute(scope_ref_attr_name);
  }
  if (value === null) return null;
  return value;
}
function createCustomConfig(options = {}) {
  let config = new ScopeConfig();
  config.includeRoot = options.hasOwnProperty("includeRoot") && typeof options.includeRoot !== "undefined" ? options.includeRoot : defaultConfig.includeRoot;
  config.scope_auto_name_prefix = options.hasOwnProperty("scope_auto_name_prefix") && typeof options.scope_auto_name_prefix === "string" ? options.scope_auto_name_prefix : defaultConfig.scope_auto_name_prefix;
  config.isScopeElement = options.hasOwnProperty("isScopeElement") && typeof options.isScopeElement !== "undefined" ? options.isScopeElement : defaultConfig.isScopeElement;
  config.ref_attr_name = options.hasOwnProperty("ref_attr_name") && typeof options.ref_attr_name === "string" ? options.ref_attr_name : defaultConfig.ref_attr_name;
  config.window = options.hasOwnProperty("window") && typeof options.window !== "undefined" ? options.window : defaultConfig.window;
  config.scope_ref_attr_name = options.hasOwnProperty("scope_ref_attr_name") && typeof options.scope_ref_attr_name === "string" ? options.scope_ref_attr_name : defaultConfig.scope_ref_attr_name;
  return config;
}
function selectRefsExtended(root_element, custom_callback, options = {}) {
  var refs = {};
  var scope_refs = {};
  var unnamed_scopes = [];
  const config = createCustomConfig(options);
  function callback(currentNode) {
    var ref_name = currentNode.getAttribute(config.ref_attr_name);
    if (ref_name != null) {
      if (ref_name != "") {
        if (!refs[ref_name]) {
          refs[ref_name] = currentNode;
        } else {
          if (globalThis.window) {
            console.warn(
              `Element has reference #${ref_name} which is already used
`,
              `
element: `,
              currentNode,
              `
reference #${ref_name}: `,
              refs[ref_name],
              `
scope root: `,
              root_element
            );
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
          console.warn(
            `scope #${ref_scope_name} is already used`,
            globalThis.window ? currentNode : ""
          );
          unnamed_scopes.push(currentNode);
        }
      } else {
        unnamed_scopes.push(currentNode);
      }
    }
    if (custom_callback) custom_callback(currentNode);
  }
  if (config.includeRoot === true) {
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
  const SCOPE_AUTO_NAME_PREFIX2 = config.scope_auto_name_prefix;
  unnamed_scopes.forEach((unnamed_scope_element) => {
    while (scope_refs[SCOPE_AUTO_NAME_PREFIX2 + index.toString()]) {
      index++;
    }
    scope_refs[SCOPE_AUTO_NAME_PREFIX2 + index.toString()] = unnamed_scope_element;
  });
  return { refs, scope_refs };
}
function walkDomScope(root_element, callback, options) {
  const config = createCustomConfig(options);
  function scope_filter(_node) {
    var node = (
      /** @type {HTMLElement} */
      _node
    );
    var parentElement = node.parentElement;
    if (parentElement && parentElement != root_element && isScopeElement(parentElement, config) !== null) {
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
  if (config.includeRoot === true) {
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
      throw new Error(`Missing data-ref: ${prop}`);
    }
    const type = typeof annotation[prop] === "function" ? annotation[prop].prototype : annotation[prop];
    if (type.isPrototypeOf(ref) === false) {
      throw new Error(
        `The data-ref "${prop}" must be an instance of ${type.constructor.name} (actual: ${ref.constructor.name})`
      );
    }
  }
}
function createFromHTML(html, options) {
  if (typeof html !== "string") {
    throw new Error("html must be a string");
  }
  const config = createCustomConfig(options);
  if (!config.window) {
    throw new Error("window is not defined in options");
  }
  let wnd = config.window;
  const doc = (
    /** @type {Document} */
    wnd.document
  );
  const template = doc.createElement("template");
  template.innerHTML = html;
  return template.content;
}

// src/component/slot-manager.js
var SlotManager = class {
  /** @type {Set<string>} */
  #slotNames = /* @__PURE__ */ new Set();
  /** @type {Map<string, Set<Component>>} */
  #namedSlotChildren = /* @__PURE__ */ new Map();
  /** @type {Set<Component>}  */
  #childrenComponents = /* @__PURE__ */ new Set();
  /** @type {Component} */
  #component;
  /** @type {boolean} */
  #slotStrictMode = false;
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.#component = component;
  }
  /**
   * @param {boolean} mode
   */
  setSlotStrictMode(mode) {
    this.#slotStrictMode = mode;
  }
  /**
   * Defines the names of the slots in the component.
   * The slots are declared in the component's template using the "data-slot" attribute.
   * The slot names are used to access the children components of the component.
   * @param {...string} slotNames - The names of the slots.
   */
  defineSlots(...slotNames) {
    const newSlotNames = new Set(slotNames);
    for (const existingSlotName of this.#slotNames) {
      if (!newSlotNames.has(existingSlotName)) {
        this.removeSlot(existingSlotName);
      }
    }
    for (const slotName of newSlotNames) {
      this.addSlot(slotName);
    }
  }
  /**
   * Adds a slot to the component.
   * This method is used to programmatically add a slot to the component.
   * @param {string} slotName - The name of the slot to add.
   */
  addSlot(slotName) {
    if (!this.#namedSlotChildren.has(slotName)) {
      this.#namedSlotChildren.set(slotName, /* @__PURE__ */ new Set());
    }
    this.#slotNames.add(slotName);
  }
  /**
   * Removes the given slot name from the component.
   * This method first unmounts all children components of the given slot name,
   * then removes the slot name from the component's internal maps.
   * @param {string} slotName - The name of the slot to remove.
   */
  removeSlot(slotName) {
    if (!this.#slotNames.has(slotName)) return;
    let slotChildren = this.#namedSlotChildren.get(slotName);
    if (slotChildren) {
      slotChildren.forEach((childComponent) => {
        this.#component.removeChildComponent(childComponent);
        childComponent.unmount();
        this.#childrenComponents.delete(childComponent);
      });
      this.#namedSlotChildren.delete(slotName);
    }
    this.#slotNames.delete(slotName);
  }
  /**
   * Returns an array of slot names defined in the component.
   * @type {string[]}
   */
  get slotNames() {
    let arr = Array.from(this.#slotNames);
    return arr;
  }
  /**
   * Checks if the given slot name exists in the component.
   * @param {string} slotName - The name of the slot to check.
   * @returns {boolean} True if the slot exists, false otherwise.
   */
  slotExists(slotName) {
    return this.#slotNames.has(slotName);
  }
  /**
   * Adds a child component to a slot.
   * @param {string} slotName - The name of the slot to add the component to.
   * @param {...Component} components - The components to add to the slot.
   * @throws {Error} If the slot does not exist.
   */
  addComponentsToSlot(slotName, ...components) {
    if (!this.slotExists(slotName)) {
      if (this.#slotStrictMode) {
        throw new Error(`Slot "${slotName}" does not exist`);
      } else {
        console.warn(
          `Warning: Slot "${slotName}" does not exist in component "${this.#component.constructor.name}". It will be created automatically.`
        );
      }
    }
    let childrenComponentsSet = this.#namedSlotChildren.get(slotName);
    if (!childrenComponentsSet) {
      childrenComponentsSet = /* @__PURE__ */ new Set();
      this.#namedSlotChildren.set(slotName, childrenComponentsSet);
    }
    for (let i = 0; i < components.length; i++) {
      this.#childrenComponents.add(components[i]);
      childrenComponentsSet.add(components[i]);
    }
  }
  /**
   * Removes the given child component from all slots.
   * @param {Component} childComponent - The child component to remove.
   */
  removeChildComponent(childComponent) {
    this.#childrenComponents.delete(childComponent);
    for (let [slotName, childrenComponentsSet] of this.#namedSlotChildren) {
      if (!childrenComponentsSet.has(childComponent)) continue;
      childrenComponentsSet.delete(childComponent);
      break;
    }
  }
  /**
   * Returns the children components of the component.
   * @type {Set<Component>}
   */
  get children() {
    return this.#childrenComponents;
  }
  /**
   * Mounts all children components of the given slot name to the DOM.
   * The children components are mounted to the slot ref element with the "append" mode.
   * If no slot name is given, all children components of all slots are mounted to the DOM.
   * @param {string} [slotName] - The name of the slot to mount children components for.
   */
  mountChildren(slotName) {
    if (this.#component.isConnected !== true) return;
    const slotNames = slotName ? [slotName] : Array.from(this.#slotNames);
    let hasInvalidSlot = slotNames.some(
      (name) => !this.#component.$internals.slotRefs[name]
    );
    if (hasInvalidSlot) {
      if (this.#slotStrictMode) {
        throw new Error(
          `One or more slot names do not exist in component "${this.#component.constructor.name}"`
        );
      } else {
        this.#component.updateRefs();
        let hasInvalidSlot_2 = slotNames.some(
          (name) => !this.#component.$internals.slotRefs[name]
        );
        if (hasInvalidSlot_2) {
          console.warn(
            `One or more slot names do not exist in component "${this.#component.constructor.name}"`
          );
          return;
        }
      }
    }
    for (const currentSlotName of slotNames) {
      const children = this.#namedSlotChildren.get(currentSlotName);
      const slotRef = this.#component.$internals.slotRefs[currentSlotName];
      if (!children || !slotRef) continue;
      for (const child of children) {
        if (!child.isCollapsed) {
          child.mount(slotRef, "append");
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
    let slotNames = slotName ? [slotName] : Array.from(this.#slotNames);
    for (let i = 0; i < slotNames.length; i++) {
      let children = Array.from(
        this.#namedSlotChildren.get(slotNames[i]) || []
      );
      for (let y = 0; y < children.length; y++) {
        children[y].unmount();
      }
    }
  }
};

// node_modules/@supercat1337/event-emitter/dist/event-emitter.esm.js
var EventEmitter = class {
  /**
   * Object that holds events and their listeners
   * @type {Object.<string, Function[]>}
   */
  events = {};
  /** @type {Object.<"#has-listeners"|"#no-listeners"|"#listener-error", Function[]>} */
  #internalEvents = {
    "#has-listeners": [],
    "#no-listeners": [],
    "#listener-error": []
  };
  #isDestroyed = false;
  /**
   * logErrors indicates whether errors thrown by listeners should be logged to the console.
   * @type {boolean}
   */
  logErrors = true;
  /**
   * Is the event emitter destroyed?
   * @type {boolean}
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }
  /**
   * on is used to add a callback function that's going to be executed when the event is triggered
   * @param {T} event
   * @param {Function} listener
   * @returns {()=>void}
   */
  on(event, listener) {
    if (this.#isDestroyed) {
      throw new Error("EventEmitter is destroyed");
    }
    if (typeof this.events[event] !== "object") {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    let that = this;
    let unsubscriber = function() {
      that.removeListener(event, listener);
    };
    if (this.events[event].length == 1) {
      this.#emitInternal("#has-listeners", event);
    }
    return unsubscriber;
  }
  /**
   * Internal method to add a listener to an internal event
   * @param {"#has-listeners"|"#no-listeners"|"#listener-error"} event
   * @param {Function} listener
   * @returns {()=>void}
   */
  #onInternalEvent(event, listener) {
    this.#internalEvents[event].push(listener);
    let that = this;
    let unsubscriber = function() {
      that.#removeInternalListener(event, listener);
    };
    return unsubscriber;
  }
  /**
   * Internal method to remove a listener from an internal event
   * @param {"#has-listeners"|"#no-listeners"|"#listener-error"} event
   * @param {Function} listener
   */
  #removeInternalListener(event, listener) {
    var idx;
    if (typeof this.#internalEvents[event] === "object") {
      idx = this.#internalEvents[event].indexOf(listener);
      if (idx > -1) {
        this.#internalEvents[event].splice(idx, 1);
      }
    }
  }
  /**
   * off is an alias for removeListener
   * @param {T} event
   * @param {Function} listener
   */
  off(event, listener) {
    return this.removeListener(event, listener);
  }
  /**
   * Remove an event listener from an event
   * @param {T} event
   * @param {Function} listener
   */
  removeListener(event, listener) {
    if (this.#isDestroyed) {
      return;
    }
    var idx;
    if (!this.events[event]) return;
    idx = this.events[event].indexOf(listener);
    if (idx > -1) {
      this.events[event].splice(idx, 1);
      if (this.events[event].length == 0) {
        this.#emitInternal("#no-listeners", event);
      }
    }
  }
  /**
   * emit is used to trigger an event
   * @param {T} event
   * @param {...any} args
   */
  emit(event, ...args) {
    if (this.#isDestroyed) {
      return;
    }
    if (typeof this.events[event] !== "object") return;
    var listeners = this.events[event];
    var length = listeners.length;
    for (var i = 0; i < length; i++) {
      try {
        listeners[i].apply(this, args);
      } catch (e) {
        this.#emitInternal("#listener-error", e, event, ...args);
        if (this.logErrors) {
          console.error(`Error in listener for event "${event}":`, e);
        }
      }
    }
  }
  /**
   * Internal function to emit an event
   * @param {"#has-listeners"|"#no-listeners"|"#listener-error"} event
   * @param {...any} args
   */
  #emitInternal(event, ...args) {
    var listeners = this.#internalEvents[event];
    var length = listeners.length;
    for (var i = 0; i < length; i++) {
      try {
        listeners[i].apply(this, args);
      } catch (e) {
        let listenerError = e;
        listenerError.cause = {
          event,
          args
        };
        if (event === "#listener-error") {
          if (this.logErrors) {
            console.error(
              `Error in listener for internal event "${event}":`,
              listenerError
            );
          }
          continue;
        }
        if (event === "#has-listeners") {
          if (this.logErrors) {
            console.error(
              `Error in listener for internal event "${event}":`,
              listenerError
            );
          }
          this.#emitInternal(
            "#listener-error",
            listenerError,
            "#has-listeners",
            ...args
          );
        }
        if (event === "#no-listeners") {
          if (this.logErrors) {
            console.error(
              `Error in listener for internal event "${event}":`,
              listenerError
            );
          }
          this.#emitInternal(
            "#listener-error",
            listenerError,
            "#no-listeners",
            ...args
          );
        }
      }
    }
  }
  /**
   * Add a one-time listener
   * @param {T} event
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
    if (this.#isDestroyed) {
      throw new Error("EventEmitter is destroyed");
    }
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
    if (this.#isDestroyed) {
      throw new Error("EventEmitter is destroyed");
    }
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
    if (this.#isDestroyed) {
      return;
    }
    this.#isDestroyed = true;
    this.#internalEvents = {
      "#has-listeners": [],
      "#no-listeners": [],
      "#listener-error": []
    };
    this.events = {};
  }
  /**
   * Clears all listeners for a specified event.
   * @param {T} event - The event for which to clear all listeners.
   */
  clearEventListeners(event) {
    if (this.#isDestroyed) {
      return;
    }
    let listeners = this.events[event] || [];
    let listenersCount = listeners.length;
    if (listenersCount > 0) {
      this.events[event] = [];
      this.#emitInternal("#no-listeners", event);
    }
  }
  /**
   * onHasEventListeners() is used to subscribe to the "#has-listeners" event. This event is emitted when the number of listeners for any event (except "#has-listeners" and "#no-listeners") goes from 0 to 1.
   * @param {Function} callback
   * @returns {()=>void}
   */
  onHasEventListeners(callback) {
    if (this.#isDestroyed) {
      throw new Error("EventEmitter is destroyed");
    }
    return this.#onInternalEvent("#has-listeners", callback);
  }
  /**
   * onNoEventListeners() is used to subscribe to the "#no-listeners" event. This event is emitted when the number of listeners for any event (except "#has-listeners" and "#no-listeners") goes from 1 to 0.
   * @param {Function} callback
   * @returns {()=>void}
   */
  onNoEventListeners(callback) {
    if (this.#isDestroyed) {
      throw new Error("EventEmitter is destroyed");
    }
    return this.#onInternalEvent("#no-listeners", callback);
  }
  /**
   * onListenerError() is used to subscribe to the "#listener-error" event. This event is emitted when any listener throws an error.
   * @param {Function} callback
   * @returns {()=>void}
   */
  onListenerError(callback) {
    if (this.#isDestroyed) {
      throw new Error("EventEmitter is destroyed");
    }
    return this.#onInternalEvent("#listener-error", callback);
  }
};

// src/component/internals.js
var Internals = class {
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.disconnectController = new AbortController();
    this.root = null;
    this.textUpdateFunction = null;
    this.textResources = {};
    this.refs = {};
    this.slotRefs = {};
    this.parentComponent = null;
    this.parentSlotName = "";
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
function onDisconnectDefault(component) {
  try {
    component.disconnectedCallback();
  } catch (e) {
    console.error("Error in disconnectedCallback:", e);
  }
}
var Component = class _Component {
  /** @type {Internals} */
  $internals = new Internals();
  /** @type {LayoutFunction|string|undefined} */
  #layout = void 0;
  /** @type {LayoutFunction|string|undefined} */
  layout;
  /** @type {string[]|undefined} */
  slots;
  /** @type {import("dom-scope").RefsAnnotation|undefined} */
  refsAnnotation;
  /** @type {Node|null} */
  #template = null;
  #connected = false;
  slotManager = new SlotManager(this);
  isCollapsed = false;
  constructor() {
    this.onConnect(onConnectDefault);
    this.onDisconnect(onDisconnectDefault);
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
   * @param {import("./internals.js").TextUpdateFunction|null} func - The text update function to set.
   * @returns {void}
   */
  setTextUpdateFunction(func) {
    this.$internals.textUpdateFunction = func;
  }
  #loadTemplate() {
    if (this.layout) {
      this.#layout = this.layout;
      this.layout = void 0;
    }
    let layout = this.#layout || void 0;
    if (layout == void 0) return;
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
   * @param {import("dom-scope").RefsAnnotation} [annotation] - An array of strings representing the names of the refs.
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
   * Returns the ref element with the given name.
   * @param {string} refName - The name of the ref to retrieve.
   * @returns {HTMLElement} The ref element with the given name.
   * @throws {Error} If the ref does not exist.
   */
  getRef(refName) {
    let refs = this.getRefs();
    if (!(refName in refs)) {
      throw new Error(`Ref "${refName}" does not exist`);
    }
    return refs[refName];
  }
  /**
   * Checks if a ref with the given name exists.
   * @param {string} refName - The name of the ref to check.
   * @returns {boolean} True if the ref exists, false otherwise.
   */
  hasRef(refName) {
    let refs = this.getRefs();
    return refName in refs;
  }
  /**
   * Updates the refs object with the current state of the DOM.
   * This method is usually called internally when the component is connected or disconnected.
   * @throws {Error} If the component is not connected to the DOM.
   * @returns {void}
   */
  updateRefs() {
    if (!this.$internals.root) {
      throw new Error("Component is not connected to the DOM");
    }
    let componentRoot = (
      /** @type {HTMLElement} */
      this.$internals.root
    );
    let { refs, scope_refs } = selectRefsExtended(componentRoot, null, {
      scope_ref_attr_name: "data-slot",
      ref_attr_name: "data-ref"
    });
    if (this.refsAnnotation) {
      checkRefs(refs, this.refsAnnotation);
    }
    for (let key in scope_refs) {
      this.slotManager.addSlot(key);
    }
    this.$internals.refs = refs;
    this.$internals.slotRefs = scope_refs;
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
   * Subscribes to the "disconnect" event.
   * This event is emitted just before the component is disconnected from the DOM.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * The callback is called with the component instance as the this value.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onDisconnect(callback) {
    return this.on("disconnect", callback);
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
   * Subscribes to the "collapse" event.
   * This event is emitted after the component has collapsed.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onCollapse(callback) {
    return this.on("collapse", callback);
  }
  /**
   * Subscribes to the "expand" event.
   * This event is emitted after the component has expanded.
   * The callback is called with the component instance as the this value.
   * @param {(component: this) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onExpand(callback) {
    return this.on("expand", callback);
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
    this.updateRefs();
    this.$internals.disconnectController = new AbortController();
    this.#connected = true;
    this.slotManager.mountChildren();
    this.emit("connect");
  }
  /**
   * Disconnects the component from the DOM.
   * Sets the component's #connected flag to false.
   * Clears the refs and slotRefs objects.
   * Aborts all event listeners attached with the $on method.
   * Emits "disconnect" event through the event emitter.
   */
  disconnect() {
    if (this.#connected === false) return;
    this.#connected = false;
    this.$internals.disconnectController.abort();
    this.$internals.refs = {};
    this.$internals.slotRefs = {};
    this.emit("disconnect");
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
    if (!(container instanceof Element)) {
      throw new TypeError("Container must be a DOM Element");
    }
    const validModes = ["replace", "append", "prepend"];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Must be one of: ${validModes.join(", ")}`);
    }
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
    this.slotManager.unmountChildren();
    this.disconnect();
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
    this.emit("collapse");
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
    this.$internals.parentComponent.addComponentToSlot(this.$internals.parentSlotName, this);
    this.emit("expand");
  }
  /**
   * Shows the component.
   * If the component is not connected, it does nothing.
   * If the component is connected, it removes the "d-none" class from the root element.
   */
  show() {
    if (!this.isConnected) return;
    this.$internals.root?.classList.remove("d-none");
  }
  /**
   * Hides the component.
   * If the component is not connected, it does nothing.
   * If the component is connected, it adds the "d-none" class to the root element.
   */
  hide() {
    if (!this.isConnected) return;
    this.$internals.root?.classList.add("d-none");
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
  addComponentToSlot(slotName, ...components) {
    if (!components.every((comp) => comp instanceof _Component)) {
      throw new Error("All components must be instances of Component");
    }
    if (typeof this.slots !== "undefined") {
      this.defineSlots(...this.slots);
    }
    this.slotManager.addComponentsToSlot(slotName, ...components);
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
export {
  Component,
  DOMReady,
  SlotToggler,
  Toggler,
  copyToClipboard,
  escapeHtml,
  fadeIn,
  fadeOut,
  formatBytes,
  formatDate,
  formatDateTime,
  getDefaultLanguage,
  hideElements,
  injectCoreStyles,
  isDarkMode,
  removeSpinnerFromButton,
  runWithMinimumTime,
  scrollToBottom,
  scrollToTop,
  showElements,
  showSpinnerInButton,
  sleep,
  ui_button_status_waiting_off,
  ui_button_status_waiting_off_html,
  ui_button_status_waiting_on,
  unixtime,
  withMinimumTime
};
