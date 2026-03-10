// @ts-check
import { Component, html, Config } from '@supercat1337/ui';
import { ToastComponent } from './ToastComponent.js';
import { eventBus } from './eventBus.js';

/**
 * @typedef {Object} ProductState
 * @property {string} name - The product name.
 * @property {number} price - The product price.
 * @property {string} badge - Additional product info or category.
 * @property {boolean} added - Whether the product is already in the cart.
 */

/**
 * ProductComponent represents a single product item in the shop.
 * It demonstrates state serialization/restoration for SSR and hydration.
 */
export class ProductComponent extends Component {
    /**
     * @param {Object} options
     * @param {string} [options.instanceId] - Unique ID for this component instance.
     * @param {string} [options.sid] - Server ID used for hydration mapping.
     * @param {string} [options.name] - Initial product name.
     * @param {number} [options.price] - Initial product price.
     * @param {string} [options.badge] - Initial product badge text.
     */
    constructor({ instanceId, sid, name = '', price = 0, badge = '' }) {
        super({ instanceId, sid });
        
        /** @type {ProductState} */
        this.state = { name, price, badge, added: false };
    }

    /**
     * Serializes the current state for server-side rendering.
     * This data will be available in the hydration manifest on the client.
     * @returns {ProductState}
     */
    serialize() {
        return { ...this.state };
    }

    /**
     * Restores the component state from the provided hydration data.
     * @param {Partial<ProductState>} data - The data retrieved from the server.
     */
    restoreCallback(data) {
        this.state = { ...this.state, ...data };
    }

    /**
     * The structural layout of the component.
     * Uses data-ref for easy element access via getRefs().
     */
    layout = () => html`
        <div class="product-item">
            <h5 data-ref="title"></h5>
            <p data-ref="priceText"></p>
            <button data-ref="buyBtn" class="btn btn-primary">Add to Cart</button>
        </div>
    `;

    /**
     * Annotations for DOM references to enable IDE autocomplete and type safety.
     * Using Config.window ensures compatibility between server (JSDOM) and browser environments.
     */
    refsAnnotation = {
        title: Config.window.HTMLHeadingElement.prototype,
        priceText: Config.window.HTMLParagraphElement.prototype,
        buyBtn: Config.window.HTMLButtonElement.prototype,
    };

    /**
     * Updates the DOM elements based on the current internal state.
     */
    #renderState() {
        const refs = this.getRefs();
        refs.title.textContent = this.state.name;
        refs.priceText.textContent = `Price: $${this.state.price}`;

        if (refs.buyBtn) {
            refs.buyBtn.textContent = this.state.added ? 'In Cart' : 'Add to Cart';
            refs.buyBtn.classList.toggle('btn-success', this.state.added);
            refs.buyBtn.classList.toggle('btn-primary', !this.state.added);
        }
    }

    /**
     * Called when the component is connected to the DOM.
     * Initializes the UI and sets up event listeners.
     */
    connectedCallback() {
        // Initial sync between state and DOM
        this.#renderState();

        if (Config.isSSR) return;

        const { buyBtn } = this.getRefs();

        // Use $on for automatic cleanup when the component is unmounted
        this.$on(buyBtn, 'click', () => {
            if (!this.state.added) {
                // Update local state
                this.state.added = true;
                this.#renderState();

                // Notify other components via the event bus
                eventBus.emit('add-to-cart', this.state.name);

                // Example of dynamic component creation and mounting (Teleportation-like)
                const toast = new ToastComponent({
                    message: `${this.state.name} added to cart!`,
                    duration: 2000,
                });

                const teleportRoot = Config.window.document.getElementById('teleport-root');
                if (teleportRoot) {
                    toast.mount(teleportRoot, 'append');
                }
            }
        });
    }
}