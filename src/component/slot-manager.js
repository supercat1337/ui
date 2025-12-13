// @ts-check
import { Component } from './component.js';

export class Slot {
    /** @type {string} */
    name;
    /** @type {Set<Component>} */
    components = new Set();

    /**
     * Initializes a new instance of the Slot class.
     * @param {string} name - The name of the slot.
     */
    constructor(name) {
        this.name = name;
    }
}

export class SlotManager {
    /** @type {Map<string, Slot>} */
    #slots = new Map();

    /** @type {Set<Component>}  */
    #allComponents = new Set();

    /** @type {Component} */
    #parentComponent;

    /**
     * @param {Component} component
     */
    constructor(component) {
        this.#parentComponent = component;
    }

    /**
     * Adds a slot to the component.
     * This method is used to programmatically add a slot to the component.
     * @param {string} slotName - The name of the slot to add.
     * @returns {Slot} The set of children components associated with the slot.
     */
    addSlot(slotName) {
        let slot = this.getSlot(slotName);
        if (slot != null) {
            return slot;
        } else {
            let slot = new Slot(slotName);
            this.#slots.set(slotName, slot);
            return slot;
        }
    }

    /**
     * @param {string} slotName
     * @returns {Slot | null}
     */
    getSlot(slotName) {
        return this.#slots.get(slotName) || null;
    }

    /**
     * Checks if the given slot name exists in the component.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot exists, false otherwise.
     */
    hasSlot(slotName) {
        return this.#slots.has(slotName);
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
            this.clearSlot(slotName);
            this.#slots.delete(slotName);
        }
    }

    /**
     * Checks if the given slot name has any children components associated with it.
     * @param {string} slotName - The name of the slot to check.
     * @returns {boolean} True if the slot has children components, false otherwise.
     */
    hasComponents(slotName) {
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
    clearSlot(slotName) {
        let slot = this.getSlot(slotName);
        if (slot == null) return false;

        slot.components.forEach(childComponent => {
            this.#parentComponent.removeChildComponent(childComponent);
            childComponent.unmount();
            this.#allComponents.delete(childComponent);
        });

        return true;
    }

    /**
     * Returns an array of slot names defined in the component.
     * @type {string[]}
     */
    get slotNames() {
        let names = Array.from(this.#slots.keys());
        return names;
    }

    /**
     * Adds a child component to a slot.
     * @param {string} slotName - The name of the slot to add the component to.
     * @param {...Component} components - The components to add to the slot.
     * @throws {Error} If the slot does not exist.
     */
    addComponentsToSlot(slotName, ...components) {
        let slot = this.getSlot(slotName);

        if (slot == null) {
            slot = this.addSlot(slotName);
        }

        for (let i = 0; i < components.length; i++) {
            if (this.#allComponents.has(components[i])) {
                continue;
            }

            this.#allComponents.add(components[i]);
            slot.components.add(components[i]);
        }
    }

    /**
     * Returns the children components of the component.
     * @type {Set<Component>}
     */
    get children() {
        return this.#allComponents;
    }

    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     */
    mountChildren() {
        if (!this.#parentComponent.isConnected) return;

        this.#slots.forEach(slot => {
            this.mountSlotComponents(slot.name);
        });
    }

    /**
     * Mounts all children components of the given slot name to the DOM.
     * The children components are mounted to the slot ref element with the "append" mode.
     * If no slot name is given, all children components of all slots are mounted to the DOM.
     * @param {string} slotName - The name of the slot to mount children components for.
     */
    mountSlotComponents(slotName) {
        if (!this.#parentComponent.isConnected) return;

        let slot = this.getSlot(slotName);
        if (!slot) {
            console.warn(
                `Slot "${slotName}" does not exist in component "${
                    this.#parentComponent.constructor.name
                }"`
            );
            return;
        }

        let slotRoot = this.#parentComponent.$internals.slotRefs[slotName];
        if (!slotRoot) {
            console.warn(
                `Cannot get root element for Slot "${slotName}" does not exist in component "${
                    this.#parentComponent.constructor.name
                }"`
            );
            return;
        }

        slot.components.forEach(childComponent => {
            if (!childComponent.isCollapsed) {
                childComponent.mount(slotRoot, 'append');
            }
        });
    }

    /**
     * Unmounts all children components of the component from the DOM.
     * This method iterates over all children components of the component and calls their unmount method.
     */
    unmountComponents() {
        this.#allComponents.forEach(childComponent => {
            childComponent.unmount();
        });
    }

    /**
     * Unmounts all children components of the given slot name from the DOM.
     * @param {string} slotName - The name of the slot to unmount children components for.
     */
    unmountSlotComponents(slotName) {
        let slot = this.getSlot(slotName);
        if (slot == null) return;

        slot.components.forEach(childComponent => {
            childComponent.unmount();
        });
    }

    /**
     * Removes the given child component from all slots.
     * This method first checks if the child component exists in the component's internal maps.
     * If it does, it removes the child component from the set of all children components and
     * from the sets of children components of all slots.
     * @param {Component} childComponent - The child component to remove.
     * @returns {boolean} True if the child component was removed, false otherwise.
     */
    removeChildComponent(childComponent) {
        if (!this.#allComponents.has(childComponent)) return false;
        this.#allComponents.delete(childComponent);

        this.#slots.forEach(slot => {
            slot.components.delete(childComponent);
        });

        return true;
    }
}
