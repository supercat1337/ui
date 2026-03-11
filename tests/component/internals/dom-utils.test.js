// @ts-nocheck
import test from 'ava';
import { JSDOM } from 'jsdom';
import { insertToDOM } from '../../../src/component/internals/dom-utils.js';

test.beforeEach(t => {
    const dom = new JSDOM('<!DOCTYPE html><div id="target"></div>');
    t.context.dom = dom;
    t.context.window = dom.window;
    t.context.document = dom.window.document;
});

test('insertToDOM: should handle "replace" strategy correctly', t => {
    const { document, window } = t.context;
    const target = document.getElementById('target');
    target.innerHTML = '<span>Old Content</span>';

    const fragment = document.createElement('div');
    fragment.id = 'new-content';

    const result = insertToDOM(fragment, target, 'replace', window);

    t.is(target.children.length, 1);
    t.is(target.firstElementChild.id, 'new-content');
    t.is(result, fragment);
});

test('insertToDOM: should handle "prepend" strategy correctly', t => {
    const { document, window } = t.context;
    const target = document.getElementById('target');
    target.innerHTML = '<div id="existing">Existing</div>';

    const fragment = document.createElement('div');
    fragment.id = 'new-element';

    const result = insertToDOM(fragment, target, 'prepend', window);

    t.is(target.children.length, 2);
    t.is(target.firstElementChild.id, 'new-element', 'New element should be the first child');
    t.is(target.lastElementChild.id, 'existing', 'Old element should be pushed down');
    t.is(result, fragment);
});

test('insertToDOM: should handle "append" strategy (default)', t => {
    const { document, window } = t.context;
    const target = document.getElementById('target');
    target.innerHTML = '<div id="existing">Existing</div>';

    const fragment = document.createElement('div');
    fragment.id = 'new-element';

    const result = insertToDOM(fragment, target, 'append', window);

    t.is(target.children.length, 2);
    t.is(target.lastElementChild.id, 'new-element', 'New element should be the last child');
    t.is(result, fragment);
});

test('insertToDOM: should work with DocumentFragment', t => {
    
    const { document, window } = t.context;
    const target = document.getElementById('target');
    const fragment = document.createDocumentFragment();
    
    const child = document.createElement('span');
    child.id = 'fragment-child';
    fragment.appendChild(child);

    const result = insertToDOM(fragment, target, 'append', window);

    t.is(target.querySelector('#fragment-child'), child);
    t.is(result, child, 'Should return the first element child of the fragment');
});