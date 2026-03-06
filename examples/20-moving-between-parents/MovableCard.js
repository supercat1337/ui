// @ts-check

import { Component, html } from '@supercat1337/ui';

export class MovableCard extends Component {
    refsAnnotation = {
        display: HTMLSpanElement.prototype,
        button: HTMLButtonElement.prototype,
    };

    // Generate a random pastel color once
    color = `hsl(${Math.random() * 360}, 70%, 80%)`;

    layout = () => html`
        <div class="card" style="background-color: ${this.color};">
            <span data-ref="display">0</span>
            <button data-ref="button">+1</button>
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
