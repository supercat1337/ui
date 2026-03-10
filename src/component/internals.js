// @ts-check
import { EventEmitter } from '@supercat1337/event-emitter';
import { Config } from './config.js';

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

    /** @type {import('./component.js').Component|null} */
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
