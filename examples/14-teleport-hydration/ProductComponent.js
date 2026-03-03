// @ts-check

import { Component, html } from '@supercat1337/ui';

export class ProductComponent extends Component {
    /**
     *
     * @param {string} id
     */
    constructor(id) {
        // Set the ID to match the data-component-root attribute in HTML
        super({ instanceId: id });
    }

    // Runtime validation for both local and teleported refs
    refsAnnotation = {
        buyBtn: HTMLButtonElement.prototype,
        closeBtn: HTMLButtonElement.prototype,
        popup: HTMLElement.prototype,
    };

    // Layout used for fresh renders (not used during hydration)
    layout = () => html`
        <div class="product-card">
            <h3>Smartphone Pro</h3>
            <button data-ref="buyBtn">Add to Cart</button>
        </div>
    `;

    teleports = {
        cartNotify: {
            layout: () => html`
                <div class="notify-popup" data-ref="popup">
                    <button data-ref="closeBtn">OK</button>
                </div>
            `,
            target: () => document.body,
        },
    };

    connectedCallback() {
        const refs = this.getRefs();

        // Attach logic to existing DOM elements
        refs.buyBtn.onclick = () => {
            refs.popup.classList.add('is-visible');
        };

        refs.closeBtn.onclick = () => {
            refs.popup.classList.remove('is-visible');
        };
    }
}
