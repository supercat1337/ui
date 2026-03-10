// @ts-check
import test from 'ava';
import { SlotManager } from '../../src/component/slot-manager.js';
import { Component } from '../../src/component/component.js';
import { Slot } from '../../src/component/slot.js';
import { html } from '../../src/utils/utils.js';

/**
 * Factory to create a minimal Component mock
 * @param {Object} overrides
 */
const createMockComponent = (overrides = {}) => ({
    constructor: { name: 'MockComponent' },
    isConnected: false,
    $internals: {
        scopeRefs: {},
        ...overrides.$internals,
    },
    ...overrides,
});

test('SlotManager: registerSlot should create and return a Slot', t => {
    const mockComp = /** @type {any} */ (createMockComponent());
    const manager = new SlotManager(mockComp);

    // Register a new slot
    const slot = manager.registerSlot('header');

    t.is(slot.name, 'header', 'Slot name matches input');
    t.true(manager.hasSlot('header'), 'Slot is correctly registered in the internal Map');

    // Attempting to register the same slot again
    const existingSlot = manager.registerSlot('header');
    t.is(
        slot,
        existingSlot,
        'Should return the existing Slot instance instead of creating a new one'
    );
});

test('SlotManager: getSlotElement behavior', t => {
    const mockComp = /** @type {any} */ (createMockComponent());
    const manager = new SlotManager(mockComp);
    const div = document.createElement('div');

    // Mocking the internal scope reference
    mockComp.$internals.scopeRefs['content'] = div;

    // Case 1: Component is not connected to DOM
    t.is(
        manager.getSlotElement('content'),
        null,
        'Returns null if the parent component is not connected'
    );

    // Case 2: Component is connected
    mockComp.isConnected = true;
    t.is(
        manager.getSlotElement('content'),
        div,
        'Returns the DOM element when the component is connected'
    );

    // Case 3: Non-existent slot ref
    t.is(manager.getSlotElement('unknown'), null, 'Returns null for unknown slot names');
});

test('SlotManager: findChildBySid traverses all slots', t => {
    const mockComp = /** @type {any} */ (createMockComponent());
    const manager = new SlotManager(mockComp);

    // Mocking a Slot-like structure since we haven't seen the actual Slot class yet
    const mockSlot = {
        getComponents: () => [
            { $internals: { sid: 'child-1' } },
            { $internals: { sid: 'child-2' } },
        ],
    };

    // Manually injecting a mock slot into the private Map for this specific test
    manager.slots.set('main', /** @type {any} */ (mockSlot));

    const found = manager.findChildBySid('child-2');
    const notFound = manager.findChildBySid('child-99');

    t.is(found?.$internals.sid, 'child-2', 'Finds the correct child by SID');
    t.is(notFound, null, 'Returns null if SID does not exist in any slot');
});

/**
 * Test for basic slot registration.
 * Ensures the manager correctly creates and tracks Slot instances.
 */
test('SlotManager: registerSlot creates and caches slots', t => {
    const parent = new Component();
    const manager = new SlotManager(parent);

    const slot = manager.registerSlot('header');

    t.true(slot instanceof Slot, 'Should return a Slot instance');
    t.is(manager.getSlot('header'), slot, 'Should retrieve the same slot by name');
    t.is(manager.getSlots().size, 1, 'Should have exactly one slot registered');
});

/**
 * Test for duplicate registration.
 * Verifies that registering the same slot name doesn't overwrite existing children.
 */
test('SlotManager: registerSlot handles duplicate names gracefully', t => {
    const parent = new Component();
    const manager = new SlotManager(parent);

    const first = manager.registerSlot('main');
    const second = manager.registerSlot('main');

    t.is(first, second, 'Should return the existing slot instead of creating a new one');
});

/**
 * Test for DOM element retrieval.
 * Covers the logic that finds the [data-slot] element inside the component's root.
 */
test('SlotManager: getSlotElement finds the correct DOM node', t => {
    const parent = new Component();
    parent.setLayout(
        () => html`
            <div>
                <header data-slot="header"></header>
                <main data-slot="main"></main>
            </div>
        `
    );

    // Mount to a container so getRootNode() works
    const container = document.createElement('div');
    parent.mount(container);

    const manager = parent.slotManager;
    const headerEl = manager.getSlotElement('header');

    t.truthy(headerEl, 'Should find the header slot element');
    t.is(headerEl.tagName.toLowerCase(), 'header');
    t.is(manager.getSlotElement('non-existent'), null, 'Should return null for unknown slots');
});

/**
 * Test for deep child lookup by SID.
 * This test uses the public Component API to ensure that SIDs are
 * properly propagated through the SlotManager before searching.
 */
