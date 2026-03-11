// @ts-nocheck
import test from 'ava';
import { JSDOM } from 'jsdom';
import { prepareRenderResult, getCloneFromCache } from '../../../src/component/internals/render-utils.js';

test.beforeEach(t => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    t.context.document = dom.window.document;
});

test('prepareRenderResult: should set instanceId always', t => {
    const { document } = t.context;
    const el = document.createElement('div');
    
    prepareRenderResult(el, { instanceId: 'inst-1', sid: '0.1', isSSR: false });
    
    t.is(el.getAttribute('data-component-root'), 'inst-1');
    t.false(el.hasAttribute('data-sid'), 'Should NOT set SID if isSSR is false');
});

test('prepareRenderResult: should set SID only in SSR mode', t => {
    const { document } = t.context;
    const el = document.createElement('div');
    
    prepareRenderResult(el, { instanceId: 'inst-1', sid: '0.1', isSSR: true });
    
    t.is(el.getAttribute('data-component-root'), 'inst-1');
    t.is(el.getAttribute('data-sid'), '0.1', 'Should set SID in SSR mode');
});

test('getCloneFromCache: should return a clone if conditions are met', t => {
    const { document } = t.context;
    const original = document.createElement('div');
    original.id = 'cached';
    
    const clone = getCloneFromCache(original, true);
    
    t.not(clone, original, 'Clone should be a different object reference');
    t.is(clone.id, 'cached');
});

test('getCloneFromCache: should return null if shouldClone is false', t => {
    const { document } = t.context;
    const original = document.createElement('div');
    
    const result = getCloneFromCache(original, false);
    
    t.is(result, null);
});