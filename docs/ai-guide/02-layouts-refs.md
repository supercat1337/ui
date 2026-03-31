---
title: BareDOM – Layouts & Refs
version: 2.0.0
tags: [layout, refs, html, template]
---

# Layouts

The `layout` property defines the component's appearance. **It is mandatory** – a component without a `layout` cannot be mounted or rendered.

In BareDOM, you can define layouts at two levels: **Static (Class-level)** for maximum performance and **Instance-level** for maximum flexibility.

## Static vs Instance Layouts

### Static Layout (Recommended)

Defined using the `static` keyword. This is the **Blueprint** for all instances of the class.

- **Performance:** The HTML string is parsed into a `DocumentFragment` **only once** for the entire class and cached. Every new instance simply clones this fragment.
- **Requirement:** Must be a **String** (usually created with the `html` tag). This requirement allows the engine to use a high-performance caching strategy. By providing a static string, the template is parsed into a `DocumentFragment` once and stored in a private global cache (using `WeakMap`). This "blueprint" is then cloned for every new instance, which is significantly faster than re-parsing or handling unique DOM nodes for every component.
- **SSR:** Ideal for Server-Side Rendering as the structure is available without creating an instance.

```js
class MyButton extends Component {
    static layout = html`<button class="btn"><slot></slot></button>`;
}
```

### Instance Layout

Defined as a regular property. It **overrides** the static layout for a specific instance.

- **Flexibility:** Use this when a specific component needs a unique structure or dynamic generation.
- **Types:** Can be a **String**, a **Function** (called on every render), or a **DOM Node**.

```js
// Unique layout for this specific instance
const uniqueBtn = new MyButton();
uniqueBtn.layout = html`<button class="special-btn">Special</button>`;
```

---

## Template Helpers

BareDOM provides specialized helpers to construct your layouts efficiently.

### `html` (String-based)

A tagged template literal that returns a **sanitized string**.

- **Use case:** High-performance rendering and **SSR**.
- **Behavior:** Automatically escapes values to prevent XSS.
- **Recommendation:** Always prefer `html` for layouts. While `htmlDOM` is available, using it inside a layout function is usually unnecessary because the engine will eventually convert your string to DOM anyway. Using strings (`html`) is faster and ensures SSR compatibility.

```js
const header = title => html`<h1>${title}</h1>`;
// Returns a string: "<h1>...</h1>"
```

### `htmlDOM` (Node-based)

A helper that parses a template string and returns a live **DocumentFragment**.

- **Use case:** Manual DOM manipulation or when you need to work with real nodes immediately.
- **Behavior:** Internally uses `html` to build the string and then converts it to DOM nodes.
- **SSR:** Not suitable for Server-Side Rendering because it produces DOM nodes.

```js
const fragment = htmlDOM`<div>Live Node</div>`;
document.body.appendChild(fragment);
```

### `unsafeHTML`

Wraps a string in a `SafeHTML` object to bypass automatic escaping.

- **Warning:** Use only for trusted content.

---

## Layout Resolution Priority

When a component is rendered, the engine looks for the layout in the following order:

1.  **Instance `layout`**: If defined (as string, function, or node), it is used.
2.  **Static `layout`**: If no instance layout exists, the class-level static blueprint is used.
3.  **Fallback**: If neither is defined, an error is thrown.

---

## Caching Mechanism (Under the Hood)

To ensure peak performance, BareDOM uses a multi-level caching strategy:

1.  **Global Cache (`WeakMap`):** Static layouts are parsed once and stored in a private `WeakMap` keyed by the class constructor. This prevents naming collisions between different component types and avoids memory leaks.
2.  **Instance Cache:** If a static string is provided to an instance, it is cached locally after the first parse.
3.  **No Cache for Functions:** If your `layout` is a function, it is **never cached**. It is re-executed on every render to ensure your UI stays in sync with the latest data.

---

## Server-Side Rendering (SSR) Considerations

When building components that need to be rendered on the server (e.g., using Node.js or PHP), follow these guidelines to ensure compatibility and correct hydration.

### 1. Prefer Static Layout

- Always define `static layout` as a **string** (using `html` tag or plain string). This allows the server to extract the template without instantiating the component.
- Static layouts are **deterministic** – they produce the same HTML on both server and client, avoiding hydration mismatches.

### 2. Instance Layout for SSR

If you need to override the layout for a specific instance on the server, ensure it is:

- A **string** (e.g., `html` template)
- A **function that returns a string**
- **Safe to execute on the server**: no access to DOM APIs (`document`, `window`), no browser‑specific globals.

You can detect the environment using `Config.isSSR` to conditionally avoid client‑only code:

```js
import { Config } from '@supercat1337/ui';

class MyComponent extends Component {
    layout = () => {
        if (Config.isSSR) {
            return html`<div>Server-side version</div>`;
        }
        return htmlDOM`<div>Client-side version</div>`;
    };
}
```

### 3. Avoid `htmlDOM` in SSR

- `htmlDOM` returns a `DocumentFragment` with live DOM nodes, which cannot be serialized to HTML on the server. Use `html` (string-based) instead.

### 4. Keep Layouts Pure

- Layouts should describe **structure**, not behaviour. Event handlers, subscriptions, and data fetching belong in lifecycle methods (`connectedCallback`, etc.).
- Inline event handlers (e.g., `onclick="..."`) are strongly discouraged – they break separation of concerns and make hydration error‑prone.

