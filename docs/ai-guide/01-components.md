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
    layout = `<div class="card"><div class="card-title">Title</div></div>`;
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

### Which Approach Should You Choose?

- **For simple components that don't need isolation:** Use `static styles` or a `<style>` tag in the layout (global styles).
- **For components with per‑instance theming:** Use `instanceId` to generate unique class names/IDs.
- **For reusable widgets that must be fully isolated:** Consider using a Web Component with Shadow DOM inside your BareDOM component.
- **If you already have a bundler and want scoped CSS:** CSS Modules are a great fit.

All native approaches (1–3) work without any build step, making them ideal for projects that avoid complex tooling.

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

| Method                          | Description                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `connectedCallback()`           | Lifecycle hook called after the component is mounted. Override to add event listeners, fetch data, etc.                   |
| `disconnectedCallback()`        | Lifecycle hook called just before unmounting. Override to clean up external resources.                                    |
| `restoreCallback(data)`         | Lifecycle hook called during hydration with server‑provided data (before the DOM is ready).                               |
| `on(event, callback)`           | Subscribes to a custom or lifecycle event. Returns an unsubscribe function.                                               |
| `once(event, callback)`         | Subscribes to an event for one invocation only. Returns an unsubscribe function.                                          |
| `emit(event, context)`          | Emits an event with optional context data.                                                                                |
| `$on(element, event, callback)` | Attaches a DOM event listener that is automatically removed when the component unmounts. Returns an unsubscribe function. |

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
