// @ts-check

import { Component } from './component.js';

/**
 * Generates a flat map of the component tree for SSR hydration.
 * * @param {...Component} rootComponents - The starting root components of the tree.
 * @returns {Record<string, import('./types.d.ts').ComponentMetadata>} A flat dictionary of component metadata indexed by instanceId.
 */
export function generateManifest(...rootComponents) {
    /** @type {Record<string, any>} */
    const container = {};
    /** @type {Set<string>} */
    const processedIds = new Set();

    /**
     * @param {Component} component
     * @param {string} assignedSid - SID assigned by the parent or root loop
     */
    function register(component, assignedSid) {
        // 1. Force SID assignment if it's missing or needs update
        if (!component.$internals.sid || component.$internals.sid !== assignedSid) {
            component.$internals.sid = assignedSid;
        }

        const sid = component.$internals.sid;

        if (processedIds.has(sid)) return;
        processedIds.add(sid);

        /** @type {Record<string, string[]>} */
        const slots = {};

        component.slotManager.slots.forEach((slot, slotName) => {
            /** @type {string[]} */
            const childSids = [];

            slot.components.forEach((child, index) => {
                // Construct the child SID based on the current component's SID
                const childSid = `${sid}.${slotName}.${index}`;

                // Collect the SID for the manifest
                childSids.push(childSid);

                // Recurse
                register(child, childSid);
            });

            slots[slotName] = childSids;
        });

        container[sid] = {
            className: component.constructor.name,
            // Fallback to empty object if no serialize method
            data: component.serialize(),
            slots: slots,
        };
    }

    rootComponents.forEach((component, index) => {
        if (component) {
            // If the root component already has a SID (e.g. 'app'), use it.
            // Otherwise, generate a default one like 'root0'
            const rootSid = component.$internals.sid || `root${index}`;
            register(component, rootSid);
        }
    });

    return container;
}

/**
 * Creates an HTMLScriptElement containing the hydration manifest.
 * Useful for DOM-based environments or JSDOM on the server.
 * * @param {Record<string, import('./types.d.ts').ComponentMetadata>} manifest - The hydration map.
 * @param {string} variableName - Global variable name (default: __HYDRATION_DATA__).
 * @returns {HTMLScriptElement}
 */
export function createManifestScript(manifest, variableName = '__HYDRATION_DATA__') {
    const script = document.createElement('script');

    // We use JSON.stringify and wrap it in a self-executing assignment
    const rawJson = JSON.stringify(manifest).replace(/<\/script>/g, '<\\/script>');
    script.textContent = `window.${variableName} = ${rawJson};`;

    return script;
}

/**
 * Alternative for pure string-based SSR (Node.js without JSDOM)
 * @param {Record<string, import('./types.d.ts').ComponentMetadata>} manifest
 * @param {string} variableName
 * @returns {string}
 */
export function renderManifestHTML(manifest, variableName = '__HYDRATION_DATA__') {
    const rawJson = JSON.stringify(manifest).replace(/<\/script>/g, '<\\/script>');
    return `<script>window.${variableName} = ${rawJson};</script>`;
}

/*
// example

// server.js
import { renderToString } from './ssr-engine.js';
import { generateManifest } from './manifest-generator.js';
import { renderManifest } from './manifest-renderer.js';

const root = new App();
// ... setup tree ...

const htmlContent = renderToString(root);
const manifest = generateManifest(root);
const manifestScript = renderManifest(manifest);

const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Surgical DOM App</title>
</head>
<body>
    <div id="app">${htmlContent}</div>
    
    ${renderManifestHTML}
    
    <script src="/bundle.js"></script>
</body>
</html>
`;
*/
