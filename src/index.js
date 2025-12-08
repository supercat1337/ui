// @ts-check

import { injectCoreStyles } from "./utils/index.js";

export * from "./utils/index.js";
export { Component } from "./component/component.js";
export { SlotToggler } from "./slot-toggler.js";

if (globalThis.hasOwnProperty("document")) {
    injectCoreStyles(globalThis.document);
}

