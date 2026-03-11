// @ts-check
import { Component } from '../component.js';

/**
 * Recursively finds a component in the tree by its SID.
 * Includes optimization checks to skip irrelevant branches.
 * * @param {Component} startComponent - Where to start the search.
 * @param {string} targetSid - The SID to find.
 * @returns {Component | null}
 */
export function findComponentBySid(startComponent, targetSid) {
    const currentSid = startComponent.$internals.sid;

    // 1. Quick check: is it the current component?
    if (currentSid === targetSid) {
        return startComponent;
    }

    // 2. Optimization: if targetSid doesn't start with currentSid,
    // the target cannot be in this branch.
    if (currentSid && !targetSid.startsWith(currentSid + '.')) {
        return null;
    }

    // 3. Recursive search through slots
    const slots = startComponent.slotManager.getSlots();
    for (const slot of slots.values()) {
        for (const child of slot.getComponents()) {
            const found = findComponentBySid(child, targetSid);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Collects all ancestor components starting from the current one up to the root.
 * @param {Component} component
 * @returns {Component[]} Array of components from self to top-level root.
 */
export function collectComponentAncestors(component) {
    /** @type {Component<any>[]} */
    const ancestors = [];
    let current = component;

    while (current) {
        ancestors.push(current);
        current = current.$internals.parentComponent;
    }

    return ancestors;
}
