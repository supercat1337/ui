// @ts-check
import { ProductComponent } from './ProductComponent.js';
import { CartComponent } from './CartComponent.js';
import { ToastComponent } from './ToastComponent.js';
import { Config } from '@supercat1337/ui';

/**
 * Component Registry:
 * Maps class names (from the manifest) to actual class constructors.
 * This allows the hydration logic to instantiate the correct component types dynamically.
 */
const componentRegistry = {
    ProductComponent,
    CartComponent,
    ToastComponent,
};

/**
 * Retrieve the hydration manifest from the global window object.
 * The manifest contains the state and metadata for all components rendered on the server.
 */
const manifest = Config.getManifest();

/**
 * Hydrates a single DOM element by converting it into a live Component instance.
 * * @param {Element} element - The DOM element marked with a 'data-sid' attribute.
 */
function hydrateFromElement(element) {
    if (!manifest) {
        throw new Error('Manifest not found');
    }

    // SID (Server ID) is the key link between the DOM and the manifest data
    const sid = element.getAttribute('data-sid');
    if (!sid) return;

    // Instance ID identifies this specific instance in the DOM tree
    const instanceId = element.getAttribute('data-component-root');

    // Find the corresponding metadata in the manifest
    const meta = manifest[sid];
    if (!meta) {
        console.warn(`No manifest entry found for sid: "${sid}"`);
        return;
    }

    const { className } = meta;
    // @ts-ignore
    const ComponentClass = componentRegistry[className];

    if (!ComponentClass) {
        console.warn(`Component class "${className}" not found in registry for sid: "${sid}"`);
        return;
    }

    /**
     * Initialization:
     * We pass the existing instanceId and sid to the constructor.
     * The library will automatically pull hydration data for this SID.
     */
    const component = new ComponentClass({
        instanceId,
        sid: sid,
    });

    /**
     * Hydration Phase:
     * The 'hydrate' mode tells the library NOT to create new DOM nodes,
     * but to bind to the existing ones and trigger restoreCallback() + connectedCallback().
     */
    component.mount(element, 'hydrate');
}

/**
 * Entry Point:
 * Find all server-rendered components in the document and hydrate them.
 * We use [data-sid] as the primary selector for hydration targets.
 */
document.querySelectorAll('[data-sid]').forEach(hydrateFromElement);

console.log('🚀 Hydration complete. The application is now interactive.');
