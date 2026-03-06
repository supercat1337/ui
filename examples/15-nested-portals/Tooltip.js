
// @ts-check
import { Component, html } from '@supercat1337/ui';

// ================= Tooltip Component =================
export class Tooltip extends Component {
    refsAnnotation = {
        trigger: HTMLButtonElement.prototype,
        tip: HTMLElement.prototype,
    };

    // Main layout – the trigger button (stays where it's placed)
    layout = () => html`
        <button data-ref="trigger">Hover me</button>
    `;

    // Teleport: the tooltip itself goes to document.body
    teleports = {
        tooltip: {
            layout: () => html`
                <div class="tooltip" data-ref="tip">✨ I'm a tooltip!</div>
            `,
            target: document.body,
            strategy: /** @type {const} */ ('append'),
        },
    };

    connectedCallback() {
        const refs = this.getRefs();

        // Use $on for auto‑cleanup on disconnect
        this.$on(refs.trigger, 'mouseenter', () => {
            refs.tip.style.display = 'block';
        });
        this.$on(refs.trigger, 'mouseleave', () => {
            refs.tip.style.display = 'none';
        });
    }
}