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
function ui_button_status_waiting_off_html(el, html2) {
  el.disabled = false;
  el.innerHTML = html2;
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
function delegateEvent(eventType, ancestorElement, targetElementSelector, listenerFunction) {
  ancestorElement.addEventListener(eventType, function(event) {
    let target;
    if (event.target && event.target instanceof Element) {
      target = event.target;
      if (event.target.matches(targetElementSelector)) {
        listenerFunction(event, target);
      } else if (event.target.closest(targetElementSelector)) {
        target = event.target.closest(targetElementSelector);
        listenerFunction(event, target);
      }
    }
  });
}
var SafeHTML = class {
  /** @param {string} html */
  constructor(html2) {
    this.html = html2;
  }
  toString() {
    return this.html;
  }
};
function unsafeHTML(html2) {
  return new SafeHTML(html2);
}
function html(strings, ...values) {
  let rawResult = "";
  if (typeof strings === "string") {
    rawResult = strings;
  } else if (Array.isArray(strings)) {
    rawResult = strings.reduce((acc, str, i) => {
      let value = values[i - 1];
      if (Array.isArray(value)) {
        value = value.join("");
      }
      const stringValue = value instanceof SafeHTML ? value.toString() : escapeHtml(String(value ?? ""));
      return acc + stringValue + str;
    });
  }
  const tmpl = document.createElement("template");
  tmpl.innerHTML = rawResult;
  return tmpl.content;
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

// src/utils/pagination.js
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
function renderPaginationElement(currentPageNumber, totalPages, itemUrlRenderer, onClickCallback) {
  let ul = document.createElement("ul");
  ul.classList.add("pagination");
  let items = createPaginationArray(currentPageNumber, totalPages);
  items.forEach((item) => {
    let li = document.createElement("li");
    li.classList.add("page-item");
    if (item == "...") {
      li.classList.add("disabled");
      let span = document.createElement("span");
      span.classList.add("page-link");
      span.textContent = item;
      li.appendChild(span);
      ul.appendChild(li);
      return;
    }
    let a = document.createElement("a");
    a.classList.add("page-link");
    if (item == currentPageNumber.toString()) {
      li.classList.add("active");
    }
    if (itemUrlRenderer) {
      a.href = itemUrlRenderer(Number(item));
    } else {
      a.href = "#";
    }
    a.textContent = item;
    a.setAttribute("data-page-value", item);
    li.appendChild(a);
    ul.appendChild(li);
    if (onClickCallback) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        let link = (
          /** @type {HTMLAnchorElement} */
          e.target
        );
        if (!link) return false;
        let pageValue = link.getAttribute("data-page-value");
        if (!pageValue) return false;
        return onClickCallback(Number(pageValue));
      });
    }
  });
  return ul;
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
var DEFAULT_SETTINGS = {
  REF_ATTR: "data-ref",
  SCOPE_ATTR: "data-scope",
  AUTO_PREFIX: "unnamed-scope"
};
var ScopeConfig = class {
  /** @param {import("./dom-scope.esm.d.ts").ScopeOptions} [options] */
  constructor(options = {}) {
    this.refAttribute = options.refAttribute ?? DEFAULT_SETTINGS.REF_ATTR;
    this.scopeAttribute = options.scopeAttribute ?? DEFAULT_SETTINGS.SCOPE_ATTR;
    this.window = options.window ?? (typeof globalThis !== "undefined" ? globalThis.window : void 0);
    this.isScopeElement = options.isScopeElement ?? null;
    this.scopeAutoNamePrefix = options.scopeAutoNamePrefix ?? DEFAULT_SETTINGS.AUTO_PREFIX;
  }
};
var defaultInstance = new ScopeConfig();
function isScopeElement(element, config = defaultInstance) {
  if (config.isScopeElement) {
    return config.isScopeElement(element, config);
  }
  const attrs = Array.isArray(config.scopeAttribute) ? config.scopeAttribute : [config.scopeAttribute];
  for (const attr of attrs) {
    const value = element.getAttribute(attr);
    if (value !== null) return value;
  }
  return null;
}
function createConfig(options = {}) {
  if (options instanceof ScopeConfig) return options;
  return new ScopeConfig({ ...defaultInstance, ...options });
}
function selectRefsExtended(roots, customCallback = null, options = {}) {
  const config = createConfig(options);
  const refs = {};
  const scopeRefs = {};
  const unnamedScopes = [];
  const rootList = Array.isArray(roots) ? roots : [roots];
  const callback = (currentNode) => {
    const refName = currentNode.getAttribute(config.refAttribute);
    if (refName) {
      if (!refs[refName]) {
        refs[refName] = currentNode;
      } else {
        console.warn(`[Scope] Duplicate ref #${refName} found during multi-root scan.`);
      }
    }
    if (!rootList.includes(
      /** @type {HTMLElement} */
      currentNode
    )) {
      const scopeName = isScopeElement(currentNode, config);
      if (typeof scopeName === "string") {
        if (scopeName !== "" && !scopeRefs[scopeName]) {
          scopeRefs[scopeName] = currentNode;
        } else {
          unnamedScopes.push(currentNode);
        }
      }
    }
    if (customCallback) customCallback(currentNode);
  };
  walkDomScope(roots, callback, config);
  let index = 0;
  const prefix = config.scopeAutoNamePrefix;
  for (const unnamedEl of unnamedScopes) {
    while (scopeRefs[prefix + index]) index++;
    scopeRefs[prefix + index] = unnamedEl;
  }
  return { refs, scopeRefs };
}
function walkDomScope(roots, callback, options) {
  const config = createConfig(options);
  const win = config.window;
  const rootList = Array.isArray(roots) ? roots : [roots];
  for (const root of rootList) {
    const filter = (node) => {
      const el = (
        /** @type {HTMLElement} */
        node
      );
      if (rootList.includes(el)) return win.NodeFilter.FILTER_ACCEPT;
      const parent = el.parentElement;
      if (parent && !rootList.includes(parent) && isScopeElement(parent, config) !== null) {
        return win.NodeFilter.FILTER_REJECT;
      }
      return win.NodeFilter.FILTER_ACCEPT;
    };
    const walker = win.document.createTreeWalker(root, win.NodeFilter.SHOW_ELEMENT, {
      acceptNode: filter
    });
    let currentNode;
    while (currentNode = /** @type {HTMLElement} */
    walker.nextNode()) {
      callback(currentNode);
    }
  }
}
function checkRefs(refs, annotation) {
  for (const [prop, expectedType] of Object.entries(annotation)) {
    const ref = refs[prop];
    if (!ref) {
      throw new Error(`[Scope] Missing required data-ref: "${prop}"`);
    }
    const targetProto = typeof expectedType === "function" ? expectedType.prototype : expectedType;
    if (!targetProto.isPrototypeOf(ref)) {
      const actualName = ref.constructor?.name || "Unknown";
      const expectedName = targetProto.constructor?.name || "ExpectedType";
      throw new Error(
        `[Scope] Type mismatch for "${prop}": expected ${expectedName}, got ${actualName}`
      );
    }
  }
}

