// @ts-check

/**
 * @typedef {Object} ComponentMetadata
 * @property {string} className - The constructor name for class instantiation.
 * @property {any} data - Serialized state from component.serialize().
 * @property {Record<string, string[]>} slots - Map of slot names to child instance IDs.
 */

/**
 * Configuration Manager for UI Library.
 * Handles SSR flags and hydration data access.
 */
class ConfigManager {
    constructor() {
        /** @type {boolean} Indicates if we are currently in Server-Side Rendering mode. */
        this.isSSR = false;

        /** @type {string} The global key where hydration data is stored. */
        this.hydrationDataKey = '__HYDRATION_DATA__';

        /** * Safe reference to the global object (window in browser, global in Node).
         * @type {globalThis}
         */
        // @ts-ignore
        this.window = typeof globalThis !== 'undefined' ? globalThis : {};
    }

    /**
     * Safely retrieves the hydration manifest from the global environment.
     * @returns {ComponentMetadata|null}
     */
    getManifest() {
        // globalThis works in both Node.js and Browsers
        const globalObject = typeof globalThis !== 'undefined' ? globalThis : {};
        return globalObject[this.hydrationDataKey] || null;
    }

    /**
     * Extracts state for a specific SID.
     * @param {string} sid - Server ID
     * @returns {any|null}
     */
    getHydrationData(sid) {
        const manifest = this.getManifest();
        if (manifest && manifest[sid]) {
            return manifest[sid].data;
        }
        return null;
    }

    /**
     * Clears the manifest to free up memory.
     */
    destroyManifest() {
        const globalObject = typeof globalThis !== 'undefined' ? globalThis : {};
        if (globalObject[this.hydrationDataKey]) {
            delete globalObject[this.hydrationDataKey];
        }
    }
}

// Export a singleton instance
export const Config = new ConfigManager();
