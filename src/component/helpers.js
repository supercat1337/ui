// @ts-check

import { html } from '../utils/utils.js';
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
        if (returnValue instanceof window.Node) {
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

    if (template.nodeType === window.Node.ELEMENT_NODE) {
        result = /** @type {Element} */ (template);
    } else if (template.nodeType === window.Node.DOCUMENT_FRAGMENT_NODE) {
        const children = Array.from(template.childNodes).filter(
            node =>
                node.nodeType === window.Node.ELEMENT_NODE ||
                (node.nodeType === window.Node.TEXT_NODE && node.textContent.trim() !== '')
        );

        if (children.length === 1 && children[0].nodeType === window.Node.ELEMENT_NODE) {
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
