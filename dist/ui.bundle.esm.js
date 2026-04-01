// src/component/config.js
var ConfigManager = class {
  constructor() {
    this.isSSR = false;
    this.hydrationDataKey = "__HYDRATION_DATA__";
    this.window = typeof globalThis !== "undefined" ? globalThis : {};
    this.checkRefsFlag = true;
  }
  /**
   * Safely retrieves the hydration manifest from the global environment.
   * @returns {{[key:string]:import('./types.d.ts').ComponentMetadata}|null}
   */
  getManifest() {
    const globalObject = typeof globalThis !== "undefined" ? globalThis : {};
    return globalObject[this.hydrationDataKey] || null;
  }
  /**
   * Extracts state for a specific SID.
   * @param {string} sid - Server ID
   * @returns {any|null}
   */
  getHydrationData(sid) {
    const manifest = this.getManifest();
    if (manifest && manifest[sid]) {
      return manifest[sid].data;
    }
    return null;
  }
  /**
   * Clears the manifest to free up memory.
   */
  destroyManifest() {
    const globalObject = typeof globalThis !== "undefined" ? globalThis : {};
    if (globalObject[this.hydrationDataKey]) {
      delete globalObject[this.hydrationDataKey];
    }
  }
};
var Config = new ConfigManager();

// src/utils/utils.js
function DOMReady(callback, doc = window.document) {
  doc.readyState === "interactive" || doc.readyState === "complete" ? callback() : doc.addEventListener("DOMContentLoaded", callback);
}
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/[&<>"']/g, function(m) {
    let charset = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
      // ' -> &apos; for XML only
    };
    return charset[
      /** @type {'&' | '<' | '>'| '"' | "'"} */
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
  const checkClass = customClassName || "spinner-border";
  if (button.getElementsByClassName(checkClass)[0]) return;
  let spinner = doc.createElement("span");
  spinner.className = checkClass;
  if (customClassName && !customClassName.includes("spinner-border")) {
    spinner.classList.add("spinner-border");
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
function copyToClipboard(text, wnd = window) {
  return wnd.navigator.clipboard.writeText(text);
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
    if (event.target && event.target instanceof Config.window.Element) {
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
function htmlDOM(strings, ...values) {
  let rawResult = "";
  if (typeof strings === "string") {
    const tmpl2 = document.createElement("template");
    tmpl2.innerHTML = strings.trim();
    return tmpl2.content;
  }
  rawResult = strings[0];
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    if (value === null || value === void 0 || value === false) {
      value = "";
    }
    if (Array.isArray(value)) {
      const joined = value.map((item) => {
        if (item === null || item === void 0 || item === false) return "";
        if (item instanceof SafeHTML) return item.toString();
        if (item instanceof Config.window.Element) return item.outerHTML;
        if (item instanceof Config.window.DocumentFragment) {
          const tempDiv = document.createElement("div");
          tempDiv.appendChild(item.cloneNode(true));
          return tempDiv.innerHTML;
        }
        if (item instanceof Config.window.Node) {
          return item.nodeType === Config.window.Node.TEXT_NODE ? escapeHtml(item.textContent ?? "") : "";
        }
        return escapeHtml(String(item));
      }).join("");
      value = unsafeHTML(joined);
    } else if (value instanceof Config.window.Element) {
      value = unsafeHTML(value.outerHTML);
    } else if (value instanceof Config.window.DocumentFragment) {
      const tempDiv = document.createElement("div");
      tempDiv.appendChild(value.cloneNode(true));
      value = unsafeHTML(tempDiv.innerHTML);
    } else if (value instanceof Config.window.Node) {
      value = unsafeHTML(
        value.nodeType === Config.window.Node.TEXT_NODE ? escapeHtml(value.textContent ?? "") : ""
      );
    }
    const stringValue = value instanceof SafeHTML ? value.toString() : escapeHtml(String(value));
    rawResult += stringValue + strings[i + 1];
  }
  const tmpl = document.createElement("template");
  tmpl.innerHTML = rawResult.trim();
  return tmpl.content;
}
function debounce(func, wait, immediate = false) {
  let timeoutId = null;
  let result;
  let debounced = function(...args) {
    const context = this;
    const later = function() {
      timeoutId = null;
      if (!immediate) result = func.apply(context, args);
    };
    const callNow = immediate && !timeoutId;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
  debounced.cancel = function() {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
  };
  return (
    /** @type {T & { cancel(): void }} */
    /** @type {any} */
    debounced
  );
}
function throttle(func, wait, options = {}) {
  const { leading = true, trailing = true } = options;
  let timeoutId = null;
  let lastArgs = null;
  let lastContext = null;
  let lastCallTime = 0;
  const invokeFunc = function() {
    lastCallTime = Date.now();
    func.apply(lastContext, lastArgs);
    lastArgs = lastContext = null;
  };
  let throttled = function(...args) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);
    lastArgs = args;
    lastContext = this;
    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      func.apply(lastContext, lastArgs);
      lastArgs = lastContext = null;
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (trailing) invokeFunc();
      }, remaining);
    }
  };
  throttled.cancel = function() {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = lastContext = null;
    lastCallTime = 0;
  };
  return (
    /** @type {T & { cancel(): void }} */
    /** @type {any} */
    throttled
  );
}
function onClickOutside(element, callback) {
  if (!element || typeof callback !== "function") {
    throw new Error("onClickOutside: element and callback are required");
  }
  const handler = (event) => {
    if (!element.contains(event.target)) {
      callback(event);
    }
  };
  document.addEventListener("click", handler, true);
  return () => {
    document.removeEventListener("click", handler, true);
  };
}
function html(strings, ...values) {
  let rawResult = "";
  if (typeof strings === "string") {
    return strings.trim();
  }
  rawResult = strings[0];
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    if (value === null || value === void 0 || value === false) {
      value = "";
    }
    if (Array.isArray(value)) {
      const joined = value.map((item) => {
        if (item === null || item === void 0 || item === false) return "";
        if (item instanceof SafeHTML) return item.toString();
        return escapeHtml(String(item));
      }).join("");
      value = unsafeHTML(joined);
    }
    const stringValue = value instanceof SafeHTML ? value.toString() : escapeHtml(String(value));
    rawResult += stringValue + strings[i + 1];
  }
  return rawResult.trim();
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

