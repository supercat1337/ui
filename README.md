# @supercat1337/ui (BareDOM)

**The Surgical Component Engine for the Modern Web.**

[![npm version](https://img.shields.io/npm/v/@supercat1337/ui.svg)](https://www.npmjs.com/package/@supercat1337/ui)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@supercat1337/ui)](https://bundlephobia.com/package/@supercat1337/ui)
[![license](https://img.shields.io/npm/l/@supercat1337/ui)](https://github.com/supercat1337/ui/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@supercat1337/ui)](https://www.npmjs.com/package/@supercat1337/ui)

`@supercat1337/ui` is a structured **Vanilla JS** toolkit for developers who demand the architectural power of modern frameworks (Components, Slots, Lifecycle) without the abstraction tax of a Virtual DOM. It operates directly on the **Native DOM**, offering unparalleled performance and total transparency.

- **Zero dependencies**
- **< 5KB gzipped**
- **Type-safe with JSDoc + runtime validation**
- **Isomorphic (SSR-ready)**
- **Built-in teleports (portals), event system, and utilities**

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Philosophy](#philosophy-surgical-vs-reactive)
- [Core Concepts](#core-concepts)
    - [Component](#component)
    - [Layouts](#layouts)
    - [Refs & Type Safety](#refs--type-safety)
    - [Slots & Composition](#slots--composition)
    - [Lifecycle Hooks](#lifecycle-hooks)
    - [Events](#events)
    - [Teleports (Portals)](#teleports-portals)
- [Utility Functions](#utility-functions)
- [Examples](#examples)
- [API Reference](#api-reference)
- [License](#license)

---

## Installation

```bash
npm install @supercat1337/ui
```

Or directly from GitHub:

```bash
npm install https://github.com/supercat1337/ui.git
```

---

## Quick Start

Create an interactive counter component:

```js
import { Component, html } from '@supercat1337/ui';

class Counter extends Component {
    // Define layout with a data-ref for dynamic elements
    layout = html`
        <div>
            <p>Count: <span data-ref="countSpan">0</span></p>
            <button data-ref="incrementBtn">Increment</button>
        </div>
    `;

    // Type annotation for refs (enables autocompletion + runtime checks)
    refsAnnotation = {
        countSpan: HTMLSpanElement.prototype,
        incrementBtn: HTMLButtonElement.prototype,
    };

    // Component state
    count = 0;

    // Called after the component is mounted to the DOM
    connectedCallback() {
        const { incrementBtn, countSpan } = this.getRefs();
        incrementBtn.addEventListener('click', () => {
            this.count++;
            countSpan.textContent = this.count;
        });
    }
}

// Mount the component to document.body (replaces content)
new Counter().mount(document.body, 'replace');
```

---

## Philosophy: Surgical vs. Reactive

Most frameworks follow a "Top-Down" approach: State Change → Re-render Tree → Diff Virtual DOM → Update Real DOM.

**Our Surgical DOM approach changes the game:**

1. **Target:** Precisely identify elements using `data-ref` attributes.
2. **Action:** Attach listeners and update properties directly via JavaScript.
3. **Result:** Zero diffing overhead, minimal CPU usage, and absolute clarity on when and where the DOM changes.

You get the structure of a framework without the bloat – just pure, transparent DOM manipulation.

---

## Core Concepts

### Component

Every component extends the base `Component` class. The constructor accepts an optional `options` object with an `instanceId` (auto-generated if omitted).

```js
class MyComponent extends Component {
    constructor() {
        super({ instanceId: 'my-unique-id' }); // optional
    }
}
```

### Layouts

A component’s appearance is defined by its `layout` property. It can be:

- A **string** (parsed as HTML)
- A **function** that returns a `Node` or `string`
- A **Node** (e.g., `DocumentFragment`, `HTMLElement`)

Use the `html` tagged template to create `DocumentFragment` efficiently.

```js
// Static layout
layout = html`<div data-ref="box">Hello</div>`;

// Dynamic layout (re‑evaluated on every render)
layout = () => html`<div>${new Date().toLocaleTimeString()}</div>`;

// Direct DOM node
layout = document.createElement('div');
```

You can also set the layout programmatically with `setLayout(layout, annotation?)` or `setRenderer(layout, annotation?)` (synonym).

### Refs & Type Safety

Elements marked with `data-ref="name"` become accessible via `this.getRefs()`. To enable IDE autocompletion and runtime validation, define `refsAnnotation` as an object mapping ref names to their expected prototype.

```js
refsAnnotation = {
  searchInput: HTMLInputElement.prototype,
  submitBtn: HTMLButtonElement.prototype,
};

connectedCallback() {
  const refs = this.getRefs();
  // Autocompletion for .value and .addEventListener
  refs.submitBtn.onclick = () => console.log(refs.searchInput.value);
}
```

If a ref is missing at runtime, the library throws a descriptive error immediately.

### Slots & Composition

Components can contain **slots** – placeholders where child components can be inserted. Define a slot with `data-slot="slotName"`.

```js
// Parent component
class Parent extends Component {
    layout = html`
        <div class="card">
            <header data-slot="header"></header>
            <main data-slot="content"></main>
        </div>
    `;

    constructor() {
        super();
        this.addComponentToSlot('header', new Header());
        this.addComponentToSlot('content', new DynamicContent());
    }
}
```

Slot management methods:

- `addComponentToSlot(slotName, ...components)`
- `getSlotNames()`
- `hasSlotContent(slotName)`
- `clearSlotContent(slotName)`

### Lifecycle Hooks

Override these methods to run code at specific moments:

| Method                   | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| `connectedCallback()`    | Called after the component is mounted to the DOM.                     |
| `disconnectedCallback()` | Called just before unmounting. Good for cleanup.                      |
| `update(...args)`        | Called when you manually invoke `update()` (no automatic reactivity). |

Additionally, you can subscribe to lifecycle events using:

- `onConnect(callback)`
- `onDisconnect(callback)`
- `onMount(callback)`
- `onBeforeUnmount(callback)`
- `onUnmount(callback)`
- `onCollapse(callback)`
- `onExpand(callback)`
- `onPrepareRender(callback)`

### Events

Components include a built-in event emitter for custom communication:

```js
// Emit an event
this.emit('userLoggedIn', { name: 'Alice' });

// Listen for events
const unsubscribe = this.on('userLoggedIn', user => {
    console.log('Welcome', user.name);
});

// Remove listener
unsubscribe();
```

For DOM events that should auto‑cleanup on unmount, use `$on(element, event, callback)`.

```js
this.$on(this.getRefs().myButton, 'click', () => { ... });
// Listener is automatically removed when component disconnects
```

### Teleports (Portals)

Render a fragment of UI into an arbitrary DOM node (e.g., `document.body`) while keeping it logically attached to the component. Define teleports in the `teleports` property.

```js
class Modal extends Component {
    teleports = {
        modal: {
            layout: () => html`
                <div class="modal-overlay">
                    <div class="modal-content" data-ref="content">Hello</div>
                </div>
            `,
            target: document.body, // or a selector like '#portal', or a function
            strategy: 'append', // 'append' | 'prepend' | 'replace'
        },
    };

    connectedCallback() {
        this.getRefs().content; // still accessible!
    }
}
```

Teleports are automatically created/destroyed with the component.

### Hydration (SSR)

To attach logic to server‑rendered HTML that already exists in the DOM, use `mount(container, 'hydrate')`. The component will reuse existing elements that match its layout structure.

```html
<!-- Server‑rendered HTML -->
<div data-instance-id="my-counter">
    <span data-ref="countSpan">42</span>
    <button data-ref="incBtn">+</button>
</div>
```

```js
// Client‑side hydration
const counter = new Counter();
counter.mount(document.querySelector('[data-instance-id="my-counter"]'), 'hydrate');
```

The `instanceId` can be passed in the constructor or auto‑generated.

---

## Utility Functions

The library ships with a rich set of DOM and general utilities:

| Function                                                          | Description                                       |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| `DOMReady(callback, doc?)`                                        | Executes callback when DOM is ready.              |
| `copyToClipboard(text)`                                           | Copies text to clipboard (Promise).               |
| `createPaginationArray(current, total, delta?, gap?)`             | Returns array of page numbers with gaps.          |
| `delegateEvent(eventType, ancestor, selector, listener)`          | Attaches a delegated event listener.              |
| `escapeHtml(unsafe)`                                              | Escapes &, <, ", ' for safe HTML interpolation.   |
| `fadeIn(element, duration?, window?)`                             | Fades in an element.                              |
| `fadeOut(element, duration?, window?)`                            | Fades out an element.                             |
| `formatBytes(bytes, decimals?, lang?, sizes?)`                    | Human‑readable file size.                         |
| `formatDate(unix_timestamp)`                                      | Localized date string.                            |
| `formatDateTime(unix_timestamp)`                                  | Localized date + time.                            |
| `getDefaultLanguage()`                                            | Returns user's language (or 'en').                |
| `hideElements(...elements)`                                       | Adds `d-none` class.                              |
| `html` (tagged template)                                          | Creates `DocumentFragment` from template.         |
| `injectCoreStyles(doc?)`                                          | Injects minimal CSS (`.d-none`, `html-fragment`). |
| `isDarkMode(window?)`                                             | Detects prefers‑color‑scheme: dark.               |
| `removeSpinnerFromButton(button)`                                 | Removes spinner element.                          |
| `renderPaginationElement(current, total, urlRenderer?, onClick?)` | Returns a Bootstrap‑style pagination `<ul>`.      |
| `scrollToBottom(element)`                                         | Scrolls element to bottom.                        |
| `scrollToTop(element)`                                            | Scrolls element to top.                           |
| `showElements(...elements)`                                       | Removes `d-none` class.                           |
| `showSpinnerInButton(button, className?, doc?)`                   | Adds a spinner (Bootstrap style).                 |
| `sleep(ms)`                                                       | Promise‑based delay.                              |
| `ui_button_status_waiting_off(button, text)`                      | Restores button after waiting.                    |
| `ui_button_status_waiting_off_html(button, html)`                 | Restores with HTML content.                       |
| `ui_button_status_waiting_on(button, text)`                       | Disables button and shows spinner.                |
| `unixtime(dateObject?)`                                           | Returns current Unix time in seconds.             |
| `unsafeHTML(html)`                                                | Marks string as safe (bypasses escaping).         |
| `withMinimumTime(promise, minTime)`                               | Ensures promise takes at least `minTime` ms.      |

**Utility Classes**

- `SlotToggler(component, slotNames, activeSlotName)` – Manages toggling between slots.
- `Toggler` – Generic toggler for any set of items.

---

## Examples

Explore the [examples directory](./examples) for complete, runnable demos. Each example focuses on a specific feature:

| Folder                   | Name                    | Key Concept                                                                                                                  |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `01-layout-diversity`    | **Layout Diversity**    | Using strings, functions, and DOM nodes as layouts.                                                                          |
| `02-interactive-counter` | **Interactive Counter** | State, events, and `getRefs()`.                                                                                              |
| `03-todo-list`           | **Todo List**           | Complex state and dynamic re‑rendering.                                                                                      |
| `04-lifecycle-async`     | **Lifecycle & Async**   | Fetching data with `connectedCallback`.                                                                                      |
| `05-hydration`           | **Client Hydration**    | Attaching logic to existing HTML.                                                                                            |
| `06-ssr-generator`       | **Isomorphic SSR**      | Full Node.js server‑side rendering.                                                                                          |
| `07-lazy-loading`        | **Lazy Loading**        | Dynamic imports and slot placeholders.                                                                                       |
| `08-css-modules`         | **CSS Modules**         | Style encapsulation in ESM.                                                                                                  |
| `09-native-css-scripts`  | **Native CSS Scripts**  | Direct CSSOM manipulation.                                                                                                   |
| `10-instance-theming`    | **Component Theming**   | CSS modifiers and `adoptedStyleSheets`.                                                                                      |
| `11-event-interop`       | **Event Interop**       | Component communication via `on`/`emit`.                                                                                     |
| `12-slot-toggler-utils`  | **UI Utilities**        | High‑level UI logic helpers.                                                                                                 |
| `13-teleports`           | **Logical Teleports**   | Rendering fragments to external DOM nodes.                                                                                   |
| `14-teleport-hydration`  | **Teleport Hydration**  | Hydrating teleported SSR markup.                                                                                             |
| `15-nested-portals`      | **Nested Portals**      | Rendering components with portals inside portals, preserving logical hierarchy and unified refs across multiple DOM targets. |
| `16-web-components`      | **Web Components Integration** | Using custom elements with Shadow DOM inside BareDOM components and accessing their internal refs via the unified refs system. |

To run examples locally:

```bash
npm install
npm run examples
```

For SSR examples (06), navigate to the folder and run `node server.js`.

---

## API Reference

For a complete API reference, please refer to the [TypeScript definitions](./index.d.ts) (included in the package) or browse the source.

Key methods and properties of `Component`:

- `mount(container: Element, mode?: 'replace' | 'append' | 'prepend' | 'hydrate'): void`
- `unmount(): void`
- `rerender(): void`
- `collapse(): void` / `expand(): void` / `expandForce(): void`
- `show(): void` / `hide(): void`
- `getRefs(): T` (where T matches your `refsAnnotation`)
- `getRef(refName: string): HTMLElement`
- `hasRef(refName: string): boolean`
- `updateRefs(): void`
- `reloadText(): void` (calls the text update function)
- `setTextUpdateFunction(func: ((component: Component) => void) | null): void`
- `removeOnUnmount(...elements: Element[]): void`
- `searchElements(tagName: string, querySelector?: string): Element[]`
- `getRootNode(): HTMLElement`
- `parentComponent: Component | null`

---

## License

MIT © [supercat1337](https://github.com/supercat1337)