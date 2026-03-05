// @ts-check
import { Component, html } from '@supercat1337/ui';

// ================= Tooltip Component =================
class Tooltip extends Component {
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
                <div class="tooltip" data-ref="tip">I'm a tooltip!</div>
            `,
            target: document.body,
            strategy: /** @type {const} */ ('append'),
        },
    };

    connectedCallback() {
        const refs = this.getRefs();
        refs.trigger.addEventListener('mouseenter', () => {
            refs.tip.style.display = 'block';
        });
        refs.trigger.addEventListener('mouseleave', () => {
            refs.tip.style.display = 'none';
        });
    }
}

// ================= Modal Component =================
export class ModalWithTooltip extends Component {
    refsAnnotation = {
        openBtn: HTMLButtonElement.prototype,
        closeBtn: HTMLButtonElement.prototype,
        overlay: HTMLElement.prototype,
        tooltipSlot: HTMLElement.prototype,
    };

    // Main layout – the "Open Modal" button
    layout = () => html`
        <div class="modal-wrapper">
            <button data-ref="openBtn">Open Modal</button>
        </div>
    `;

    // Teleport: the modal overlay (goes to document.body)
    teleports = {
        overlay: {
            layout: () => html`
                <div class="modal-overlay" data-ref="overlay">
                    <div class="modal-content">
                        <h2>Settings</h2>
                        <button class="close-btn" data-ref="closeBtn">Close</button>
                        <!-- Slot where Tooltip will be inserted -->
                        <div data-slot="tooltip-slot" data-ref="tooltipSlot"></div>
                    </div>
                </div>
            `,
            target: document.body,
            strategy: /** @type {const} */ ('append'),
        },
    };

    constructor() {
        super();
        // Add Tooltip to the slot inside the teleported overlay
        this.addComponentToSlot('tooltip-slot', new Tooltip());
    }

    connectedCallback() {
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