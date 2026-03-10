// @ts-nocheck

import test from 'ava';
import { Component } from '../../src/component/component.js';
import { SlotToggler } from '../../src/utils/slot-toggler.js';

test.beforeEach(t => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    t.context.container = container;
});

test.afterEach(t => {
    t.context.container.remove();
});

test('SlotToggler: switches visibility and triggers lifecycle signals', t => {
    const parent = new Component();
    
    // Create a mock component to track unmount calls
    let unmountCalled = false;
    const childComponent = new Component();
    childComponent.unmount = () => { unmountCalled = true; };

    parent.setLayout(`
        <div>
            <div data-slot="home" id="home-el"></div>
            <div data-slot="settings" id="settings-el"></div>
        </div>
    `);

    childComponent.setLayout("<div>Hello</div>");

    // Register the child component in the 'home' slot
    parent.addComponentToSlot('home', childComponent);
    parent.mount(t.context.container);

    const toggler = new SlotToggler(parent, ['home', 'settings'], 'home');
    const homeEl = document.getElementById('home-el');
    const settingsEl = document.getElementById('settings-el');

    // 1. Initialization (home is active)
    toggler.init();
    t.false(homeEl.classList.contains('d-none'), 'Home should be visible');
    t.true(settingsEl.classList.contains('d-none'), 'Settings should be hidden');

    // 2. Toggle to 'settings'
    // This should trigger hideElements(homeEl) and unmountSlot('home')
    toggler.toggle('settings');

    t.true(homeEl.classList.contains('d-none'), 'Home should now be hidden');
    t.false(settingsEl.classList.contains('d-none'), 'Settings should now be visible');
    
    // Verify that the unmount signal reached the child component in the slot
    t.true(unmountCalled, 'Child component in the deactivated slot should have been unmounted');

    parent.unmount();
});

test('SlotToggler: handles init logic for inactive slots without children', t => {
    const parent = new Component();
    parent.setLayout(`
        <div>
            <div data-slot="empty-a" id="a-el"></div>
            <div data-slot="empty-b" id="b-el"></div>
        </div>
    `);
    parent.mount(t.context.container);

    const toggler = new SlotToggler(parent, ['empty-a', 'empty-b'], 'empty-a');
    
    // Verify that init correctly handles empty slots (without components)
    // This covers the branch: if (slotElement) { hideElements... }
    t.notThrows(() => toggler.init());
    
    const bEl = document.getElementById('b-el');
    t.true(bEl.classList.contains('d-none'), 'Inactive empty slot should be hidden via d-none');

    parent.unmount();
});

test('SlotToggler: getters and validation errors', t => {
    const parent = new Component();
    const names = ['home', 'profile'];
    const toggler = new SlotToggler(parent, names, 'home');

    // 1. Test get slotNames()
    t.deepEqual(toggler.slotNames, names, 'slotNames getter should return the initialized names');

    // 2. Test throw if slot name is not in the list
    const error = t.throws(() => {
        toggler.toggle('settings');
    }, { instanceOf: Error });
    
    t.is(error.message, 'Slot "settings" is not defined in this SlotToggler');
});

test('SlotToggler: destruction lifecycle and safety checks', t => {
    const parent = new Component();
    const toggler = new SlotToggler(parent, ['main'], 'main');

    // Verify initial state
    t.is(toggler.component, parent);

    // 3. Test destroy()
    toggler.destroy();

    // Verify state cleanup
    t.is(toggler.component, null, 'Component reference should be nullified');
    t.deepEqual(toggler.slotNames, [], 'slotNames should be empty after destruction');
    t.is(toggler.activeSlotName, '', 'activeSlotName should be reset to empty string');

    // 4. Test throw if toggle is called after destruction
    // This covers (this.#isDestroyed || !this.component)
    const error = t.throws(() => {
        toggler.toggle('main');
    }, { instanceOf: Error });

    t.is(error.message, 'SlotToggler is destroyed');
});

test('SlotToggler: constructor creates a copy of slotNames', t => {
    const parent = new Component();
    const originalNames = ['a', 'b'];
    const toggler = new SlotToggler(parent, originalNames, 'a');

    // Mutate original array
    originalNames.push('c');

    // Toggler should still have the original state (due to .slice())
    t.deepEqual(toggler.slotNames, ['a', 'b'], 'Toggler should maintain its own copy of slot names');
});