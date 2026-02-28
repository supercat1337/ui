// @ts-check
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. ENVIRONMENT SETUP
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MOCK BROWSER GLOBALS
 * We need these before importing the UI Library or Components
 */
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="ssr-container"></div></body></html>');

// @ts-ignore
global.window = dom.window;
// @ts-ignore
global.document = dom.window.document;
// @ts-ignore
global.window.isServer = true;

// 2. IMPORT COMPONENT
// Now that globals are set, we can safely import our UI logic
import { UserProfile } from './UserProfile.js';

async function generateSSRPage() {
    // Shared state between Server and Client
    const userData = { id: 101, name: 'Alice Freeman', role: 'Software Engineer' };

    // Create component instance
    const profile = new UserProfile(userData);

    // Render component into the JSDOM container
    const container = document.getElementById('ssr-container');
    if (container) {
        profile.mount(container, 'append');
    }

    const componentHtml = container ? container.innerHTML : '';

    // 3. GENERATE FULL HTML TEMPLATE
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Isomorphic SSR Example</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script type="importmap">
        {
            "imports": {
                "@supercat1337/ui": "../../dist/ui.bundle.esm.js"
            }
        }
    </script>
</head>
<body class="bg-light d-flex align-items-center justify-content-center vh-100">
    <div id="client-app-root">
        ${componentHtml}
    </div>

    <script type="module">
        import { UserProfile } from './UserProfile.js';

        // CLIENT-SIDE HYDRATION
        // We use the exact same data to ensure the VDOM matches the SSR HTML
        const profile = new UserProfile(${JSON.stringify(userData)});
        
        // Connect event listeners to existing [data-component-root]
        profile.mount(document.getElementById('client-app-root'), 'hydrate');
    </script>
</body>
</html>`;

    // 4. WRITE FILE TO DISK
    // Using __dirname ensures index.html is created next to server.js
    const outputPath = path.join(__dirname, 'index.html');
    fs.writeFileSync(outputPath, template);

    console.log('--------------------------------------------------');
    console.log(`🚀 SSR Success: Generated ${outputPath}`);
    console.log('👉 Open this file via a local web server (e.g. Live Server)');
    console.log('--------------------------------------------------');
}

generateSSRPage().catch(console.error);
