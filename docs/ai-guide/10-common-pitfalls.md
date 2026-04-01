---
title: BareDOM – Common Pitfalls
version: 2.0.0
tags: [pitfalls, troubleshooting, best-practices]
---

# Common Pitfalls

## 1. The “Ghost” Teleport (Missing Anchor)

**Problem:** You defined a teleport, but it never appears in the DOM.  
**Cause:** Teleports are part of the component’s lifecycle. If the component’s main `layout` (the anchor) is not mounted into the DOM, the teleports will never be initialized.  
**Solution:** Always ensure the component is added to a slot or mounted manually. Even if the component only exists to show a modal, its anchor must be in the DOM tree.

```js
// ❌ Wrong: teleports won't appear because the component is never mounted
const modal = new ModalComponent();

// ✅ Correct: mount the component first
const modal = new ModalComponent();
modal.mount(document.body);
```

---

## 2. Accessing Refs in the Constructor

**Problem:** `this.getRefs().element` returns `undefined` inside the `constructor`.  
**Cause:** Refs are scanned and populated only when the component is being attached to the DOM, just before `connectedCallback`.  
**Solution:** Move all DOM‑related logic (event listeners, third‑party library initialization) to `connectedCallback`.

```js
class MyComponent extends Component {
    constructor() {
        super();
        // ❌ Wrong: refs are not ready yet
        this.getRefs().myButton.textContent = 'Click me';
    }

    // ✅ Correct: use connectedCallback
    connectedCallback() {
        this.getRefs().myButton.textContent = 'Click me';
    }
}
```

---

## 3. Forgetful Cleanup

**Problem:** Memory leaks or unexpected behavior after removing a component.  
**Cause:** Creating `setInterval`, global window listeners, or external library instances without clearing them.  
**Solution:** Use `this.addDisposer(() => ...)` for custom cleanup and `this.$on()` for DOM events. These are automatically handled by the library’s internal disconnect process.

```js
connectedCallback() {
    // ❌ Wrong: no cleanup
    const intervalId = setInterval(() => this.update(), 1000);
    window.addEventListener('resize', this.onResize);

    // ✅ Correct: register disposers
    const intervalId = setInterval(() => this.update(), 1000);
    this.addDisposer(() => clearInterval(intervalId));

    this.$on(window, 'resize', this.onResize);
}
```

---

## 4. Overwriting Slots Manually

**Problem:** Manually injecting elements into a `data-slot` using `innerHTML` or `appendChild`.  
**Cause:** BareDOM manages slots internally. Manual manipulation can lead to state desync or your changes being overwritten during a `rerender()`.  
**Solution:** Always use the official `this.addToSlot(slotName, component)` and `this.clearSlotContent(slotName)` methods.

```js
// ❌ Wrong: direct DOM manipulation
const slotEl = this.getRootNode().querySelector('[data-slot="items"]');
slotEl.innerHTML = '<span>Item</span>';

// ✅ Correct: use the slot API
this.addToSlot('items', new ItemComponent());
```

---

## 5. Missing `injectCoreStyles()`

**Problem:** `SlotToggler` toggles visibility, but slots remain visible or the `d-none` class has no effect.  
**Cause:** The core CSS that defines `.d-none` (or other helper classes) is not present in the document.  
**Solution:** Call `injectCoreStyles()` once at the start of your application (e.g., in your main entry point). This adds the necessary styles.

```js
import { injectCoreStyles } from '@supercat1337/ui';
injectCoreStyles(); // call before any component mounts
```

---

## 6. Incorrect `refsAnnotation` Values

**Problem:** TypeScript shows an error, or runtime validation fails, even though the element exists.  
**Cause:** `refsAnnotation` expects the **prototype** of the expected element, not the constructor or a string.  
**Solution:** Use `HTMLInputElement.prototype`, `HTMLButtonElement.prototype`, etc.

```js
// ❌ Wrong
refsAnnotation = {
    myInput: HTMLInputElement, // constructor, not prototype
    myButton: 'HTMLButtonElement', // string
};

// ✅ Correct
refsAnnotation = {
    myInput: HTMLInputElement.prototype,
    myButton: HTMLButtonElement.prototype,
};
```

---

## 7. Misusing `SlotToggler` vs `Toggler`

**Problem:** Components inside slots lose their state when switching tabs, or static content doesn’t disappear.  
**Cause:** `SlotToggler` unmounts child components when a slot becomes inactive; `Toggler` only toggles CSS visibility.  
**Solution:** Use `SlotToggler` when you want to destroy inactive components (e.g., lazy loading). Use `Toggler` when you want to preserve state (e.g., tabs with form inputs).

```js
// ✅ Preserve state: use Toggler
this.toggler = new Toggler();

// ✅ Discard state: use SlotToggler
this.slotToggler = new SlotToggler(this, ['tab1', 'tab2']);
```

---

## 8. Returning a String from a Function‑based Layout

**Problem:** The layout function returns a string, but the component doesn’t render correctly or loses its `data-ref` bindings.  
**Cause:** This is rarely a problem. However, if the returned string is not valid HTML, or if you forget to include the necessary `data-ref` attributes, the component may not behave as expected.  
**Solution:** Ensure your function returns a valid HTML string. Using the `html` helper is recommended because it automatically escapes values and makes your intent clear, but returning a plain string is also perfectly acceptable.

