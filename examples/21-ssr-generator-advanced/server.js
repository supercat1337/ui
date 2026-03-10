// @ts-check
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { Config, generateManifest, renderManifestHTML } from '@supercat1337/ui';
import { ProductComponent } from './ProductComponent.js';
import { CartComponent } from './CartComponent.js';

// Setup file paths for the ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize JSDOM to provide a DOM-like environment on the server.
 * This allows components to use standard DOM APIs during the SSR phase.
 */
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="header-root"></div><div id="catalog-root"></div><div id="teleport-root"></div></body></html>');

// Global mocks for the library to function in Node.js
// @ts-ignore
global.window = dom.window;
global.document = dom.window.document;

/**
 * Library Configuration:
 * 1. Mark the environment as SSR to prevent certain client-only logic.
 * 2. Link the simulated window.
 */
Config.isSSR = true;
// @ts-ignore
Config.window = dom.window;

/**
 * Generates the static HTML page with pre-rendered components 
 * and a hydration manifest.
 */
async function generateAdvancedPage() {
    // Mock data for the store
    const products = [
        { id: 'p1', name: 'Laptop', price: 1200, sid: 'sid-p1', badge: 'New' },
        { id: 'p2', name: 'Mouse', price: 40, sid: 'sid-p2', badge: '' },
    ];

    // Instantiate components
    // sid (Server ID) is crucial here for mapping DOM to data on the client side.
    const cart = new CartComponent({ instanceId: 'cart', sid: 'sid-cart' });
    const productInstances = products.map(p => new ProductComponent(p));

    // Get references to root elements in our simulated DOM
    const headerRoot = document.getElementById('header-root');
    const catalogRoot = document.getElementById('catalog-root');
    if (!headerRoot || !catalogRoot) throw new Error('Required roots not found');

    /**
     * Component Mounting Phase:
     * Components are "rendered" into the simulated DOM. 
     * This triggers layout generation and initial logic.
     */
    cart.mount(headerRoot, 'append');
    productInstances.forEach(comp => comp.mount(catalogRoot, 'append'));

    /**
     * Manifest Generation:
     * Extracts state from components (via serialize()) and maps them to their SIDs.
     */
    const manifest = generateManifest(cart, ...productInstances);

    /**
     * HTML Construction:
     * Combines the static layout, rendered component HTML, and the hydration manifest.
     */
    const htmlOutput = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced SSR Demo</title>
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

    // Save the resulting file
    const outputPath = path.join(__dirname, 'index.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, htmlOutput);
    console.log(`✅ SSR Advanced page generated: ${outputPath}`);
}

// Execute the generator
generateAdvancedPage();