### 5. Hydration Consistency

- The HTML generated on the server must match the DOM structure produced by the client after hydration. Any difference (e.g., using a different layout on the client) can cause errors.
- Always use the **same layout definition** (preferably static) on both sides for components that participate in SSR.

### 6. BareDOM is a Thin Layer over HTML

BareDOM does **not** provide built-in data binding or reactive templates (like Vue or React). The `{{name}}` syntax used in examples represents placeholders that should be replaced by your **server-side engine** (Node.js, PHP, Python) **before** the component reaches the browser. Once the component is mounted in the browser, all interactivity and dynamic updates must be handled manually within `connectedCallback` using Refs.

### Example: SSR‑Safe Component

```js
class UserCard extends Component {
    static layout = html`
        <div data-ref="card">
            <h3>{{name}}</h3>
            <p>{{email}}</p>
            <button data-ref="deleteBtn">Delete</button>
        </div>
    `;

    refsAnnotation = {
        card: HTMLDivElement.prototype,
        deleteBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        const { deleteBtn } = this.getRefs();
        deleteBtn.onclick = () => this.remove();
    }
}
```

---

## Refs

Elements marked with `data-ref="name"` become accessible via `this.getRefs()`. For type safety and runtime validation, define `refsAnnotation`.

```js
class MyComponent extends Component {
    refsAnnotation = {
        searchInput: HTMLInputElement.prototype,
        submitBtn: HTMLButtonElement.prototype,
    };

    layout = html`
        <input data-ref="searchInput" type="text" />
        <button data-ref="submitBtn">Submit</button>
    `;

    connectedCallback() {
        // You can either use the refs object directly...
        const refs = this.getRefs();
        refs.submitBtn.onclick = () => console.log(refs.searchInput.value);

        // ...or destructure for a cleaner look (especially when using many refs)
        const { searchInput, submitBtn } = this.getRefs();
        submitBtn.onclick = () => console.log(searchInput.value);
    }
}
```

> **Note:** The `refsAnnotation` expects a mapping where the value is the **prototype** of the expected DOM element (e.g., `HTMLButtonElement.prototype`, `HTMLInputElement.prototype`). This enables both static type checking (in your editor) and runtime validation (if enabled).

If a ref is missing, the library throws an error. Use `hasRef(refName)` to check.

### Updating Refs Dynamically

If you modify the DOM after initial render (e.g., via `innerHTML`), call `updateRefs()` to rescan for `data-ref` elements.

```js
this.getRefs().container.innerHTML = '<span data-ref="newSpan">New</span>';
this.updateRefs(); // now `newSpan` is available
```

> **Important:** Since BareDOM is not reactive, if you manually change the structure of your component (e.g., by setting `innerHTML`), the existing refs will **not** update automatically. You must call `this.updateRefs()` to rescan the DOM and re‑bind your `refsAnnotation` to the new elements.
> // now `newSpan` is available

### Runtime Ref Validation

By default, the library performs runtime validation for every ref you declare in `refsAnnotation`. If a ref is missing when `getRefs()` is called, an error is thrown. This helps catch mistakes during development.

In production, you can disable this validation for a small performance boost. Set the global flag `Config.checkRefsFlag = false`. This must be done before any components are mounted.

```js
import { Config } from '@supercat1337/ui';

// Disable runtime ref checks (e.g., in production builds)
Config.checkRefsFlag = false;
```

Even with validation disabled, static typing (via `refsAnnotation`) continues to work in your IDE, so you still get autocompletion and type checking during development. Runtime validation only adds a safeguard that can be safely turned off in production.

## How Refs Are Collected (Scope Boundaries)

BareDOM components generate **light DOM** – the markup is inserted directly into the document, not into a shadow root. To keep refs isolated between components, the library defines **scope boundaries** using two special attributes:

- `data-component-root` – automatically added to the root element of every component instance.
- `data-slot` – marks a slot container (a point where child components can be inserted).

When the library scans for `data-ref` elements, it only looks **within the current component's scope**. It does not traverse into elements that belong to child components (i.e., elements that have `data-component-root` or are inside a `data-slot` that belongs to a child). This means:

- Refs defined inside a child component are **not visible** to the parent component.
- Refs with the same name in different components do not conflict.

### Visual Example

```html
<!-- Parent component root (data-component-root) -->
<div data-component-root="parent">
    <button data-ref="btn">Parent button</button>
    <div data-slot="slot"></div>
    <!-- Child component inserted into slot -->
    <div data-component-root="child">
        <button data-ref="btn">Child button</button>
    </div>
</div>
```

- The parent component’s `getRefs()` will contain `btn` pointing to the parent button.
- The child component’s `getRefs()` will contain `btn` pointing to the child button.
- They are completely isolated.

### Why This Matters

- **No naming collisions** – you can use the same ref name in different components without worry.
- **Encapsulation** – child components are black boxes; their internals don't leak.
- **Performance** – the scanner stops at boundaries, avoiding unnecessary traversals.

If you need to access elements inside a child component (for example, a Web Component's shadow root), you can explicitly add those roots to `this.$internals.additionalRoots` as shown in the [Web Components Integration](./06-web-components.md) guide.

```

```
