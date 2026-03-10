// @ts-check

import { Config } from "../component/config.js";

/**
 * Creates a wrapper around a Storage object (localStorage or sessionStorage)
 * with automatic JSON serialization and change subscription.
 *
 * @param {Storage} storage - The storage object to wrap (e.g. localStorage, sessionStorage).
 * @returns {{
 *   get: (key: string) => any,
 *   set: (key: string, value: any) => void,
 *   remove: (key: string) => void,
 *   clear: () => void,
 *   on: (key: string, callback: (newValue: any, oldValue: any) => void) => () => void
 * }} An object with storage methods.
 */
export function createStorage(storage) {
    // Map of key -> Set of callbacks
    const listeners = new Map();

    // Handle storage events from the same origin
    const handleStorage = event => {
        if (event.storageArea !== storage) return;

        const { key, newValue, oldValue } = event;

        // If key is null, it means clear() was called
        if (key === null) {
            // Notify all listeners with null values
            listeners.forEach((callbacks, listenerKey) => {
                callbacks.forEach(cb => cb(null, null));
            });
            return;
        }

        const callbacks = listeners.get(key);
        if (callbacks) {
            // Parse values (they are strings from the event)
            const parsedNew = newValue !== null ? JSON.parse(newValue) : null;
            const parsedOld = oldValue !== null ? JSON.parse(oldValue) : null;
            callbacks.forEach(cb => cb(parsedNew, parsedOld));
        }
    };

    // Subscribe to storage events once when the first listener is added
    let isListening = false;
    const startListening = () => {
        if (!isListening) {
            Config.window.addEventListener('storage', handleStorage);
            isListening = true;
        }
    };

    const stopListening = () => {
        if (isListening && listeners.size === 0) {
            Config.window.removeEventListener('storage', handleStorage);
            isListening = false;
        }
    };

    /**
     * Retrieves a value from storage.
     * @param {string} key
     * @returns {any} Parsed value, or null if not found.
     */
    const get = key => {
        const raw = storage.getItem(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return raw; // fallback for non-JSON values (shouldn't happen if set is used)
        }
    };

    /**
     * Stores a value in storage.
     * @param {string} key
     * @param {any} value
     */
    const set = (key, value) => {
        const oldRaw = storage.getItem(key);
        const newRaw = JSON.stringify(value);
        storage.setItem(key, newRaw);
        // Manually trigger listeners for the same tab (storage event only fires in other tabs)
        const callbacks = listeners.get(key);
        if (callbacks) {
            const oldValue = oldRaw !== null ? JSON.parse(oldRaw) : null;
            callbacks.forEach(cb => cb(value, oldValue));
        }
    };

    /**
     * Removes a key from storage.
     * @param {string} key
     */
    const remove = key => {
        const oldRaw = storage.getItem(key);
        storage.removeItem(key);
        // Notify local listeners
        const callbacks = listeners.get(key);
        if (callbacks) {
            const oldValue = oldRaw !== null ? JSON.parse(oldRaw) : null;
            callbacks.forEach(cb => cb(null, oldValue));
        }
    };

    /**
     * Clears all keys in this storage.
     */
    const clear = () => {
        storage.clear();
        // Notify all local listeners with null values
        listeners.forEach((callbacks, key) => {
            callbacks.forEach(cb => cb(null, null));
        });
    };

    /**
     * Subscribes to changes of a specific key.
     * @param {string} key
     * @param {(newValue: any, oldValue: any) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    const on = (key, callback) => {
        if (!listeners.has(key)) {
            listeners.set(key, new Set());
        }
        listeners.get(key).add(callback);
        startListening();

        return () => {
            const callbacks = listeners.get(key);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    listeners.delete(key);
                }
            }
            stopListening();
        };
    };

    return { get, set, remove, clear, on };
}

// Pre-created instances for convenience
export const local = createStorage(Config.window.localStorage);
export const session = createStorage(Config.window.sessionStorage);

/*
// example

javascript
import { local, session } from '@supercat1337/ui';

local.set('user', { name: 'Alice', age: 30 });
const user = local.get('user');
console.log(user); // { name: 'Alice', age: 30 }

const unsubscribe = local.on('user', (newValue, oldValue) => {
    console.log('User changed from', oldValue, 'to', newValue);
});

local.set('user', { name: 'Bob', age: 25 });

unsubscribe();

session.set('theme', 'dark');
*/
