---
title: BareDOM – Web Components Integration
version: 2.0.0
tags: [web-components, custom-elements, shadow-dom, integration]
---

# Using Web Components with BareDOM

BareDOM components can seamlessly work with native Web Components. You can use them in your layout and even access their internal Shadow DOM elements through the unified refs system.

## Basic Integration

Simply use the custom element tag in your layout.

```js
import { Component, html } from '@supercat1337/ui';

class MyButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `
            <button data-ref="btn">Click me</button>
        `;
    }
}
customElements.define('my-button', MyButton);

class Demo extends Component {
    layout = `<my-button></my-button>`;
}
```

By default, the ref scanner only looks in the main component’s light DOM. Elements inside the shadow root will not be automatically discovered.

## Accessing Shadow DOM Refs

To include elements from a custom element’s shadow root into your component’s `getRefs()`, you need to register that shadow root as an additional scanning target.

### The Reliable Way: Use `querySelector` in `before-update-refs`

The `before-update-refs` event fires just before the component scans for refs. Inside the callback, you can locate the custom element using `this.getRootNode().querySelector()` (or any DOM method) and push its `shadowRoot` into `this.$internals.additionalRoots`.

```js
class ShadowDemo extends Component {
    // Declare refs from both light DOM and shadow DOM
    refsAnnotation = {
        title: HTMLHeadingElement.prototype, // light DOM
        shadowBtn: HTMLButtonElement.prototype, // inside <my-button> shadow DOM
    };

    static layout = `
        <div>
            <h1 data-ref="title">Host Content</h1>
            <my-button></my-button>
        </div>
    `;

    constructor() {
        super();

        // Register the shadow root before refs are scanned
        this.on('before-update-refs', () => {
            const myButton = this.getRootNode().querySelector('my-button');
            if (myButton?.shadowRoot) {
                this.$internals.additionalRoots.push(myButton.shadowRoot);
            }
        });
    }

    connectedCallback() {
        // All refs (light + shadow) are now available
        const { title, shadowBtn } = this.getRefs();
        this.$on(shadowBtn, 'click', () => {
            title.textContent = 'Interacted with Shadow DOM!';
        });
    }
}
```

> **Important:** Do not rely on `this.getRefs()` inside `before-update-refs` – refs are still being collected at that point. The `getRootNode().querySelector()` approach is safe and works regardless of whether the custom element has a `data-ref` attribute.

### Alternative: Using a Ref on the Custom Element

If you give the custom element a `data-ref`, you could theoretically use that ref inside `before-update-refs`. However, because refs are not yet ready, this will not work as expected. The recommended pattern is to use `querySelector` as shown above.

```js
// ❌ Not recommended – refs are not yet available
this.on('before-update-refs', () => {
    const { customEl } = this.getRefs(); // may be undefined
    if (customEl?.shadowRoot) {
        this.$internals.additionalRoots.push(customEl.shadowRoot);
    }
});

// ✅ Correct – use direct DOM query
this.on('before-update-refs', () => {
    const customEl = this.getRootNode().querySelector('[data-ref="customEl"]');
    if (customEl?.shadowRoot) {
        this.$internals.additionalRoots.push(customEl.shadowRoot);
    }
});
```

## Complete Example

A fully runnable example is available in [`examples/16-web-components`](./examples/16-web-components). It shows how to integrate a custom element with Shadow DOM and access its internal refs.
