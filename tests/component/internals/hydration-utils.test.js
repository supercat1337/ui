// @ts-check
import test from 'ava';
import {
    updateComponentTreeSid,
    getMetadataForSid,
} from '../../../src/component/internals/hydration-utils.js';
// Helper to create a mock component structure
const createMockComponent = (name, slots = new Map()) => ({
    name,
    $internals: { sid: '' },
    slotManager: {
        getSlots: () => slots,
    },
});

test('updateComponentTreeSid: should correctly assign nested SIDs', t => {
    // 1. Setup a nested tree: Root -> Main Slot -> Child -> Content Slot -> SubChild
    const subChild = createMockComponent('subChild');
    const child = createMockComponent(
        'child',
        new Map([['content', { getComponents: () => [subChild] }]])
    );
    const root = createMockComponent('root', new Map([['main', { getComponents: () => [child] }]]));

    // 2. Track calls and results
    const results = {};
    const hydrationCalls = [];

    const callbacks = {
        onUpdateSid: (comp, sid) => {
            comp.$internals.sid = sid;
            results[comp.name] = sid;
        },
        onApplyHydration: comp => {
            hydrationCalls.push(comp.name);
        },
        getSlots: comp => {
            return comp.slotManager.getSlots();
        },
    };

    // 3. Run the utility
    updateComponentTreeSid(root, '0', callbacks);

    // 4. Assertions for SIDs
    t.is(results['root'], '0', 'Root should have the base SID');
    t.is(results['child'], '0.main.0', 'First child in main slot should have index 0');
    t.is(
        results['subChild'],
        '0.main.0.content.0',
        'Deeply nested child should have concatenated SID'
    );

    // 5. Assertions for Hydration Order
    // Important: parent must be hydrated BEFORE children
    t.deepEqual(
        hydrationCalls,
        ['root', 'child', 'subChild'],
        'Hydration must follow top-down order'
    );
});

test('updateComponentTreeSid: should handle multiple components in one slot', t => {
    const item1 = createMockComponent('item1');
    const item2 = createMockComponent('item2');
    const list = createMockComponent(
        'list',
        new Map([['items', { getComponents: () => [item1, item2] }]])
    );

    const results = {};
    const callbacks = {
        onUpdateSid: (comp, sid) => {
            results[comp.name] = sid;
        },
        onApplyHydration: () => {},
        getSlots: comp => comp.slotManager.getSlots(),
    };

    updateComponentTreeSid(list, 'app', callbacks);

    t.is(results['item1'], 'app.items.0');
    t.is(results['item2'], 'app.items.1');
});

test('getMetadataForSid: should return null if sid is missing', t => {
    const config = { getHydrationData: () => ({ foo: 'bar' }) };

    // @ts-ignore
    t.is(getMetadataForSid('', config), null);
    // @ts-ignore
    t.is(getMetadataForSid(null, config), null);
});

test('getMetadataForSid: should return null if getHydrationData is not a function', t => {
    const config = { getHydrationData: 'not a function' };

    // @ts-ignore
    t.is(getMetadataForSid('0.1', config), null);
});

test('getMetadataForSid: should return data from config if sid and method are valid', t => {
    const mockData = { state: { active: true } };
    const config = {
        getHydrationData: sid => {
            return sid === '0.1.2' ? mockData : null;
        },
    };

    const result = getMetadataForSid('0.1.2', config);
    t.deepEqual(result, mockData, 'Should return the exact metadata object');

    const notFound = getMetadataForSid('9.9.9', config);
    t.is(notFound, null, 'Should return null if SID is not in manifest');
});
