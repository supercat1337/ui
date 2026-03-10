// @ts-check
import { Component, html, Config } from '@supercat1337/ui';
import { eventBus } from './eventBus.js';

/**
 * CartComponent manages the shopping cart state and UI.
 * It listens to global events to update the item count and dropdown list.
 */
export class CartComponent extends Component {
    /**
     * @param {Object} options
     * @param {string} options.instanceId - Unique ID for the component.
     * @param {string} [options.sid] - Server ID for hydration.
     */
    constructor(options) {
        super(options);
        /** @type {string[]} */
        this.items = [];
    }

    /**
     * Serializes the cart items for SSR.
     * @returns {{ items: string[] }}
     */
    serialize() {
        return { items: this.items };
    }

    /**
     * Restores cart items from hydration data and triggers a re-render if connected.
     * @param {Object} data - Hydration data.
     * @param {string[]} [data.items] - List of product names.
     */
    restoreCallback(data) {
        this.items = data.items || [];
        // Re-render only if the component is already in the DOM
        if (this.isConnected) this.#render();
    }

    /**
     * Defines the cart structure with a counter and a hidden dropdown for items.
     */
    layout = () => html`
        <div class="cart" data-component-root="${this.instanceId}">
            <span>🛒 <span data-ref="count">0</span></span>
            <div class="cart-items d-none" data-ref="dropdown"></div>
        </div>
    `;

    /**
     * Type annotations for cart DOM elements.
     */
    refsAnnotation = {
        count: Config.window.HTMLSpanElement.prototype,
        dropdown: Config.window.HTMLDivElement.prototype,
    };

    /**
     * Synchronizes the UI with the current internal items array.
     */
    #render() {
        const refs = this.getRefs();
        refs.count.textContent = String(this.items.length);
        
        if (this.items.length > 0) {
            refs.dropdown.classList.remove('d-none');
            // Using innerHTML for simple list generation; 
            // in production, consider sub-components for complex items.
            refs.dropdown.innerHTML = this.items.map(item => `<div>${item}</div>`).join('');
        } else {
            refs.dropdown.classList.add('d-none');
        }
    }

    /**
     * Called when the cart is added to the DOM.
     * Subscribes to the global event bus to handle product additions.
     */
    connectedCallback() {
        this.#render();

        /**
         * Listen for the global 'add-to-cart' event.
         * Note: Since this is an external eventBus, we subscribe here.
         * In a more complex app, you might want to store the unsubscribe 
         * function and call it in disconnectedCallback.
         */
        eventBus.on('add-to-cart', (/** @type {string} */ productName) => {
            this.addItem(productName);
        });
    }

    /**
     * Adds a new item to the cart and refreshes the UI.
     * @param {string} productName - The name of the product to add.
     */
    addItem(productName) {
        this.items.push(productName);
        this.#render();
    }
}