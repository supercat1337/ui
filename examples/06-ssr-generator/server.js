// @ts-check
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config, generateManifest, renderManifestHTML } from '@supercat1337/ui';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SSR Bootstrap
 * Setup virtual DOM environment before importing components
 */
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="ssr-container"></div></body></html>');

// @ts-ignore
global.window = dom.window;
global.document = dom.window.document;

// Inform the framework that we are in SSR mode
Config.isSSR = true;
// @ts-ignore
Config.window = dom.window;

import { UserProfile } from './UserProfile.js';

/**
 * Main SSR Generation function
 */
async function generateSSRPage() {
    const userData = { name: 'Alice Freeman', role: 'Software Engineer' };
    const sid = 'root.profile';

    // 1. Initialize component on server
    const profile = new UserProfile();
    profile.state = userData; // Inject initial data
    profile.$internals.sid = sid; // Assign stable SID for hydration

    const container = document.getElementById('ssr-container');
    if (container) {
        profile.mount(container, 'append');
    }

    const componentHtml = container ? container.innerHTML : '';

    // 2. Prepare Hydration Manifest
    const hydrationManifest = generateManifest(profile);

    // 3. Construct Final HTML
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Isomorphic SSR with Manifest</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    ${renderManifestHTML(hydrationManifest)}

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
        import { Config } from '@supercat1337/ui';

        // CLIENT-SIDE HYDRATION
        // Create instance with SID to link it with manifest data
        const profile = new UserProfile({ sid: '${sid}' });
        
        // Hydration process: 
        // 1. applyHydration() -> 2. restoreCallback(data) -> 3. scanRefs() -> 4. connectedCallback()
        profile.mount(document.getElementById('client-app-root'), 'hydrate');

        // Cleanup: remove global manifest to free memory
        Config.destroyManifest();
    </script>
</body>
</html>`;

    const outputPath = path.join(__dirname, 'index.html');
    fs.writeFileSync(outputPath, template);

    console.log(`🚀 SSR Success: Generated ${outputPath}`);
}

generateSSRPage().catch(console.error);