test('SlotManager: findChildBySid performs deep search after component integration', t => {
    // 1. Setup hierarchy with explicit SIDs where necessary
    const parent = new Component({ sid: 'root' });
    const childA = new Component();
    const childB = new Component();

    // 2. Define layouts so slots can be physically identified if needed
    parent.setLayout(
        () => html`
            <div>
                <div data-slot="left"></div>
                <div data-slot="right"></div>
            </div>
        `
    );

    // 3. Use the public API to add components.
    // This triggers the internal #recursiveUpdateSid chain.
    parent.addComponentToSlot('left', childA);
    parent.addComponentToSlot('right', childB);

    // 4. Verify SIDs were actually generated
    // Path: [parent.sid].[slotName].[index]
    const expectedSidA = 'root.left.0';
    const expectedSidB = 'root.right.0';

    t.is(childA.$internals.sid, expectedSidA, 'Child A should have the correct generated SID');
    t.is(childB.$internals.sid, expectedSidB, 'Child B should have the correct generated SID');

    // 5. Test SlotManager search logic (findChildBySid)
    const manager = parent.slotManager;

    t.is(
        manager.findChildBySid(expectedSidA),
        childA,
        'SlotManager should find childA by its new SID'
    );
    t.is(
        manager.findChildBySid(expectedSidB),
        childB,
        'SlotManager should find childB by its new SID'
    );
    t.is(manager.findChildBySid('root.left.99'), null, 'Should return null for non-existent index');
});

/**
 * Test for Slot collection management.
 * Ensures that iterating over getSlots() provides the correct entries.
 */
test('SlotManager: manages multiple slots correctly', t => {
    const parent = new Component();
    const manager = parent.slotManager;

    manager.registerSlot('s1');
    manager.registerSlot('s2');
    manager.registerSlot('s3');

    const names = Array.from(manager.getSlots().keys());
    t.deepEqual(names, ['s1', 's2', 's3'], 'Should track all registered names');
});

/**
 * Test for slot iteration and component management.
 * Targets uncovered lines in SlotManager loops and removal logic.
 */
test('SlotManager: iterates and manages components correctly', t => {
    const parent = new Component();
    const manager = parent.slotManager;
    const slot = manager.registerSlot('content');

    // 1. Coverage for empty iteration (ensure loops handle 0 children)
    let count = 0;
    for (const _ of slot.getComponents()) {
        count++;
    }
    t.is(count, 0, 'Should handle iteration over empty slot');

    // 2. Coverage for component removal via manager
    const child = new Component();
    parent.addComponentToSlot('content', child);

    // Target removal logic (uncovered lines in Slot/SlotManager)
    slot.detach(child);
    t.is(slot.getComponents().length, 0, 'Component should be removed from slot');
    t.is(child.$internals.parentComponent, null, 'Child parent reference should be cleared');
});

/**
 * Test for finding children when some slots are empty.
 * Targets findChildBySid branches where it must skip empty slots.
 */
test('SlotManager: findChildBySid skips empty slots', t => {
    const parent = new Component({ sid: 'root' });
    const manager = parent.slotManager;

    manager.registerSlot('empty_slot');
    manager.registerSlot('active_slot');

    const child = new Component();
    parent.addComponentToSlot('active_slot', child);

    t.is(manager.findChildBySid('root.active_slot.0'), child);
    t.is(manager.findChildBySid('non.existent'), null, 'Should finish loop and return null');
});

/**
 * Test for SlotManager guard clauses and warnings.
 * Targets branches where slots are missing or have no content.
 */
test('SlotManager: handles missing slots and empty content', t => {
    const parent = new Component();
    const manager = parent.slotManager;

    // Targets lines 101-107 (hasSlotContent fallback)
    t.false(
        manager.hasSlotContent('non-existent'),
        'Should return false for content in unknown slot'
    );

    // Targets lines 114-116 (clearSlotContent fallback)
    t.false(
        manager.clearSlotContent('non-existent'),
        'Should return false when clearing unknown slot'
    );

    // Targets lines 137-148 (mountSlot console.warn branch)
    // We mock console.warn to verify the error branch is hit
    const originalWarn = console.warn;
    let warnCalled = false;
    console.warn = () => {
        warnCalled = true;
    };

    manager.mountSlot('ghost-slot');

    t.true(warnCalled, 'Should warn when trying to mount a non-existent slot');
    console.warn = originalWarn;
});

/**
 * Test for slot and content removal.
 * Targets unmounting and deletion logic.
 */
