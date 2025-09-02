// @ts-check
import { Component } from "./component/component.js";

export class SlotToggler {
    /**
     * Creates a new instance of SlotToggler.
     * @param {Component} component - The component that owns the slots.
     * @param {string[]} slotNames - The names of the slots.
     * @param {string} activeSlotName - The name of the slot that is currently active.
     */
    constructor(component, slotNames, activeSlotName) {
        if (typeof component.slots !== "undefined") {
            component.defineSlots(...component.slots);
            component.slots = undefined;
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
}
