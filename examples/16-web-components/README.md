
---

## 📁 `examples/16-web-components/README.md`

```markdown
# 16 – Web Components Integration (Shadow DOM Refs)

This example demonstrates how to use native Web Components (custom elements with Shadow DOM) inside a BareDOM component and how to access their internal elements via the unified refs system.

## Key Concepts

- **Using custom elements** – define and use a native Web Component inside a BareDOM layout.
- **Accessing Shadow DOM refs** – the `before-update-refs` event allows you to inject the `shadowRoot` of a custom element into `this.$internals.additionalRoots`, making its `data-ref` children available to `getRefs()`.
- **Full type safety** – the `refsAnnotation` includes refs from both the light DOM and the shadow DOM, enabling IDE autocompletion.
- **Automatic cleanup** – listeners attached with `$on` are removed when the component unmounts.

## How It Works

1. A native Web Component `FancyCard` is defined with its own Shadow DOM containing two elements marked with `data-ref`: `cardTitle` and `cardBtn`.
2. The BareDOM component `WebComponentIntegration` uses `<fancy-card>` in its layout.
3. In the `constructor`, it subscribes to the `before-update-refs` event. Inside the callback, it finds the `fancy-card` instance and pushes its `shadowRoot` into `additionalRoots`.
4. The `refsAnnotation` includes `cardTitle` and `cardBtn` along with the light DOM ref `mainBtn`.
5. In `connectedCallback`, all three refs are available and can be used to attach event listeners or update content.
6. The example also shows how the main button can update the title inside the Web Component.

## Code Structure

- `FancyCard.js` – definition of the custom element with Shadow DOM.
- `WebComponentIntegration.js` – the BareDOM component that integrates the web component.
- `index.js` – entry point that mounts the demo.

> **Note:** Web Components must be defined before the BareDOM component tries to use them; the example defines them at the top of the module.