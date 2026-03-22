---
title: BareDOM – Web Components Integration
version: 2.0.0
tags: [web-components, custom-elements, shadow-dom, integration]
---

# Using Web Components with BareDOM

BareDOM components can seamlessly work with native Web Components (custom elements). You can use them in your layout and even access their internal Shadow DOM elements through the unified refs system.

## Basic Integration

Simply use the custom element tag in your layout. The component will be rendered as expected.

```js
import { Component, html } from '@supercat1337/ui';

// Define a simple Web Component
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
    layout = html`<my-button></my-button>`;
}
```

However, `data-ref` attributes inside the shadow root will **not** be automatically discovered because the ref scanner only looks in the main component's light DOM.

## Accessing Shadow DOM Refs

To include elements from a custom element's shadow root, you need to add that shadow root to the list of additional roots the ref scanner should traverse. Do this by subscribing to the `before-update-refs` event.

```js
class Demo extends Component {
    refsAnnotation = {
        btn: HTMLButtonElement.prototype, // from shadow DOM
    };

    layout = html`<my-button></my-button>`;

    constructor() {
        super();

        this.on('before-update-refs', () => {
            const myButton = this.getRootNode().querySelector('my-button');
            if (myButton?.shadowRoot) {
                this.$internals.additionalRoots.push(myButton.shadowRoot);
            }
        });
    }

    connectedCallback() {
        const refs = this.getRefs();
        refs.btn.onclick = () => alert('Shadow button clicked!');
    }
}
```

### `additionalRoots` Property

`this.$internals.additionalRoots` is an array that the ref scanner uses to find elements with `data-ref`. You can push any `Document` or `ShadowRoot` into it.

- The ref scanner runs during mount and whenever `updateRefs()` is called.
- It also respects the `scopeAttribute` configuration (by default, it stops at `data-component-root` and `data-slot`).

## Example: Full Integration with `FancyCard`

See `examples/16-web-components` for a complete working example. It defines a custom element with Shadow DOM containing a title and a button, and the BareDOM component accesses both.

```js
// FancyCard.js
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

// WebComponentIntegration.js
export class WebComponentIntegration extends Component {
    refsAnnotation = {
        mainBtn: HTMLButtonElement.prototype,
        cardTitle: HTMLHeadingElement.prototype,
        cardBtn: HTMLButtonElement.prototype,
    };

    layout = html`
        <div>
            <button data-ref="mainBtn">Main Button</button>
            <fancy-card></fancy-card>
        </div>
    `;

    constructor() {
        super();
        this.on('before-update-refs', () => {
            const fancyCard = this.getRootNode().querySelector('fancy-card');
            if (fancyCard?.shadowRoot) {
                this.$internals.additionalRoots.push(fancyCard.shadowRoot);
            }
        });
    }

    connectedCallback() {
        const refs = this.getRefs();
        refs.mainBtn.onclick = () => (refs.cardTitle.textContent = 'Updated!');
        refs.cardBtn.onclick = () => alert('Shadow button clicked!');
    }
}
```

## Benefits

- **Unified refs** – treat shadow DOM elements just like light DOM elements.
- **Type safety** – include them in `refsAnnotation`.
- **Automatic cleanup** – listeners added with `$on` are removed when the component unmounts.
- **No conflict** – BareDOM components and Web Components can coexist peacefully.