// src/component/slot.js
var Slot = class {
  /** @type {string} */
  name;
  /** @type {Set<Component>} */
  components = /* @__PURE__ */ new Set();
  /** @type {Component} */
  #component;
  /**
   * Initializes a new instance of the Slot class.
   * @param {string} name - The name of the slot.
   * @param {Component} component
   */
  constructor(name, component) {
    this.name = name;
    this.#component = component;
  }
  /**
   * Attaches a component to the slot.
   * This method sets the given component's parent component and parent slot name,
   * and adds the component to the slot's internal set of components.
   * @param {Component} component - The component to attach to the slot.
   */
  attach(component) {
    component.$internals.parentComponent = this.#component;
    component.$internals.assignedSlotName = this.name;
    this.components.add(component);
  }
  /**
   * Detaches a component from the slot.
   * This method sets the given component's parent component and parent slot name to null,
   * and removes the component from the slot's internal set of components.
   * @param {Component} component - The component to detach from the slot.
   */
  detach(component) {
    component.$internals.parentComponent = null;
    component.$internals.assignedSlotName = "";
    this.components.delete(component);
  }
  /**
   * Detaches all components from the slot.
   * This method sets all components' parent component and parent slot name to null,
   * and removes all components from the slot's internal set of components.
   */
  detachAll() {
    this.components.forEach((component) => {
      component.$internals.parentComponent = null;
      component.$internals.assignedSlotName = "";
    });
    this.components.clear();
  }
  /**
   * Mounts all children components of the slot to the DOM.
   * This method first checks if the component is connected.
   * If not, it logs a warning and returns.
   * Then, it gets the root element of the slot from the component's internal slot refs map.
   * If the slot root element does not exist, it logs a warning and returns.
   * Finally, it iterates over all children components of the slot and calls their mount method with the slot root element and the "append" mode.
   */
  mount() {
    if (!this.#component.isConnected) {
      console.warn(
        `Cannot mount Slot "${this.name}" in disconnected component ${this.#component.constructor.name}`
      );
      return;
    }
    let slotRoot = this.#component.$internals.scopeRefs[this.name];
    if (!slotRoot) {
      console.warn(
        `Cannot get root element for Slot "${this.name}" does not exist in component "${this.#component.constructor.name}"`
      );
      return;
    }
    this.components.forEach((childComponent) => {
      if (!childComponent.isConnected && !childComponent.isCollapsed) {
        childComponent.mount(slotRoot, "append");
      }
    });
  }
  /**
   * Unmounts all children components of the slot from the DOM.
   * This method iterates over all children components of the slot and calls their unmount method.
   */
  unmount() {
    this.components.forEach((childComponent) => {
      childComponent.unmount();
    });
  }
  /**
   * Clears the slot of all its children components.
   * This method first unmounts all children components of the slot, then detaches them from the slot.
   */
  clear() {
    this.unmount();
    this.detachAll();
  }
};

