// @ts-check
import { Component } from './component/component.js';
import { hideElements, showElements } from './utils/utils.js';

export class SlotToggler {
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
                let slotElement = this.component.slotManager.getSlotElement(this.#slotNames[i]);
                if (slotElement) {
                    hideElements(slotElement);
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
            throw new Error('SlotToggler is destroyed');
        }

        if (!this.#slotNames.includes(slotName)) {
            throw new Error(`Slot "${slotName}" is not defined in this SlotToggler`);
        }

        if (slotName === this.#activeSlotName) return;

        const sm = this.component.slotManager;

        // 1. Deactivate current slot
        if (this.#activeSlotName) {
            sm.unmountSlot(this.#activeSlotName);
            const prevElement = sm.getSlotElement(this.#activeSlotName);
            if (prevElement) hideElements(prevElement);
        }

        // 2. Activate new slot
        sm.mountSlot(slotName);
        this.#activeSlotName = slotName;

        const nextElement = sm.getSlotElement(this.#activeSlotName);
        if (nextElement) showElements(nextElement);
    }

    destroy() {
        this.#isDestroyed = true;
        // @ts-ignore
        this.component = null;
        this.#slotNames = [];
        this.#activeSlotName = '';
    }
}