// src/utils/unique-id.js
var idCounter = 0;
function uniqueId(prefix = "") {
  const id = ++idCounter;
  return prefix ? `${prefix}${id}` : String(id);
}

// src/utils/storage.js
function createStorage(storage) {
  const listeners = /* @__PURE__ */ new Map();
  const handleStorage = (event) => {
    if (event.storageArea !== storage) return;
    const { key, newValue, oldValue } = event;
    if (key === null) {
      listeners.forEach((callbacks2, listenerKey) => {
        callbacks2.forEach((cb) => cb(null, null));
      });
      return;
    }
    const callbacks = listeners.get(key);
    if (callbacks) {
      const parsedNew = newValue !== null ? JSON.parse(newValue) : null;
      const parsedOld = oldValue !== null ? JSON.parse(oldValue) : null;
      callbacks.forEach((cb) => cb(parsedNew, parsedOld));
    }
  };
  let isListening = false;
  const startListening = () => {
    if (!isListening) {
      Config.window.addEventListener("storage", handleStorage);
      isListening = true;
    }
  };
  const stopListening = () => {
    if (isListening && listeners.size === 0) {
      Config.window.removeEventListener("storage", handleStorage);
      isListening = false;
    }
  };
  const get = (key) => {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };
  const set = (key, value) => {
    const oldRaw = storage.getItem(key);
    const newRaw = JSON.stringify(value);
    storage.setItem(key, newRaw);
    const callbacks = listeners.get(key);
    if (callbacks) {
      const oldValue = oldRaw !== null ? JSON.parse(oldRaw) : null;
      callbacks.forEach((cb) => cb(value, oldValue));
    }
  };
  const remove = (key) => {
    const oldRaw = storage.getItem(key);
    storage.removeItem(key);
    const callbacks = listeners.get(key);
    if (callbacks) {
      const oldValue = oldRaw !== null ? JSON.parse(oldRaw) : null;
      callbacks.forEach((cb) => cb(null, oldValue));
    }
  };
  const clear = () => {
    storage.clear();
    listeners.forEach((callbacks, key) => {
      callbacks.forEach((cb) => cb(null, null));
    });
  };
  const on = (key, callback) => {
    if (!listeners.has(key)) {
      listeners.set(key, /* @__PURE__ */ new Set());
    }
    listeners.get(key).add(callback);
    startListening();
    return () => {
      const callbacks = listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listeners.delete(key);
        }
      }
      stopListening();
    };
  };
  return { get, set, remove, clear, on };
}
var local = createStorage(Config.window.localStorage);
var session = createStorage(Config.window.sessionStorage);

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
    return this;
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
  clear() {
    this.items = /* @__PURE__ */ new Map();
    this.#active = "";
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
  /** @type {Component[]} */
  #components = [];
  /** @type {Component} */
  #ownerComponent;
  /**
   * Initializes a new instance of the Slot class.
   * @param {string} name - The name of the slot.
   * @param {Component} component
   */
  constructor(name, component) {
    this.name = name;
    this.#ownerComponent = component;
  }
  /**
   * Attaches a component to the slot.
   * This method sets the given component's parent component and parent slot name,
   * and adds the component to the slot's internal array of components.
   * @param {Component} component - The component to attach to the slot.
   * @param {"append"|"replace"|"prepend"} [mode='append']
   */
  attach(component, mode = "append") {
    this.attachMany([component], mode);
  }
  /**
   *
   * @param {Component[]} components
   * @param {"append"|"replace"|"prepend"} [mode='append']
   */
  attachMany(components, mode = "append") {
    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      component.$internals.parentComponent = this.#ownerComponent;
      component.$internals.assignedSlotName = this.name;
    }
    const componentsSet = new Set(components);
    this.#components = this.#components.filter((c) => !componentsSet.has(c));
    if (mode === "replace") {
      this.clear();
      this.#components.push(...components);
    } else if (mode === "prepend") {
      this.#components.unshift(...components);
    } else {
      this.#components.push(...components);
    }
  }
  /**
   * Detaches a component from the slot.
   * This method sets the given component's parent component and parent slot name to null,
   * and removes the component from the slot's internal set of components.
   * @param {Component} component - The component to detach from the slot.
   * @returns {boolean}
   */
  detach(component) {
    component.$internals.parentComponent = null;
    component.$internals.assignedSlotName = "";
    let foundIndex = this.#components.indexOf(component);
    if (foundIndex > -1) {
      this.#components.splice(foundIndex, 1);
    }
    return foundIndex != -1;
  }
  /**
   * Detaches all components from the slot.
   * This method sets all components' parent component and parent slot name to null,
   * and removes all components from the slot's internal set of components.
   */
  detachAll() {
    this.#components.forEach((component) => {
      component.$internals.parentComponent = null;
      component.$internals.assignedSlotName = "";
    });
    this.#components = [];
  }
  /**
   * Mounts all children components of the slot to the DOM.
   */
  mount() {
    if (!this.#ownerComponent.isConnected) {
      console.warn(
        `Cannot mount Slot "${this.name}" in disconnected component ${this.#ownerComponent.constructor.name}`
      );
      return;
    }
    let slotRoot = this.#ownerComponent.$internals.scopeRefs[this.name];
    if (!slotRoot) {
      console.warn(
        `Cannot get root element for Slot "${this.name}" does not exist in component "${this.#ownerComponent.constructor.name}"`
      );
      return;
    }
    this.#components.forEach((childComponent) => {
      childComponent.mount(slotRoot, "append");
    });
  }
  /**
   * Unmounts all children components of the slot from the DOM.
   * This method iterates over all children components of the slot and calls their unmount method.
   */
  unmount() {
    for (let i = 0; i < this.#components.length; i++) {
      let child = this.#components[i];
      child.unmount();
    }
  }
  /**
   * Clears the slot of all its children components.
   * This method first unmounts all children components of the slot, then detaches them from the slot.
   */
  clear() {
    for (let i = 0; i < this.#components.length; i++) {
      let child = this.#components[i];
      child.unmount();
      child.$internals.parentComponent = null;
      child.$internals.assignedSlotName = "";
    }
    this.#components = [];
  }
  getLength() {
    return this.#components.length;
  }
  /**
   *
   * @returns {Component[]}
   */
  getComponents() {
    return this.#components;
  }
};

