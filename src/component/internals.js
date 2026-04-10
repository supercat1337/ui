// @ts-check
import { EventEmitter } from '@supercat1337/event-emitter';
import { Config } from './config.js';
import { Component } from './component.js';

/** @type {WeakMap<Function, string>} */
const classIdMap = new WeakMap();
let classCounter = 0;

/**
 * Gets or generates a stable unique ID for a component class (e.g., 'bd-1').
 * @param {Function} ctor - The component class constructor.
 * @returns {string} The unique class identifier.
 */
export function getComponentClassId(ctor) {
    let id = classIdMap.get(ctor);
    if (!id) {
        classCounter++;
        id = `bd-${classCounter}`;
        classIdMap.set(ctor, id);
    }
    return id;
}

/**
 * Processes a CSS string by replacing the ':scope' placeholder with a unique attribute selector.
 * Used when 'static cssScope = true' is defined in the component.
 * @param {typeof import('./component.js').Component} ctor - The component class.
 * @param {string} styles - The raw CSS string.
 * @returns {string} The transformed CSS string.
 */
export function transformScopedStyles(ctor, styles) {
    // @ts-ignore - access to static property
    if (ctor.cssScope && typeof styles === 'string') {
        const cid = getComponentClassId(ctor);
        return styles.replace(/:scope/g, `[data-cid="${cid}"]`);
    }
    return styles;
}

export class Internals {
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
            this.#instanceId = Internals.generateInstanceId();

            // If the root element exists, sync the attribute for DOM-to-Instance lookups
            if (this.root instanceof Config.window.Element) {
                this.root.setAttribute('data-component-root', this.#instanceId);
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
    assignedSlotName = '';

    /** @type {"replace"|"append"|"prepend"|"hydrate"} */
    mountMode = 'replace';

    /** @type {boolean} */
    cloneTemplateOnRender = true;

    /** @type {Element|null} */
    parentElement = null;

    /** @type {Set<Element>} */
    elementsToRemove = new Set();

    /** @type {Map<string, Element>} */
    teleportRoots = new Map();

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
        let counter = ++Internals.#instanceIdCounter;
        return `${Internals.#sessionPrefix}-${counter}`;
    }
}
