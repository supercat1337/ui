// @ts-check
import { Component, html } from '@supercat1337/ui';

/**
 * Header component – demonstrates static HTML with action button.
 */
class Header extends Component {
    layout = html`
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
            <h2 class="h4 m-0 text-primary">Static Header</h2>
            <button data-ref="refreshBtn" class="btn btn-sm btn-outline-secondary">
                🔄 Refresh
            </button>
        </div>
    `;

    refsAnnotation = {
        refreshBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        const refs = this.getRefs();

        // Simple page reload logic
        refs.refreshBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
}

/**
 * Body component – demonstrates dynamic layout via arrow function.
 */
class DynamicBody extends Component {
    /** @returns {DocumentFragment} */
    layout = () => html`
        <div class="p-4 bg-white border rounded shadow-sm text-center">
            <p class="mb-1">This content is dynamically generated:</p>
            <code class="d-block mb-3 text-danger"> ${new Date().toLocaleTimeString()} </code>
            <p class="small text-muted mb-0">It re-evaluates every time the layout is called.</p>
        </div>
    `;
}

/**
 * Footer component – demonstrates DocumentFragment layout.
 */
class Footer extends Component {
    layout = html`
        <footer class="mt-4 pt-2 border-top text-center">
            <span class="text-muted small">&copy; 2026 UI Framework Documentation</span>
        </footer>
    `;
}

/**
 * Root component – orchestrates child components using slots.
 */
class LayoutDemo extends Component {
    layout = html`
        <div class="card shadow-lg" style="width: 24rem;">
            <div class="card-body">
                <header data-slot="header-slot"></header>
                <main data-slot="body-slot"></main>
                <footer data-slot="footer-slot"></footer>
            </div>
        </div>
    `;

    constructor() {
        super();

        // Compose the UI structure
        this.addToSlot('header-slot', new Header());
        this.addToSlot('body-slot', new DynamicBody());
        this.addToSlot('footer-slot', new Footer());
    }
}

// Initialize and mount to body
const app = new LayoutDemo();
app.mount(document.body);
