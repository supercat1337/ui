// @ts-check
import { Component, html } from '@supercat1337/ui';

export class ModalComponent extends Component {
    refsAnnotation = {
        openBtn: HTMLButtonElement.prototype,
        closeBtn: HTMLButtonElement.prototype,
        overlay: HTMLElement.prototype,
        title: HTMLElement.prototype,
    };

    // 1. Every component MUST have a layout (the "anchor" in the DOM)
    //    Use `html` tagged template to return a string – SSR‑friendly.
    static layout = html`
        <div class="modal-wrapper">
            <button data-ref="openBtn">Open Modal</button>
        </div>
    `;

    // 2. The teleported part that lives elsewhere (e.g., document.body)
    teleports = {
        overlay: {
            // ✅ Return a string (via html) – works on server and client.
            layout: html`
                <div class="modal-overlay" data-ref="overlay">
                    <div class="modal-content">
                        <h2 data-ref="title">Settings</h2>
                        <button class="close-btn" data-ref="closeBtn">Close</button>
                    </div>
                </div>
            `,
            // ✅ Use a CSS selector (string) instead of a function that returns a DOM element.
            //    This makes the component usable in SSR without a DOM.
            target: 'body',
            strategy: /** @type {const} */ ('append'),
        },
    };

    connectedCallback() {
        // All refs (from main layout AND teleports) are merged here.
        // Destructure for cleaner access.
        const { openBtn, closeBtn, overlay } = this.getRefs();

        // ✅ Use $on for automatic cleanup when component unmounts.
        this.$on(openBtn, 'click', () => this.show());
        this.$on(closeBtn, 'click', () => this.hide());
        this.$on(overlay, 'click', e => {
            if (e.target === overlay) this.hide();
        });
    }

    show() {
        this.getRefs().overlay.classList.add('is-active');
    }

    hide() {
        this.getRefs().overlay.classList.remove('is-active');
    }
}
