// @ts-check
import { Component } from './component.js';

export class Slot {
    /** @type {string} */
    name;
    /** @type {Component[]} */
    #components = [];

    /** @type {Component} */
    #ownerComponent;

    /**
     * Initializes a new instance of the Slot class.
     * @param {string} name - The name of the slot.
     * @param {Component} component
     */
    constructor(name, component) {
        this.name = name;
        this.#ownerComponent = component;
    }

    /**
     * Attaches a component to the slot.
     * This method sets the given component's parent component and parent slot name,
     * and adds the component to the slot's internal array of components.
     * @param {Component} component - The component to attach to the slot.
     * @param {"append"|"replace"|"prepend"} [mode='append']
     */
    attach(component, mode = 'append') {
        this.attachMany([component], mode);
    }

    /**
     *
     * @param {Component[]} components
     * @param {"append"|"replace"|"prepend"} [mode='append']
     */
    attachMany(components, mode = 'append') {
        for (let i = 0; i < components.length; i++) {
            let component = components[i];
            component.$internals.parentComponent = this.#ownerComponent;
            component.$internals.assignedSlotName = this.name;
        }

        const componentsSet = new Set(components);
        this.#components = this.#components.filter(c => !componentsSet.has(c));

        if (mode === 'replace') {
            this.clear();
            this.#components.push(...components);
        } else if (mode === 'prepend') {
            this.#components.unshift(...components);
        } else {
            this.#components.push(...components);
        }
    }

    /**
     * Detaches a component from the slot.
     * This method sets the given component's parent component and parent slot name to null,
     * and removes the component from the slot's internal set of components.
     * @param {Component} component - The component to detach from the slot.
     * @returns {boolean}
     */
    detach(component) {
        component.$internals.parentComponent = null;
        component.$internals.assignedSlotName = '';

        let foundIndex = this.#components.indexOf(component);
        if (foundIndex > -1) {
            this.#components.splice(foundIndex, 1);
        }

        return foundIndex != -1;
    }

    /**
     * Detaches all components from the slot.
     * This method sets all components' parent component and parent slot name to null,
     * and removes all components from the slot's internal set of components.
     */
    detachAll() {
        this.#components.forEach(component => {
            component.$internals.parentComponent = null;
            component.$internals.assignedSlotName = '';
        });
        this.#components = [];
    }

    /**
     * Mounts all children components of the slot to the DOM.
     */
    mount() {
        if (!this.#ownerComponent.isConnected) {
            console.warn(
                `Cannot mount Slot "${this.name}" in disconnected component ${
                    this.#ownerComponent.constructor.name
                }`
            );
            return;
        }

        let slotRoot = this.#ownerComponent.$internals.scopeRefs[this.name];
        if (!slotRoot) {
            console.warn(
                `Cannot get root element for Slot "${this.name}" does not exist in component "${
                    this.#ownerComponent.constructor.name
                }"`
            );
            return;
        }

        //slotRoot.replaceChildren();
        
        this.#components.forEach(childComponent => {
            childComponent.mount(slotRoot, 'append');
        });
    }

    /**
     * Unmounts all children components of the slot from the DOM.
     * This method iterates over all children components of the slot and calls their unmount method.
     */
    unmount() {
        for (let i = 0; i < this.#components.length; i++) {
            let child = this.#components[i];
            child.unmount();
        }
    }

    /**
     * Clears the slot of all its children components.
     * This method first unmounts all children components of the slot, then detaches them from the slot.
     */
    clear() {
        //this.unmount();
        //this.detachAll();

        for (let i = 0; i < this.#components.length; i++) {
            let child = this.#components[i];
            child.unmount();
            child.$internals.parentComponent = null;
            child.$internals.assignedSlotName = '';
        }

        this.#components = [];
    }

    getLength() {
        return this.#components.length;
    }

    /**
     *
     * @returns {Component[]}
     */
    getComponents() {
        //return [...this.#components];
        return this.#components;
    }
}