// src/component/slot-manager.js
var SlotManager = class {
  /** @type {Map<string, Slot>} */
  slots = /* @__PURE__ */ new Map();
  /** @type {Component} */
  #component;
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.#component = component;
  }
  /**
   * Adds a slot to the component.
   * This method is used to programmatically add a slot to the component.
   * If the slot already exists, it is returned as is.
   * Otherwise, a new slot is created and added to the component's internal maps.
   * @param {string} slotName - The name of the slot to add.
   * @returns {Slot} Returns the slot.
   */
  registerSlot(slotName) {
    let slot = this.getSlot(slotName);
    if (slot != null) {
      return slot;
    } else {
      let slot2 = new Slot(slotName, this.#component);
      this.slots.set(slotName, slot2);
      return slot2;
    }
  }
  /**
   * @param {string} slotName
   * @returns {Slot | null}
   */
  getSlot(slotName) {
    return this.slots.get(slotName) || null;
  }
  /**
   * 
   * @param {string} slotName 
   * @returns {HTMLElement|null}
   */
  getSlotElement(slotName) {
    if (!this.#component.isConnected) {
      return null;
    }
    return this.#component.$internals.scopeRefs[slotName] || null;
  }
  /**
   * Checks if the given slot name exists in the component.
   * @param {string} slotName - The name of the slot to check.
   * @returns {boolean} True if the slot exists, false otherwise.
   */
  hasSlot(slotName) {
    return this.slots.has(slotName);
  }
  /**
   * Removes the given slot name from the component.
   * This method first unmounts all children components of the given slot name,
   * then removes the slot name from the component's internal maps.
   * @param {string} slotName - The name of the slot to remove.
   */
  removeSlot(slotName) {
    let slotExists = this.hasSlot(slotName);
    if (slotExists) {
      this.clearSlotContent(slotName);
      this.slots.delete(slotName);
    }
  }
  /**
   * Checks if the given slot name has any children components associated with it.
   * @param {string} slotName - The name of the slot to check.
   * @returns {boolean} True if the slot has children components, false otherwise.
   */
  hasSlotContent(slotName) {
    let slot = this.getSlot(slotName);
    if (slot == null) return false;
    return slot.components.size > 0;
  }
  /**
   * Clears the given slot name of all its children components.
   * This method first removes all children components of the given slot name from the component,
   * then unmounts them and finally removes them from the component's internal maps.
   * @param {string} slotName - The name of the slot to clear.
   * @returns {boolean} True if the slot was cleared, false otherwise.
   */
  clearSlotContent(slotName) {
    let slot = this.getSlot(slotName);
    if (slot == null) return false;
    slot.clear();
    return true;
  }
  /**
   * Returns an array of slot names defined in the component.
   * @type {string[]}
   */
  get slotNames() {
    let names = Array.from(this.slots.keys());
    return names;
  }
  /**
   * Mounts all children components of the given slot name to the DOM.
   * The children components are mounted to the slot ref element with the "append" mode.
   */
  mountAllSlots() {
    if (!this.#component.isConnected) return;
    this.slots.forEach((slot) => {
      slot.mount();
    });
  }
  /**
   * Mounts all children components of the given slot name to the DOM.
   * The children components are mounted to the slot ref element with the "append" mode.
   * If no slot name is given, all children components of all slots are mounted to the DOM.
   * @param {string} slotName - The name of the slot to mount children components for.
   */
  mountSlot(slotName) {
    let slot = this.getSlot(slotName);
    if (!slot) {
      console.warn(
        `Slot "${slotName}" does not exist in component "${this.#component.constructor.name}"`
      );
      return;
    }
    slot.mount();
  }
  /**
   * Unmounts all children components of the component from the DOM.
   * This method iterates over all children components of the component and calls their unmount method.
   */
  unmountAll() {
    for (let [slotName, slot] of this.slots) {
      slot.unmount();
    }
  }
  /**
   * Unmounts all children components of the given slot name from the DOM.
   * @param {string} slotName - The name of the slot to unmount children components for.
   */
  unmountSlot(slotName) {
    let slot = this.getSlot(slotName);
    if (slot == null) return;
    slot.unmount();
  }
  /**
   * Adds a child component to a slot.
   * @param {string} slotName - The name of the slot to add the component to.
   * @param {...Component} components - The components to add to the slot.
   * @returns {Slot} Returns the slot.
   */
  attachToSlot(slotName, ...components) {
    let slot = this.registerSlot(slotName);
    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      let usingSlot = this.findSlotByComponent(component);
      if (usingSlot != null) {
        continue;
      }
      slot.attach(component);
    }
    return slot;
  }
  /**
   * Removes the given child component from all slots.
   * This method first checks if the child component exists in the component's internal maps.
   * If it does, it removes the child component from the set of all children components and
   * from the sets of children components of all slots.
   * @param {Component} childComponent - The child component to remove.
   * @returns {boolean} True if the child component was removed, false otherwise.
   */
  removeComponent(childComponent) {
    let slot = this.findSlotByComponent(childComponent);
    if (!slot) return false;
    slot.detach(childComponent);
    childComponent.unmount();
    return true;
  }
  /**
   * Finds the slot associated with the given child component.
   * @param {Component} component - The child component to find the slot for.
   * @returns {Slot | null} The slot associated with the child component, or null if no slot is found.
   */
  findSlotByComponent(component) {
    let parentComponent = component.$internals.parentComponent;
    if (parentComponent != this.#component) {
      return null;
    }
    return this.getSlot(component.$internals.assignedSlotName);
  }
};

