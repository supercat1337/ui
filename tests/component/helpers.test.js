// @ts-check
import test from 'ava';
import { resolveLayout, onConnectDefault, onDisconnectDefault } from '../../src/component/helpers.js';
import { Component } from '../../src/component/component.js';

/**
 * Test for Layout Resolution: Types and Errors.
 * Targets lines 23-35 (Invalid return types and unsupported types).
 */
test('Helpers: resolveLayout handles various input types and errors', t => {
    // 1. Function returning a Node (Line 21)
    const node = document.createElement('section');
    t.is(resolveLayout(() => node), node);

    // 2. Function returning invalid type (Line 26)
    // @ts-ignore
    t.throws(() => resolveLayout(() => 123), { message: /Invalid layout function return type/ });

    // 3. Raw Node input (Line 31)
    const span = document.createElement('span');
    t.is(resolveLayout(span), span);

    // 4. Unsupported type (Line 34-35)
    // @ts-ignore
    t.throws(() => resolveLayout(true), { message: /Unsupported layout type/ });
});

/**
 * Test for Layout Normalization: Fragments.
 * Targets lines 42-59 (DocumentFragment handling and html-fragment wrapper).
 */
test('Helpers: resolveLayout normalizes fragments and text', t => {
    // 1. Single Element inside Fragment (Lines 52-53)
    const frag1 = document.createDocumentFragment();
    const div = document.createElement('div');
    frag1.appendChild(div);
    const result1 = resolveLayout(frag1);
    t.is(result1, div, 'Should unwrap single element from fragment');

    // 2. Multiple Elements inside Fragment (Lines 55-57)
    const frag2 = document.createDocumentFragment();
    frag2.appendChild(document.createElement('p'));
    frag2.appendChild(document.createElement('b'));
    const result2 = resolveLayout(frag2);
    t.is(result2.tagName.toLowerCase(), 'html-fragment', 'Should wrap multiple elements in html-fragment');
    t.is(result2.childNodes.length, 2);

    // 3. Text Node Fragment (Lines 60-61)
    const textNode = document.createTextNode('Hello');
    const result3 = resolveLayout(textNode);
    t.is(result3.tagName.toLowerCase(), 'html-fragment');
    t.is(result3.textContent, 'Hello');
});

/**
 * Test for Lifecycle Default Handlers.
 * Targets lines 74-75 and 88-89 (Error catching in callbacks).
 */
test('Helpers: lifecycle defaults catch errors', t => {
    const comp = new Component();
    const ctx = {};
    
    // Mock console.error to verify the catch block
    const originalError = console.error;
    let errorIntercepted = false;
    console.error = () => { errorIntercepted = true; };

    // 1. Test onConnectDefault error (Line 75)
    comp.connectedCallback = () => { throw new Error('Fail'); };
    onConnectDefault(ctx, comp);
    t.true(errorIntercepted, 'Should catch and log error in connectedCallback');

    // 2. Test onDisconnectDefault error (Line 89)
    errorIntercepted = false;
    comp.disconnectedCallback = () => { throw new Error('Fail'); };
    onDisconnectDefault(ctx, comp);
    t.true(errorIntercepted, 'Should catch and log error in disconnectedCallback');

    console.error = originalError;
});

/**
 * Test for resolveLayout specifically targeting string return types 
 * and text node normalization in fragments.
 * Targets branches for returnValue === 'string' and Node.TEXT_NODE filtering.
 */
test('Helpers: resolveLayout handles string returns and text node fragments', t => {
    const ctx = { name: 'World' };

    // 1. Targets: else if (typeof returnValue === 'string')
    // A function returning a raw string should be parsed via html()
    const stringLayoutFn = (c) => `<div>Hello ${c.name}</div>`;
    const result1 = resolveLayout(stringLayoutFn, ctx);
    
    t.is(result1.tagName, 'DIV', 'Should convert returned string to a DIV element');
    t.is(result1.textContent, 'Hello World', 'Should interpolate context correctly');

    // 2. Targets: (node.nodeType === Config.window.Node.TEXT_NODE && node.textContent.trim() !== '')
    // We create a fragment with a single element and significant text to trigger the 'html-fragment' wrapper
    const mixedFragmentFn = () => {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('  Some Text  ')); // Significant text
        const span = document.createElement('span');
        span.textContent = 'Content';
        frag.appendChild(span);
        return frag;
    };

    const result2 = resolveLayout(mixedFragmentFn, ctx);

    // Because there is significant text + an element, it should NOT simplify to the span.
    // It should wrap everything in <html-fragment>
    t.is(result2.tagName, 'HTML-FRAGMENT', 'Should wrap mixed content (text + element) in html-fragment');
    t.is(result2.childNodes.length, 2, 'Should preserve both the text node and the span');
    t.is(result2.firstChild.textContent.trim(), 'Some Text', 'Should preserve significant text nodes');

    // 3. Comparison: Empty/Whitespace-only text nodes should be filtered
    const whitespaceFragmentFn = () => {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode('   ')); // Should be filtered out
        const div = document.createElement('div');
        frag.appendChild(div);
        return frag;
    };

    const result3 = resolveLayout(whitespaceFragmentFn, ctx);
    // Because the text was only whitespace, the filter leaves only 1 element,
    // so it simplifies the result to just that DIV (no wrapper).
    t.is(result3.tagName, 'DIV', 'Should simplify to DIV if other nodes are only whitespace');
});