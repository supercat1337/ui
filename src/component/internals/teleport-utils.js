// @ts-check

/**
 * Prepares a DOM element to act as a teleport root by setting necessary attributes.
 * @param {Element} node - The element to prepare.
 * @param {string} name - Teleport name from the config.
 * @param {string|null} parentSid - The SID of the owning component (for SSR/Hydration).
 * @param {string} instanceId - The unique ID of the component instance.
 */
export function prepareTeleportNode(node, name, parentSid, instanceId) {
    node.setAttribute('data-component-teleport', name);
    node.setAttribute('data-component-root', instanceId);
    
    if (parentSid) {
        node.setAttribute('data-parent-sid', parentSid);
    }
}

/**
 * Attempts to find an existing teleport node in the DOM during hydration.
 * @param {Document|Element} root - Search root (usually document).
 * @param {string} parentSid - The owner's SID.
 * @param {string} teleportName - The name of the teleport.
 * @returns {Element|null}
 */
export function findExistingTeleport(root, parentSid, teleportName) {
    const selector = `[data-parent-sid="${parentSid}"][data-component-teleport="${teleportName}"]`;
    return root.querySelector(selector);
}

/**
 * Claims an existing teleport node by updating its attributes for the new instance.
 * @param {Element} node - The teleport node to claim.
 * @param {string} instanceId - The new instance ID.
 */
export function claimTeleportNode(node, instanceId) {
    node.setAttribute('data-component-root', instanceId);
    node.removeAttribute('data-parent-sid');
}