// @ts-check
import { Component, html } from '@supercat1337/ui';

// ----------------------------------------------------------------------
// 1. Component using static styles (global CSS injected once)
// ----------------------------------------------------------------------
class StyledStatic extends Component {
    static layout = `
        <div class="static-card p-3 rounded shadow-sm">
            <h4 class="mb-2">📦 Static Styles</h4>
            <p>This component is styled via <code>static styles</code>.<br>
            Styles apply to all instances of the class.</p>
            <button data-ref="actionBtn" class="btn btn-sm btn-primary">Click me</button>
        </div>
    `;

    static styles = `
        .static-card {
            background: #e3f2fd;
            border-left: 4px solid #0d6efd;
        }
        .static-card code {
            background: #0d6efd20;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
        }
    `;

    refsAnnotation = {
        actionBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        this.$on(this.getRefs().actionBtn, 'click', () => {
            alert('Static styles component says hello!');
        });
    }
}

// ----------------------------------------------------------------------
// 2. Component with inline <style> tag (local styles using instanceId)
// ----------------------------------------------------------------------
class InlineStyleComponent extends Component {
    // layout is a function returning a string (to use instanceId)
    layout = () => html`
        <div class="inline-card-${this.instanceId} p-3 rounded shadow-sm">
            <h4 class="mb-2">🎨 Inline &lt;style&gt;</h4>
            <p>
                Styles are defined inside a <code>&lt;style&gt;</code> tag using
                <code>instanceId</code>.<br />
                Each instance gets unique class names.
            </p>
            <button
                class="btn btn-sm btn-success inline-btn-${this.instanceId}"
                data-ref="actionBtn"
            >
                Click me
            </button>
        </div>
        <style>
            .inline-card-${this.instanceId} {
                background: #fff3cd;
                border: 1px solid #ffecb3;
                border-radius: 12px;
            }
            .inline-btn-${this.instanceId} {
                background-color: #28a745;
                border: none;
            }
            .inline-btn-${this.instanceId}:hover {
                background-color: #218838;
            }
        </style>
    `;

    connectedCallback() {
        this.$on(this.getRefs().actionBtn, 'click', () => {
            alert(`Unique component ${this.instanceId}`);
        });
    }
}

// ----------------------------------------------------------------------
// 3. Component using external CSS classes (Bootstrap + style.css)
// ----------------------------------------------------------------------
class ExternalCSSComponent extends Component {
    static layout = `
        <div class="external-card text-center">
            <h4 class="mb-2">🎭 External CSS</h4>
            <p>Styles come from <code>style.css</code> and Bootstrap.<br>
            No built‑in isolation – relies on global class naming conventions.</p>
            <button class="btn btn-custom mt-2">Button from external CSS</button>
        </div>
    `;
}

// ----------------------------------------------------------------------
// 4. Component using @scope (native style isolation)
// ----------------------------------------------------------------------
class ScopedComponent extends Component {
    static layout = `
        <div class="scoped-wrapper p-3 rounded shadow-sm">
            <h4 class="mb-2">🔒 @scope with data-component-root boundary</h4>
            <p>This component uses <code>@scope ([data-component-root]) to ([data-component-root])</code>.<br>
            Styles do NOT leak into child components (e.g., the button below).</p>
            <button data-ref="scopedBtn" class="btn btn-sm btn-warning">Test</button>
            <!-- Slot to demonstrate no style leakage -->
            <div data-slot="demo-slot" class="mt-3"></div>
        </div>
    `;

    static styles = `
        @scope ([data-component-root]) to ([data-component-root]) {
            .scoped-wrapper {
                background: #f8d7da;
                border-left: 4px solid #dc3545;
            }
            button {
                background-color: #fd7e14;
                border: none;
                color: white;
                font-weight: bold;
            }
            button:hover {
                background-color: #dc3545;
            }
        }
    `;

    refsAnnotation = {
        scopedBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        this.$on(this.getRefs().scopedBtn, 'click', () => {
            alert('Button styled by @scope rules');
        });

        // Insert a child component into the slot – its styles are NOT affected by parent's @scope
        const child = new InlineStyleComponent();
        this.addToSlot('demo-slot', child);
    }
}

// ----------------------------------------------------------------------
// 5. Parent component – assembles everything together
// ----------------------------------------------------------------------
class StylingDemoApp extends Component {
    static layout = `
        <div class="container py-4">
            <h1 class="text-center mb-4">🎨 BareDOM Component Styling</h1>
            <div class="row g-4">
                <div class="col-md-6">
                    <div data-slot="static-slot"></div>
                </div>
                <div class="col-md-6">
                    <div data-slot="inline-slot"></div>
                </div>
                <div class="col-md-6">
                    <div data-slot="external-slot"></div>
                </div>
                <div class="col-md-6">
                    <div data-slot="scoped-slot"></div>
                </div>
            </div>
            <div class="mt-4 text-muted small text-center">
                <hr>
                <p>✅ Static styles — built‑in CSS via <code>static styles</code><br>
                ✅ Inline style — dynamic <code>&lt;style&gt;</code> with <code>instanceId</code><br>
                ✅ External CSS — global classes from <code>style.css</code> and Bootstrap<br>
                ✅ @scope — native boundary <code>to ([data-component-root])</code> isolates styles from child components</p>
            </div>
        </div>
    `;

    constructor() {
        super();
        this.addToSlot('static-slot', new StyledStatic());
        this.addToSlot('inline-slot', new InlineStyleComponent());
        this.addToSlot('external-slot', new ExternalCSSComponent());
        this.addToSlot('scoped-slot', new ScopedComponent());
    }
}

// Mount the application
const app = new StylingDemoApp();
app.mount(document.getElementById('app') || document.body);
