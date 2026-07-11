---
title: BareDOM – Styling Components
version: 2.0.0
tags: [css, cssScope, css-module, style]
---

# Styling Components

BareDOM components render **light DOM** (no shadow root by default). This gives you full flexibility to style your components using standard CSS. You have several options, each with different levels of encapsulation.

### 1. Global Styles (All Instances)

You can assign a CSS string or a `CSSStyleSheet` object to the static `styles` property. The styles are injected once (when the first instance is created) and apply to **all instances** of that component class.

```js
class Card extends Component {
    static styles = `
        .card { border: 1px solid #ccc; padding: 1rem; }
        .card-title { font-size: 1.2rem; }
    `;
    static layout = `<div class="card"><div class="card-title">Title</div></div>`;
}
```

**Pros:** Simple, works without extra tooling.  
**Cons:** Styles are global – you must use unique class names to avoid collisions with other components or page styles.

### 2. Instance‑Specific Styles

If you need styles that differ per instance (e.g., theming), you can generate unique class names or IDs using the component’s `instanceId` inside the layout.

```js
class ThemedCard extends Component {
    layout = () => html`
        <style>
            .card-${this.instanceId} {
                border: 1px solid ${this.theme.borderColor};
                padding: 1rem;
            }
        </style>
        <div class="card-${this.instanceId}">${this.content}</div>
    `;

    constructor({ theme, content }) {
        super();
        this.theme = theme;
        this.content = content;
    }
}
```

**Pros:** Full control over per‑instance styling, no global pollution.  
**Cons:** Slightly more verbose; you must ensure the injected `<style>` element is removed when the component unmounts (BareDOM automatically removes any elements added during rendering, but if you dynamically add `<style>` elsewhere, you'd need to manage cleanup).

### 3. Shadow DOM (Full Encapsulation)

If you need complete style isolation (styles that never leak out or in), you can use a native Web Component with Shadow DOM inside your BareDOM component. This is especially useful for reusable widgets.

```js
// Define a custom element with Shadow DOM
class FancyButton extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                button { background: blue; color: white; }
            </style>
            <button><slot></slot></button>
        `;
    }
}
customElements.define('fancy-button', FancyButton);

// Use it in a BareDOM component
class MyApp extends Component {
    layout = `<fancy-button>Click me</fancy-button>`;
}
```

**Pros:** Complete style encapsulation; styles inside the shadow root do not affect the outer page, and outer styles do not affect the shadow root.  
**Cons:** Requires defining a Web Component; the `data-ref` system can still access shadow DOM elements (as shown in [Web Components Integration](./11-web-components.md)). This approach works natively in all modern browsers.

### 4. CSS Modules (Build‑Time Encapsulation)

If you are already using a bundler (like Vite, Webpack, or Rollup), you can use CSS Modules to scope styles to a component class.

```css
/* Card.module.css */
.card {
    border: 1px solid #ccc;
}
.title {
    font-size: 1.2rem;
}
```

```js
import styles from './Card.module.css';

class Card extends Component {
    layout = html`<div class="${styles.card}"><div class="${styles.title}">Title</div></div>`;
}
```

**Pros:** Scoped class names, no runtime overhead, works with existing tooling.  
**Cons:** Requires a build step; not suitable for pure ESM environments without bundlers.

### 5. Native Style Encapsulation (`@scope`)

BareDOM allows you to isolate component styles using the native CSS `@scope` rule. This ensures that your styles only apply to the current component and do not "leak" to the rest of the page or into nested child components.

#### Automatic Scoping with `cssScope`

When you set `static cssScope = true`, BareDOM automatically handles the encapsulation infrastructure:

1.  **Unique Identifier:** Every component class is assigned a unique ID (e.g., `bd-1`, `bd-2`) via an internal counter.
2.  **DOM Marking:** This ID is automatically added as a `data-cid` attribute to the component's root element.
3.  **Placeholder Replacement:** You can use the `:scope` placeholder in your `static styles`. BareDOM will replace it with the correct attribute selector (e.g., `[data-cid="bd-1"]`).

```javascript
class ScopedCard extends Component {
    static cssScope = true; // Enables automatic encapsulation

    static layout = html`
        <div class="card">
            <h2>Component Title</h2>
            <div data-slot="content"></div>
        </div>
    `;

    static styles = `
        /* :scope is automatically replaced by [data-cid="bd-N"] */
        @scope (:scope) to ([data-component-root]) {
            .card {
                border: 1px solid #ddd;
                padding: 20px;
            }
            h2 {
                color: midnightblue;
            }
        }
    `;
}
```

### Accessing the Class Identifier Programmatically

BareDOM provides a way to retrieve the unique component identifier via code. This is useful for integration with 3rd-party libraries, global themes, or automated testing.

- **`static get classId`**: Returns the CID for the component class.
- **`get classId`**: An instance-level shortcut to the class CID.

```js
// Static access
console.log(MyComponent.classId); // e.g., "bd-4"

// Instance access
const card = new MyComponent();
console.log(card.classId); // "bd-4"
```

#### Use Cases:

1.  **Testing:** Target components reliably in Playwright or Vitest using the attribute selector: `[data-cid="${MyComponent.classId}"]`.
2.  **Global Styling:** Apply styles to all instances of a specific component type from a global CSS-in-JS manager.
3.  **Debugging:** Easily filter or identify components in the browser's Elements panel by their stable `data-cid`.

---

#### Key Benefits

- **Boundary Control:** By using `to ([data-component-root])`, you define a "lower boundary". Styles will apply to your component but **not** to any children placed inside its slots.
- **Simple Selectors:** You no longer need complex naming conventions (like BEM). You can safely style tags like `h2`, `p`, or `.button` knowing they are scoped.
- **Performance:** This utilizes native browser behavior. There is no runtime overhead of a Virtual DOM or the complexity of Shadow DOM.

---

### Summary of the Implementation Logic

For the internal engine, the workflow is now solidified:

1.  **Check `cssScope`:** If `true`, get/create the class ID (using `bd-` prefix).
2.  **Render:** Always append `data-cid="bd-N"` to the root element.
3.  **Style Injection:** Replace `:scope` in the `styles` string with `[data-cid="bd-N"]` before injecting the stylesheet into the document.

### Which Approach Should You Choose?

| Approach                     | Isolation                 | Complexity | Browser Support                        |
| :--------------------------- | :------------------------ | :--------- | :------------------------------------- |
| Global styles                | None (global)             | Low        | All                                    |
| Instance‑specific classes    | Per‑instance              | Medium     | All                                    |
| Shadow DOM                   | Full encapsulation        | High       | All modern                             |
| CSS Modules                  | Scoped class names        | Medium     | All (requires bundler)                 |
| **`@scope` with `cssScope`** | **No leak into children** | **Low**    | **Chrome 118+, Safari 17.4+, FF 128+** |
