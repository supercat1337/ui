// @ts-check
import { Component, html, Config } from '@supercat1337/ui';
import { eventBus } from './eventBus.js';

export class CartComponent extends Component {
    constructor(options) {
        super(options);
        this.items = [];
    }

    serialize() {
        return { items: this.items };
    }

    restoreCallback(data) {
        this.items = data.items || [];
        if (this.isConnected) this.#render();
    }

    layout = () => html`
        <div class="cart" data-component-root="${this.instanceId}">
            <span>🛒 <span data-ref="count">0</span></span>
            <div class="cart-items d-none" data-ref="dropdown"></div>
        </div>
    `;

    refsAnnotation = {
        count: Config.window.HTMLSpanElement.prototype,
        dropdown: Config.window.HTMLDivElement.prototype,
    };

    #render() {
        const refs = this.getRefs();
        refs.count.textContent = String(this.items.length);
        if (this.items.length > 0) {
            refs.dropdown.classList.remove('d-none');
            refs.dropdown.innerHTML = this.items.map(item => `<div>${item}</div>`).join('');
        } else {
            refs.dropdown.classList.add('d-none');
        }
    }

    connectedCallback() {
        this.#render();

        // Подписываемся на глобальные события добавления в корзину
        eventBus.on('add-to-cart', productName => {
            this.addItem(productName);
        });
    }

    addItem(productName) {
        this.items.push(productName);
        this.#render();
    }
}
