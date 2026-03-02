# @supercat1337/ui

**A High-Performance, Standards-First Component Engine for the Modern Web.**

`@supercat1337/ui` is not a "React clone." It is a structured **Vanilla JS** toolkit designed for developers who need framework-level organization (Components, Slots, Lifecycle) without the performance tax of a Virtual DOM.

---

## 🎯 Why @supercat1337/ui? (The Manifest)

Most modern frameworks prioritize developer convenience over browser efficiency. They hide the DOM behind layers of abstraction (Virtual DOM, Reconcilers, Synthetic Events), which leads to CPU overhead and "black-box" debugging.

**This library exists to solve three core problems:**

### 1. The Virtual DOM Bottleneck

Traditional frameworks re-render entire trees and then "diff" them to find changes. In high-frequency apps (dashboards, real-time monitors), this is a massive waste of resources.

- **Our Solution:** **Surgical Updates**. Use `getRefs()` to target and update a single `textContent` or `class` instantly. No diffing, no virtual trees.

### 2. The Hydration Tax

Modern SSR often "re-boots" the entire app on the client, causing layout shifts or high Time-to-Interactive (TTI).

- **Our Solution:** **Lightweight Hydration**. We find existing DOM nodes and attach logic without re-rendering. It’s the fastest way from "HTML string" to "Interactive App."

### 3. The Shadow DOM Struggle

Native Web Components often force you into Shadow DOM, which breaks global CSS (Bootstrap, Tailwind) and complicates styling.

- **Our Solution:** **Componentized Light DOM**. Get the power of `<slot>` and lifecycle methods while staying in the Light DOM. Your CSS just works.

---

## ✨ Key Features at a Glance

- **🚀 Zero Dependencies:** Tiny bundle size, perfect for micro-frontends and widgets.
- **⚡ Native CSSOM:** High-performance styling via `adoptedStyleSheets`.
- **🧩 Advanced Slots:** Powerful `SlotManager` and `SlotToggler` for complex UI layouts.
- **📡 Event-Driven:** Built-in `on`/`emit` system in every component instance.
- **🛡 Type Safety:** Full JSDoc and `refsAnnotation` support for static and runtime typing.
- **🛠 Utility Belt:** Integrated helpers for pagination, formatting, animations, and event delegation.

---

## 🚀 Quick Start

### 1. Define Your Component

```javascript
import { Component, html } from '@supercat1337/ui';

export class LiveCounter extends Component {
    constructor() {
        super();
        this.state = { count: 0 };
    }

    // Surgical Update: Blazing fast, zero diffing
    increment = () => {
        this.state.count++;
        this.getRefs().display.textContent = this.state.count;
    };

    layout = () => html`
        <div class="card">
            <span data-ref="display">0</span>
            <button onclick="${this.increment}">+</button>
        </div>
    `;
}
```

### 2. Mount to DOM

```html
<div id="root"></div>
<script type="module">
    import { LiveCounter } from './LiveCounter.js';
    new LiveCounter().mount(document.getElementById('root'));
</script>
```

---

## 🏗 Comparison Table

| Feature         | React / Vue            | Web Components        | **@supercat1337/ui**          |
| --------------- | ---------------------- | --------------------- | ----------------------------- |
| **Rendering**   | Virtual DOM (Heavy)    | Shadow DOM (Isolated) | **Surgical Light DOM (Fast)** |
| **Bundle Size** | 30KB - 100KB+          | 0KB (Native)          | **< 5KB (Minimal)**           |
| **SEO / SSR**   | Needs Meta-Framework   | Complex               | **Native & Isomorphic**       |
| **Styling**     | Scoped CSS / CSS-in-JS | Encapsulated (Hard)   | **Global & AdoptedStyles**    |
| **Longevity**   | High Maintenance       | Native Standards      | **Native Standards**          |

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

- **`SlotToggler`**: Easily switch between multiple slots (e.g., Tabs or View Switchers). It handles unmounting the old slot and mounting the new one automatically.
- **`Toggler`**: A generic state manager for "on/off" logic across multiple items.

### 🎨 UI & Animations

- **`fadeIn` / `fadeOut**`: Smooth, `requestAnimationFrame`-based transitions for elements.
- **`showSpinnerInButton` / `removeSpinnerFromButton**`: Standardized loading states for buttons.
- **`scrollToTop` / `scrollToBottom**`: Helper for chat windows or long forms.
- **`showElements` / `hideElements**`: Fast visibility toggling using the built-in `d-none` system.

### 📝 Text & Formatting

- **`formatBytes`**: Converts raw numbers into human-readable sizes (e.g., `1.2 GB`). Supports multiple languages.
- **`formatDate` / `formatDateTime**`: Localized date formatting from Unix timestamps.
- **`escapeHtml` / `unsafeHTML**`: Security helpers. Use `unsafeHTML` when you explicitly trust a string to be rendered as HTML.
- **`createPaginationArray`**: Logic for generating pagination numbers with "gaps" (e.g., `1, 2 ... 10`).

### ⚡ Event & Async Helpers

- **`delegateEvent`**: High-performance event delegation. Attach one listener to a parent to manage many children.
- **`DOMReady`**: Ensures your logic runs only when the document is fully interactive.
- **`withMinimumTime`**: A "UX polisher"—ensures a loading spinner stays visible for at least X ms to prevent annoying "flickering" on fast connections.
- **`sleep`**: A simple, promise-based delay.

---

### Why this makes the library competitive:

1. **Reduced Bundle Size**: Users don't need `date-fns`, `numeral.js`, or `jQuery`.
2. **Standardized UI**: Buttons, spinners, and pagination look and behave consistently.
3. **Low-Level Access**: Functions like `delegateEvent` show that the library understands browser performance at a deep level.

**Should we add one final example (Example 12) to the folder that showcases these "Utility Belt" functions in action?**

## ⚖️ License

MIT
