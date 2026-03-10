import fs from 'node:fs';
import path from 'node:path';

const JS_BUNDLE = './dist/ui.esm.js';
const DTS_BUNDLE = './ui.esm.d.ts';

if (fs.existsSync(JS_BUNDLE)) {
    let content = fs.readFileSync(JS_BUNDLE, 'utf8');
    content = content.replace(/\/\/ @ts-check\n?/g, '');
    content = content.replace(/\/\/\/ <reference.*\/>\n?/g, '');

    content = content.replace(/import\(['"].*types\.d\.ts['"]\)\./g, '');

    if (!content.startsWith('/// <reference')) {
        content = `// @ts-nocheck\n/// <reference types="${DTS_BUNDLE}" />\n` + content;
    }

    fs.writeFileSync(JS_BUNDLE, content);
    console.log('✅ Bundle fixed: references updated, broken JSDoc imports removed.');
}
