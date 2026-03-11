// @ts-nocheck
import test from 'ava';
import { JSDOM } from 'jsdom';
import { validateMountArgs, findHydrationRoot } from '../../../src/component/internals/mounting-utils.js';

test.beforeEach(t => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>');
    t.context.window = dom.window;
    t.context.document = dom.window.document;
});

test('validateMountArgs: should throw TypeError if container is not an Element', t => {
    const { window } = t.context;
    
    // @ts-ignore
    const error = t.throws(() => validateMountArgs({}, 'replace', window), { instanceOf: TypeError });
    t.is(error.message, 'Mount target must be a valid DOM Element.');
});

test('validateMountArgs: should throw Error for invalid mode', t => {
    const { document, window } = t.context;
    const container = document.createElement('div');
    
    // @ts-ignore
    const error = t.throws(() => validateMountArgs(container, 'invalid-mode', window), { instanceOf: Error });
    t.true(error.message.includes('Invalid mount mode "invalid-mode"'));
});

test('validateMountArgs: should pass for valid modes', t => {
    const { document, window } = t.context;
    const container = document.createElement('div');
    
    t.notThrows(() => validateMountArgs(container, 'replace', window));
    t.notThrows(() => validateMountArgs(container, 'hydrate', window));
});

test('findHydrationRoot: should return container if it has the matching SID', t => {
    const { document } = t.context;
    const container = document.createElement('div');
    container.setAttribute('data-sid', '0.1.2');

    const result = findHydrationRoot(container, '0.1.2');
    t.is(result, container);
});

test('findHydrationRoot: should find child element with matching SID', t => {
    const { document } = t.context;
    const container = document.createElement('div');
    const child = document.createElement('section');
    child.setAttribute('data-sid', '0.1.2');
    container.appendChild(child);

    const result = findHydrationRoot(container, '0.1.2');
    t.is(result, child);
});

test('findHydrationRoot: should return null if SID is not found', t => {
    const { document } = t.context;
    const container = document.createElement('div');
    
    const result = findHydrationRoot(container, '9.9.9');
    t.is(result, null);
});