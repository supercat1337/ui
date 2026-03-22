# BareDOM – Surgical Direct DOM Components

**The Surgical Direct DOM Component Engine for the Modern Web.**

[![npm version](https://img.shields.io/npm/v/@supercat1337/ui.svg)](https://www.npmjs.com/package/@supercat1337/ui)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@supercat1337/ui)](https://bundlephobia.com/package/@supercat1337/ui)
[![license](https://img.shields.io/npm/l/@supercat1337/ui)](https://github.com/supercat1337/ui/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@supercat1337/ui)](https://www.npmjs.com/package/@supercat1337/ui)

`BareDOM` (published as `@supercat1337/ui`) is a structured Vanilla JS toolkit for developers who demand the architectural power of modern frameworks (Components, Slots, Lifecycle) without the abstraction tax of a Virtual DOM. It operates directly on the **Native DOM**, offering unparalleled performance and total transparency.

- **Lightweight** (core ~5kB gzipped, plus two small dependencies)
- **Type-safe with JSDoc + runtime validation**
- **Isomorphic (SSR-ready)**
- **Built-in teleports, event system, and utilities**

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Philosophy: Surgical Direct DOM vs. Reactive](#philosophy-surgical-direct-dom-vs-reactive)
- [Core Concepts](#core-concepts)
    - [Component](#component)
    - [Layouts](#layouts)
    - [Refs & Type Safety](#refs--type-safety)
    - [Slots & Composition](#slots--composition)
    - [Lifecycle Hooks](#lifecycle-hooks)
    - [Events](#events)
    - [Teleports (Portals)](#teleports-portals)
    - [Web Components Integration](#web-components-integration)
    - [Hydration (SSR)](#hydration-ssr)
- [Utility Functions](#utility-functions)
- [Utility Classes](#utility-classes)
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

```js
import { Component, html } from '@supercat1337/ui';

class Header extends Component {
    // Defined a semantic layout with Bootstrap-like utility classes
    layout = html`
        <div class="d-flex justify-content-between p-3 border-bottom">
            <h2>My App</h2>
            <button class="btn btn-outline-secondary" data-ref="refreshBtn">Refresh</button>
        </div>
    `;

    // Runtime validation for references
    refsAnnotation = { refreshBtn: HTMLButtonElement.prototype };

    connectedCallback() {
        const { refreshBtn } = this.getRefs();

        refreshBtn.onclick = () => location.reload();

        // Or use $on for auto-cleanup.
        // This avoids memory leaks when the header is unmounted.
        this.$on(refreshBtn, 'click', () => location.reload());
    }
}

class DynamicBody extends Component {
    // Functional layout that re-evaluates on every rerender()
    layout = () => html`
        <div class="p-3"><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
    `;

    connectedCallback() {
        // Use addDisposer to ensure the interval is cleared when component unmounts
        const timerId = setInterval(() => this.rerender(), 1000);
        this.addDisposer(() => clearInterval(timerId));
    }
}

class App extends Component {
    // Define slots for composition
    layout = html`
        <div class="app-wrapper">
            <header data-slot="header"></header>
            <main data-slot="content"></main>
        </div>
    `;

    constructor() {
        super();
        // Compose the application using the Slot API
        this.addToSlot('header', new Header());
        this.addToSlot('content', new DynamicBody());
    }
}

const app = new App();
app.mount(document.body);
```

---

## Philosophy: Surgical Direct DOM vs. Reactive

Most modern frameworks follow a **“Top‑Down”** approach: state change → re‑render the whole tree → compute a diff against the virtual DOM → patch the real DOM.

**Our approach – Surgical Direct DOM** – turns this model upside down:

- **Direct DOM** – we work directly with real DOM nodes. No wrappers, no proxies, no virtual trees. The library is a thin layer between your code and the browser.
- **Surgical** – every update is targeted and predictable. You never re‑render an entire tree. Instead, you locate a specific element using a `data-ref` attribute, receive it with full type safety (thanks to `refsAnnotation`), and update exactly what needs to change.

| Feature        | Virtual DOM                      | Surgical Direct DOM                          |
| -------------- | -------------------------------- | -------------------------------------------- |
| Updates        | Whole tree → diff → patch        | Only the targeted element(s)                 |
| Performance    | Scales with tree size            | Constant time per update (O(1))              |
| Predictability | Hidden, diff‑algorithm dependent | Absolute – you control every change          |
| DOM access     | Through abstractions             | Direct, native element references            |
| Type safety    | Often weak or none               | Static + runtime checks via `refsAnnotation` |

**How it looks in code:**

```js
refsAnnotation = { countSpan: HTMLSpanElement.prototype };
connectedCallback() {
    const refs = this.getRefs(); // refs.countSpan is typed as HTMLSpanElement
    refs.countSpan.textContent = String(this.state.count); // surgical update
}
```

You don’t burden the browser with unnecessary work, you don’t wait for diff calculations, and you always know **when** and **where** the DOM changes. That’s the essence of **surgical precision** combined with **direct access**.

---

## Core Concepts

### Component

Every component extends the base `Component` class. The constructor accepts an optional `options` object with `instanceId` and `sid` (server-side identifier).

```js
class MyComponent extends Component {
    static styles = `/* optional CSS */`; // Adopted stylesheet
    constructor() {
        super({ instanceId: 'my-id' }); // optional
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

You can also set the layout programmatically with `setLayout(layout, annotation?)`.

### Refs & Type Safety

Elements marked with `data-ref="name"` become accessible via `this.getRefs()`. To enable IDE autocompletion and runtime validation, define `refsAnnotation` as an object mapping ref names to their expected prototype.

```js
refsAnnotation = {
    searchInput: HTMLInputElement.prototype,
    submitBtn: HTMLButtonElement.prototype,
};

connectedCallback() {
    const refs = this.getRefs();
    refs.submitBtn.onclick = () => console.log(refs.searchInput.value);
}
```

If a ref is missing at runtime, the library throws a descriptive error. Use `hasRef(refName)` to check, and `updateRefs()` to rescan after dynamic DOM changes.

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
        this.addToSlot('header', new Header());
        this.addToSlot('content', new DynamicContent());
    }
}
```

Slot management methods:

- `addToSlot(slotName, componentOrComponents, mode?)` – mode can be `'append'`, `'prepend'`, or `'replace'`.
- `getSlotNames()` – returns an array of slot names.
- `hasSlotContent(slotName)` – checks if a slot has any children.
- `clearSlotContent(slotName)` – removes all children from a slot.

### Lifecycle Hooks

Override these methods to run code at specific moments:

| Method                   | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| `connectedCallback()`    | Called after the component is mounted to the DOM.                   |
| `disconnectedCallback()` | Called just before unmounting. Good for cleanup.                    |
| `restoreCallback(data)`  | Called during hydration to restore state from server-provided data. |

Additionally, you can subscribe to lifecycle events using `this.on(eventName, callback)`. Available event names are:

- `'connect'` – after `connectedCallback`
- `'disconnect'` – after `disconnectedCallback`
- `'mount'` – after the component is fully inserted into the DOM
- `'unmount'` – after the component is removed from the DOM
- `'prepareRender'` – before the layout is rendered
- `'collapse'` – after the component collapses
- `'expand'` – after the component expands
- `'restore'` – after hydration state is restored

The hooks follow a **bottom‑up** order: child components are connected/disconnected before their parent, mirroring the natural DOM lifecycle.

```js
this.on('connect', () => console.log('Component connected'));
```

### Events

Components include a built-in event emitter for custom communication:

```js
// Emit an event
this.emit('userLoggedIn', { name: 'Alice' });

// Listen for events – callback receives (context, component)
const unsubscribe = this.on('userLoggedIn', ({ user }, component) => {
    console.log('Welcome', user.name);
    console.log('Event from component:', component.instanceId);
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
// @ts-check
import { Component, html } from '@supercat1337/ui';

export class ModalComponent extends Component {
    refsAnnotation = {
        openBtn: HTMLButtonElement.prototype,
        closeBtn: HTMLButtonElement.prototype,
        overlay: HTMLElement.prototype,
        title: HTMLElement.prototype,
    };

    // Main component layout (the "anchor" in the DOM)
    layout = () => html`
        <div class="modal-wrapper">
            <button data-ref="openBtn">Open Modal</button>
        </div>
    `;

    // Teleported overlay that lives elsewhere (e.g., document.body)
    teleports = {
        overlay: {
            layout: () => html`
                <div class="modal-overlay" data-ref="overlay">
                    <div class="modal-content">
                        <h2 data-ref="title">Settings</h2>
                        <button class="close-btn" data-ref="closeBtn">Close</button>
                    </div>
                </div>
            `,
            target: () => document.body,
            strategy: /** @type {const} */ ('append'),
        },
    };

    connectedCallback() {
        // All refs (from main layout AND teleports) are merged here!
        const refs = this.getRefs();

        refs.openBtn.onclick = () => this.show();
        refs.closeBtn.onclick = () => this.hide();

        refs.overlay.onclick = e => {
            if (e.target === refs.overlay) this.hide();
        };
    }

    show() {
        this.getRefs().overlay.classList.add('is-active');
    }

    hide() {
        this.getRefs().overlay.classList.remove('is-active');
    }
}

const modal = new ModalComponent();
modal.mount(document.getElementById('app'));
```

- `teleports` is an object where each key is a teleport name, and the value is a `TeleportConfig` with:
    - `layout`: a function returning the `DocumentFragment` to teleport.
    - `target`: an `Element`, a CSS selector, or a function that returns an `Element` where the teleported content will be inserted.
    - `strategy`: `'append'` (default), `'prepend'`, or `'replace'` to control how the content is inserted.
- All `data-ref` elements inside teleports are merged into the component’s main refs object, so you can access them with `this.getRefs()`.
- Teleports are automatically created and destroyed with the component.

### Web Components Integration

BareDOM components are not a replacement for native Web Components – they complement them. You can freely use custom elements with Shadow DOM inside a BareDOM layout and even access their internal `data-ref` elements through the unified refs system.

#### How it works

1. Define a Web Component with its own Shadow DOM, marking elements with `data-ref`.
2. Use the custom element in your BareDOM layout.
3. In the BareDOM component, subscribe to the `before-update-refs` event. Inside the callback, locate the custom element instance and push its `shadowRoot` into `this.$internals.additionalRoots`.
4. The library will then scan that shadow root for `data-ref` attributes and merge them into the component’s refs object.

#### Example

```js
// Define a Web Component with Shadow DOM
class FancyCard extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <h3 data-ref="cardTitle">Default Title</h3>
            <button data-ref="cardBtn">Click me</button>
        `;
    }
}
customElements.define('fancy-card', FancyCard);

// BareDOM component that uses it and accesses internal refs
export class WebComponentIntegration extends Component {
    refsAnnotation = {
        mainBtn: HTMLButtonElement.prototype, // light DOM ref
        cardTitle: HTMLHeadingElement.prototype, // shadow DOM ref
        cardBtn: HTMLButtonElement.prototype, // shadow DOM ref
    };

    layout = html`
        <div>
            <button data-ref="mainBtn">Main Button</button>
            <fancy-card></fancy-card>
        </div>
    `;

    constructor() {
        super();

        // Before refs are collected, add the custom element's shadowRoot
        // to the list of additional roots to scan.
        this.on('before-update-refs', () => {
            const fancyCard = this.getRootNode().querySelector('fancy-card');
            if (fancyCard?.shadowRoot) {
                this.$internals.additionalRoots.push(fancyCard.shadowRoot);
            }
        });
    }

    connectedCallback() {
        const refs = this.getRefs();
        // Now all refs (light + shadow) are available with full type information
        refs.mainBtn.onclick = () => (refs.cardTitle.textContent = 'Updated!');
        refs.cardBtn.onclick = () => alert('Shadow button clicked!');
    }
}
```

**Key benefits:**

- **Unified refs** – elements inside a Web Component’s Shadow DOM become accessible like any other ref.
- **Type safety** – include them in `refsAnnotation` for autocompletion and runtime validation.
- **Automatic cleanup** – event listeners attached with `$on` are removed when the component unmounts, even if they target shadow DOM elements.

> **Note:** The Web Component must be defined before the BareDOM component attempts to use it. The example defines it at the top of the module.

For a complete runnable example, see [`examples/16-web-components`](./examples/16-web-components).

### Hydration (SSR)

To attach logic to server‑rendered HTML that already exists in the DOM, use `mount(container, 'hydrate')`. The component will reuse existing elements that match its layout structure.

**Server‑side (simulated via hydration manifest):**

```html
<!-- index.html – server‑rendered HTML with hydration markers -->
<!doctype html>
<html lang="en">
    <head>
        <!-- Hydration manifest (populated by the server) -->
        <script>
            window.__HYDRATION_DATA__ = {
                'root.profile': {
                    data: {
                        userName: 'SuperCat 1337',
                        userStatus: 'Online (from SSR)',
                    },
                },
            };
        </script>
        <script type="importmap">
            { "imports": { "@supercat1337/ui": "../../dist/ui.bundle.esm.js" } }
        </script>
    </head>
    <body>
        <!-- The server‑rendered component root, marked with data‑sid and data‑component‑root -->
        <div
            id="ssr-widget"
            data-sid="root.profile"
            data-component-root="user-profile"
            class="card shadow"
            style="width: 22rem;"
        >
            <div class="card-body text-center">
                <h5 class="fw-bold" data-ref="title">Loading...</h5>
                <p class="text-muted small">
                    Status: <span data-ref="status" class="badge bg-secondary">Unknown</span>
                </p>
                <hr />
                <button class="btn btn-primary w-100" data-ref="actionBtn">
                    Wait for Hydration
                </button>
            </div>
        </div>

        <script type="module" src="./main.js" async></script>
    </body>
</html>
```

**Client‑side component:**

```js
// main.js
import { Component } from '@supercat1337/ui';

class HydratedWidget extends Component {
    refsAnnotation = {
        title: HTMLHeadingElement.prototype,
        status: HTMLSpanElement.prototype,
        actionBtn: HTMLButtonElement.prototype,
    };

    state = {
        userName: 'Guest',
        userStatus: 'Offline',
    };

    restoreCallback(data) {
        // Called automatically during hydration BEFORE the DOM is ready
        this.state.userName = data.userName;
        this.state.userStatus = data.userStatus;
    }

    connectedCallback() {
        // DOM is ready, attach logic using restored state
        const refs = this.getRefs();
        refs.title.textContent = this.state.userName;
        refs.status.textContent = this.state.userStatus;
        refs.status.className = 'badge bg-success';

        refs.actionBtn.onclick = () => {
            alert(`Hello, ${this.state.userName}!`);
        };
    }
}

const container = document.getElementById('ssr-widget');
if (container) {
    const widget = new HydratedWidget({ instanceId: 'user-profile', sid: 'root.profile' });
    widget.mount(container, 'hydrate');
}
```

**Key points:**

- The server must generate a hydration manifest (a JavaScript object keyed by component `sid`) containing the serialized state (`data`). This is typically injected as `window.__HYDRATION_DATA__`.
- Each component instance on the server must have a unique `sid` (server ID) that matches the `data-sid` attribute in the rendered HTML.
- The client component is instantiated with the same `instanceId` and `sid`. During `mount(..., 'hydrate')`, the library finds the existing DOM node, matches the manifest data, and calls `restoreCallback(data)` before the component is attached.
- After hydration, the component behaves as if it were rendered entirely on the client – events, refs, and state work normally.

This approach enables full isomorphism: render HTML on the server, hydrate it on the client, and retain interactivity without double‑rendering.

---

## Utility Functions

The library exports the following standalone utilities:

| Function                                                                             | Description                                                                             |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `DOMReady(callback, doc?)`                                                           | Executes callback when DOM is ready.                                                    |
| `copyToClipboard(text, wnd?)`                                                        | Copies text to clipboard using Clipboard API.                                           |
| `createManifestScript(manifest, variableName?)`                                      | Creates a `<script>` element with the hydration manifest.                               |
| `createPaginationArray(current, total, delta?, gap?)`                                | Returns array of page numbers with gaps.                                                |
| `createStorage(storage)`                                                             | Wraps `localStorage`/`sessionStorage` with JSON serialization and change subscriptions. |
| `debounce(func, wait, immediate?)`                                                   | Debounces a function; returns a cancellable version.                                    |
| `delegateEvent(eventType, ancestorElement, targetElementSelector, listenerFunction)` | Attaches a delegated event listener.                                                    |
| `escapeHtml(unsafe)`                                                                 | Escapes &, <, ", ' for safe HTML interpolation.                                         |
| `extractComponentStyles(doc?)`                                                       | Extracts CSS from all `<style>` elements in the document.                               |
| `fadeIn(element, duration?, wnd?)`                                                   | Fades in an element.                                                                    |
| `fadeOut(element, duration?, wnd?)`                                                  | Fades out an element.                                                                   |
| `formatBytes(bytes, decimals?, lang?, sizes?)`                                       | Human‑readable file size.                                                               |
| `formatDate(unix_timestamp)`                                                         | Localized date string.                                                                  |
| `formatDateTime(unix_timestamp)`                                                     | Localized date + time.                                                                  |
| `generateManifest(...rootComponents)`                                                | Generates a flat hydration map for SSR.                                                 |
| `getDefaultLanguage()`                                                               | Returns user's language (or 'en').                                                      |
| `hideElements(...elements)`                                                          | Adds `d-none` class.                                                                    |
| `html` (tagged template)                                                             | Creates `DocumentFragment` from template.                                               |
| `injectCoreStyles(doc?)`                                                             | Injects minimal CSS (`.d-none`, `html-fragment`).                                       |
| `isDarkMode(wnd?)`                                                                   | Detects prefers‑color‑scheme: dark.                                                     |
| `local`                                                                              | Wrapped `localStorage` with change subscriptions.                                       |
| `onClickOutside(element, callback)`                                                  | Calls callback when a click occurs outside the given element.                           |
| `removeSpinnerFromButton(button)`                                                    | Removes spinner element from a button.                                                  |
| `renderManifestHTML(manifest, variableName?)`                                        | Returns a string `<script>` tag for SSR.                                                |
| `renderPaginationElement(current, total, itemUrlRenderer?, onClickCallback?)`        | Returns a Bootstrap‑style pagination `<ul>`.                                            |
| `scrollToBottom(element)`                                                            | Scrolls element to bottom.                                                              |
| `scrollToTop(element)`                                                               | Scrolls element to top.                                                                 |
| `session`                                                                            | Wrapped `sessionStorage` with change subscriptions.                                     |
| `showElements(...elements)`                                                          | Removes `d-none` class.                                                                 |
| `showSpinnerInButton(button, customClassName?, doc?)`                                | Adds a spinner to a button.                                                             |
| `sleep(ms)`                                                                          | Promise‑based delay.                                                                    |
| `throttle(func, wait, options?)`                                                     | Throttles a function; returns a cancellable version.                                    |
| `ui_button_status_waiting_off(button, text)`                                         | Restores button after waiting.                                                          |
| `ui_button_status_waiting_off_html(button, html)`                                    | Restores with HTML content.                                                             |
| `ui_button_status_waiting_on(button, text)`                                          | Disables button and shows spinner.                                                      |
| `uniqueId(prefix?)`                                                                  | Generates a unique ID with an optional prefix.                                          |
| `unixtime(dateObject?)`                                                              | Returns current Unix time in seconds.                                                   |
| `unsafeHTML(html)`                                                                   | Marks string as safe HTML (bypasses escaping).                                          |
| `withMinimumTime(promise, minTime)`                                                  | Ensures promise takes at least `minTime` ms.                                            |

---

## Utility Classes

| Class                                                | Description                                               |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `SlotToggler(component, slotNames, activeSlotName?)` | Manages toggling between slots.                           |
| `Toggler()`                                          | Generic toggler for any set of items.                     |
| `Config`                                             | Configuration manager (SSR flags, hydration data access). |

---

## Examples

Explore the [examples directory](./examples) for complete, runnable demos. Each example focuses on a specific feature:

| Folder                      | Name                                  | Key Concept                                                                                                                    |
| --------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `01-layout-diversity`       | Layout Diversity                      | Using strings, functions, and DOM nodes as layouts.                                                                            |
| `02-interactive-counter`    | Interactive Counter                   | State, events, and `getRefs()`.                                                                                                |
| `03-todo-list`              | Todo List                             | Complex state and dynamic re‑rendering.                                                                                        |
| `04-lifecycle-async`        | Lifecycle & Async                     | Fetching data with `connectedCallback`.                                                                                        |
| `05-hydration`              | Client Hydration                      | Attaching logic to existing HTML.                                                                                              |
| `06-ssr-generator`          | Isomorphic SSR                        | Full Node.js server‑side rendering.                                                                                            |
| `07-lazy-loading`           | Lazy Loading                          | Dynamic imports and slot placeholders.                                                                                         |
| `08-css-modules`            | CSS Modules                           | Style encapsulation in ESM.                                                                                                    |
| `09-native-css-scripts`     | Native CSS Scripts                    | Direct CSSOM manipulation.                                                                                                     |
| `10-instance-theming`       | Component Theming                     | CSS modifiers and `adoptedStyleSheets`.                                                                                        |
| `11-event-interop`          | Event Interop                         | Component communication via `on`/`emit`.                                                                                       |
| `12-slot-toggler-utils`     | UI Utilities                          | High‑level UI logic helpers.                                                                                                   |
| `13-teleports`              | Logical Teleports                     | Rendering fragments to external DOM nodes.                                                                                     |
| `14-teleport-hydration`     | Teleport Hydration                    | Hydrating teleported SSR markup.                                                                                               |
| `15-nested-portals`         | Nested Portals                        | Rendering components with portals inside portals.                                                                              |
| `16-web-components`         | **Web Components Integration**        | Using custom elements with Shadow DOM inside BareDOM components and accessing their internal refs via the unified refs system. |
| `17-i18n`                   | Internationalization                  | Dynamic text updates without re‑rendering.                                                                                     |
| `18-utilities`              | Utility Functions                     | Debounce, throttle, uniqueId, onClickOutside, storage wrapper.                                                                 |
| `19-moving-components`      | Moving Components (Same Parent)       | Moving a component between slots.                                                                                              |
| `20-moving-between-parents` | Moving Components (Different Parents) | Transferring a component between parents.                                                                                      |

To run examples locally:

```bash
npm install
npm run examples
```

For SSR examples (06), navigate to the folder and run `node server.js`.

---

## API Reference

For a complete API reference, refer to the TypeScript definitions (`ui.esm.d.ts`) included in the package. Below are the most important methods and properties of the `Component` class.

### Component (public members)

| Property / Method                                                      | Description                                                                            |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `static styles: string \| CSSStyleSheet`                               | Optional CSS to be adopted by the component.                                           |
| `layout: (() => Node \| string) \| string \| Node`                     | The component’s layout.                                                                |
| `teleports: TeleportList`                                              | Map of teleport configurations.                                                        |
| `refsAnnotation: T`                                                    | Annotates `data-ref` elements with expected types.                                     |
| `get instanceId(): string`                                             | Unique identifier for this component instance.                                         |
| `get isConnected(): boolean`                                           | Whether the component is currently mounted.                                            |
| `reloadText(): void`                                                   | Calls the registered text update function (for i18n).                                  |
| `setTextUpdateFunction(func: (component: this) => void \| null): void` | Sets a function to update text nodes.                                                  |
| `setLayout(layout, annotation?): void`                                 | Assigns a new layout and optional ref annotation.                                      |
| `getRefs(): T`                                                         | Returns the map of referenced elements.                                                |
| `hasRef(refName): boolean`                                             | Checks if a ref exists.                                                                |
| `updateRefs(): void`                                                   | Rescans the DOM for `data-ref` elements.                                               |
| `serialize(): any`                                                     | Returns a plain object to be serialized for SSR.                                       |
| `on(event, callback): () => void`                                      | Subscribes to a component event.                                                       |
| `once(event, callback): () => void`                                    | Subscribes once.                                                                       |
| `emit(event, data): void`                                              | Emits a component event.                                                               |
| `$on(element, event, callback): () => void`                            | Attaches a DOM event that auto‑cleans on unmount.                                      |
| `addDisposer(fn: () => void): void`                                    | Registers a cleanup function that is automatically called when the component unmounts. |
| `connectedCallback(): void`                                            | Lifecycle hook (override).                                                             |
| `disconnectedCallback(): void`                                         | Lifecycle hook (override).                                                             |
| `restoreCallback(data): void`                                          | Lifecycle hook (override) for hydration.                                               |
| `mount(container, mode?): void`                                        | Mounts the component (`'replace'`, `'append'`, `'prepend'`, `'hydrate'`).              |
| `unmount(): void`                                                      | Removes the component from the DOM.                                                    |
| `rerender(): void`                                                     | Fully re‑renders the component.                                                        |
| `get isCollapsed(): boolean`                                           | Whether the component is collapsed.                                                    |
| `collapse(): void`                                                     | Collapses the component (replaces with placeholder).                                   |
| `expand(): void`                                                       | Expands a collapsed component.                                                         |
| `expandForce(): void`                                                  | Expands the component and all collapsed ancestors.                                     |
| `getSlotNames(): string[]`                                             | Returns an array of slot names.                                                        |
| `hasSlotContent(slotName: string): boolean`                            | Checks if a slot has any child components.                                             |
| `clearSlotContent(slotName: string): boolean`                          | Removes all child components from a slot. Returns `true` if the slot was cleared.      |
| `detachFromSlot(): boolean`                                            | Removes the component from its slot.                                                   |
| `addToSlot(slotName, componentOrComponents, mode?): this`              | Adds child component(s) to a slot.                                                     |
| `get parentComponent(): Component \| null`                             | Returns the parent component, if any.                                                  |
| `getRootNode(): HTMLElement`                                           | Returns the component’s root DOM element.                                              |
| `removeOnUnmount(...elements): void`                                   | Marks elements to be removed when component unmounts.                                  |
| `queryLocal(tagName, querySelector?): Element[]`                       | Searches only the component’s direct DOM (excludes child components).                  |
| `getComponentBySid(sid): Component \| null`                            | Finds a descendant component by its server ID.                                         |
| `getHydrationData(): any \| null`                                      | Retrieves hydration data for this instance.                                            |

---

## License

MIT © [Albert Bazaleev aka supercat1337](https://github.com/supercat1337)
