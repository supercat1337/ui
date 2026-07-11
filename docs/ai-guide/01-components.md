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

BareDOM provides multiple ways to style your components – from global CSS to fully encapsulated Shadow DOM. These are now covered in a dedicated guide:

👉 **[Styling Components](./05-styling.md)** – learn about `static styles`, `@scope` with `cssScope`, CSS Modules, Shadow DOM, and more.

## Recommended: External HTML Templates for Layouts

For better maintainability and separation of concerns, it is strongly recommended to store your component layouts in separate `.html` files and import them as strings. This approach works seamlessly with both server‑side rendering (SSR) and client‑side hydration.

**Example:**

```html
<!-- MyComponent.template.html -->
<div class="card" data-ref="card">
    <h2 data-ref="title"></h2>
    <div data-slot="content"></div>
</div>
```

```js
// MyComponent.js
import template from './MyComponent.template.html';

class MyComponent extends Component {
    static layout = template;
    // ...
}
```

### Important: Static Layout Does Not Support Interpolation

A static `layout` (whether defined inline as a string or imported from a `.html` file) is **not** a template function — it does **not** support JavaScript interpolation (`${...}`). It is a plain HTML string. To insert dynamic content, either use `data-ref` and update it in `connectedCallback`, or use an instance layout as a function (see [Layouts & Refs](./02-layouts-refs.md)).

### Build Setup with esbuild

To enable importing `.html` files as strings, configure **esbuild** with a simple plugin:

```js
// esbuild.config.js
import fs from 'fs';

export const htmlPlugin = () => ({
    name: 'html',
    setup(build) {
        build.onLoad({ filter: /\.html$/ }, async args => {
            const contents = await fs.promises.readFile(args.path, 'utf8');
            return { contents: JSON.stringify(contents), loader: 'text' };
        });
    },
});
```

Add this plugin to your esbuild configuration. Then all `.html` imports will return the raw HTML string, ready to be used as `layout` (whether static or instance‑level).

**Why this is recommended:**

- Keeps HTML separate from JavaScript logic.
- Improves readability and editor support (syntax highlighting, formatting).
- Works identically on server and client – the string is parsed by the BareDOM engine.
- Easy to cache and optimise with esbuild’s build pipeline.

> **Note:** You may also use this technique with other bundlers (Webpack, Rollup, Vite) using similar loaders/plugins.

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

| Method                          | Description                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectedCallback()`           | Lifecycle hook called after the component is mounted. Override to add event listeners, fetch data, etc.                                                                   |
| `disconnectedCallback()`        | Lifecycle hook called just before unmounting. Override to clean up external resources.                                                                                    |
| `restoreCallback(data)`         | Lifecycle hook called during hydration with server‑provided data (before the DOM is ready).                                                                               |
| `on(event, callback)`           | Subscribes to a custom or lifecycle event. Returns an unsubscribe function.                                                                                               |
| `once(event, callback)`         | Subscribes to an event for one invocation only. Returns an unsubscribe function.                                                                                          |
| `emit(event, context)`          | Emits an event with optional context data.                                                                                                                                |
| `$on(element, event, callback)` | Attaches a DOM event listener that is automatically removed when the component unmounts. `event` can be any string (standard or custom). Returns an unsubscribe function. |
| `getUnmountSignal()`            | Returns an `AbortSignal` that aborts when the component unmounts. Useful for cancelling fetch, timers, and event listeners.                                               |

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

### Important: Do Not Type `refsAnnotation` with JSDoc

When defining `refsAnnotation`, **do not** add a JSDoc type annotation (e.g., `@type {Record<string, ...>}`). TypeScript will automatically infer the precise type from the provided prototypes (e.g., `HTMLInputElement.prototype`). This gives you full type safety for `this.getRefs()` without any extra annotations.

✅ Correct:

```js
class MyComponent extends Component {
    refsAnnotation = {
        input: HTMLInputElement.prototype,
        button: HTMLButtonElement.prototype,
    };
    // The type of refs is inferred as { input: HTMLInputElement, button: HTMLButtonElement }
}
```

❌ Wrong:

```js
class MyComponent extends Component {
    /** @type {Record<string, any>} */ // unnecessary and breaks inference
    refsAnnotation = {
        input: HTMLInputElement.prototype,
        button: HTMLButtonElement.prototype,
    };
}
```

The same rule applies when using TypeScript – avoid explicit type annotations for `refsAnnotation`.
