// @ts-nocheck
import test from 'ava';
import { JSDOM } from 'jsdom';
import { scanRootsForRefs } from '../../../src/component/internals/ref-utils.js';

test.beforeEach(t => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    t.context.window = dom.window;
    t.context.document = dom.window.document;
});

test('scanRootsForRefs: should merge child refs and root-level refs', t => {
    const { document, window } = t.context;

    // Мокаем selectRefsExtended (имитируем поиск внутри)
    const mockSelectRefsExtended = () => ({
        refs: { childRef: document.createElement('span') },
        scopeRefs: {},
    });

    const root = document.createElement('div');
    root.setAttribute('data-ref', 'myRoot');
    root.setAttribute('data-slot', 'mainSlot');

    const result = scanRootsForRefs([root], mockSelectRefsExtended, {
        scopeAttribute: ['data-slot'],
        refAttribute: 'data-ref',
        window,
    });

    t.is(result.refs.childRef.tagName, 'SPAN');
    t.is(result.refs.myRoot, root, 'Should capture ref from the root element itself');
    t.is(result.scopeRefs.mainSlot, root, 'Should capture slot from the root element');
});
