## 📁 `examples/13-teleports/README.md`

# 13 – Logical Teleports (Portals)

This example demonstrates how to render a part of a component’s UI into an arbitrary DOM node (e.g., `document.body`) while keeping it logically attached to the component. This pattern is perfect for modals, tooltips, dropdowns, and notifications that need to break out of their parent’s overflow or z‑index constraints.

## Key Concepts

- **`teleports` property** – define one or more teleported fragments inside your component.
- **Unified refs** – all `data-ref` attributes from both the main layout **and** the teleported content are merged and accessible via `getRefs()`.
- **Flexible targeting** – the `target` can be an element, a CSS selector, or a function returning an element.
- **Insertion strategies** – `'append'`, `'prepend'`, or `'replace'` control how the teleported content is placed inside the target.
- **Lifecycle integration** – teleported fragments are automatically removed when the component unmounts.

## How It Works

- The `ModalComponent` defines a minimal main layout containing only an “Open Modal” button (`data-ref="openBtn"`).
- The `teleports` object declares one teleport named `overlay`. Its `layout` contains the modal overlay, content area, title, and close button.
- The `target` is set to `document.body`, so the modal markup is physically appended to the body, not inside the component’s original container.
- Despite being elsewhere in the DOM, the modal’s elements (`overlay`, `title`, `closeBtn`) are included in `this.getRefs()` just like regular layout elements.
- In `connectedCallback`, event listeners are attached to these refs – opening the modal adds an `is-active` class to the overlay, and clicking the overlay background or the close button hides it.

## Code Structure

- `ModalComponent.js` – the main component with its layout and teleport definition.
- `main.js` – entry point that imports the component and mounts it to `#app`.
- `index.html` – basic HTML container with a `<div id="app">` and a link to the styles (optional).

## Code Snippets

### ModalComponent.js (abridged)

```javascript
export class ModalComponent extends Component {
  refsAnnotation = {
    openBtn: HTMLButtonElement.prototype,
    closeBtn: HTMLButtonElement.prototype,
    overlay: HTMLElement.prototype,
    title: HTMLElement.prototype,
  };

  layout = () => html`
    <div class="modal-wrapper">
      <button data-ref="openBtn">Open Modal</button>
    </div>
  `;

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
      target: document.body,
      strategy: 'append',
    },
  };

  connectedCallback() {
    const refs = this.getRefs();
    refs.openBtn.onclick = () => this.show();
    refs.closeBtn.onclick = () => this.hide();
    refs.overlay.onclick = e => {
      if (e.target === refs.overlay) this.hide();
    };
  }

  show() { this.getRefs().overlay.classList.add('is-active'); }
  hide() { this.getRefs().overlay.classList.remove('is-active'); }
}
```

### main.js

```javascript
import { ModalComponent } from './ModalComponent.js';

const modal = new ModalComponent();
modal.mount(document.getElementById('app'));
```

## Why Teleports?

- **Escape styling constraints** – modals are not clipped by parent `overflow: hidden`.
- **Z‑index management** – all modals can be stacked predictably at the body level.
- **Accessibility** – easier to manage focus trapping and ARIA attributes when the modal is a top‑level element.
- **Logical hierarchy preserved** – even though the modal lives elsewhere, it still belongs to its parent component and can communicate via events or shared state.

This example lays the foundation for more advanced patterns like nested teleports (see example `15-nested-portals`).
