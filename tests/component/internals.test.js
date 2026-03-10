// @ts-check
import test from 'ava';
import { Internals } from '../../src/component/internals.js';
import { Config } from '../../src/component/config.js';

/**
 * Test for Lazy Instance ID Generation.
 * Targets lines 23-29: The getter branch that generates IDs and syncs with the DOM.
 */
test('Internals: lazy instanceId generation and DOM sync', t => {
    const internals = new Internals();
    
    // 1. Verify initial state
    t.is(internals.instanceId.split('-').length, 2, 'Should generate a hyphenated ID');
    const firstId = internals.instanceId;
    t.is(internals.instanceId, firstId, 'Subsequent calls should return the cached ID');

    // 2. Test DOM synchronization (Targets lines 26-28)
    const internalsWithRoot = new Internals();
    const mockElement = document.createElement('div');
    internalsWithRoot.root = mockElement;

    const generatedId = internalsWithRoot.instanceId;
    t.is(mockElement.getAttribute('data-component-root'), generatedId, 'Should sync ID to root element attribute');
});

/**
 * Test for Manual ID Override.
 * Targets the setter branch for instanceId.
 */
test('Internals: instanceId setter bypasses generation', t => {
    const internals = new Internals();
    const customId = 'manual-id-123';
    
    internals.instanceId = customId;
    t.is(internals.instanceId, customId, 'Should return the manually set ID');
});

/**
 * Test for static ID uniqueness.
 * Verifies that generateInstanceId increments and uses a session prefix.
 */
test('Internals: generateInstanceId produces unique incrementing IDs', t => {
    const id1 = Internals.generateInstanceId();
    const id2 = Internals.generateInstanceId();
    
    t.not(id1, id2, 'Each generated ID must be unique');
    
    const count1 = parseInt(id1.split('-')[1]);
    const count2 = parseInt(id2.split('-')[1]);
    t.is(count2, count1 + 1, 'ID counter should increment by 1');
});

/**
 * Test for default property initialization.
 * Ensures the internal state is clean upon instantiation.
 */
test('Internals: initializes with correct default state', t => {
    const internals = new Internals();
    
    t.truthy(internals.eventEmitter, 'Should initialize an EventEmitter');
    t.truthy(internals.disconnectController, 'Should initialize an AbortController');
    t.true(internals.elementsToRemove instanceof Set, 'elementsToRemove should be a Set');
    t.true(internals.teleportRoots instanceof Map, 'teleportRoots should be a Map');
    t.is(internals.mountMode, 'replace', 'Default mount mode should be replace');
});