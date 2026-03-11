// @ts-check

import test from 'ava';
import { extractComponentStyles, UI_COMPONENT_SHEET } from '../../src/component/style.js';

test('extractComponentStyles: should return css from adoptedStyleSheets', t => {
    const mockSheet = {
        [UI_COMPONENT_SHEET]: true,
        cssRules: [
            { cssText: '.test { color: red; }' },
            { cssText: 'button { border: none; }' }
        ]
    };

    const fakeDoc = {
        adoptedStyleSheets: [mockSheet, { [UI_COMPONENT_SHEET]: false }] 
    };

    // @ts-ignore
    const result = extractComponentStyles(fakeDoc);

    t.is(result, '.test { color: red; }\nbutton { border: none; }');
});

test('extractComponentStyles: should return empty string if not supported', t => {
    // @ts-ignore
    const result = extractComponentStyles({}); // no adoptedStyleSheets
    t.is(result, '');
});