// src/component/slot-manager.js
var SlotManager = class {
  /** @type {Map<string, Slot>} */
  slots = /* @__PURE__ */ new Map();
  /** @type {Component} */
  #ownerComponent;
  /**
   * @param {Component} component
   */
  constructor(component) {
    this.#ownerComponent = component;
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
    let slot = this.slots.get(slotName);
    if (!slot) {
      slot = new Slot(slotName, this.#ownerComponent);
      this.slots.set(slotName, slot);
    }
    return slot;
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
    if (!this.#ownerComponent.isConnected) {
      return null;
    }
    return this.#ownerComponent.$internals.scopeRefs[slotName] || null;
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
    const slot = this.slots.get(slotName);
    if (slot) {
      slot.clear();
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
    return slot.getLength() > 0;
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
    if (!this.#ownerComponent.isConnected) return;
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
        `Slot "${slotName}" does not exist in component "${this.#ownerComponent.constructor.name}"`
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
    this.slots.forEach((slot) => {
      slot.unmount();
    });
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
   * @param {Component[]} components - The components to add to the slot.
   * @param {"append"|"replace"|"prepend"} [mode="append"]
   * @returns {Slot} Returns the slot.
   */
  attachToSlot(slotName, components, mode = "append") {
    let slot = this.registerSlot(slotName);
    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      let usingSlot = this.findSlotByComponent(component);
      if (usingSlot != null) {
        usingSlot.detach(component);
      }
    }
    slot.attachMany(components, mode);
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
    if (parentComponent != this.#ownerComponent) {
      return null;
    }
    return this.getSlot(component.$internals.assignedSlotName);
  }
  /**
   * Finds a direct child by its SID.
   * @param {string} sid
   * @returns {Component|null}
   */
  findChildBySid(sid) {
    for (const [_, slot] of this.slots) {
      const found = slot.getComponents().find((c) => c.$internals.sid === sid);
      if (found) return found;
    }
    return null;
  }
  /**
   *
   * @param {string} slotName
   * @returns {number}
   */
  getSlotLength(slotName) {
    let slot = this.getSlot(slotName);
    if (slot == null) return 0;
    return slot.getLength();
  }
  getSlots() {
    return this.slots;
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
  /** * Private storage for the lazy instance ID.
   * @type {string|null}
   */
  #instanceId = null;
  /** * The server-side identifier used for hydration.
   * @type {string|null}
   */
  sid = null;
  /**
   * Lazy getter for the instanceId.
   * Generates a unique ID only when first requested.
   */
  get instanceId() {
    if (this.#instanceId === null) {
      this.#instanceId = _Internals.generateInstanceId();
      if (this.root instanceof Config.window.Element) {
        this.root.setAttribute("data-component-root", this.#instanceId);
      }
    }
    return this.#instanceId;
  }
  /**
   * Allows manual override of the instanceId.
   * @param {string} value
   */
  set instanceId(value) {
    this.#instanceId = value;
  }
  /** @type {EventEmitter<any>} */
  eventEmitter = new EventEmitter();
  /** @type {AbortController} */
  disconnectController = new AbortController();
  /** @type {Element|null} */
  root = null;
  /** @type {import('./types.d.ts').TextUpdateFunction|null} */
  textUpdateFunction = null;
  /** @type {Record<string, any>} */
  textResources = {};
  /** @type {Record<string, HTMLElement>} */
  refs = {};
  /** @type {Record<string, HTMLElement>} */
  scopeRefs = {};
  /** @type {Component|null} */
  parentComponent = null;
  /** @type {string} */
  assignedSlotName = "";
  /** @type {"replace"|"append"|"prepend"|"hydrate"} */
  mountMode = "replace";
  /** @type {boolean} */
  cloneTemplateOnRender = true;
  /** @type {Element|null} */
  parentElement = null;
  /** @type {Set<Element>} */
  elementsToRemove = /* @__PURE__ */ new Set();
  /** @type {Map<string, Element>} */
  teleportRoots = /* @__PURE__ */ new Map();
  /** @type {import('dom-scope').ScopeRoot[]} */
  additionalRoots = [];
  /** @type {boolean} */
  isHydrated = false;
  /** @type {number} */
  static #instanceIdCounter = 0;
  static #sessionPrefix = Math.random().toString(36).slice(2, 6);
  /**
   * Generates a unique instance ID.
   * @returns {string} The unique instance ID.
   */
  static generateInstanceId() {
    let counter = ++_Internals.#instanceIdCounter;
    return `${_Internals.#sessionPrefix}-${counter}`;
  }
};

// src/component/helpers.js
function resolveLayout(layout, ctx) {
  let template;
  if (typeof layout === "function") {
    const returnValue = layout(ctx);
    if (returnValue instanceof Config.window.Node) {
      template = returnValue;
    } else if (typeof returnValue === "string") {
      template = htmlDOM(returnValue);
    } else {
      throw new Error(`Invalid layout function return type: ${typeof returnValue}`);
    }
  } else if (typeof layout === "string") {
    template = htmlDOM(layout.trim());
  } else if (layout instanceof window.Node) {
    template = layout;
  } else {
    console.warn("Unsupported layout type:", typeof layout, layout);
    throw new Error(`Unsupported layout type: ${typeof layout}`);
  }
  let result;
  if (template.nodeType === Config.window.Node.ELEMENT_NODE) {
    result = /** @type {Element} */
    template;
  } else if (template.nodeType === Config.window.Node.DOCUMENT_FRAGMENT_NODE) {
    const children = Array.from(template.childNodes).filter(
      (node) => node.nodeType === Config.window.Node.ELEMENT_NODE || node.nodeType === Config.window.Node.TEXT_NODE && node.textContent.trim() !== ""
    );
    if (children.length === 1 && children[0].nodeType === Config.window.Node.ELEMENT_NODE) {
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
  return result;
}
function onConnectDefault(ctx, component) {
  component.reloadText();
  try {
    component.connectedCallback();
  } catch (e) {
    console.error("Error in connectedCallback:", e);
  }
}
function onDisconnectDefault(ctx, component) {
  try {
    component.disconnectedCallback();
  } catch (e) {
    console.error("Error in disconnectedCallback:", e);
  }
}

// src/component/style.js
var UI_COMPONENT_SHEET = /* @__PURE__ */ Symbol("isUIComponentSheet");
function extractComponentStyles(doc = document) {
  if (!doc.adoptedStyleSheets) return "";
  return doc.adoptedStyleSheets.filter((sheet) => sheet[UI_COMPONENT_SHEET] === true).map((sheet) => {
    return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
  }).join("\n");
}

// src/component/internals/hydration-utils.js
function updateComponentTreeSid(component, newSid, callbacks) {
  callbacks.onUpdateSid(component, newSid);
  callbacks.onApplyHydration(component);
  const slots = callbacks.getSlots(component);
  slots.forEach((slot, name) => {
    const subComponents = typeof slot.getComponents === "function" ? slot.getComponents() : [];
    for (let j = 0; j < subComponents.length; j++) {
      const subChild = subComponents[j];
      const subSid = `${newSid}.${name}.${j}`;
      updateComponentTreeSid(subChild, subSid, callbacks);
    }
  });
}

// src/component/internals/dom-utils.js
function filterElementsByTagName(root, tagName, walkDomScope2, options) {
  const targetTag = tagName.toLowerCase().trim();
  const filteredElements = [];
  walkDomScope2(
    root,
    (node) => {
      if (node.nodeType === options.window.Node.ELEMENT_NODE) {
        const el = (
          /** @type {Element} */
          node
        );
        if (targetTag === "*" || el.tagName.toLowerCase() === targetTag) {
          filteredElements.push(el);
        }
      }
    },
    options
  );
  return filteredElements;
}
function insertToDOM(fragment, resolvedTarget, strategy, window2) {
  const rootElement = fragment instanceof window2.Element ? (
    /** @type {Element} */
    fragment
  ) : fragment.firstElementChild;
  switch (strategy) {
    case "prepend":
      resolvedTarget.prepend(fragment);
      break;
    case "replace":
      resolvedTarget.replaceChildren(fragment);
      break;
    case "append":
    default:
      resolvedTarget.append(fragment);
      break;
  }
  return rootElement;
}

// src/component/internals/teleport-utils.js
function prepareTeleportNode(node, name, parentSid, instanceId) {
  node.setAttribute("data-component-teleport", name);
  node.setAttribute("data-component-root", instanceId);
  if (parentSid) {
    node.setAttribute("data-parent-sid", parentSid);
  }
}
function findExistingTeleport(root, parentSid, teleportName) {
  const selector = `[data-parent-sid="${parentSid}"][data-component-teleport="${teleportName}"]`;
  return root.querySelector(selector);
}
function claimTeleportNode(node, instanceId) {
  node.setAttribute("data-component-root", instanceId);
  node.removeAttribute("data-parent-sid");
}

// src/component/internals/style-utils.js
function createComponentStyleSheet(styles, marker, window2) {
  if (typeof window2.CSSStyleSheet === "undefined") return null;
  let sheet;
  if (styles instanceof window2.CSSStyleSheet) {
    sheet = styles;
  } else {
    sheet = new window2.CSSStyleSheet();
    sheet.replaceSync(styles);
  }
  sheet[marker] = true;
  return sheet;
}
function injectSheet(doc, sheet) {
  if (!doc.adoptedStyleSheets) {
    doc.adoptedStyleSheets = [];
  }
  if (!doc.adoptedStyleSheets.includes(sheet)) {
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
  }
}

// src/component/internals/render-utils.js
function prepareRenderResult(element, { instanceId, sid, isSSR }) {
  if (instanceId) {
    element.setAttribute("data-component-root", instanceId);
  }
  if (isSSR && sid) {
    element.setAttribute("data-sid", sid);
  }
  return element;
}
function getCloneFromCache(cachedElement, shouldClone) {
  if (shouldClone && cachedElement) {
    return (
      /** @type {Element} */
      cachedElement.cloneNode(true)
    );
  }
  return null;
}

// src/component/internals/ref-utils.js
function scanRootsForRefs(roots, selectRefsExtended2, options) {
  let { refs, scopeRefs } = selectRefsExtended2(roots, null, options);
  const rootRefs = {};
  const window2 = options.window;
  for (const root of roots) {
    if (root instanceof window2.Element) {
      const refName = root.getAttribute(options.refAttribute);
      if (refName) {
        rootRefs[refName] = root;
      }
      const slotAttribute = options.scopeAttribute.find((attr) => root.hasAttribute(attr));
      if (slotAttribute && root.getAttribute(slotAttribute)) {
        const slotName = root.getAttribute(slotAttribute);
        if (root.hasAttribute("data-slot")) {
          scopeRefs[slotName] = /** @type {HTMLElement} */
          root;
        }
      }
    }
  }
  return {
    refs: { ...refs, ...rootRefs },
    scopeRefs
  };
}

// src/component/internals/tree-utils.js
function findComponentBySid(startComponent, targetSid) {
  const currentSid = startComponent.$internals.sid;
  if (currentSid === targetSid) {
    return startComponent;
  }
  if (currentSid && !targetSid.startsWith(currentSid + ".")) {
    return null;
  }
  const slots = startComponent.slotManager.getSlots();
  for (const slot of slots.values()) {
    for (const child of slot.getComponents()) {
      const found = findComponentBySid(child, targetSid);
      if (found) return found;
    }
  }
  return null;
}
function collectComponentAncestors(component) {
  const ancestors = [];
  let current = component;
  while (current) {
    ancestors.push(current);
    current = current.$internals.parentComponent;
  }
  return ancestors;
}

// src/component/internals/mounting-utils.js
function validateMountArgs(container, mode, window2) {
  if (!(container instanceof window2.Element)) {
    throw new TypeError("Mount target must be a valid DOM Element.");
  }
  const validModes = ["replace", "append", "prepend", "hydrate"];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mount mode "${mode}". Expected: ${validModes.join(", ")}`);
  }
}
function findHydrationRoot(container, sid) {
  if (container.getAttribute("data-sid") === sid) {
    return container;
  }
  return container.querySelector(`[data-sid="${sid}"]`);
}

// src/component/component.js
var sharedTemplates = /* @__PURE__ */ new WeakMap();
var Component = class {
  /** @type {string | CSSStyleSheet | null} */
  static styles = null;
  static _stylesInjected = false;
  /** @type {Internals} */
  $internals = new Internals();
  /**
   * Shared template for all instances of this class.
   * Best for performance as it's cached globally.
   * @type {string|undefined}
   */
  static layout;
  /**
   * Instance-specific layout. Overrides static layout.
   * Use a function for dynamic structures or a string/Node for unique instances.
   * @type {((component: any) => Node|string)|string|null|Node}
   */
  layout = null;
  /** @type {import('./types.d.ts').TeleportList} */
  teleports = {};
  /** @type {T} */
  refsAnnotation;
  #isConnected = false;
  slotManager = new SlotManager(this);
  #isCollapsed = false;
  #cachedElement = null;
  /** @type {Function[]} */
  #disposers = [];
  /**
   * Initializes a new instance of the Component class.
   * @param {Object} [options] - An object with the following optional properties:
   * @param {string} [options.instanceId] - The instance ID of the component. If not provided, a unique ID will be generated.
   * @param {string} [options.sid]
   */
  constructor(options = {}) {
    const { instanceId = null, sid = null } = options;
    this.$internals = new Internals();
    if (instanceId) this.$internals.instanceId = instanceId;
    this.on("connect", onConnectDefault);
    this.on("disconnect", onDisconnectDefault);
    if (sid) {
      this.$internals.sid = sid;
      this.once("restore", (data) => {
        this.restoreCallback(data);
      });
    }
  }
  /** @returns {string} */
  get instanceId() {
    return this.$internals.instanceId;
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
   * Triggers the text update logic by calling the registered text update function.
   * Use this to refresh translated strings, plural forms, or formatted labels
   * without rerendering the entire component structure.
   */
  reloadText() {
    if (this.$internals.textUpdateFunction) {
      this.$internals.textUpdateFunction(this);
    }
  }
  /**
   * Registers a specialized function responsible for updating text nodes within the component.
   * This is particularly useful for i18n (internationalization) or when specific labels
   * depend on multiple state variables.
   * * @param {((component: this) => void) | null} func - The function to be called by `reloadText()`.
   */
  setTextUpdateFunction(func) {
    this.$internals.textUpdateFunction = func;
  }
  /**
   * Sets the layout of the component by assigning the template content.
   * @param {((component: this) => Node|string)|string} layout - A function that returns a Node representing the layout.
   * @param {T} [annotation] - An array of strings representing the names of the refs.
   * The function is called with the component instance as the this value.
   */
  setLayout(layout, annotation) {
    this.layout = layout;
    if (annotation) {
      this.refsAnnotation = annotation;
    }
  }
  #ensureStylesInjected() {
    const ctor = (
      /** @type {typeof Component} */
      this.constructor
    );
    if (ctor._stylesInjected) return;
    if (Config.window.document.getElementById("ui-ssr-styles")) {
      ctor._stylesInjected = true;
      return;
    }
    if (ctor.styles) {
      this.#injectStaticStyles(ctor.styles);
    }
    ctor._stylesInjected = true;
  }
  /**
   *
   * @param {string | CSSStyleSheet | null} styles
   * @returns
   */
  #injectStaticStyles(styles) {
    const sheet = createComponentStyleSheet(styles, UI_COMPONENT_SHEET, Config.window);
    if (sheet) {
      injectSheet(document, sheet);
    }
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
   * Checks if a ref with the given name exists.
   * @param {string} refName - The name of the ref to check.
   * @returns {boolean} True if the ref exists, false otherwise.
   */
  hasRef(refName) {
    let refs = this.getRefs();
    return refName in refs;
  }
  /**
   * Manually rescans the component's DOM tree to update the `refs` object.
   * While this is called automatically during mounting and hydration, you should
   * call it manually if you've dynamically injected new HTML containing `data-ref`
   * attributes (e.g., via innerHTML) to ensure `getRefs()` returns the latest elements.
   * * @throws {Error} If the component is not currently connected to the DOM.
   * @returns {void}
   */
  updateRefs() {
    if (!this.$internals.root) {
      throw new Error("Component is not connected to the DOM");
    }
    this.emit("before-update-refs");
    const allRoots = (
      /** @type {Element[]} */
      this.$internals.additionalRoots.length > 0 ? [this.$internals.root, ...this.$internals.additionalRoots] : [this.$internals.root]
    );
    const { refs, scopeRefs } = scanRootsForRefs(allRoots, selectRefsExtended, {
      scopeAttribute: ["data-slot", "data-component-root"],
      refAttribute: "data-ref",
      window: Config.window
    });
    for (const key in scopeRefs) {
      this.slotManager.registerSlot(key);
    }
    this.$internals.refs = refs;
    this.$internals.scopeRefs = scopeRefs;
    if (Config.checkRefsFlag && this.refsAnnotation) {
      checkRefs(refs, this.refsAnnotation);
    }
  }
  serialize() {
    return {};
  }
  /* Events */
  /**
   * Subscribes to a specified event.
   * @param {import('./types.d.ts').ComponentEvent} event - The name of the event to subscribe to.
   * @param {Function} callback - The callback function to be executed when the event is triggered.
   * @returns {()=>void} A function that can be called to unsubscribe the listener.
   */
  on(event, callback) {
    return this.$internals.eventEmitter.on(event, callback);
  }
  /**
   * Subscribes to a specified event and automatically unsubscribes after the first trigger.
   * @param {import('./types.d.ts').ComponentEvent} event - The name of the event to subscribe to.
   * @param {Function} callback - The callback function.
   * @returns {() => void} A function that can be called to unsubscribe the listener before it triggers.
   */
  once(event, callback) {
    return this.$internals.eventEmitter.once(event, callback);
  }
  /**
   * Emits an event with the given arguments.
   * @param {import('./types.d.ts').ComponentEvent} event - The name of the event to emit.
   * @param {any} data - The data object to be passed to the event handlers.
   */
  emit(event, data) {
    return this.$internals.eventEmitter.emit(event, data, this);
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
  /* Lifecycle methods */
  /**
   * Connects the component to the specified componentRoot element.
   * Initializes the refs object and sets the component's root element.
   * Emits "connect" event through the event emitter.
   * @param {HTMLElement} componentRoot - The root element to connect the component to.
   */
  #connect(componentRoot) {
    this.$internals.root = componentRoot;
    this.updateRefs();
    this.$internals.disconnectController = new (Config.window.AbortController || AbortController)();
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
  #disconnect() {
    if (this.#isConnected === false) return;
    this.#isConnected = false;
    this.$internals.disconnectController.abort();
    this.$internals.refs = {};
    this.$internals.scopeRefs = {};
    this.#runDisposers();
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
   * Called automatically during the hydration process to restore the component's state.
   * This method receives data serialized by `serialize()` on the server.
   * Use this to synchronize your internal `this.state` with server-provided data
   * before the component becomes interactive in the DOM.
   * * @param {any} data - The plain object retrieved from the hydration manifest (window.__HYDRATION_DATA__).
   * @returns {void}
   */
  restoreCallback(data) {
  }
  /**
   * Internal rendering engine.
   * Separates static (cached) layouts from dynamic (functional) layouts.
   * Ensures a single root Element is always returned.
   * @returns {Element}
   */
  #render() {
    const ctor = (
      /** @type {typeof Component} */
      this.constructor
    );
    const layout = this.layout || ctor.layout;
    if (!layout) throw new Error("Layout is not defined.");
    const isFunction = typeof layout === "function";
    const shouldClone = this.$internals.cloneTemplateOnRender;
    if (!isFunction && layout === ctor.layout) {
      let cached = sharedTemplates.get(ctor);
      if (!cached) {
        cached = resolveLayout(layout, this);
        sharedTemplates.set(ctor, cached);
      }
      return (
        /** @type {Element} */
        cached.cloneNode(true)
      );
    }
    if (!isFunction) {
      const cached = getCloneFromCache(this.#cachedElement, shouldClone);
      if (cached) return cached;
    }
    const result = resolveLayout(layout, this);
    prepareRenderResult(result, {
      instanceId: this.instanceId,
      sid: this.$internals.sid,
      isSSR: Config.isSSR
    });
    if (!isFunction && shouldClone) {
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
   * @param {string|HTMLElement|(() => HTMLElement)} container - The target (selector, element, or provider).
   * @param {"replace"|"append"|"prepend"|"hydrate"} mode - The mounting strategy.
   */
  mount(container, mode = "replace") {
    if (Config.isSSR) return;
    if (this.isCollapsed) return;
    const resolvedContainer = this.#resolveTarget(container);
    validateMountArgs(resolvedContainer, mode, Config.window);
    if (mode === "hydrate") {
      return this.#handleHydration(resolvedContainer);
    }
    if (this.isConnected) {
      this.#handleMove(resolvedContainer, mode);
    } else {
      this.#handleInitialMount(resolvedContainer, mode);
    }
  }
  /**
   * @param {Element} container
   */
  #handleHydration(container) {
    this.#ensureStylesInjected();
    const sid = this.$internals.sid;
    if (!sid) throw new Error("Hydration failed: No SID assigned.");
    const root = findHydrationRoot(container, sid);
    if (!root) throw new Error(`Hydration failed: SID "${sid}" not found.`);
    root.removeAttribute("data-sid");
    root.setAttribute("data-component-root", this.instanceId);
    this.$internals.root = root;
    this.$internals.parentElement = root.parentElement;
    this.$internals.mountMode = "replace";
    this.#applyHydration();
    this.#connect(
      /** @type {HTMLElement} */
      root
    );
    this.emit("mount");
  }
  /**
   * @param {Element} container
   * @param {"replace"|"append"|"prepend"} mode
   */
  #handleInitialMount(container, mode) {
    const root = this.#render();
    if (mode === "replace") container.replaceChildren(root);
    else if (mode === "append") container.append(root);
    else if (mode === "prepend") container.prepend(root);
    this.$internals.root = root;
    this.$internals.parentElement = container;
    this.$internals.mountMode = mode;
    this.#ensureStylesInjected();
    this.#mountTeleports();
    this.emit("prepareRender", root);
    this.#connect(
      /** @type {HTMLElement} */
      root
    );
    this.emit("mount");
  }
  /**
   * @param {Element} container
   * @param {"replace"|"append"|"prepend"} mode
   */
  #handleMove(container, mode) {
    const root = this.getRootNode();
    if (mode === "replace") container.replaceChildren(root);
    else if (mode === "append") container.append(root);
    else if (mode === "prepend") container.prepend(root);
    this.$internals.parentElement = container;
    this.$internals.mountMode = mode;
    this.emit("move", { to: container });
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
    this.#disconnect();
    this.#cleanupTeleports();
    this.$internals.additionalRoots = [];
    this.$internals.root?.remove();
    this.$internals.root = null;
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
   * Returns whether the component is currently in a collapsed state (replaced by a placeholder).
   * @returns {boolean}
   */
  get isCollapsed() {
    return this.#isCollapsed;
  }
  /**
   * Collapses the component by replacing its DOM content with a lightweight placeholder.
   * Unlike `unmount()`, this state is tracked by `isCollapsed`, allowing the component
   * to remember its exact position in the DOM tree for future restoration.
   */
  collapse() {
    this.unmount();
    this.#isCollapsed = true;
    this.emit("collapse");
  }
  /**
   * Re-mounts a collapsed component back into its original DOM position.
   */
  expand() {
    this.#isCollapsed = false;
    if (this.#isConnected) return;
    const parent = this.$internals.parentComponent;
    const target = parent ? this.#resolveSlotTarget(parent) : this.#resolveStandaloneTarget();
    if (!target) return;
    this.mount(target, this.$internals.mountMode);
    this.emit("expand");
  }
  /**
   * Resolves the target element for a standalone component.
   * @returns {HTMLElement|null}
   */
  #resolveStandaloneTarget() {
    const el = this.$internals.parentElement;
    if (!el) {
      console.warn("[Expand] Cannot expand: no parent element specified.");
      return null;
    }
    if (!el.isConnected) {
      console.warn("[Expand] Cannot expand: parent element is disconnected from DOM.");
      return null;
    }
    return (
      /** @type {HTMLElement} */
      el
    );
  }
  /**
   * Resolves the target slot in a parent component.
   * @param {Component} parent
   * @returns {HTMLElement|null}
   */
  #resolveSlotTarget(parent) {
    if (!parent.isConnected) {
      console.warn("[Expand] Cannot expand: parent component is not connected.");
      return null;
    }
    const slotName = this.$internals.assignedSlotName;
    const slotRef = parent.$internals.scopeRefs[slotName];
    if (!slotRef) {
      console.warn(`[Expand] Cannot find slot "${slotName}" in parent component.`);
      return null;
    }
    return slotRef;
  }
  /**
   * Forces the expansion of the entire component hierarchy from the current node up to the root.
   * Use this when you need to ensure a specific nested component is visible,
   * even if its ancestors were previously collapsed.
   */
  expandForce() {
    const ancestors = collectComponentAncestors(this);
    for (let i = ancestors.length - 1; i >= 0; i--) {
      ancestors[i].expand();
    }
  }
  /**
   * Registers a cleanup function to be executed when the component is unmounted.
   * * This is the recommended way to manage third-party resources (like MobX disposers,
   * timers, or external library instances) to ensure they are properly cleaned up
   * without manually overriding `disconnectedCallback`.
   *
   * @param {() => void} fn - The cleanup function to register.
   * @example
   * connectedCallback() {
   * // Example: Auto-cleanup for a timer
   * const timerId = setInterval(() => this.tick(), 1000);
   * this.addDisposer(() => clearInterval(timerId));
   * * // Example: Auto-cleanup for a third-party library
   * const chart = new Chart(this.getRefs().canvas, config);
   * this.addDisposer(() => chart.destroy());
   * }
   */
  addDisposer(fn) {
    if (typeof fn === "function") {
      this.#disposers.push(fn);
    }
  }
  #runDisposers() {
    this.#disposers.forEach((dispose) => {
      try {
        dispose();
      } catch (e) {
        console.error(`Error in disposer:`, e);
      }
    });
    this.#disposers = [];
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
   * Clears the given slot name of all its children components.
   * This method first removes all children components of the given slot name from the component,
   * then unmounts them and finally removes them from the component's internal maps.
   * @param {string} slotName - The name of the slot to clear.
   * @returns {boolean} True if the slot was cleared, false otherwise.
   */
  clearSlotContent(slotName) {
    return this.slotManager.clearSlotContent(slotName);
  }
  /**
   * Checks if the given slot name has any children components associated with it.
   * @param {string} slotName - The name of the slot to check.
   * @returns {boolean} True if the slot has children components, false otherwise.
   */
  hasSlotContent(slotName) {
    return this.slotManager.hasSlotContent(slotName);
  }
  /**
   * Detaches a component from the slot.
   * @returns {boolean}
   */
  detachFromSlot() {
    let oldParentComponent = this.parentComponent;
    if (oldParentComponent && this.$internals.assignedSlotName) {
      let slot = oldParentComponent.slotManager.getSlot(this.$internals.assignedSlotName);
      if (!slot) return false;
      return slot.detach(this);
    }
    return false;
  }
  /**
   * Returns a slot element
   * @param {string} slotName
   * @returns {HTMLElement|null}
   */
  getSlotElement(slotName) {
    return this.slotManager.getSlotElement(slotName);
  }
  /**
   * Adds a child component to a slot.
   * @param {string} slotName - The name of the slot to add the component to.
   * @param {Component|Component[]} componentOrComponents - The component to add to the slot.
   * @param {"append"|"replace"|"prepend"} [mode="append"]
   * @returns {Component<T>}
   * @throws {Error} If the slot does not exist.
   */
  addToSlot(slotName, componentOrComponents, mode = "append") {
    const components = Array.isArray(componentOrComponents) ? componentOrComponents : [componentOrComponents];
    const validModes = /* @__PURE__ */ new Set(["append", "replace", "prepend"]);
    if (!validModes.has(mode)) mode = "append";
    const oldLength = this.slotManager.getSlotLength(slotName);
    const slot = this.slotManager.attachToSlot(slotName, components, mode);
    const parentSid = this.$internals.sid;
    if (parentSid) {
      const allComponents = slot.getComponents();
      let startIndex = 0;
      if (mode === "append") {
        startIndex = oldLength;
      }
      for (let i = startIndex; i < allComponents.length; i++) {
        const child = allComponents[i];
        const newSid = `${parentSid}.${slotName}.${i}`;
        this.#recursiveUpdateSid(child, newSid);
      }
    }
    if (this.#isConnected) {
      if (mode == "replace") {
        slot.unmount();
        slot.mount();
      } else {
        const slotRoot = this.slotManager.getSlotElement(slotName);
        if (!slotRoot) {
          console.warn(`Slot root for "${slotName}" not found, cannot mount children`);
          return this;
        }
        if (mode == "append") {
          for (let i = 0; i < components.length; i++) {
            let child = components[i];
            child.mount(slotRoot, "append");
          }
        } else if (mode == "prepend") {
          for (let i = components.length - 1; i >= 0; i--) {
            let child = components[i];
            child.mount(slotRoot, "prepend");
          }
        }
      }
    }
    return this;
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
    if (!this.$internals.root) {
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
    return filterElementsByTagName(this.$internals.root, tagName, walkDomScope, {
      scopeAttribute: ["data-slot", "data-component-root"],
      refAttribute: "data-ref",
      window: Config.window
    });
  }
  /**
   * Returns an array of elements matching the given tag name within the component's scope.
   * Unlike standard querySelectorAll, this method respects component boundaries:
   * it ignores elements that belong to nested child components.
   * * @param {string} tagName - The tag name to search for (e.g., 'li', 'div').
   * @param {string} [querySelector] - An optional CSS selector to further filter the results.
   * @returns {Element[]} An array of elements belonging ONLY to the current component level.
   */
  queryLocal(tagName, querySelector = "") {
    let elements = this.#getElementsByTagName(tagName);
    if (querySelector === "") {
      return elements;
    } else {
      return elements.filter((el) => el.matches(querySelector));
    }
  }
  /**
   * @param {string} name - teleport name
   * @param {import('./types.d.ts').TeleportConfig} config - teleport config
   * @returns {Element}
   */
  #renderTeleport(name, config) {
    const result = resolveLayout(config.layout, this);
    prepareTeleportNode(result, name, this.$internals.sid, this.instanceId);
    return result;
  }
  /**
   * @param {string} name
   * @param {Element} root
   */
  #registerRemoteRoot(name, root) {
    if (!this.$internals.additionalRoots.includes(root)) {
      this.$internals.additionalRoots.push(root);
    }
    this.$internals.teleportRoots.set(name, root);
  }
  #mountTeleports() {
    if (!this.teleports) return;
    for (const [name, config] of Object.entries(this.teleports)) {
      this.#mountTeleport(name, config);
    }
  }
  /**
   * @param {string} name
   * @param {import('./types.d.ts').TeleportConfig} config
   */
  #mountTeleport(name, config) {
    const fragment = this.#renderTeleport(name, config);
    const resolvedTarget = this.#resolveTarget(config.target);
    const rootElement = this.#insertToDOM(fragment, resolvedTarget, config.strategy);
    this.#registerRemoteRoot(name, rootElement);
  }
  /**
   * Resolves a target (string, function, or Element) into a guaranteed HTMLElement.
   * @param {any} target
   * @returns {HTMLElement}
   * @throws {Error}
   */
  #resolveTarget(target) {
    let element = null;
    if (typeof target === "function") {
      element = target.call(this);
    } else if (typeof target === "string") {
      element = document.querySelector(target);
    } else if (target instanceof Config.window.Element) {
      element = target;
    }
    if (!element) {
      throw new Error(`[Mounting Error] Target element not found for: ${target}`);
    }
    return element;
  }
  /**
   * Mounts a fragment or element into a specified target using a given strategy.
   * @param {Element|DocumentFragment} fragment - The content to insert (result of resolveLayout).
   * @param {HTMLElement} target - The destination: element, selector, or provider function.
   * @param {"prepend"|"append"|"replace"} [strategy="append"] - The insertion strategy.
   * @returns {Element|null} The root element of the inserted content.
   */
  #insertToDOM(fragment, target, strategy = "append") {
    return insertToDOM(fragment, target, strategy, Config.window);
  }
  #cleanupTeleports() {
    for (const rootElement of this.$internals.teleportRoots.values()) {
      rootElement.remove();
    }
    this.$internals.teleportRoots.clear();
  }
  /**
   * Synchronizes already existing teleported nodes (SSR) with the component instance.
   */
  #hydrateTeleports() {
    if (!this.teleports || !this.$internals.sid) return;
    for (const [name, config] of Object.entries(this.teleports)) {
      const existing = findExistingTeleport(document, this.$internals.sid, name);
      if (existing) {
        claimTeleportNode(existing, this.instanceId);
        this.#registerRemoteRoot(name, existing);
      } else {
        console.warn(`[Hydration] Teleport "${name}" not found. Falling back to mount.`);
        this.#mountTeleport(name, config);
      }
    }
  }
  /**
   * Checks the global manifest and emits the hydrate event if data exists for this SID.
   */
  #applyHydration() {
    if (this.$internals.isHydrated) return;
    const sid = this.$internals.sid;
    if (!sid) return;
    this.#hydrateTeleports();
    const metadata = Config.getHydrationData(sid);
    if (metadata) {
      this.$internals.isHydrated = true;
      this.emit("restore", metadata);
    }
  }
  /**
   * Recursively updates SIDs for a component and all its nested children.
   * @param {Component} component
   * @param {string} newSid
   */
  #recursiveUpdateSid(component, newSid) {
    updateComponentTreeSid(component, newSid, {
      onUpdateSid: (comp, sid) => {
        comp.$internals.sid = sid;
      },
      onApplyHydration: (comp) => {
        comp.#applyHydration();
      },
      getSlots: (comp) => {
        return comp.slotManager.getSlots();
      }
    });
  }
  /**
   * Finds a nested component by its string SID.
   * @param {string} targetSid - The SID to search for.
   * @returns {Component|null}
   */
  getComponentBySid(targetSid) {
    return findComponentBySid(this, targetSid);
  }
  /**
   * Retrieves hydration data for this specific component instance from the global manifest.
   * Useful for accessing server-provided state BEFORE the component is mounted or hydrated.
   * While `restoreCallback` is triggered automatically during `mount('hydrate')`,
   * this method allows manual data retrieval at any time after instantiation.
   * @returns {any | null}
   */
  getHydrationData() {
    const sid = this.$internals.sid;
    return sid ? Config.getHydrationData(sid) : null;
  }
};

// src/utils/slot-toggler.js
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
   * @param {string} [activeSlotName] - The name of the slot that is currently active.
   */
  constructor(component, slotNames, activeSlotName) {
    this.component = component;
    this.#slotNames = slotNames.slice();
    this.#activeSlotName = activeSlotName ? activeSlotName : this.#slotNames[0];
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

// src/component/ssr.js
function generateManifest(...rootComponents) {
  const container = {};
  const processedIds = /* @__PURE__ */ new Set();
  function register(component, assignedSid) {
    if (!component.$internals.sid || component.$internals.sid !== assignedSid) {
      component.$internals.sid = assignedSid;
    }
    const sid = component.$internals.sid;
    if (processedIds.has(sid)) return;
    processedIds.add(sid);
    const slots = {};
    component.slotManager.slots.forEach((slot, slotName) => {
      const childSids = [];
      let components = slot.getComponents();
      components.forEach((child, index) => {
        const childSid = `${sid}.${slotName}.${index}`;
        childSids.push(childSid);
        register(child, childSid);
      });
      slots[slotName] = childSids;
    });
    container[sid] = {
      className: component.constructor.name,
      // Fallback to empty object if no serialize method
      data: component.serialize(),
      slots
    };
  }
  rootComponents.forEach((component, index) => {
    if (component) {
      const rootSid = component.$internals.sid || `root${index}`;
      register(component, rootSid);
    }
  });
  return container;
}
function createManifestScript(manifest, variableName = "__HYDRATION_DATA__") {
  const script = document.createElement("script");
  const rawJson = JSON.stringify(manifest).replace(/<\/script>/g, "<\\/script>");
  script.textContent = `window.${variableName} = ${rawJson};`;
  return script;
}
function renderManifestHTML(manifest, variableName = "__HYDRATION_DATA__") {
  const rawJson = JSON.stringify(manifest).replace(/<\/script>/g, "<\\/script>");
  return `<script>window.${variableName} = ${rawJson};</script>`;
}
export {
  Component,
  Config,
  DOMReady,
  SlotToggler,
  Toggler,
  UI_COMPONENT_SHEET,
  copyToClipboard,
  createManifestScript,
  createPaginationArray,
  createStorage,
  debounce,
  delegateEvent,
  escapeHtml,
  extractComponentStyles,
  fadeIn,
  fadeOut,
  formatBytes,
  formatDate,
  formatDateTime,
  generateManifest,
  getDefaultLanguage,
  hideElements,
  html,
  htmlDOM,
  injectCoreStyles,
  isDarkMode,
  local,
  onClickOutside,
  removeSpinnerFromButton,
  renderManifestHTML,
  renderPaginationElement,
  scrollToBottom,
  scrollToTop,
  session,
  showElements,
  showSpinnerInButton,
  sleep,
  throttle,
  ui_button_status_waiting_off,
  ui_button_status_waiting_off_html,
  ui_button_status_waiting_on,
  uniqueId,
  unixtime,
  unsafeHTML,
  withMinimumTime
};