// node_modules/@supercat1337/event-emitter/src/event-emitter-lite.js
var ORIGINAL = /* @__PURE__ */ Symbol("original");
var EventEmitterLite = class {
  /**
   * @type {Object.<Events extends string ? Events : keyof Events, Function[]>}
   */
  events = /* @__PURE__ */ Object.create(null);
  /**
   * logErrors indicates whether errors thrown by listeners should be logged to the console.
   * @type {boolean}
   */
  logErrors = true;
  /**
   * on is used to add a callback function that's going to be executed when the event is triggered
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   * @returns {() => void}
   */
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    let unsubscriber = () => this.removeListener(event, listener);
    return unsubscriber;
  }
  /**
   * Add a one-time listener
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   * @returns {()=>void}
   */
  once(event, listener) {
    const wrapper = (...args) => {
      this.removeListener(event, wrapper);
      listener.apply(this, args);
    };
    wrapper[ORIGINAL] = listener;
    return this.on(event, wrapper);
  }
  /**
   * off is an alias for removeListener
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   */
  off(event, listener) {
    return this.removeListener(event, listener);
  }
  /**
   * Remove an event listener from an event
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   */
  removeListener(event, listener) {
    if (typeof listener !== "function") return;
    const listeners = this.events[event];
    if (!listeners) return;
    const idx = listeners.findIndex((l) => l === listener || l[ORIGINAL] === listener);
    if (idx > -1) {
      listeners.splice(idx, 1);
      if (listeners.length === 0) delete this.events[event];
    }
  }
  /**
   * emit is used to trigger an event
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {...any} args
   */
  emit(event, ...args) {
    const listeners = this.events[event];
    if (!listeners) return;
    const queue = (this.events[event] || []).slice();
    var length = queue.length;
    for (let i = 0; i < length; i++) {
      try {
        queue[i].apply(this, args);
      } catch (e) {
        if (this.logErrors) {
          console.error(`Error in listener for event "${String(event)}":`, e);
        }
      }
    }
  }
};

