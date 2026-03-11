// @ts-nocheck
import test from 'ava';
import { findComponentBySid, collectComponentAncestors } from '../../../src/component/internals/tree-utils.js';

test('findComponentBySid: should find nested component by SID', t => {
    const mockChild = {
        $internals: { sid: '0.slotA.0' },
        slotManager: { getSlots: () => new Map() }
    };

    const mockRoot = {
        $internals: { sid: '0' },
        slotManager: {
            getSlots: () => new Map([
                ['slotA', { getComponents: () => [mockChild] }]
            ])
        }
    };

    // @ts-ignore
    t.is(findComponentBySid(mockRoot, '0.slotA.0'), mockChild);
    // @ts-ignore
    t.is(findComponentBySid(mockRoot, '0'), mockRoot);
    // @ts-ignore
    t.is(findComponentBySid(mockRoot, '9.9.9'), null, 'Should return null for non-existent SID');
});

test('findComponentBySid: should skip irrelevant branches', t => {
    const mockRoot = {
        $internals: { sid: '1' },

        get slotManager() {
            t.fail('Should not scan slots if SID prefix does not match');
            return null;
        }
    };

    // @ts-ignore
    const result = findComponentBySid(mockRoot, '2.0');
    t.is(result, null);
});

test('findComponentBySid: should return null after deep scan fails', t => {
    // Tree: Root -> SlotA -> [Child1, Child2]
    const mockChild1 = {
        $internals: { sid: '0.slotA.0' },
        slotManager: { getSlots: () => new Map() }
    };
    
    const mockChild2 = {
        $internals: { sid: '0.slotA.1' },
        slotManager: { getSlots: () => new Map() }
    };

    const mockRoot = {
        $internals: { sid: '0' },
        slotManager: {
            getSlots: () => new Map([
                ['slotA', { getComponents: () => [mockChild1, mockChild2] }]
            ])
        }
    };
    // @ts-ignore
    t.is(findComponentBySid(mockRoot, '0.slotA.5'), null, 'Should return null if index is out of bounds');
    // @ts-ignore
    t.is(findComponentBySid(mockRoot, '0.wrongSlot.0'), null, 'Should return null if slot name is wrong');
});

test('collectComponentAncestors: should collect full chain from child to root', t => {
    const mockRoot = { name: 'root', $internals: { parentComponent: null } };
    const mockParent = { name: 'parent', $internals: { parentComponent: mockRoot } };
    const mockChild = { name: 'child', $internals: { parentComponent: mockParent } };

    // @ts-ignore
    const result = collectComponentAncestors(mockChild);

    t.is(result.length, 3);
    t.is(result[0].name, 'child');
    t.is(result[1].name, 'parent');
    t.is(result[2].name, 'root');
});

test('collectComponentAncestors: should return only self if no parent exists', t => {
    const mockStandalone = { $internals: { parentComponent: null } };
    // @ts-ignore
    const result = collectComponentAncestors(mockStandalone);

    t.is(result.length, 1);
    t.is(result[0], mockStandalone);
});