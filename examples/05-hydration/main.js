// @ts-check
import { Component } from '../../dist/ui.bundle.esm.js'; // '@supercat1337/ui';

/**
 * HydratedWidget Component
 * Attaches to existing DOM structure instead of creating a new one.
 */
class HydratedWidget extends Component {
    /** * @type {Object<string, any>} 
     */
    refsAnnotation = {
        title: HTMLHeadingElement.prototype,
        status: HTMLSpanElement.prototype,
        actionBtn: HTMLButtonElement.prototype
    };

    /**
     * Logic executed after hydration.
     */
    connectedCallback() {
        const refs = this.getRefs();

        refs.actionBtn.onclick = () => {
            refs.title.textContent = 'Client Logic Attached! ⚡';
            
            refs.status.textContent = 'Active';
            refs.status.className = 'badge bg-success';

            refs.actionBtn.disabled = true;
            refs.actionBtn.textContent = 'Fully Hydrated';

            console.log('Hydration successful for component:', this.instanceId);
        };
    }
}

// --- Bootstrap ---

const existingNode = document.body;

if (existingNode instanceof HTMLElement) {
    // We pass the instanceId matching the data-component-root value if needed, 
    // or simply mount to the target element.
    const widget = new HydratedWidget({instanceId: "user-profile"});
    
    /**
     * HYDRATE MODE:
     * 1. Scans the existingNode for [data-ref].
     * 2. Maps them to the component instance.
     * 3. Runs connectedCallback without touching the innerHTML.
     */
    widget.mount(existingNode, 'hydrate');
}