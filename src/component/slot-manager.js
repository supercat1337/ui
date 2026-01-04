// @ts-check
import { Component } from './component.js';
import { Slot } from './slot.js';

export class SlotManager {
    /** @type {Map<string, Slot>} */
    slots = new Map();

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
            let slot = new Slot(slotName, this.#component);
            this.slots.set(slotName, slot);
            return slot;
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

        this.slots.forEach(slot => {
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
                `Slot "${slotName}" does not exist in component "${
                    this.#component.constructor.name
                }"`
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
        /*
        for (let [slotName, slot] of this.slots) {
            if (slot.components.has(component)) {
                return slot;
            }
        }

        return null;
        */

        let parentComponent = component.$internals.parentComponent;

        if (parentComponent != this.#component) {
            return null;
        }

        return this.getSlot(component.$internals.assignedSlotName);
    }
}
