// @ts-check

import { html } from '../utils/utils.js';
import { Component } from './component.js';
import { Config } from './config.js';
/**
 *
 * @param {((component: any) => Node|string)|string|null|Node} layout
 * @param {*} ctx
 * @returns
 */
export function resolveLayout(layout, ctx) {
    /** @type {Node} */
    let template;

    // 2. Resolve content
    if (typeof layout === 'function') {
        // Dynamic: always execute the function. Cannot be cached as a whole.
        const returnValue = layout(ctx);
        if (returnValue instanceof Config.window.Node) {
            template = returnValue;
        } else if (typeof returnValue === 'string') {
            template = html(returnValue);
        } else {
            throw new Error(`Invalid layout function return type: ${typeof returnValue}`);
        }
    } else if (typeof layout === 'string') {
        // Static: parse the string via the html helper
        template = html(layout.trim());
    } else if (layout instanceof window.Node) {
        template = layout;
    } else {
        console.warn('Unsupported layout type:', typeof layout, layout);
        throw new Error(`Unsupported layout type: ${typeof layout}`);
    }

    // 3. Normalization logic (Ensuring single root element)
    /** @type {Element} */
    let result;

    if (template.nodeType === Config.window.Node.ELEMENT_NODE) {
        result = /** @type {Element} */ (template);
    } else if (template.nodeType === Config.window.Node.DOCUMENT_FRAGMENT_NODE) {
        const children = Array.from(template.childNodes).filter(
            node =>
                node.nodeType === Config.window.Node.ELEMENT_NODE ||
                (node.nodeType === Config.window.Node.TEXT_NODE && node.textContent.trim() !== '')
        );

        if (children.length === 1 && children[0].nodeType === Config.window.Node.ELEMENT_NODE) {
            result = /** @type {Element} */ (children[0]);
        } else {
            result = document.createElement('html-fragment');
            result.appendChild(template);
        }
    } else {
        result = document.createElement('html-fragment');
        result.appendChild(template);
    }
    return result;
}

/**
 * Default handler for the "connect" event.
 * This function calls the `reloadText` method and then the `connectedCallback` method of the component.
 * If the `connectedCallback` method throws an error, it is caught and console.error is called with the error.
 * @param {any} ctx
 * @param {Component} component - The component instance
 */
export function onConnectDefault(ctx, component) {
    component.reloadText();
    try {
        component.connectedCallback();
    } catch (e) {
        console.error('Error in connectedCallback:', e);
    }
}

/**
 * Default handler for the "disconnect" event.
 * This function calls the `disconnectedCallback` method of the component.
 * If the `disconnectedCallback` method throws an error, it is caught and console.error is called with the error.
 * @param {any} ctx
 * @param {Component} component - The component instance
 */
export function onDisconnectDefault(ctx, component) {
    try {
        component.disconnectedCallback();
    } catch (e) {
        console.error('Error in disconnectedCallback:', e);
    }
}