// node_modules/@supercat1337/event-emitter/src/event-emitter.js
var EventEmitter = class extends EventEmitterLite {
  /** @type {Object.<"#has-listeners"|"#no-listeners"|"#listener-error", Function[]>} */
  #internalEvents = {
    "#has-listeners": [],
    "#no-listeners": [],
    "#listener-error": []
  };
  #isDestroyed = false;
  #isReportingError = false;
  // Used to prevent infinite loop
  /**
   * Is the event emitter destroyed?
   * @type {boolean}
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }
  /**
   * on is used to add a callback function that's going to be executed when the event is triggered
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   */
  on(event, listener) {
    if (this.#isDestroyed) throw new Error("EventEmitter is destroyed");
    const isFirst = !this.events[event] || this.events[event].length === 0;
    const unsubscriber = super.on(event, listener);
    if (isFirst) {
      this.#emitInternal("#has-listeners", event);
    }
    return unsubscriber;
  }
  /**
   * Remove an event listener from an event
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {Function} listener
   */
  removeListener(event, listener) {
    if (typeof listener !== "function") return;
    if (this.#isDestroyed || !this.events[event]) return;
    super.removeListener(event, listener);
    if (!this.events[event]) {
      this.#emitInternal("#no-listeners", event);
    }
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
    const listeners = this.#internalEvents[event];
    if (!listeners) return;
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  }
  /**
   * emit is used to trigger an event
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   * @param {...any} args
   */
  emit(event, ...args) {
    if (this.#isDestroyed) {
      return;
    }
    if (typeof this.events[event] !== "object") return;
    const listeners = [...this.events[event]];
    var length = listeners.length;
    for (var i = 0; i < length; i++) {
      try {
        listeners[i].apply(this, args);
      } catch (e) {
        this.#emitInternal("#listener-error", e, event, ...args);
        if (this.logErrors) {
          console.error(`Error in listener for event "${String(event)}":`, e);
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
    const listeners = this.#internalEvents[event];
    if (!listeners || listeners.length === 0) return;
    const queue = listeners.slice();
    for (const fn of queue) {
      try {
        fn.apply(this, args);
      } catch (e) {
        if (event === "#listener-error" || this.#isReportingError) {
          if (this.logErrors) {
            console.error("Critical error in internal listener:", e);
          }
          continue;
        }
        this.#isReportingError = true;
        try {
          this.#emitInternal("#listener-error", e, event, ...args);
        } finally {
          this.#isReportingError = false;
        }
      }
    }
  }
  /**
   * Wait for a specific event to be emitted.
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event - The event to wait for.
   * @param {number} [max_wait_ms=0] - Maximum time to wait in ms. If 0, waits indefinitely.
   * @returns {Promise<boolean>} - Resolves with true if event emitted, false on timeout.
   */
  waitForEvent(event, max_wait_ms = 0) {
    return this.waitForAnyEvent([event], max_wait_ms);
  }
  /**
   * Wait for any of the specified events to be emitted.
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K[]} events - Array of event names.
   * @param {number} [max_wait_ms=0] - Maximum time to wait in ms.
   * @returns {Promise<boolean>} - Resolves with true if any event emitted, false on timeout.
   */
  waitForAnyEvent(events, max_wait_ms = 0) {
    if (this.#isDestroyed) throw new Error("EventEmitter is destroyed");
    return new Promise((resolve) => {
      let timeout;
      const unsubscribers = [];
      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        unsubscribers.forEach((u) => u());
      };
      const onEvent = () => {
        cleanup();
        resolve(true);
      };
      const uniqueEvents = [...new Set(events)];
      uniqueEvents.forEach((event) => {
        unsubscribers.push(this.on(event, onEvent));
      });
      if (max_wait_ms > 0) {
        timeout = setTimeout(() => {
          cleanup();
          resolve(false);
        }, max_wait_ms);
      }
    });
  }
  /**
   * Clear all events
   */
  clear() {
    if (this.#isDestroyed) return;
    const eventNames = Object.keys(this.events);
    eventNames.forEach((event) => {
      this.clearEventListeners(event);
    });
  }
  /**
   * Destroys the event emitter, clearing all events and listeners.
   */
  destroy() {
    if (this.#isDestroyed) return;
    this.clear();
    this.#isDestroyed = true;
    this.#internalEvents = {
      "#has-listeners": [],
      "#no-listeners": [],
      "#listener-error": []
    };
    this.events = /* @__PURE__ */ Object.create(null);
  }
  /**
   * Clears all listeners for a specified event.
   * @template {Events extends string ? Events : keyof Events} K
   * @param {K} event
   */
  clearEventListeners(event) {
    if (this.#isDestroyed) return;
    const listeners = this.events[event];
    if (listeners && listeners.length > 0) {
      delete this.events[event];
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
var Internals = class _Internals {
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.disconnectController = new AbortController();
    this.root = null;
    this.textUpdateFunction = null;
    this.textResources = {};
    this.refs = {};
    this.scopeRefs = {};
    this.parentComponent = null;
    this.assignedSlotName = "";
    this.mountMode = "replace";
    this.cloneTemplateOnRender = true;
    this.parentElement = null;
    this.elementsToRemove = /* @__PURE__ */ new Set();
  }
  static #instanceIdCounter = 0;
  /**
   * Generates a unique instance ID.
   * @returns {string} The unique instance ID.
   */
  static generateInstanceId() {
    let counter = ++_Internals.#instanceIdCounter;
    return `c${counter}`;
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
var Component = class {
  /** @type {Internals} */
  $internals = new Internals();
  /** @type {LayoutFunction|string|null|Node} */
  layout = null;
  /** @type {T} */
  refsAnnotation;
  #isConnected = false;
  slotManager = new SlotManager(this);
  #isCollapsed = false;
  /** @type {string} */
  #instanceId;
  #cachedElement = null;
  /**
   * Initializes a new instance of the Component class.
   * @param {Object} [options] - An object with the following optional properties:
   * @param {string} [options.instanceId] - The instance ID of the component. If not provided, a unique ID will be generated.
   */
  constructor(options = {
    instanceId: void 0
  }) {
    this.#instanceId = options.instanceId || Internals.generateInstanceId();
    this.onConnect(onConnectDefault);
    this.onDisconnect(onDisconnectDefault);
  }
  /** @returns {string} */
  get instanceId() {
    return this.#instanceId;
  }
  /* State */
  /**
   * Checks if the component is connected to a root element.
   * @returns {boolean} True if the component is connected, false otherwise.
   */
  get isConnected() {
    return this.#isConnected;
  }
  /**
   * Returns whether the component is currently collapsed or not.
   * @returns {boolean} True if the component is collapsed, false otherwise.
   */
  get isCollapsed() {
    return this.#isCollapsed;
  }
  /**
   * Returns whether the component is currently running on a server or not.
   * @returns {boolean} True if the component is running on a server, false otherwise.
   */
  get isServer() {
    return typeof window !== "undefined" && window.isServer === true;
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
   * @param {_TextUpdateFunction|null} func - The text update function to set.
   * @returns {void}
   */
  setTextUpdateFunction(func) {
    this.$internals.textUpdateFunction = func;
  }
  /**
   * Sets the layout of the component by assigning the template content.
   * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
   * @param {T} [annotation] - An array of strings representing the names of the refs.
   * The function is called with the component instance as the this value.
   */
  setLayout(layout, annotation) {
    this.layout = layout;
    if (annotation) {
      this.refsAnnotation = annotation;
    }
  }
  /**
   * Sets the renderer for the component by assigning the template content.
   * This is a synonym for setLayout.
   * @param {LayoutFunction|string} layout - A function that returns a Node representing the layout.
   * @param {T} [annotation] - An array of strings representing the names of the refs.
   * The function is called with the component instance as the this value.
   */
  setRenderer(layout, annotation) {
    this.setLayout(layout, annotation);
  }
  /* Refs */
  /**
   * Returns the refs object.
   * The refs object is a map of HTML elements with the keys specified in the refsAnnotation object.
   * The refs object is only available after the component has been connected to the DOM.
   * @returns {typeof this["refsAnnotation"]}
   */
  getRefs() {
    if (!this.#isConnected) {
      throw new Error("Component is not connected to the DOM");
    }
    return (
      /** @type {any} */
      this.$internals.refs
    );
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
    let { refs, scopeRefs } = selectRefsExtended(componentRoot, null, {
      scopeAttribute: ["data-slot", "data-component-root"],
      refAttribute: "data-ref",
      window
    });
    if (this.refsAnnotation) {
      checkRefs(refs, this.refsAnnotation);
    }
    for (let key in scopeRefs) {
      this.slotManager.registerSlot(key);
    }
    this.$internals.refs = refs;
    this.$internals.scopeRefs = scopeRefs;
  }
  /* Events */
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
    return this.$internals.eventEmitter.emit(event, ...args, this);
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
   * Subscribes to the "prepareRender" event.
   * This event is emitted just before the component is about to render its layout.
   * The callback is called with the component instance as the this value.
   * @param {(component: this, template: Node) => void} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  onPrepareRender(callback) {
    return this.on("prepareRender", callback);
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
  /* Lifecycle methods */
  /**
   * Connects the component to the specified componentRoot element.
   * Initializes the refs object and sets the component's root element.
   * Emits "connect" event through the event emitter.
   * @param {HTMLElement} componentRoot - The root element to connect the component to.
   */
  connect(componentRoot) {
    if (this.#isConnected === true) {
      throw new Error("Component is already connected");
    }
    this.$internals.root = componentRoot;
    this.updateRefs();
    this.$internals.disconnectController = new AbortController();
    this.#isConnected = true;
    this.slotManager.mountAllSlots();
    this.emit("connect");
  }
  /**
   * Disconnects the component from the DOM.
   * Sets the component's #isConnected flag to false.
   * Clears the refs and scopeRefs objects.
   * Aborts all event listeners attached with the $on method.
   * Emits "disconnect" event through the event emitter.
   */
  disconnect() {
    if (this.#isConnected === false) return;
    this.#isConnected = false;
    this.$internals.disconnectController.abort();
    this.$internals.refs = {};
    this.$internals.scopeRefs = {};
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
   * Default implementation of template getter.
   * Can be overridden or rely on this.layout.
   * @returns {string|Function|Node}
   */
  template() {
    return this.layout || "";
  }
  /**
   * Internal rendering engine.
   * Separates static (cached) layouts from dynamic (functional) layouts.
   * Ensures a single root Element is always returned.
   * @returns {Element}
   */
  render() {
    const layout = this.layout;
    if (!layout) {
      throw new Error("Layout is not defined for the component.");
    }
    const isStatic = typeof layout !== "function";
    if (isStatic && this.$internals.cloneTemplateOnRender && this.#cachedElement) {
      return (
        /** @type {Element} */
        this.#cachedElement.cloneNode(true)
      );
    }
    let template;
    if (typeof layout === "function") {
      const returnValue = layout(this);
      if (returnValue instanceof window.Node) {
        template = returnValue;
      } else if (typeof returnValue === "string") {
        template = html(returnValue);
      } else {
        throw new Error(`Invalid layout function return type: ${typeof returnValue}`);
      }
    } else if (typeof layout === "string") {
      template = html(layout.trim());
    } else if (layout instanceof window.Node) {
      template = layout;
    } else {
      console.warn("Unsupported layout type:", typeof layout, layout);
      throw new Error(`Unsupported layout type: ${typeof layout}`);
    }
    let result;
    if (template.nodeType === window.Node.ELEMENT_NODE) {
      result = /** @type {Element} */
      template;
    } else if (template.nodeType === window.Node.DOCUMENT_FRAGMENT_NODE) {
      const children = Array.from(template.childNodes).filter(
        (node) => node.nodeType === window.Node.ELEMENT_NODE || node.nodeType === window.Node.TEXT_NODE && node.textContent.trim() !== ""
      );
      if (children.length === 1 && children[0].nodeType === window.Node.ELEMENT_NODE) {
        result = /** @type {Element} */
        children[0];
      } else {
        result = document.createElement("html-fragment");
        result.appendChild(template);
      }
    } else {
      result = document.createElement("html-fragment");
      result.appendChild(template);
    }
    if (this.instanceId && result.getAttribute("data-component-root") !== this.instanceId) {
      result.setAttribute("data-component-root", this.instanceId);
    }
    if (isStatic && this.$internals.cloneTemplateOnRender) {
      this.#cachedElement = result;
      return (
        /** @type {Element} */
        result.cloneNode(true)
      );
    }
    return result;
  }
  /**
   * Mounts the component to a DOM container or hydrates existing HTML.
   * @param {Element} container - The target DOM element (the "hole").
   * @param {"replace"|"append"|"prepend"|"hydrate"} mode - The mounting strategy.
   */
  mount(container, mode = "replace") {
    if (!(container instanceof window.Element)) {
      throw new TypeError("Mount target must be a valid DOM Element.");
    }
    const validModes = ["replace", "append", "prepend", "hydrate"];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mount mode "${mode}". Expected: ${validModes.join(", ")}`);
    }
    if (this.isConnected) {
      if (this.$internals.parentElement === container) return;
      this.unmount();
    }
    this.$internals.mountMode = mode === "hydrate" ? "replace" : mode;
    let componentRoot;
    if (mode === "hydrate") {
      const isRoot = container.getAttribute("data-component-root") === this.#instanceId;
      if (isRoot) {
        componentRoot = container;
      } else {
        componentRoot = container.querySelector(
          `[data-component-root="${this.#instanceId}"]`
        );
      }
      if (!componentRoot) {
        throw new Error(`Hydration failed: Root ${this.#instanceId} not found.`);
      }
    } else {
      componentRoot = this.render();
      if (mode === "replace") container.replaceChildren(componentRoot);
      else if (mode === "append") container.append(componentRoot);
      else if (mode === "prepend") container.prepend(componentRoot);
    }
    this.$internals.root = componentRoot;
    this.$internals.parentElement = componentRoot.parentElement;
    this.emit("prepareRender", componentRoot);
    this.connect(
      /** @type {HTMLElement} */
      componentRoot
    );
    this.emit("mount");
  }
  /**
   * Unmounts the component from the DOM.
   * Emits "beforeUnmount" and "unmount" events through the event emitter.
   * Disconnects the component from the DOM and removes the root element.
   */
  unmount() {
    if (this.#isConnected === false) return;
    this.emit("beforeUnmount");
    this.slotManager.unmountAll();
    this.disconnect();
    this.$internals.root?.remove();
    this.$internals.elementsToRemove.forEach((el) => {
      el.remove();
    });
    this.$internals.elementsToRemove.clear();
    this.emit("unmount");
  }
  /**
   * Rerenders the component.
   * If the component is connected, it unmounts and mounts the component again.
   * If the component is not connected, it mounts the component to the parent component's slot.
   */
  rerender() {
    this.collapse();
    this.expand();
  }
  /**
   * This method is called when the component is updated.
   * It is an empty method and is intended to be overridden by the user.
   * @param {...*} args
   */
  update(...args) {
  }
  /* Visibility */
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
   * Collapses the component by unmounting it from the DOM.
   * Sets the #isCollapsed flag to true.
   */
  collapse() {
    this.unmount();
    this.#isCollapsed = true;
    this.emit("collapse");
  }
  /**
   * Expands the component by mounting it to the DOM.
   * Sets the #isCollapsed flag to false.
   * If the component is already connected, does nothing.
   * If the component does not have a parent component, does nothing.
   * Otherwise, mounts the component to the parent component's slot.
   */
  expand() {
    this.#isCollapsed = false;
    if (this.#isConnected === true) return;
    let parentComponent = this.$internals.parentComponent;
    if (parentComponent === null) {
      if (this.$internals.parentElement) {
        if (this.$internals.parentElement.isConnected) {
          this.mount(this.$internals.parentElement, this.$internals.mountMode);
        } else {
          console.warn(
            "Cannot expand a disconnected component without a parent element (parent element is not connected)"
          );
          return;
        }
      } else {
        console.warn(
          "Cannot expand a disconnected component without a parent element (no parent element specified)"
        );
        return;
      }
    } else {
      if (parentComponent.isConnected === false) {
        console.warn("Cannot expand a disconnected parent component");
        return;
      }
      let assignedSlotRef = parentComponent.$internals.scopeRefs[this.$internals.assignedSlotName];
      if (!assignedSlotRef) {
        console.warn(
          `Cannot find a rendered slot with name "${this.$internals.assignedSlotName}" in the parent component`
        );
        return;
      }
      this.mount(assignedSlotRef, this.$internals.mountMode);
    }
    this.emit("expand");
  }
  /**
   * Expands all components in the hierarchy, starting from the current component.
   * If a component is already connected, does nothing.
   * If a component does not have a parent component, does nothing.
   * Otherwise, mounts the component to the parent component's slot.
   */
  expandForce() {
    let components = [];
    let currentComponent = this;
    while (currentComponent) {
      components.push(currentComponent);
      currentComponent = currentComponent.$internals.parentComponent;
    }
    for (let i = components.length - 1; i >= 0; i--) {
      let component = components[i];
      component.expand();
    }
  }
  /* Slots, parent, children */
  /**
   * Returns an array of the slot names defined in the component.
   * @returns {string[]}
   */
  getSlotNames() {
    return this.slotManager.slotNames;
  }
  /**
   * Adds a child component to a slot.
   * @param {string} slotName - The name of the slot to add the component to.
   * @param {...Component} components - The component to add to the slot.
   * @throws {Error} If the slot does not exist.
   */
  addComponentToSlot(slotName, ...components) {
    let slot = this.slotManager.attachToSlot(slotName, ...components);
    if (this.#isConnected) {
      slot.mount();
    }
  }
  /**
   * Returns the parent component of the current component, or null if the current component is a root component.
   * @returns {Component | null} The parent component of the current component, or null if the current component is a root component.
   */
  get parentComponent() {
    return this.$internals.parentComponent || null;
  }
  /* DOM */
  /**
   * Returns the root node of the component.
   * This is the node that the component is mounted to.
   * @returns {HTMLElement} The root node of the component.
   */
  getRootNode() {
    if (!this.#isConnected) {
      throw new Error("Component is not connected to the DOM");
    }
    return (
      /** @type {HTMLElement} */
      this.$internals.root
    );
  }
  /**
   * Removes an element from the DOM when the component is unmounted.
   * The element is stored in an internal set and removed from the DOM when the component is unmounted.
   * @param {...Element} elements - The elements to remove from the DOM when the component is unmounted.
   */
  removeOnUnmount(...elements) {
    for (let i = 0; i < elements.length; i++) {
      this.$internals.elementsToRemove.add(elements[i]);
    }
  }
  /**
   * Internal method to get elements by tag name, filtering out those within scoped refs.
   * @param {string} tagName - The tag name to search for.
   * @returns {Element[]} An array of elements matching the tag name, excluding those within scoped refs.
   */
  #getElementsByTagName(tagName) {
    if (!this.#isConnected) {
      throw new Error("Component is not connected to the DOM");
    }
    tagName = tagName.toLowerCase().trim();
    let filteredElements = [];
    walkDomScope(
      this.$internals.root,
      (node) => {
        if (node.nodeType === window.Node.ELEMENT_NODE) {
          let el = (
            /** @type {Element} */
            node
          );
          if (tagName === "*") {
            filteredElements.push(el);
          } else if (el.tagName.toLowerCase() === tagName) {
            filteredElements.push(el);
          }
        }
      },
      {
        scopeAttribute: ["data-slot", "data-component-root"],
        refAttribute: "data-ref",
        window
      }
    );
    return filteredElements;
  }
  /**
   * Returns an array of elements matching the given tag name, optionally filtered by a CSS selector.
   * If no query selector is given, all elements matching the tag name are returned.
   * If a query selector is given, only elements matching the tag name and the query selector are returned.
   * @param {string} tagName - The tag name to search for.
   * @param {string} [querySelector] - An optional CSS selector to filter the results by.
   * @returns {Element[]} An array of elements matching the tag name and query selector.
   */
  searchElements(tagName, querySelector = "") {
    let elements = this.#getElementsByTagName(tagName);
    if (querySelector === "") {
      return elements;
    } else {
      return elements.filter((el) => el.matches(querySelector));
    }
  }
};

// src/slot-toggler.js
var SlotToggler = class {
  #isDestroyed = false;
  /** @type {string[]} */
  #slotNames;
  /** @type {string} */
  #activeSlotName;
  /** @type {Component} */
  component;
  /**
   * Creates a new instance of SlotToggler.
   * @param {Component} component - The component that owns the slots.
   * @param {string[]} slotNames - The names of the slots.
   * @param {string} activeSlotName - The name of the slot that is currently active.
   */
  constructor(component, slotNames, activeSlotName) {
    this.component = component;
    this.#slotNames = slotNames.slice();
    this.#activeSlotName = activeSlotName;
  }
  get slotNames() {
    return this.#slotNames;
  }
  get activeSlotName() {
    return this.#activeSlotName;
  }
  init() {
    for (let i = 0; i < this.#slotNames.length; i++) {
      if (this.#slotNames[i] != this.activeSlotName) {
        let slotElement2 = this.component.slotManager.getSlotElement(this.#slotNames[i]);
        if (slotElement2) {
          hideElements(slotElement2);
        }
        this.component.slotManager.unmountSlot(this.#slotNames[i]);
      }
    }
    this.component.slotManager.mountSlot(this.activeSlotName);
    let slotElement = this.component.slotManager.getSlotElement(this.activeSlotName);
    if (slotElement) {
      showElements(slotElement);
    }
  }
  /**
   * Toggles the active slot to the given slot name.
   * Removes the previously active slot, defines all slots, mounts the children of the given slot name, and sets the given slot name as the active slot.
   * @param {string} slotName - The name of the slot to toggle to.
   */
  /**
   * Toggles the active slot to the given slot name.
   * @param {string} slotName - The name of the slot to activate.
   */
  toggle(slotName) {
    if (this.#isDestroyed || !this.component) {
      throw new Error("SlotToggler is destroyed");
    }
    if (!this.#slotNames.includes(slotName)) {
      throw new Error(`Slot "${slotName}" is not defined in this SlotToggler`);
    }
    if (slotName === this.#activeSlotName) return;
    const sm = this.component.slotManager;
    if (this.#activeSlotName) {
      sm.unmountSlot(this.#activeSlotName);
      const prevElement = sm.getSlotElement(this.#activeSlotName);
      if (prevElement) hideElements(prevElement);
    }
    sm.mountSlot(slotName);
    this.#activeSlotName = slotName;
    const nextElement = sm.getSlotElement(this.#activeSlotName);
    if (nextElement) showElements(nextElement);
  }
  destroy() {
    this.#isDestroyed = true;
    this.component = null;
    this.#slotNames = [];
    this.#activeSlotName = "";
  }
};
export {
  Component,
  DOMReady,
  SlotToggler,
  Toggler,
  copyToClipboard,
  createPaginationArray,
  delegateEvent,
  escapeHtml,
  fadeIn,
  fadeOut,
  formatBytes,
  formatDate,
  formatDateTime,
  getDefaultLanguage,
  hideElements,
  html,
  injectCoreStyles,
  isDarkMode,
  removeSpinnerFromButton,
  renderPaginationElement,
  scrollToBottom,
  scrollToTop,
  showElements,
  showSpinnerInButton,
  sleep,
  ui_button_status_waiting_off,
  ui_button_status_waiting_off_html,
  ui_button_status_waiting_on,
  unixtime,
  unsafeHTML,
  withMinimumTime
};
