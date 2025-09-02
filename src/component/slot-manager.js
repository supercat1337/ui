// @ts-check
import { Component } from "./component.js";

export class SlotManager {
    /** @type {Set<string>} */
    #definedSlotNames = new Set();

    /** @type {Map<string, Set<Component>>} */
    #slotChildrenMap = new Map();

    /** @type {Set<Component>}  */
    #children = new Set();

    /** @type {Component} */
    #component;

    /**
     * @param {Component} component
     */
    constructor(component) {
        this.#component = component;
    }

    /**
     * Defines the names of the slots in the component.
     * The slots are declared in the component's template using the "scope-ref" attribute.
     * The slot names are used to access the children components of the component.
     * @param {...string} slotNames - The names of the slots.
     */
    defineSlots(...slotNames) {
        let keysToDelete = [];

        let currentSlotNames = Array.from(this.#definedSlotNames);

        for (let i = 0; i < currentSlotNames.length; i++) {
            if (slotNames.indexOf(currentSlotNames[i]) == -1) {
                keysToDelete.push(currentSlotNames[i]);
            }
        }

        for (let i = 0; i < keysToDelete.length; i++) {
            this.removeSlot(keysToDelete[i]);
        }

        for (let i = 0; i < slotNames.length; i++) {
            if (!this.#slotChildrenMap.has(slotNames[i])) {
                this.#slotChildrenMap.set(slotNames[i], new Set());
            }
        }

        this.#definedSlotNames = new Set(slotNames);
    }

    /**
     * Removes the given slot name from the component.
     * This method first unmounts all children components of the given slot name,
     * then removes the slot name from the component's internal maps.
     * @param {string} slotName - The name of the slot to remove.
     */
    removeSlot(slotName) {
        let slotChildren = this.#slotChildrenMap.get(slotName);
        if (slotChildren) {
            let children = Array.from(slotChildren);
            for (let i = 0; i < children.length; i++) {
                this.#component.removeChildComponent(children[i]);
                children[i].unmount();
                this.#children.delete(children[i]);
            }

            this.#slotChildrenMap.delete(slotName);
        }

        this.#definedSlotNames.delete(slotName);
    }

    /**
     * Returns an array of slot names defined in the component.
     * @type {string[]}
     */
    get slotNames() {
        let arr = Array.from(this.#definedSlotNames);
        return arr;
    }

    /**
     * Checks if the given slot name exists in the component.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot exists, false otherwise.
     */
    slotExists(slotName) {
        return this.#definedSlotNames.has(slotName);
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} children - The components to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addChildComponent(slotName, ...children) {
        if (this.slotExists(slotName) === false) {
            throw new Error(`Slot "${slotName}" does not exist`);
        }

        let childrenSet = this.#slotChildrenMap.get(slotName);
        if (!childrenSet) {
            childrenSet = new Set();
            this.#slotChildrenMap.set(slotName, childrenSet);
        }

        for (let i = 0; i < children.length; i++) {
            this.#children.add(children[i]);
            childrenSet.add(children[i]);
        }
    }

    /**
     * Removes the given child component from all slots.
     * @param {Component} childComponent - The child component to remove.
     */
    removeChildComponent(childComponent) {
        this.#children.delete(childComponent);
        for (let [slotName, childrenSet] of this.#slotChildrenMap) {
            if (!childrenSet.has(childComponent)) continue;
            childrenSet.delete(childComponent);
            break;
        }
    }

    /**
     * Returns the children components of the component.
     * @type {Set<Component>}
     */
    get children() {
        return this.#children;
    }

    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     * If no slot name is given, all children components of all slots are mounted to the DOM.
     * @param {string} [slotName] - The name of the slot to mount children components for.
     */
    mountChildren(slotName) {
        /** @type {string[]} */
        let slotNames = slotName
            ? [slotName]
            : Array.from(this.#definedSlotNames);

        for (let i = 0; i < slotNames.length; i++) {
            let children = Array.from(
                this.#slotChildrenMap.get(slotNames[i]) || []
            );
            let slotRef = this.#component.$internals.slotRefs[slotNames[i]];

            if (slotRef)
                for (let y = 0; y < children.length; y++) {
                    if (children[y].isCollapsed == false) {
                        children[y].mount(slotRef, "append");
                    }
                }
        }
    }

    /**
     * Unmounts all children components of the given slot name.
     * This method iterates over the children components of the given slot name and calls their unmount method.
     * @param {string} [slotName] - The name of the slot to unmount the children components for.
     * if no slot name is given, all children components of all slots are unmounted.
     */
    unmountChildren(slotName) {
        /** @type {string[]} */
        let slotNames = slotName
            ? [slotName]
            : Array.from(this.#definedSlotNames);
        for (let i = 0; i < slotNames.length; i++) {
            let children = Array.from(
                this.#slotChildrenMap.get(slotNames[i]) || []
            );
            for (let y = 0; y < children.length; y++) {
                children[y].unmount();
            }
        }
    }
}
