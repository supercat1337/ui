---
title: BareDOM – Layouts & Refs
version: 2.0.0
tags: [layout, refs, html, template]
---

# Layouts

The `layout` property defines the component's appearance. **It is mandatory** – a component without a `layout` cannot be mounted or rendered.

The `layout` can be:

- **String** – parsed as HTML.
- **Function** – returns a `Node` or `string`. The function is re‑evaluated on every render.
- **Node** – a `DocumentFragment`, `HTMLElement`, or any node.

Use the `html` tagged template to create `DocumentFragment` efficiently.

```js
// Static layout
layout = html`<div data-ref="box">Static</div>`;

// Dynamic layout (re‑evaluated on every render)
layout = () => html`<div>Time: ${new Date().toLocaleTimeString()}</div>`;

// Direct element
layout = document.createElement('div');
```

You can also set the layout programmatically with `setLayout(layout, annotation?)`.

> **Note:** If `layout` is a function, it is called every time the component is rendered (e.g., after `rerender()`). This is useful for dynamic content that depends on external state.

### Basic Usage

```js
import { html, unsafeHTML } from '@supercat1337/ui';

// Strings are escaped by default
const safe = html`<div>${'<script>alert("xss")</script>'}</div>`;
// Result: <div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>

// Use unsafeHTML to insert raw HTML
const raw = html`<div>${unsafeHTML('<strong>bold</strong>')}</div>`;
// Result: <div><strong>bold</strong></div>
```

### Handling Different Value Types

| Type                                  | Behaviour                                                                |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `null`, `undefined`, `false`          | Converted to empty string (they produce no output).                      |
| `number`, `boolean`, `string`         | Converted to string and escaped.                                         |
| `Element` (e.g., `HTMLElement`)       | The element is inserted directly (its `outerHTML` is used).              |
| `TextNode`, `CommentNode`             | Text nodes are inserted with escaped content; comment nodes are ignored. |
| `DocumentFragment`                    | Its children are appended to the fragment being built.                   |
| `SafeHTML` (returned by `unsafeHTML`) | The wrapped string is inserted as raw HTML (no escaping).                |
| `Array`                               | Values are processed recursively. Falsy values are skipped.              |

### Arrays and Falsy Values

```js
const items = ['a', false, null, undefined, 'b'];
const list = html`<ul>
    ${items.map(i => (i ? html`<li>${i}</li>` : ''))}
</ul>`;
// The falsy values become empty strings, so only 'a' and 'b' appear.
```

You can also pass an array directly – the library will flatten it and process each item.

### Nested Fragments

`html` calls are composable – you can nest fragments inside each other.

```js
const sub = html`<span>inner</span>`;
const main = html`<div>${sub}</div>`;
// main contains a <div> with a <span>
```

### Inserting DOM Nodes

You can insert existing DOM nodes directly. Their `outerHTML` is used for the fragment.

```js
const button = document.createElement('button');
button.textContent = 'Click';
const fragment = html`<div>${button}</div>`;
// Result: <div><button>Click</button></div>
```

Text nodes are inserted as escaped text:

```js
const textNode = document.createTextNode('<b>not bold</b>');
const fragment = html`<div>${textNode}</div>`;
// Result: <div>&lt;b&gt;not bold&lt;/b&gt;</div>
```

Comment nodes are ignored (they produce no output).

### SafeHTML and `unsafeHTML`

Use `unsafeHTML` to mark a string as safe – the library will insert it as raw HTML without escaping.

```js
const safeString = unsafeHTML('<span class="special">Raw</span>');
const fragment = html`<div>${safeString}</div>`;
// Result: <div><span class="special">Raw</span></div>
```

**Warning:** Only use `unsafeHTML` with trusted content. It bypasses XSS protection.
> **Important:** The layout should only define the structure (HTML). Event listeners and interactive logic must be attached in lifecycle methods (like `connectedCallback`) using refs. Avoid inline event handlers such as `onclick="..."` in the layout – this mixes presentation with logic and breaks the separation of concerns. Instead, use `data-ref` to target elements and attach listeners programmatically.

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
