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
    layout = () => html`
        <div class="modal-wrapper">
            <button data-ref="openBtn">Open Modal</button>
        </div>
    `;

    // 2. The teleported part that lives elsewhere (e.g., document.body)
    teleports = {
        overlay: {
            layout: () => html`
                <div class="modal-overlay" data-ref="overlay">
                    <div class="modal-content">
                        <h2 data-ref="title">Settings</h2>
                        <button class="close-btn" data-ref="closeBtn">Close</button>
                    </div>
                </div>
            `,
            target: () => document.body,
            strategy: /** @type {const} */ ('append'),
        },
    };

    connectedCallback() {
        // All refs (from main layout AND teleports) are merged here!
        const refs = this.getRefs();

        refs.openBtn.onclick = () => this.show();
        refs.closeBtn.onclick = () => this.hide();

        refs.overlay.onclick = e => {
            if (e.target === refs.overlay) this.hide();
        };
    }

    show() {
        this.getRefs().overlay.classList.add('is-active');
    }

    hide() {
        this.getRefs().overlay.classList.remove('is-active');
    }
}
