// @ts-check
import { Component, html, Config } from '@supercat1337/ui';
import { ToastComponent } from './ToastComponent.js';
import { eventBus } from './eventBus.js';

export class ProductComponent extends Component {
    /**
     * @param {Object} options
     * @param {string} options.instanceId
     * @param {string} [options.sid]
     * @param {string} [options.name]
     * @param {number} [options.price]
     * @param {string} [options.badge]
     */
    constructor({ instanceId, sid, name = '', price = 0, badge = '' }) {
        super({ instanceId, sid });
        this.state = { name, price, badge, added: false };
    }

    teleports = {
        badgePortal: {
            // layout всегда возвращает одинаковую структуру
            layout: () => html`<span class="badge d-none" data-ref="badgeNode"></span>`,
            // Цель должна быть стабильной
            target: () => this.element,
            strategy: 'prepend',
        },
    };

    serialize() {
        return { ...this.state };
    }

    restoreCallback(data) {
        this.state = { ...this.state, ...data };
        // Синхронизируем UI после восстановления данных
        if (this.element) this.#renderState();
    }

    // Абсолютно статичный каркас
    layout = () => html`
        <div class="product-item">
            <h5 data-ref="title"></h5>
            <p data-ref="priceText"></p>
            <button data-ref="buyBtn" class="btn btn-primary">Add to Cart</button>
        </div>
    `;

    refsAnnotation = {
        title: Config.window.HTMLHeadingElement.prototype,
        priceText: Config.window.HTMLParagraphElement.prototype,
        buyBtn: Config.window.HTMLButtonElement.prototype,
        // Добавляем реф для бейджа, который прилетит через телепорт
        badgeNode: Config.window.HTMLElement.prototype,
    };

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

    connectedCallback() {
        this.#renderState();

        const refs = this.getRefs();

        // Используем addEventListener вместо onclick для чистоты
        refs.buyBtn.addEventListener('click', () => {
            if (!this.state.added) {
                this.state.added = true;
                this.#renderState();

                // Уведомляем другие компоненты (например, CartComponent)
                eventBus.emit('add-to-cart', this.state.name);

                // Динамически создаем и монтируем тост
                const toast = new ToastComponent({
                    message: `${this.state.name} added to cart!`,
                    duration: 2000,
                });

                // Используем Config.window для поиска корня телепортов
                const teleportRoot = Config.window.document.getElementById('teleport-root');
                if (teleportRoot) {
                    toast.mount(teleportRoot, 'append');
                }
            }
        });
    }
}
