// @ts-check
// @ts-check
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { Config, generateManifest, renderManifestHTML } from '@supercat1337/ui';
import { ProductComponent } from './ProductComponent.js';
import { CartComponent } from './CartComponent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="header-root"></div><div id="catalog-root"></div><div id="teleport-root"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
Config.isSSR = true;
Config.window = dom.window;

async function generateAdvancedPage() {
    const products = [
        { id: 'p1', name: 'Laptop', price: 1200, sid: 'sid-p1', badge: 'New' },
        { id: 'p2', name: 'Mouse', price: 40, sid: 'sid-p2', badge: '' },
    ];

    const cart = new CartComponent({ instanceId: 'cart', sid: 'sid-cart' });
    const productInstances = products.map(p => new ProductComponent(p));

    const headerRoot = document.getElementById('header-root');
    const catalogRoot = document.getElementById('catalog-root');
    if (!headerRoot || !catalogRoot) throw new Error('Required roots not found');

    cart.mount(headerRoot, 'append');
    productInstances.forEach(comp => comp.mount(catalogRoot, 'append'));

    const manifest = generateManifest(cart, ...productInstances);

    const htmlOutput = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css" />
    ${renderManifestHTML(manifest)}
    <script type="importmap">
        {
            "imports": {
                "@supercat1337/ui": "../../dist/ui.bundle.esm.js",
                "@supercat1337/event-emitter": "../../node_modules/@supercat1337/event-emitter/index.js" 
            }
        }
    </script>
</head>
<body>
    <nav class="navbar navbar-dark bg-dark mb-4">
        <div class="container" id="header-root">
            <span class="navbar-brand">✨ Super UI Store</span>
            ${headerRoot.innerHTML}
        </div>
    </nav>
    
    <div class="container" id="catalog-root">
        ${catalogRoot.innerHTML}
    </div>

    <div id="teleport-root"></div>

    <script type="module" src="main.js"></script>
</body>
</html>`;

    const outputPath = path.join(__dirname, 'index.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, htmlOutput);
    console.log(`✅ SSR Advanced: ${outputPath}`);
}

generateAdvancedPage();