```js
// ✅ Works: returns a valid HTML string (plain)
layout = () => '<div>Hello</div>';

// ✅ Also works: returns an HTML string via `html`
layout = () => html`<div>Hello</div>`;

// ✅ Works: returns a DocumentFragment (e.g., from htmlDOM)
layout = () => htmlDOM`<div>Hello</div>`;
```

> **Note:** If your function returns a `DocumentFragment`, it will be used directly. If it returns a string, the string is parsed as HTML. The `html` helper is preferred for dynamic content because it provides built‑in escaping against XSS attacks.

---

## 9. Using `rerender()` Unnecessarily

**Problem:** The entire component flashes or re‑creates child components, losing their state.
**Cause:** `rerender()` destroys and recreates the whole component tree, including all children.
**Solution:** Update only the specific `refs` that need to change. Use `rerender()` only when the entire layout must be rebuilt (e.g., after a language switch that affects many static texts).

```js
// ❌ Unnecessary full re‑render
this.count++;
this.rerender();

// ✅ Surgical update
this.getRefs().counterSpan.textContent = this.count;
```

---

## 10. Forgetting to Call `super()` in Constructor

**Problem:** The component throws an error or behaves unexpectedly.  
**Cause:** If you override the constructor, you must call `super()` (with optional options) before accessing `this`.  
**Solution:** Always call `super()` as the first line.

```js
class MyComponent extends Component {
    constructor(options) {
        super(options); // required
        // your custom code
    }
}
```

---

## 11. Trying to Use `data-ref` Inside a Child Component’s Template

**Problem:** The parent component cannot access `data-ref` elements that belong to a child component.  
**Cause:** BareDOM isolates refs per component to prevent naming collisions.  
**Solution:** If you need to access a child’s internal elements, consider lifting the ref up (e.g., by making the child expose a method) or use the [Web Components integration](./06-web-components.md) pattern to merge additional roots.

---

## 12. Missing `sid` for SSR Hydration

**Problem:** Hydration fails; the component does not restore state.  
**Cause:** The server‑rendered HTML contains `data-component-root` with a `data-sid`, but the client‑side component lacks the same `sid`.  
**Solution:** Ensure the component is instantiated with the same `sid` that was used on the server, and mount it with `mode: 'hydrate'`.

```js
// Server: component rendered with sid='profile-card'
// Client: use the same sid
const widget = new Widget({ sid: 'profile-card' });
widget.mount(document.getElementById('profile-card'), 'hydrate');
```

---

## 13. Using `addEventListener` Without Unsubscribing

**Problem:** Event listeners keep firing even after the component is removed.  
**Cause:** Adding listeners manually with `addEventListener` without cleaning them up.  
**Solution:** Always use `$on` or attach the listener with an `AbortSignal` from the component’s internal disconnect controller. The `getUnmountSignal()` method provides a convenient way to obtain the signal.

```js
// ❌ Wrong: leaks memory
window.addEventListener('resize', this.onResize);

// ✅ Correct: auto‑cleaned on unmount (using $on)
this.$on(window, 'resize', this.onResize);

// ✅ Also correct: using the unmount signal directly
const signal = this.getUnmountSignal();
window.addEventListener('resize', this.onResize, { signal });
```

---

## 14. Placing SSR‑Critical Logic in `connectedCallback`

**Problem:** Server‑Side Rendering (SSR) produces HTML without calling `connectedCallback`, so data fetched inside it will not be included in the server output.  
**Cause:** Lifecycle methods like `connectedCallback` are **not executed** on the server.  
**Solution:** If you need to load data that must be present in the initial HTML (e.g., for SEO), do it **outside** the component lifecycle – for instance, in a dedicated method called manually during the build phase, or by passing data directly to the constructor. Use `connectedCallback` only for client‑side initialization.

```js
class MyComponent extends Component {
    constructor(data) {
        super();
        // ✅ Data passed in – works on both server and client
        this.data = data;
    }

    connectedCallback() {
        // ❌ This will not run on the server
        fetch('/api/data').then(...);
    }
}
```

---

## 15. Using Instance Layout for SSR

**Problem:** A component that uses an instance‑specific layout (function or DOM node) cannot be reliably rendered on the server if not done correctly.  
**Cause:** The server needs a string representation of the layout; functions that return nodes or rely on browser APIs will fail.  
**Solution:** For SSR, you can use an **instance layout as a function that returns a string**. This function will be called on both the server and client, ensuring consistency.

```js
// ✅ Works on server: instance layout as function returning string
class MyComponent extends Component {
    constructor(data) {
        super();
        this.data = data;
        this.layout = () => html`<div>${this.data.title}</div>`;
    }
}

// ❌ Breaks on server: instance layout as DOM node
class MyComponent extends Component {
    constructor() {
        super();
        this.layout = document.createElement('div');
    }
}
```

**Important:**

- The layout function must be pure and avoid browser APIs.
- Function‑based layouts are **not cached** – they run on every render. For many instances, consider using static layout with later client‑side data injection if performance is a concern.
- Ensure the function produces **identical HTML** on server and client to avoid hydration mismatches.

For components with structure that does **not** depend on data, prefer `static layout` for better performance and caching.

```

```
