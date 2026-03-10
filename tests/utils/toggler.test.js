// @ts-check
import test from 'ava';
import { Toggler } from '../../src/utils/toggler.js';

test('Toggler: addItem should add items and throw error on duplicates', t => {
    const toggler = new Toggler();
    const on = () => {};
    const off = () => {};

    toggler.addItem('item1', on, off);
    t.true(toggler.items.has('item1'), 'Item should be present in the Map');

    const error = t.throws(
        () => {
            toggler.addItem('item1', on, off);
        },
        { instanceOf: Error }
    );

    t.is(error.message, 'Item already exists');
});

test('Toggler: removeItem should remove items and clear internal active state', t => {
    const toggler = new Toggler();
    const noop = () => {};

    toggler.addItem('A', noop, noop);
    toggler.setActive('A');

    // Removing the currently active item
    toggler.removeItem('A');
    t.false(toggler.items.has('A'), 'Item should be removed from items Map');

    // Re-adding the item to verify the private #active was cleared
    // If #active wasn't cleared, setActive('A') would return early in the next step
    let callCount = 0;
    toggler.addItem('A', () => callCount++, noop);
    toggler.setActive('A');

    t.is(callCount, 1, 'Callback should fire because #active was reset during removal');
});

test('Toggler: setActive should manage item states and trigger callbacks', t => {
    const toggler = new Toggler();
    let events = [];

    const on = name => events.push(`on:${name}`);
    const off = name => events.push(`off:${name}`);

    toggler.addItem('A', on, off);
    toggler.addItem('B', on, off);

    // 1. Set A as active
    toggler.setActive('A');
    t.true(toggler.items.get('A').isActive);
    t.deepEqual(events, ['on:A']);
    events = [];

    // 2. Set A again (should return early with no changes)
    toggler.setActive('A');
    t.is(events.length, 0, 'Should not trigger callbacks if item is already active');

    // 3. Switch from A to B
    toggler.setActive('B');
    t.false(toggler.items.get('A').isActive, 'A should be inactive');
    t.true(toggler.items.get('B').isActive, 'B should be active');

    // Verify sequence: A is turned off, B is turned on
    t.true(events.includes('off:A'));
    t.true(events.includes('on:B'));

    // 4. Error handling for non-existent items
    t.throws(() => toggler.setActive('C'), { message: 'Item not found' });
});

test('Toggler: runCallbacks should execute callbacks for all items based on current state', t => {
    const toggler = new Toggler();
    let log = [];

    toggler.addItem(
        'A',
        n => log.push(`on:${n}`),
        n => log.push(`off:${n}`)
    );
    toggler.addItem(
        'B',
        n => log.push(`on:${n}`),
        n => log.push(`off:${n}`)
    );

    toggler.setActive('A'); // State: A=true, B=false. Log: ['on:A']
    log = [];

    toggler.runCallbacks();

    // Should call 'on' for A and 'off' for B
    t.is(log.length, 2);
    t.true(log.includes('on:A'));
    t.true(log.includes('off:B'));
});

test('Toggler: init should set active state and run initial callbacks', t => {
    const toggler = new Toggler();
    let log = [];

    toggler.addItem(
        'A',
        n => log.push(`on:${n}`),
        n => log.push(`off:${n}`)
    );
    toggler.addItem(
        'B',
        n => log.push(`on:${n}`),
        n => log.push(`off:${n}`)
    );

    // init calls setActive() AND runCallbacks()
    toggler.init('A');

    // Expected sequence:
    // 1. setActive('A') -> calls on:A
    // 2. runCallbacks() -> calls on:A and off:B
    const onACount = log.filter(x => x === 'on:A').length;
    t.is(onACount, 2, 'on:A should have been called twice during init sequence');
    t.true(log.includes('off:B'), 'off:B should have been called by runCallbacks');
});
