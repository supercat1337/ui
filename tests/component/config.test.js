// @ts-check
import test from 'ava';
import { Config } from '../../src/component/config.js';

/**
 * Test for Config global state and window abstraction.
 * Targets lines 40-53 in config.js.
 */
test('Config: handles custom window and property settings', t => {
    // Test the setter/getter branches
    const originalWin = Config.window;
    
    // Simulate setting a custom window object (hits lines 40-41)
    const mockWin = { document: {}, Element: class {} };
    // @ts-ignore
    Config.window = mockWin;
    // @ts-ignore
    t.is(Config.window, mockWin);

    // Reset for safety
    Config.window = originalWin;

    // Test hydration data getter branch (hits lines 49-53)
    const data = Config.getHydrationData('non-existent-id');
    t.is(data, null, 'Should return null if manifest is empty');
});

/**
 * Test for hydration data retrieval and manifest management.
 * Targets lines 40-53 in config.js (getManifest, getHydrationData, destroyManifest).
 */
test('Config: manages hydration manifest lifecycle', t => {
    const testSid = 'comp-999';
    const testData = { foo: 'bar' };
    const key = Config.hydrationDataKey;

    // 1. Initial state: Manifest should be null if not defined
    // This hits the "|| null" branch in getManifest
    t.is(Config.getManifest(), null, 'Should return null when no manifest exists');
    t.is(Config.getHydrationData(testSid), null, 'Should return null for missing SID');

    // 2. Mocking the global hydration data
    // We use globalThis as the source of truth for the singleton
    globalThis[key] = {
        [testSid]: { data: testData }
    };

    // 3. Retrieval logic
    t.deepEqual(Config.getHydrationData(testSid), testData, 'Should retrieve data for existing SID');
    t.is(Config.getHydrationData('non-existent'), null, 'Should return null for unknown SID');

    // 4. Cleanup logic (Targets lines 49-53: destroyManifest)
    Config.destroyManifest();
    t.is(globalThis[key], undefined, 'Global manifest should be deleted');
    t.is(Config.getManifest(), null, 'getManifest should return null after destruction');
});

/**
 * Test for environment-safe global object reference.
 * Ensures the 'window' property is populated.
 */
test('Config: provides a reference to globalThis', t => {
    t.truthy(Config.window, 'Config.window should be defined');
    t.is(Config.window, globalThis, 'In modern environments, Config.window should point to globalThis');
});