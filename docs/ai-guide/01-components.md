---
title: BareDOM – Components
version: 2.0.0
tags: [component, api, class]
---

# Components

## The `Component` Class

All components inherit from the base `Component` class. You can pass an optional `options` object to the constructor.

```js
import { Component } from '@supercat1337/ui';

class MyComponent extends Component {
    // Every component must define a `layout` (see Layouts & Refs).
    layout = `<div>Hello</div>`;

    constructor() {
        super({ instanceId: 'my-id', sid: 'server-id' });
    }
}
```

> **Important:** A component without a `layout` cannot be mounted or rendered. The `layout` property is mandatory and defines the component's DOM structure.

### Static Layout (Recommended for Performance & SSR)

For components that should have the same structure for all instances, define `static layout` as a string. This layout is parsed once and cached, making it very efficient. It is also a good choice for components that participate in Server‑Side Rendering (SSR) when their structure does not depend on instance data.

```js
class MyButton extends Component {
    static layout = `<button class="btn">Click me</button>`;
}
```

If you need to render components on the server with data‑dependent layouts, see the [SSR Considerations](./02-layouts-refs.md#server-side-rendering-ssr-considerations) section in the Layouts guide.

### Options

| Option       | Type     | Description                                                      |
| ------------ | -------- | ---------------------------------------------------------------- |
| `instanceId` | `string` | Unique identifier for this instance (auto‑generated if omitted). |
| `sid`        | `string` | Server‑side identifier used during hydration.                    |

---

## Styling Components

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
**Cons:** Requires defining a Web Component; the `data-ref` system can still access shadow DOM elements (as shown in [Web Components Integration](./06-web-components.md)). This approach works natively in all modern browsers.

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

---

## Other Properties & Methods

### Properties (Getters)

| Property          | Type                | Description                                                                                       |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `instanceId`      | `string`            | Unique identifier for this component instance. Auto‑generated if not provided in the constructor. |
| `isConnected`     | `boolean`           | Returns `true` if the component is currently mounted in the DOM.                                  |
| `isCollapsed`     | `boolean`           | Returns `true` if the component is in a collapsed state (replaced by a placeholder).              |
| `parentComponent` | `Component \| null` | Returns the parent component, or `null` if this is a root component.                              |

### Core Methods

| Method                    | Description                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mount(container, mode?)` | Attaches the component to the DOM. `container` can be a selector, element, or function that returns an element. `mode` can be `'replace'` (default), `'append'`, `'prepend'`, or `'hydrate'`. |
| `unmount()`               | Removes the component from the DOM and cleans up all resources (listeners, teleports, etc.).                                                                                                  |
| `rerender()`              | Forces a full re‑render of the component. Use with caution – prefer updating specific refs instead.                                                                                           |
| `collapse()`              | Replaces the component's DOM content with a lightweight placeholder. The component’s state is preserved.                                                                                      |
| `expand()`                | Restores a collapsed component to its original DOM content.                                                                                                                                   |
| `expandForce()`           | Expands the component and all collapsed ancestors up to the root.                                                                                                                             |

### Layout & Refs

| Method                           | Description                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `setLayout(layout, annotation?)` | Assigns a new layout (string, function, or Node) and optionally updates the refs annotation.                             |
| `getRefs()`                      | Returns the map of referenced DOM elements (as defined by `refsAnnotation`).                                             |
| `hasRef(refName)`                | Checks if a ref with the given name exists.                                                                              |
| `updateRefs()`                   | Rescans the component’s DOM for `data-ref` elements and updates the internal refs map. Useful after dynamic DOM changes. |

### Slots & Composition

| Method                                              | Description                                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `getSlotNames()`                                    | Returns an array of slot names defined in the component.                                                                                     |
| `hasSlotContent(slotName)`                          | Returns `true` if the slot has any child components.                                                                                         |
| `clearSlotContent(slotName)`                        | Removes all child components from a slot. Returns `true` if the slot was cleared.                                                            |
| `getSlotElement(slotName)`                          | Returns the DOM element that serves as the slot container (the element with `data-slot`).                                                    |
| `addToSlot(slotName, componentOrComponents, mode?)` | Adds one or more components to a slot. `mode` can be `'append'`, `'prepend'`, or `'replace'`. Returns the component instance (for chaining). |
| `detachFromSlot()`                                  | Removes the component from its parent slot (if any). Returns `true` if detached.                                                             |

### Lifecycle & Events

| Method                          | Description                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `connectedCallback()`           | Lifecycle hook called after the component is mounted. Override to add event listeners, fetch data, etc.                     |
| `disconnectedCallback()`        | Lifecycle hook called just before unmounting. Override to clean up external resources.                                      |
| `restoreCallback(data)`         | Lifecycle hook called during hydration with server‑provided data (before the DOM is ready).                                 |
| `on(event, callback)`           | Subscribes to a custom or lifecycle event. Returns an unsubscribe function.                                                 |
| `once(event, callback)`         | Subscribes to an event for one invocation only. Returns an unsubscribe function.                                            |
| `emit(event, context)`          | Emits an event with optional context data.                                                                                  |
| `$on(element, event, callback)` | Attaches a DOM event listener that is automatically removed when the component unmounts. Returns an unsubscribe function.   |
| `getUnmountSignal()`            | Returns an `AbortSignal` that aborts when the component unmounts. Useful for cancelling fetch, timers, and event listeners. |

> **SSR Note:** When a component is rendered on the server (e.g., with Node.js without a DOM), lifecycle methods such as `connectedCallback`, `disconnectedCallback`, and `restoreCallback` are **not executed**. The server only generates the initial HTML structure. All client‑side logic should be placed inside these hooks, which will run in the browser after hydration. For server‑side data fetching, use separate methods or pass data through the constructor.

### Utilities

| Method                              | Description                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `serialize()`                       | Returns a plain object containing the component’s state (for SSR). Override to provide custom serialization.                                                |
| `getRootNode()`                     | Returns the root DOM element of the component.                                                                                                              |
| `removeOnUnmount(...elements)`      | Marks elements to be automatically removed from the DOM when the component unmounts.                                                                        |
| `queryLocal(tagName, selector?)`    | Searches for elements **only** within the current component’s direct DOM (excluding child components). Returns an array.                                    |
| `getComponentBySid(targetSid)`      | Finds a descendant component by its server ID (`sid`).                                                                                                      |
| `getHydrationData()`                | Returns the hydration data for this instance from the global manifest (if any).                                                                             |
| `reloadText()`                      | Triggers the registered text update function (useful for i18n).                                                                                             |
| `setTextUpdateFunction(func)`       | Registers a function to update text nodes when `reloadText()` is called.                                                                                    |
| `addDisposer(fn: () => void): void` | Registers a cleanup function that is automatically called when the component unmounts. Useful for timers, subscriptions, and third‑party library instances. |

---

## Core Methods in Detail

### `mount(container, mode?)`

Attaches the component to the DOM.

- `container`: `string` (CSS selector), `HTMLElement`, or a function that returns an element.
- `mode`: `'replace'` (default), `'append'`, `'prepend'`, or `'hydrate'`.

```js
const widget = new MyWidget();
widget.setLayout('<div>Hello world!</div>');
widget.mount('#app', 'append');
```

### `unmount()`

Removes the component from the DOM and cleans up all resources (event listeners, teleports, etc.).

### `rerender()`

Forces a full re‑render of the component. Use with caution – usually you should update only specific refs instead.

### `getUnmountSignal()`

Returns an `AbortSignal` that is aborted when the component is unmounted. This is a convenient way to automatically cancel asynchronous operations without manual cleanup.

```js
async connectedCallback() {
    const signal = this.getUnmountSignal();
    try {
        const response = await fetch('/api/data', { signal });
        // ...
    } catch (err) {
        if (err.name === 'AbortError') {
            // Request aborted because component unmounted
            return;
        }
        // handle other errors
    }
}
```

You can also use it with `addEventListener`:

```js
connectedCallback() {
    const signal = this.getUnmountSignal();
    window.addEventListener('resize', this.handleResize, { signal });
}
```

> **Note:** For simpler DOM event binding, consider using `$on` – it automatically handles cleanup.
