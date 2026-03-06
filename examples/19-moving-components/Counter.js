// @ts-check
import { Component, html } from '@supercat1337/ui';

export class Counter extends Component {
    refsAnnotation = {
        display: HTMLSpanElement.prototype,
        button: HTMLButtonElement.prototype,
    };

    layout = () => html`
        <div class="counter-card">
            <span data-ref="display">0</span>
            <button data-ref="button">➕ Increment</button>
        </div>
    `;

    count = 0;

    connectedCallback() {
        const refs = this.getRefs();
        refs.button.addEventListener('click', () => {
            this.count++;
            refs.display.textContent = String(this.count);
        });
    }
}
