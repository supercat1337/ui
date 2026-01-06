// @ts-check

import { EventEmitter } from "@supercat1337/event-emitter";
import { Component } from "./component.js";

/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */

export class Internals {
    constructor() {
        /** @type {EventEmitter<any>} */
        this.eventEmitter = new EventEmitter();
        /** @type {AbortController} */
        this.disconnectController = new AbortController();
        /** @type {Element|null} */
        this.root = null;
        /** @type {TextUpdateFunction|null} */
        this.textUpdateFunction = null;
        /** @type {{[key:string]:any}}  */
        this.textResources = {};
        /** @type {{[key:string]:HTMLElement}} */
        this.refs = {};
        /** @type {{[key:string]:HTMLElement}} */
        this.scopeRefs = {};
        /** @type {Component|null} */
        this.parentComponent = null;
        /** @type {string} */
        this.assignedSlotName = "";
        /** @type {"replace"|"append"|"prepend"} */
        this.mountMode = "replace";
        /** @type {boolean} */
        this.cloneTemplateOnRender = true;
        /** @type {Element|null} */
        this.parentElement = null;
        /** @type {Set<Element>} */
        this.elementsToRemove = new Set();
    }

    static #instanceIdCounter = 0;

    /**
     * Generates a unique instance ID.
     * @returns {string} The unique instance ID.
     */
    static generateInstanceId() {
        let counter = ++Internals.#instanceIdCounter;
        return `c${counter}`;
    }
}
