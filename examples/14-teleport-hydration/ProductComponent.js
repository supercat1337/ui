// @ts-check
import { Component, html, Config } from '@supercat1337/ui';

export class ProductComponent extends Component {
    state = {
        count: 0,
    };

    /**
     * @param {{ count: number }} data
     */
    restoreCallback(data) {
        this.state.count = data.count;
    }

    refsAnnotation = {
        buyBtn: Config.window.HTMLButtonElement.prototype,
        closeBtn: Config.window.HTMLButtonElement.prototype,
        popup: Config.window.HTMLElement.prototype,
    };

    teleports = {
        cartNotify: {
            layout: () =>
                html` <div class="notify-popup" data-ref="popup">
                    <button data-ref="closeBtn">OK</button>
                </div>`,
            target: () => Config.window.document.body,
        },
    };

    connectedCallback() {
        const refs = this.getRefs();

        // If we hydrated, this.state.count is already 5
        if (this.state.count > 0) {
            refs.buyBtn.textContent = `In Cart (${this.state.count})`;
        }

        refs.buyBtn.onclick = () => {
            this.state.count++;
            refs.buyBtn.textContent = `In Cart (${this.state.count})`;
            refs.popup.classList.add('is-visible');
        };

        refs.closeBtn.onclick = () => {
            refs.popup.classList.remove('is-visible');
        };
    }
}
