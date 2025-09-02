// @ts-check
import { Component } from "./component.js";

export class SlotManager {
    /** @type {Set<string>} */
    #definedSlotNames = new Set();

    /** @type {Map<string, Set<Component>>} */
    #namedSlotChildren = new Map();

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
        const newSlotNames = new Set(slotNames);

        // Remove old slots that are not in the new list
        for (const existingSlotName of this.#definedSlotNames) {
            if (!newSlotNames.has(existingSlotName)) {
                this.removeSlot(existingSlotName);
            }
        }

        // Add new slots
        for (const slotName of newSlotNames) {
            if (!this.#namedSlotChildren.has(slotName)) {
                this.#namedSlotChildren.set(slotName, new Set());
            }
        }

        this.#definedSlotNames = newSlotNames;
    }

    /**
     * Removes the given slot name from the component.
     * This method first unmounts all children components of the given slot name,
     * then removes the slot name from the component's internal maps.
     * @param {string} slotName - The name of the slot to remove.
     */
    removeSlot(slotName) {
        let slotChildren = this.#namedSlotChildren.get(slotName);
        if (slotChildren) {
            let children = Array.from(slotChildren);
            for (let i = 0; i < children.length; i++) {
                this.#component.removeChildComponent(children[i]);
                children[i].unmount();
                this.#children.delete(children[i]);
            }

            this.#namedSlotChildren.delete(slotName);
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

        let childrenComponentsSet = this.#namedSlotChildren.get(slotName);
        if (!childrenComponentsSet) {
            childrenComponentsSet = new Set();
            this.#namedSlotChildren.set(slotName, childrenComponentsSet);
        }

        for (let i = 0; i < children.length; i++) {
            this.#children.add(children[i]);
            childrenComponentsSet.add(children[i]);
        }
    }

    /**
     * Removes the given child component from all slots.
     * @param {Component} childComponent - The child component to remove.
     */
    removeChildComponent(childComponent) {
        this.#children.delete(childComponent);
        for (let [slotName, childrenComponentsSet] of this.#namedSlotChildren) {
            if (!childrenComponentsSet.has(childComponent)) continue;
            childrenComponentsSet.delete(childComponent);
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
        const slotNames = slotName
            ? [slotName]
            : Array.from(this.#definedSlotNames);

        for (const currentSlotName of slotNames) {
            const children = this.#namedSlotChildren.get(currentSlotName);
            const slotRef =
                this.#component.$internals.slotRefs[currentSlotName];

            if (!children || !slotRef) continue;

            for (const child of children) {
                if (!child.isCollapsed) {
                    child.mount(slotRef, "append");
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
                this.#namedSlotChildren.get(slotNames[i]) || []
            );
            for (let y = 0; y < children.length; y++) {
                children[y].unmount();
            }
        }
    }
}
