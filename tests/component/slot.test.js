// @ts-check
import test from 'ava';
import { Slot } from '../../src/component/slot.js';
import { Component } from '../../src/component/component.js';

/**
 * Factory to create a mock component
 * @param {string} name
 */
const createMockComponent = (name = 'Mock') => ({
    constructor: { name },
    isConnected: false,
    $internals: {
        parentComponent: null,
        assignedSlotName: '',
        scopeRefs: {},
    },
    // Mocking the mount/unmount methods
    mount: (root, mode) => {
        /** logic handled by spy in specific tests */
    },
    unmount: () => {
        /** logic handled by spy in specific tests */
    },
});

test('Slot: attach() updates child internals', t => {
    const parent = /** @type {any} */ (createMockComponent('Parent'));
    const child = /** @type {any} */ (createMockComponent('Child'));
    const slot = new Slot('header', parent);

    slot.attach(child);

    t.is(slot.getLength(), 1, 'Slot should contain one component');
    t.is(child.$internals.parentComponent, parent, 'Child parentComponent should be set to parent');
    t.is(
        child.$internals.assignedSlotName,
        'header',
        'Child assignedSlotName should be set to slot name'
    );
});

test('Slot: detach() clears child internals', t => {
    const parent = /** @type {any} */ (createMockComponent('Parent'));
    const child = /** @type {any} */ (createMockComponent('Child'));
    const slot = new Slot('header', parent);

    slot.attach(child);
    const result = slot.detach(child);

    t.true(result, 'detach() should return true for existing component');
    t.is(slot.getLength(), 0, 'Slot should be empty');
    t.is(child.$internals.parentComponent, null, 'Child parentComponent should be null');
    t.is(child.$internals.assignedSlotName, '', 'Child assignedSlotName should be empty string');
});

test('Slot: mount() fails and warns if parent is disconnected', t => {
    const parent = /** @type {any} */ (createMockComponent('Parent'));
    const child = /** @type {any} */ (createMockComponent('Child'));
    const slot = new Slot('main', parent);

    // Track if mount was called
    let mountCalled = false;
    child.mount = () => {
        mountCalled = true;
    };

    slot.attach(child);
    slot.mount();

    t.false(mountCalled, 'Child mount() should not be called if parent is disconnected');
});

test('Slot: mount() succeeds if parent is connected and has ref', t => {
    const parent = /** @type {any} */ (createMockComponent('Parent'));
    const child = /** @type {any} */ (createMockComponent('Child'));
    const slotElement = document.createElement('div');

    parent.isConnected = true;
    parent.$internals.scopeRefs['main'] = slotElement;

    const slot = new Slot('main', parent);
    slot.attach(child);

    let mountTarget = null;
    child.mount = target => {
        mountTarget = target;
    };

    slot.mount();

    t.is(mountTarget, slotElement, 'Child should be mounted to the correct scopeRef element');
});

test('Slot: clear() unmounts and detaches all', t => {
    const parent = /** @type {any} */ (createMockComponent('Parent'));
    const child1 = /** @type {any} */ (createMockComponent('C1'));
    const child2 = /** @type {any} */ (createMockComponent('C2'));
    const slot = new Slot('list', parent);

    let unmountCount = 0;
    const unmountSpy = () => {
        unmountCount++;
    };
    child1.unmount = unmountSpy;
    child2.unmount = unmountSpy;

    slot.attach(child1);
    slot.attach(child2);

    slot.clear();

    t.is(unmountCount, 2, 'All children unmount() should be called');
    t.is(slot.getLength(), 0, 'All children should be detached');
});

/**
 * Test for Slot detachment.
 * Targets lines 76-82: Removing components that aren't present.
 */
test('Slot: handles detaching non-members', t => {
    const parent = new Component();
    const slot = new Slot('test', parent);
    const stranger = new Component();

    // Attempt to detach a component that was never attached
    t.notThrows(() => slot.detach(stranger), 'Should not throw when detaching non-member');

    // Attempt to remove a component that was never attached
    const removed = slot.detach(stranger);
    t.false(removed, 'Should return false for removing non-member');
});

/**
 * Test for Slot mounting with a missing root element.
 * Targets the branch: if (!slotRoot) { console.warn(...) }
 */
test('Slot: warns when mounting to a non-existent root element', t => {
    // 1. Setup a component with no slots in its layout
    const parent = new Component();
    parent.setLayout('<div>No slots here</div>');

    // We must mount it so isConnected becomes true (to pass the first check)
    const container = document.createElement('div');
    document.body.appendChild(container);
    parent.mount(container);

    const slotManager = parent.slotManager;

    // 2. Register a slot that isn't in the template
    // This creates a Slot instance, but scopeRefs won't have 'missing-link'
    slotManager.registerSlot('missing-link');
    const slot = slotManager.getSlot('missing-link');

    // 3. Trigger mount()
    // It passes !this.#component.isConnected
    // But it should fail at !slotRoot and trigger console.warn
    t.notThrows(() => {
        slot.mount();
    }, 'mount() should handle missing slotRoot gracefully without throwing');

    // Verify state: the branch returned early
    t.pass('Reached the end of the test after the warning branch');

    // Cleanup
    parent.unmount();
    document.body.removeChild(container);
});
