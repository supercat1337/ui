// @ts-nocheck
import test from 'ava';
import { JSDOM } from 'jsdom';
import { createComponentStyleSheet, injectSheet } from '../../../src/component/internals/style-utils.js';

const UI_MARKER = Symbol.for('ui-test-marker');

test.beforeEach(t => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const doc = dom.window.document;

    // @ts-ignore
    doc.adoptedStyleSheets = [];

    class MockStyleSheet {
        constructor() { this.rules = ''; }
        replaceSync(css) { this.rules = css; }
    }

    t.context.mockWindow = { CSSStyleSheet: MockStyleSheet };
    t.context.document = doc;
});

test('createComponentStyleSheet: should create and mark the sheet', t => {
    const { mockWindow } = t.context;
    const css = '.test { color: blue; }';
    
    const sheet = createComponentStyleSheet(css, UI_MARKER, mockWindow);
    
    t.not(sheet, null);
    t.is(sheet[UI_MARKER], true);
    t.is(sheet.rules, css);
});

test('injectSheet: should add sheet to adoptedStyleSheets', t => {
    const { document } = t.context;
    const mockSheet = { [UI_MARKER]: true };

    injectSheet(document, mockSheet);
    
    t.is(document.adoptedStyleSheets.length, 1);
    t.is(document.adoptedStyleSheets[0], mockSheet);
});

test('injectSheet: should not add the same sheet instance twice', t => {
    const { document } = t.context;
    const mockSheet = { [UI_MARKER]: true };

    injectSheet(document, mockSheet);
    injectSheet(document, mockSheet);
    
    t.is(document.adoptedStyleSheets.length, 1);
});

test('createComponentStyleSheet: should reuse existing CSSStyleSheet instance', t => {
    const { mockWindow } = t.context;
    
    const existingSheet = new mockWindow.CSSStyleSheet();
    existingSheet.replaceSync('.existing { color: green; }');

    const sheet = createComponentStyleSheet(existingSheet, UI_MARKER, mockWindow);

    t.is(sheet, existingSheet, 'Should return the exact same instance');
    t.is(sheet[UI_MARKER], true, 'Should still apply the marker to the existing sheet');
});

test('injectSheet: should create adoptedStyleSheets array if it does not exist (fallback)', t => {
    const { document } = t.context;
    
    delete document.adoptedStyleSheets;
    t.is(document.adoptedStyleSheets, undefined);

    const mockSheet = { [UI_MARKER]: true };

    // @ts-ignore
    injectSheet(document, mockSheet);

    t.true(Array.isArray(document.adoptedStyleSheets), 'Should initialize adoptedStyleSheets as an array');
    t.is(document.adoptedStyleSheets.length, 1);
    t.is(document.adoptedStyleSheets[0], mockSheet);
});