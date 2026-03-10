import test from 'ava';
import { SlotManager } from '../../src/component/slot-manager.js';
// Assuming we import the actual classes here

test('Integration: Moving a component between slots', t => {
    const parent = /** @type {any} */ ({ $internals: { scopeRefs: {} } });
    const manager = new SlotManager(parent);
    const child = /** @type {any} */ ({ $internals: { parentComponent: null, assignedSlotName: '' } });

    // Step 1: Attach to Header
    manager.attachToSlot('header', child);
    t.is(child.$internals.assignedSlotName, 'header');

    // Step 2: Move to Footer
    manager.attachToSlot('footer', child);
    t.is(child.$internals.assignedSlotName, 'footer');
    t.is(manager.getSlotLength('header'), 0, 'Old slot should be empty');
    t.is(manager.getSlotLength('footer'), 1, 'New slot should have the component');
});