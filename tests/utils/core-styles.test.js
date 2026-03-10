// @ts-nocheck

import test from 'ava';
import { injectCoreStyles } from '../../src/utils/core-styles.js';

// Helper to mock a document with Constructable Stylesheets support
const createMockDocument = () => {
    const mockSheet = {
        replaceSync: (css) => { mockSheet._css = css; }
    };

    // Global CSSStyleSheet constructor mock
    global.CSSStyleSheet = class {
        constructor() { return mockSheet; }
    };

    return {
        adoptedStyleSheets: [],
        _mockSheet: mockSheet
    };
};

test('injectCoreStyles: injects CSS into adoptedStyleSheets', t => {
    const doc = createMockDocument();
    
    injectCoreStyles(doc);

    t.is(doc.adoptedStyleSheets.length, 1, 'Should add one stylesheet to the array');
    
    const injectedCSS = doc._mockSheet._css;
    t.true(injectedCSS.includes('.d-none {'), 'Should contain d-none class definition');
    t.true(injectedCSS.includes('display: none !important;'), 'Should include !important for d-none');
    t.true(injectedCSS.includes('html-fragment {'), 'Should contain html-fragment definition');
    t.true(injectedCSS.includes('display: contents;'), 'Should use display: contents for fragments');
});

test('injectCoreStyles: throws error if document is null', t => {
    const error = t.throws(() => {
        injectCoreStyles(null);
    }, { instanceOf: Error });

    t.is(error.message, 'Document is null. Cannot inject core styles.');
});

test('injectCoreStyles: preserves existing stylesheets', t => {
    const doc = createMockDocument();
    const existingSheet = { name: 'existing' };
    doc.adoptedStyleSheets = [existingSheet];

    injectCoreStyles(doc);

    t.is(doc.adoptedStyleSheets.length, 2, 'Should have two stylesheets now');
    t.is(doc.adoptedStyleSheets[0], existingSheet, 'Original stylesheet should remain at index 0');
});

test('injectCoreStyles: uses global document as default', t => {
    const originalDoc = global.document;
    const mockDoc = createMockDocument();
    
    // Temporarily override global window/document
    global.window = { document: mockDoc };
    global.document = mockDoc;

    t.notThrows(() => injectCoreStyles());
    t.is(mockDoc.adoptedStyleSheets.length, 1);

    // Restore
    global.document = originalDoc;
});