test('SlotManager: removes and unmounts slots correctly', t => {
    const parent = new Component();
    const manager = parent.slotManager;
    const child = new Component();
    child.setLayout('<div></div>');

    manager.attachToSlot('sidebar', child);

    // Targets lines 165-169 (unmountSlot)
    manager.unmountSlot('sidebar');
    t.false(child.isConnected, 'Child should be unmounted via unmountSlot');

    // Targets lines 75-80 (removeSlot)
    manager.removeSlot('sidebar');
    t.false(manager.hasSlot('sidebar'), 'Slot should be deleted from Map');

    // Targets return null branch in unmountSlot
    t.is(manager.unmountSlot('non-existent'), undefined, 'Should handle unmounting unknown slot');
});

/**
 * Test for finding slots by component and SID.
 * Targets the logic that identifies which slot a component belongs to.
 */
test('SlotManager: child and slot lookup branches', t => {
    const parent = new Component();
    const manager = parent.slotManager;
    const child = new Component();

    // 1. Targets lines 203-210 (parentComponent mismatch)
    const stranger = new Component();
    t.is(
        manager.findSlotByComponent(stranger),
        null,
        'Should return null for component with different parent'
    );

    // 2. Targets findSlotByComponent success
    manager.attachToSlot('main', child);
    const foundSlot = manager.findSlotByComponent(child);
    t.is(foundSlot.name, 'main', 'Should find the correct slot by component reference');

    // 3. Targets findChildBySid (lines 215-220)
    child.$internals.sid = 'test-sid';
    t.is(manager.findChildBySid('test-sid'), child, 'Should find child by SID');
    t.is(manager.findChildBySid('wrong-sid'), null, 'Should return null if SID not in any slot');
});

/**
 * Test for bulk operations and metadata.
 */
test('SlotManager: utility methods coverage', t => {
    const parent = new Component();
    const manager = parent.slotManager;

    // Targets getSlotLength (lines 225-230)
    t.is(manager.getSlotLength('empty'), 0, 'Length of unknown slot should be 0');

    manager.registerSlot('active');
    manager.attachToSlot('active', new Component(), new Component());
    t.is(manager.getSlotLength('active'), 2, 'Should return correct number of components');

    // Targets mountAllSlots (ensure it respects parent connection)
    t.is(manager.mountAllSlots(), undefined, 'Should exit early if parent not connected');
});

/**
 * Test for SlotManager edge cases.
 * Targets parent mismatch and missing slot clear logic.
 */
test('SlotManager: deep branch coverage', t => {
    const parent = new Component();
    const manager = parent.slotManager;

    // 1. Targets line 90: hasSlotContent for a slot that exists but is empty
    manager.registerSlot('empty-but-exists');
    t.false(
        manager.hasSlotContent('empty-but-exists'),
        'Should return false for empty existing slot'
    );

    // 2. Targets lines 114-116: clearSlotContent for a non-existent slot
    t.false(
        manager.clearSlotContent('non-existent'),
        'Should return false when clearing unknown slot'
    );

    // 3. Targets lines 203-210: findSlotByComponent where parent is different
    const stranger = new Component();
    const unrelatedParent = new Component();
    stranger.$internals.parentComponent = unrelatedParent; // Simulate different parent

    t.is(
        manager.findSlotByComponent(stranger),
        null,
        'Should return null for component with different parent'
    );
});

test('SlotManager: cleanup edge cases', t => {
    const parent = new Component();
    const manager = parent.slotManager;

    // Targets 114-116: clearSlotContent on a name that hasn't been registered
    const clearResult = manager.clearSlotContent('imaginary-slot');
    t.false(clearResult, 'Clearing an unknown slot should return false');

    // Targets 146-147: Handling removal of a component from a slot it's not in
    const randomComp = new Component();
    const removed = manager.removeComponent(randomComp);
    t.false(removed, 'Removing a component that is not in the slot should return false');
});

/**
 * Test for SlotManager lifecycle and component removal.
 * Targets lines 114-116 (missing slot warning), 146-147, and 205-209 (lookup logic).
 */
test('SlotManager: handles slot mounting and component removal', t => {
    const parent = new Component();
    const child = new Component();
    const manager = parent.slotManager;

    // 1. Targets lines 114-116: mountSlot for a non-existent slot
    // This should trigger the console.warn branch safely
    manager.mountSlot('missing-slot-id');

    t.pass('mountSlot handled non-existent slot without throwing');

    // 2. Targets lines 146-147 and 205-209: Successful removal
    // Register a slot and add a component to it
    manager.registerSlot('content');

    t.deepEqual(manager.slotNames, ['content']);

    parent.addComponentToSlot('content', child);

    // verify that removeComponent finds the slot via findSlotByComponent (205-209)
    const wasRemoved = manager.removeComponent(child);

    t.true(wasRemoved, 'removeComponent should return true when child is found');
    t.is(child.$internals.parentComponent, null, 'Child should be detached after removal');

    t.notThrows(() => {
        manager.mountSlot('content');
    });
});
