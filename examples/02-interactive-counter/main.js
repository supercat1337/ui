// @ts-check
import { Component, html } from '@supercat1337/ui';

/**
 * CounterApp Component
 * Demonstrates: Direct DOM manipulation, refs usage, and internal state handling.
 */
class CounterApp extends Component {
    /** @type {number} */
    #count = 0;

    // The component UI structure
    layout = html`
        <div class="card shadow" style="width: 22rem;">
            <div class="card-body text-center">
                <h5 class="card-title text-muted mb-4">Interactive Counter</h5>

                <div class="display-2 fw-bold mb-4 text-primary" data-ref="counterDisplay">0</div>

                <div class="input-group mb-4">
                    <span class="input-group-text">Step:</span>
                    <input
                        type="number"
                        class="form-control"
                        data-ref="stepInput"
                        value="1"
                        min="1"
                    />
                </div>

                <div class="d-grid gap-2 d-md-flex justify-content-center">
                    <button class="btn btn-outline-danger px-4" data-ref="decBtn">&minus;</button>
                    <button class="btn btn-outline-success px-4" data-ref="incBtn">&plus;</button>
                </div>

                <hr class="my-4" />

                <button class="btn btn-link btn-sm text-decoration-none" data-ref="resetBtn">
                    Reset Counter
                </button>
            </div>
        </div>
    `;

    /** * Annotate references for type safety and validation
     */
    refsAnnotation = {
        counterDisplay: HTMLDivElement.prototype,
        stepInput: HTMLInputElement.prototype,
        incBtn: HTMLButtonElement.prototype,
        decBtn: HTMLButtonElement.prototype,
        resetBtn: HTMLButtonElement.prototype,
    };

    /**
     * Component Lifecycle: Setup event listeners
     */
    connectedCallback() {
        const refs = this.getRefs();

        // Attach event listeners using Scoped Refs
        refs.incBtn.addEventListener('click', () => this.#changeValue(true));
        refs.decBtn.addEventListener('click', () => this.#changeValue(false));

        refs.resetBtn.addEventListener('click', () => {
            this.#count = 0;
            this.#updateUI();
        });
    }

    /**
     * Logic: Update the internal count based on the input step
     * @param {boolean} increment
     */
    #changeValue(increment) {
        const refs = this.getRefs();

        // Read value directly from the input element ref
        const step = parseInt(refs.stepInput.value) || 0;

        this.#count += increment ? step : -step;
        this.#updateUI();
    }

    /**
     * Render: Manually update specific DOM nodes
     */
    #updateUI() {
        const refs = this.getRefs();
        refs.counterDisplay.textContent = this.#count.toString();

        // Add a small visual feedback
        refs.counterDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => (refs.counterDisplay.style.transform = 'scale(1)'), 100);
    }
}

// --- Bootstrap ---
// Create and mount the counter application to the body
const app = new CounterApp();
app.mount(document.body);
