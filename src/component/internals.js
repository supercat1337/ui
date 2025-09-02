// @ts-check

import { EventEmitter } from "@supercat1337/event-emitter";
import { Component } from "./component.js";

/**
 * @typedef {(component: Component) => void} TextUpdateFunction
 */

export class Internals {
    constructor() {
        /** @type {EventEmitter} */
        this.eventEmitter = new EventEmitter();
        /** @type {AbortController} */
        this.disconnectController = new AbortController();
        /** @type {HTMLElement|null} */
        this.root = null;
        /** @type {TextUpdateFunction|null} */
        this.textUpdateFunction = null;
        /** @type {{[key:string]:any}}  */
        this.textResources = {};
        /** @type {{[key:string]:HTMLElement}} */
        this.refs = {};
        /** @type {{[key:string]:HTMLElement}} */
        this.slotRefs = {};
        /** @type {Component|null} */
        this.parentComponent = null;
        /** @type {string} */
        this.parentSlotName = "";
    }
}
