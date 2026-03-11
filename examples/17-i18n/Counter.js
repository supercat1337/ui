// @ts-check
import { Component, html } from '@supercat1337/ui';
import { t, onLanguageChange } from './i18n.js';

export class Counter extends Component {
    refsAnnotation = {
        label: HTMLSpanElement.prototype,
        value: HTMLSpanElement.prototype,
        button: HTMLButtonElement.prototype,
    };

    // Local state (not reactive – we update DOM manually)
    count = 0;

    layout = html`
        <div class="counter">
            <span data-ref="label"></span>
            <span data-ref="value">0</span>
            <button data-ref="button">+1</button>
        </div>
    `;

    connectedCallback() {
        const refs = this.getRefs();

        // Subscribe to language changes
        const unsubscribe = onLanguageChange(() => this.reloadText());

        // Define how to update the text parts
        this.setTextUpdateFunction(() => {
            refs.label.textContent = t('counter', { count: this.count }) + ' ';
            // 'value' span remains unchanged (holds the number)
        });

        // Set initial text
        this.reloadText();

        // Handle button click
        refs.button.addEventListener('click', () => {
            this.count++;
            refs.value.textContent = String(this.count);
            // Update the label because the plural form might change (e.g., "1 time" vs "2 times")
            this.reloadText();
        });

        // Cleanup on disconnect
        this.once('disconnect', unsubscribe);
    }
}
