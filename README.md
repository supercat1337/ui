# @supercat1337/ui

**A lightweight, zero-dependency component engine for the modern web.**

`@supercat1337/ui` is a performance-first library for building web interfaces using native standards. It provides a robust component model, a surgical DOM update system, and built-in SSR/Hydration support—all without the overhead of a heavy runtime or complex Virtual DOM diffing.

---

## ✨ Key Features

- **🚀 Surgical Updates:** No Virtual DOM overhead. Use `getRefs()` to target and update DOM nodes directly for maximum performance.
- **🌍 Isomorphic by Design:** First-class support for Server-Side Rendering (SSR) and Client-Side Hydration.
- **⚡ Native CSSOM:** Leverage `adoptedStyleSheets` for high-performance, scoped styling.
- **📦 Zero Dependencies:** Extremely small footprint, perfect for micro-frontends and performance-critical apps.
- **🧩 Slot-Based Composition:** Advanced slot management for building complex, nested component architectures.
- **📡 Built-in Messaging:** Every component is an `EventEmitter`, enabling decoupled communication via `on` and `emit`.

---

## 🚀 Quick Start

### 1. Define a Component

```javascript
import { Component, html } from '@supercat1337/ui';

export class UserProfile extends Component {
    constructor(name) {
        super();
        this.state = { name, count: 0 };
    }

    // Surgical update: Only updates the specific ref, not the whole layout
    increment = () => {
        this.state.count++;
        const { counterDisplay } = this.getRefs();
        counterDisplay.textContent = this.state.count;
    };

    connectedCallback() {
        const { btn } = this.getRefs();
        // Native event binding with automatic scoping
        this.$on(btn, 'click', this.increment);
    }

    layout = () => html`
        <div class="profile">
            <h2>User: ${this.state.name}</h2>
            <p>Actions: <span data-ref="counterDisplay">0</span></p>
            <button data-ref="btn">Increment</button>
        </div>
    `;
}
```

### 2. Render to DOM

Simply instantiate your root component and use the `.mount()` method to attach it to the DOM.

```html
<div id="app"></div>

<script type="module">
    import { App } from './app.js';

    // The mount method handles the initial render and lifecycle setup
    new App().mount(document.getElementById('app'));
</script>
```

---

## 🛠 Core Concepts

### Surgical DOM Updates

While the library supports full re-renders via `update()`, it encourages "Surgical Updates." By using `getRefs()`, you can modify specific elements instantly, bypassing the need for a diffing engine.

### Isomorphic Workflow

1. **Server:** Use the library with JSDOM to generate static HTML.
2. **Client:** The library "hydrates" the existing HTML, attaching event listeners and state without flickering or re-rendering the initial view.

---

## 📚 Learning from Examples

The repository includes 11 comprehensive examples covering everything you need:

| Folder                | Topic                                       |
| --------------------- | ------------------------------------------- |
| `01-layout-diversity` | Strings, Functions, and DOM layouts.        |
| `05-hydration`        | Making static HTML interactive.             |
| `06-ssr-generator`    | Generating HTML on the server.              |
| `10-instance-theming` | Advanced styling with `adoptedStyleSheets`. |
| `11-event-interop`    | Direct communication and `getRefs`.         |

_Explore the [Examples Folder](./examples) directory for full source code._

---

## 📝 Technical Philosophy

This library is built for developers who want **control**. It doesn't hide the DOM from you; it gives you the tools to manage it efficiently. It follows the **Unix Philosophy**: do one thing (manage components) and do it well.

---

## 🛡 Type Safety: Static & Runtime

The library provides two ways to ensure your component logic is safe and predictable, even without a heavy TypeScript build step.

### 1. Static Typing (via JSDoc)

Since the library is written in modern JavaScript, you can use `@ts-check` and JSDoc to get full IDE support. This is especially powerful for component `state` and event `payloads`.

```javascript
// @ts-check

/** @typedef {{ id: number, text: string, done: boolean }} Todo */

export class TodoItem extends Component {
    constructor() {
        super();
        /** @type {{ item: Todo }} */
        this.state = {
            item: { id: 1, text: 'Learn Surgical DOM', done: false },
        };
    }
}
```

### 2. Runtime Element Typing (Refs Annotation)

The `getRefs()` method is the heart of surgical updates. To avoid "missing element" errors and get full autocompletion for DOM properties, use the `refsAnnotation` property. This maps your `data-ref` names to their specific HTML classes.

```javascript
export class SearchBar extends Component {
    // This provides both static autocomplete and a runtime hint
    refsAnnotation = {
        searchInput: HTMLInputElement.prototype,
        submitBtn: HTMLButtonElement.prototype,
        resultsList: HTMLUListElement.prototype,
    };

    update() {
        const refs = this.getRefs();

        // IDE knows exactly what these are:
        refs.searchInput.value = '';
        refs.resultsList.replaceChildren(...[]);
        refs.submitBtn.disabled = true;
    }

    layout = () => html`
        <div>
            <input data-ref="searchInput" type="text" />
            <button data-ref="submitBtn">Search</button>
            <ul data-ref="resultsList"></ul>
        </div>
    `;
}
```

## 🛠 The Utility Belt

The library comes packed with high-performance utilities to handle common UI tasks without needing external dependencies like Lodash or jQuery.

### 🧩 Component & Slot Control

* **`SlotToggler`**: Easily switch between multiple slots (e.g., Tabs or View Switchers). It handles unmounting the old slot and mounting the new one automatically.
* **`Toggler`**: A generic state manager for "on/off" logic across multiple items.

### 🎨 UI & Animations

* **`fadeIn` / `fadeOut**`: Smooth, `requestAnimationFrame`-based transitions for elements.
* **`showSpinnerInButton` / `removeSpinnerFromButton**`: Standardized loading states for buttons.
* **`scrollToTop` / `scrollToBottom**`: Helper for chat windows or long forms.
* **`showElements` / `hideElements**`: Fast visibility toggling using the built-in `d-none` system.

### 📝 Text & Formatting

* **`formatBytes`**: Converts raw numbers into human-readable sizes (e.g., `1.2 GB`). Supports multiple languages.
* **`formatDate` / `formatDateTime**`: Localized date formatting from Unix timestamps.
* **`escapeHtml` / `unsafeHTML**`: Security helpers. Use `unsafeHTML` when you explicitly trust a string to be rendered as HTML.
* **`createPaginationArray`**: Logic for generating pagination numbers with "gaps" (e.g., `1, 2 ... 10`).

### ⚡ Event & Async Helpers

* **`delegateEvent`**: High-performance event delegation. Attach one listener to a parent to manage many children.
* **`DOMReady`**: Ensures your logic runs only when the document is fully interactive.
* **`withMinimumTime`**: A "UX polisher"—ensures a loading spinner stays visible for at least X ms to prevent annoying "flickering" on fast connections.
* **`sleep`**: A simple, promise-based delay.

---

### Why this makes the library competitive:

1. **Reduced Bundle Size**: Users don't need `date-fns`, `numeral.js`, or `jQuery`.
2. **Standardized UI**: Buttons, spinners, and pagination look and behave consistently.
3. **Low-Level Access**: Functions like `delegateEvent` show that the library understands browser performance at a deep level.

**Should we add one final example (Example 12) to the folder that showcases these "Utility Belt" functions in action?**

## ⚖️ License

MIT
