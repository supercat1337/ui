// @ts-nocheck

import test from 'ava';
import { createStorage } from '../../src/utils/storage.js';
import { Config } from '../../src/component/config.js';

// 1. Helper to create a mock Storage object (localStorage/sessionStorage)
const createMockStorage = () => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
    };
};

// 2. Setup Config.window mock before tests
test.before(t => {
    Config.window = {
        addEventListener: () => {},
        removeEventListener: () => {},
        localStorage: createMockStorage(),
        sessionStorage: createMockStorage()
    };
});

test('Storage: set and get handles JSON serialization', t => {
    const mockStorage = createMockStorage();
    const storage = createStorage(mockStorage);
    const data = { id: 1, name: 'Alice' };

    storage.set('user', data);
    
    // Verify it was stored as a string internally
    t.is(mockStorage.getItem('user'), JSON.stringify(data));
    // Verify it comes back as an object
    t.deepEqual(storage.get('user'), data);
});

test('Storage: remove notifies local listeners', t => {
    const storage = createStorage(createMockStorage());
    let lastValue = undefined;

    storage.set('session', 'active');
    storage.on('session', (newVal) => {
        lastValue = newVal;
    });

    storage.remove('session');
    t.is(lastValue, null, 'Listener should receive null after removal');
    t.is(storage.get('session'), null);
});

test('Storage: clear notifies all listeners', t => {
    const storage = createStorage(createMockStorage());
    let aNotified = false;
    let bNotified = false;

    storage.on('a', () => { aNotified = true; });
    storage.on('b', () => { bNotified = true; });

    storage.clear();
    t.true(aNotified);
    t.true(bNotified);
});

test('Storage: handleStorage processes external events (cross-tab)', t => {
    const mockStorage = createMockStorage();
    let storageHandler;
    
    // Capture the handler assigned to the window
    Config.window.addEventListener = (type, handler) => {
        if (type === 'storage') storageHandler = handler;
    };

    const storage = createStorage(mockStorage);
    let result = null;
    
    storage.on('sync', (newVal) => { result = newVal; });

    // Simulate an external storage event from another tab
    const fakeEvent = {
        storageArea: mockStorage,
        key: 'sync',
        newValue: JSON.stringify({ status: 'ok' }),
        oldValue: null
    };

    storageHandler(fakeEvent);
    t.deepEqual(result, { status: 'ok' }, 'Should parse and notify from external storage event');
});

test('Storage: handleStorage processes external clear event', t => {
    const mockStorage = createMockStorage();
    let storageHandler;
    Config.window.addEventListener = (type, handler) => {
        if (type === 'storage') storageHandler = handler;
    };

    const storage = createStorage(mockStorage);
    let notified = false;
    
    storage.on('anyKey', (val) => { 
        if (val === null) notified = true; 
    });

    // key: null represents a storage.clear() call in another tab
    storageHandler({ storageArea: mockStorage, key: null });
    t.true(notified, 'Should notify all listeners when storage is cleared externally');
});



test('Storage: get() fallback triggers catch block for invalid JSON', t => {
    const mockStorage = createMockStorage();
    const storage = createStorage(mockStorage);
    
    // Manually inject invalid JSON into the underlying storage
    mockStorage.setItem('bad-json', '{ invalid : json }');
    
    // This triggers the try/catch block in get()
    const result = storage.get('bad-json');
    t.is(result, '{ invalid : json }', 'Should return raw string if JSON parsing fails');
});

test('Storage: set() correctly calculates oldValue and notifies local listeners', t => {
    const storage = createStorage(createMockStorage());
    let observedOld = undefined;
    let observedNew = undefined;

    // First, set initial value
    storage.set('theme', 'light');

    // Subscribe to changes
    storage.on('theme', (newVal, oldVal) => {
        observedNew = newVal;
        observedOld = oldVal;
    });

    // Update value - triggers the "if (callbacks)" branch in set()
    storage.set('theme', 'dark');

    t.is(observedNew, 'dark', 'Should pass new value to listener');
    t.is(observedOld, 'light', 'Should correctly parse and pass the previous value from storage');
});

test('Storage: stopListening removes window event listener when listeners Map is empty', t => {
    let removeCount = 0;
    let removeType = '';

    Config.window.removeEventListener = (type) => {
        removeCount++;
        removeType = type;
    };

    const storage = createStorage(createMockStorage());
    
    // Adding listeners to start internal "isListening"
    const unsub1 = storage.on('key1', () => {});
    const unsub2 = storage.on('key2', () => {});

    // Unsubscribe only one - should NOT trigger stopListening yet
    unsub1();
    t.is(removeCount, 0, 'Should not remove event listener if other keys still have subscribers');

    // Unsubscribe the last one - triggers stopListening logic
    unsub2();
    t.is(removeCount, 1, 'Should call removeEventListener when the last subscriber is removed');
    t.is(removeType, 'storage');
});

test('Storage: set() handles local notification even if old value is null', t => {
    const storage = createStorage(createMockStorage());
    let observedOld = 'initial-garbage';

    storage.on('new-item', (newVal, oldVal) => {
        observedOld = oldVal;
    });

    // Setting a brand new item (oldRaw will be null)
    storage.set('new-item', { success: true });

    t.is(observedOld, null, 'oldValue passed to callback should be null if key did not exist');
});