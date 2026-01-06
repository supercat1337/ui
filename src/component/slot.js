// @ts-check
import { Component } from './component.js';

export class Slot {
    /** @type {string} */
    name;
    /** @type {Set<Component>} */
    components = new Set();

    /** @type {Component} */
    #component;

    /**
     * Initializes a new instance of the Slot class.
     * @param {string} name - The name of the slot.
     * @param {Component} component
     */
    constructor(name, component) {
        this.name = name;
        this.#component = component;
    }

    /**
     * Attaches a component to the slot.
     * This method sets the given component's parent component and parent slot name,
     * and adds the component to the slot's internal set of components.
     * @param {Component} component - The component to attach to the slot.
     */
    attach(component) {
        component.$internals.parentComponent = this.#component;
        component.$internals.assignedSlotName = this.name;
        this.components.add(component);
    }

    /**
     * Detaches a component from the slot.
     * This method sets the given component's parent component and parent slot name to null,
     * and removes the component from the slot's internal set of components.
     * @param {Component} component - The component to detach from the slot.
     */
    detach(component) {
        component.$internals.parentComponent = null;
        component.$internals.assignedSlotName = '';
        this.components.delete(component);
    }

    /**
     * Detaches all components from the slot.
     * This method sets all components' parent component and parent slot name to null,
     * and removes all components from the slot's internal set of components.
     */
    detachAll() {
        this.components.forEach(component => {
            component.$internals.parentComponent = null;
            component.$internals.assignedSlotName = '';
        });
        this.components.clear();
    }

    /**
     * Mounts all children components of the slot to the DOM.
     * This method first checks if the component is connected.
     * If not, it logs a warning and returns.
     * Then, it gets the root element of the slot from the component's internal slot refs map.
     * If the slot root element does not exist, it logs a warning and returns.
     * Finally, it iterates over all children components of the slot and calls their mount method with the slot root element and the "append" mode.
     */
    mount() {
        if (!this.#component.isConnected) {
            console.warn(
                `Cannot mount Slot "${this.name}" in disconnected component ${
                    this.#component.constructor.name
                }`
            );
            return;
        }

        let slotRoot = this.#component.$internals.scopeRefs[this.name];
        if (!slotRoot) {
            console.warn(
                `Cannot get root element for Slot "${this.name}" does not exist in component "${
                    this.#component.constructor.name
                }"`
            );
            return;
        }

        this.components.forEach(childComponent => {
            if (!childComponent.isConnected && !childComponent.isCollapsed) {
                childComponent.mount(slotRoot, 'append');
            }
        });
    }

    /**
     * Unmounts all children components of the slot from the DOM.
     * This method iterates over all children components of the slot and calls their unmount method.
     */
    unmount() {
        this.components.forEach(childComponent => {
            childComponent.unmount();
        });
    }

    /**
     * Clears the slot of all its children components.
     * This method first unmounts all children components of the slot, then detaches them from the slot.
     */
    clear() {
        this.unmount();
        this.detachAll();
    }
}
