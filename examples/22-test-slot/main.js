// @ts-check
import { Component, html } from '@supercat1337/ui';

/**
 * A simple counter component that displays a count value and a button to increment it.
 * Demonstrates dynamic content updates without full re-rendering.
 */
class CounterComponent extends Component {
    // Private instance counter
    #count = 0;

    /**
     * Dynamic layout that shows the counter's ID and current count.
     * The layout is re‑evaluated only once (static HTML) because the counter uses
     * manual DOM updates rather than relying on re‑rendering.
     */
    layout = () => html`
        <div class="card mb-2 p-2">
            <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-secondary me-2">ID: ${this.instanceId.slice(-4)}</span>
                <span class="fw-bold">Count: ${this.#count}</span>
                <button data-ref="incBtn" class="btn btn-sm btn-primary">+1</button>
            </div>
        </div>
    `;

    // Declare refs to allow type‑checked access to DOM elements
    refsAnnotation = {
        incBtn: HTMLButtonElement.prototype,
    };

    /**
     * Lifecycle method called when the component is attached to the DOM.
     * Sets up the event listener for the increment button.
     */
    connectedCallback() {
        this.getRefs().incBtn.addEventListener('click', () => {
            this.#count++;
            this.update(); // Manually update the displayed count
        });
    }

    /**
     * Manually updates the displayed counter value in the DOM.
     * This avoids re‑rendering the entire component, preserving the DOM node
     * and any internal state (e.g., focus, animations).
     */
    update() {
        const countSpan = this.getRootNode().querySelector('.fw-bold');
        if (countSpan) countSpan.textContent = `Count: ${this.#count}`;
    }
}

/**
 * Parent component that demonstrates slot operations (append, prepend, replace, remount).
 * It provides a control panel and a slot container where child counters are placed.
 */
class SlotTest extends Component {
    /**
     * Layout with a control bar and a slot element.
     * The slot is identified by the `data-slot="test-slot"` attribute.
     */
    layout = html`
        <div class="container mt-4">
            <h3>Slot testing</h3>
            <div class="btn-group mb-3" role="group">
                <button data-ref="appendBtn" class="btn btn-outline-primary">Append</button>
                <button data-ref="prependBtn" class="btn btn-outline-primary">Prepend</button>
                <button data-ref="replaceBtn" class="btn btn-outline-primary">Replace</button>
                <button data-ref="remountBtn" class="btn btn-outline-warning">Remount Slot</button>
            </div>
            <div data-slot="test-slot" class="border p-3 bg-light"></div>
        </div>
    `;

    // Declare refs for the buttons to enable type‑checked event binding
    refsAnnotation = {
        appendBtn: HTMLButtonElement.prototype,
        prependBtn: HTMLButtonElement.prototype,
        replaceBtn: HTMLButtonElement.prototype,
        remountBtn: HTMLButtonElement.prototype,
    };

    /**
     * Constructor: initializes the slot with three default counter components.
     */
    constructor() {
        super();
        this.addToSlot('test-slot', [
            new CounterComponent(),
            new CounterComponent(),
            new CounterComponent(),
        ]);
    }

    /**
     * Lifecycle method: attaches click handlers to the control buttons.
     * Each handler demonstrates a different slot manipulation mode.
     */
    connectedCallback() {
        const refs = this.getRefs();

        // Append a new counter at the end of the slot
        refs.appendBtn.addEventListener('click', () => {
            const newCounter = new CounterComponent();
            this.addToSlot('test-slot', newCounter, 'append');
            console.log('Appended new counter');
        });

        // Prepend a new counter at the beginning of the slot
        refs.prependBtn.addEventListener('click', () => {
            const newCounter = new CounterComponent();
            this.addToSlot('test-slot', newCounter, 'prepend');
            console.log('Prepended new counter');
        });

        // Replace the entire slot content with three new counters
        refs.replaceBtn.addEventListener('click', () => {
            const newComponents = [
                new CounterComponent(),
                new CounterComponent(),
                new CounterComponent(),
            ];
            this.addToSlot('test-slot', newComponents, 'replace');
            console.log('Replaced slot content');
        });

        // Force‑remount the slot (unmount + mount) – this is intentionally redundant
        // to show that repeated mounts do not break the UI (due to internal safeguards).
        refs.remountBtn.addEventListener('click', () => {
            const slot = this.slotManager.getSlot('test-slot');
            if (slot) {
                slot.unmount();
                slot.mount();
                console.log('Remount called on slot (should have no effect)');
            }
        });
    }
}

// Instantiate and mount the root component onto the document body
const app = new SlotTest();
app.mount(document.body);
