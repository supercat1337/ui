// @ts-check
import test from 'ava';
import {
    createManifestScript,
    generateManifest,
    renderManifestHTML,
} from '../../src/component/ssr.js';
import { Component } from '../../src/component/component.js';
import { htmlDOM } from '../../src/utils/utils.js';

/**
 * Factory for mock components with slot support
 */
const createMockComponent = (className, sid = '', data = {}) => ({
    constructor: { name: className },
    $internals: { sid },
    serialize: () => data,
    slotManager: {
        slots: new Map(),
    },
});

/**
 * Helper to add a mock slot to a mock component
 */
const addMockSlot = (parent, slotName, children = []) => {
    parent.slotManager.slots.set(slotName, { components: children });
};

test('SSR: generateManifest creates a flat map of a nested tree', t => {
    // Setup a small tree: App -> Header -> [UserBtn, Logo]
    const userBtn = createMockComponent('Button', '', { label: 'Login' });
    const logo = createMockComponent('Logo');
    const header = createMockComponent('Header');
    const app = createMockComponent('App', 'app-root');

    addMockSlot(header, 'actions', [userBtn]);
    addMockSlot(header, 'brand', [logo]);
    addMockSlot(app, 'top', [header]);

    // @ts-ignore
    const manifest = generateManifest(app);

    // Verify SIDs are generated recursively
    t.truthy(manifest['app-root'], 'Root exists');
    t.truthy(manifest['app-root.top.0'], 'Header exists');
    t.truthy(manifest['app-root.top.0.actions.0'], 'Button exists');

    // Verify data serialization
    t.is(manifest['app-root.top.0.actions.0'].data.label, 'Login');
    t.is(manifest['app-root.top.0.actions.0'].className, 'Button');

    // Verify slot structure
    t.deepEqual(manifest['app-root.top.0'].slots.actions, ['app-root.top.0.actions.0']);
});

test('SSR: generateManifest handles multiple root components', t => {
    const comp1 = createMockComponent('Comp1');
    const comp2 = createMockComponent('Comp2');

    // @ts-ignore
    const manifest = generateManifest(comp1, comp2);

    t.truthy(manifest['root0'], 'First root gets index 0');
    t.truthy(manifest['root1'], 'Second root gets index 1');
});

test('SSR: renderManifestHTML escapes closing script tags', t => {
    const manifest = {
        evil: {
            className: 'XSS',
            data: { html: '</script><script>alert(1)</script>' },
            slots: {},
        },
    };

    const html = renderManifestHTML(manifest);

    // Check for the escaped version used in the replace() call
    t.true(
        html.includes('<\\/script>'),
        'Should escape </script> to prevent breaking the container tag'
    );
    t.false(html.includes('</script><script>'), 'Should not contain raw closing tag');
});

test('SSR: generateManifest avoids duplicate processing using SIDs', t => {
    const root = createMockComponent('Root', 'shared');
    // If the same component instance is passed twice
    // @ts-ignore
    const manifest = generateManifest(root, root);

    t.is(Object.keys(manifest).length, 1, 'Should only process a unique SID once');
});

/**
 * Test for SSR manifest script generation.
 * Targets createManifestScript including custom variable names
 * and script tag escaping logic.
 */
test('SSR: createManifestScript generates correct script and escapes tags', t => {
    const manifest = {
        version: '1.0.0',
        content: '</script><script>alert("xss")</script>',
    };

    // 1. Test default variable name and content
    // @ts-ignore
    const defaultScript = createManifestScript(manifest);
    t.is(defaultScript.tagName, 'SCRIPT', 'Should create a script element');
    t.true(
        defaultScript.textContent.includes('window.__HYDRATION_DATA__ ='),
        'Should use default variable name'
    );

    // 2. Test custom variable name
    const customVar = 'MY_APP_DATA';
    // @ts-ignore
    const customScript = createManifestScript(manifest, customVar);
    t.true(
        customScript.textContent.includes(`window.${customVar} =`),
        'Should use custom variable name'
    );

    // 3. Test </script> escaping (The regex logic)
    // The string should be escaped to <\/script>
    t.false(
        customScript.textContent.includes('</script>'),
        'Should not contain raw closing script tags'
    );
    t.true(
        customScript.textContent.includes('<\\/script>'),
        'Should escape closing script tags for safety'
    );

    // 4. Verification of the JSON data integrity
    const jsonString = customScript.textContent.split('= ')[1].replace(/;$/, '');
    // We parse the escaped string (JS engine does this automatically in browser)
    const parsed = JSON.parse(jsonString.replace(/<\\\/script>/g, '</script>'));
    t.deepEqual(parsed, manifest, 'The data inside the script should match the original manifest');
});
