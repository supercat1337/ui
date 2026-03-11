// @ts-check



/**
 * Recursively updates SIDs for a component tree.
 * Pure logic extracted from the Component class to allow isolated testing.
 * * @param {any} component - The root component to start from.
 * @param {string} newSid - The new SID to assign.
 * @param {import("../types.d.ts").HydrationCallbacks} callbacks - Methods to interact with the component instance.
 */
export function updateComponentTreeSid(component, newSid, callbacks) {
    // 1. Update the current component's SID via callback
    callbacks.onUpdateSid(component, newSid);

    // 2. Trigger hydration for this level
    callbacks.onApplyHydration(component);

    // 3. Process children in slots
    const slots = callbacks.getSlots(component);

    slots.forEach((slot, name) => {
        // Assume slot has a method to get its children (components)
        const subComponents = typeof slot.getComponents === 'function' ? slot.getComponents() : [];
        
        for (let j = 0; j < subComponents.length; j++) {
            const subChild = subComponents[j];
            // Format: "parentSid.slotName.index" (e.g., "0.main.1")
            const subSid = `${newSid}.${name}.${j}`;
            
            // Recursive call
            updateComponentTreeSid(subChild, subSid, callbacks);
        }
    });
}

/**
 * Resolves the metadata from the global configuration.
 * * @param {string} sid - The unique session identifier.
 * @param {Object} config - The global library configuration object.
 * @returns {any | null}
 */
export function getMetadataForSid(sid, config) {
    if (!sid || typeof config.getHydrationData !== 'function') {
        return null;
    }
    return config.getHydrationData(sid);
}