# Teleports (Portals)

Teleports allow you to render a fragment of UI into an arbitrary DOM node (e.g., `document.body`) while keeping it logically attached to the component. The teleported content's `data-ref` elements are merged into the component's refs, and the teleport is automatically created when the component is mounted and destroyed when it unmounts.

**Important:** Teleports are **not independent** – they are part of the component's lifecycle. The component itself must be mounted (via `mount()`) for teleports to appear. The main layout is still required and serves as the component's anchor in the DOM.

- Teleports are created **immediately before** `connectedCallback` is called. This means that by the time your component's logic runs in `connectedCallback`, all teleported elements are already present in their target location and their refs are fully accessible via `getRefs()`.
- Teleports are automatically removed when the component unmounts.

## Defining Teleports

Add a `teleports` property to your component. It's an object where each key is a teleport name, and the value is a `TeleportConfig`.

```js
class Modal extends Component {
    // Main layout (required) – the component's anchor in the DOM
    layout = html`<div>Modal trigger</div>`;

    teleports = {
        overlay: {
            layout: () => html`
                <div class="modal-overlay" data-ref="overlay">
                    <div class="modal-content">
                        <h2 data-ref="title">Modal</h2>
                        <button data-ref="closeBtn">Close</button>
                    </div>
                </div>
            `,
            target: document.body,
            strategy: 'append',
        },
    };
}
```

When the component is mounted (e.g., `new Modal().mount(...)`), the teleport is created and inserted into the target. When the component is unmounted, the teleport is automatically removed.

### `TeleportConfig` Properties

| Property   | Type                                             | Description                                                                    |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `layout`   | `() => DocumentFragment`                         | A function that returns the content to teleport.                               |
| `target`   | `Element` \| `string` \| `() => Element \| null` | Where to insert the content. Can be an element, a CSS selector, or a function. |
| `strategy` | `'append'` \| `'prepend'` \| `'replace'`         | How to insert the content relative to existing children of the target.         |

> **Note:** Teleports are initialized just before `connectedCallback`. This guarantees that when you access `this.getRefs()` inside `connectedCallback`, any refs inside teleports are already available.

## Accessing Teleported Refs

All `data-ref` elements inside teleports become part of the component's refs object, just like in the main layout.

```js
connectedCallback() {
    const refs = this.getRefs();
    refs.closeBtn.onclick = () => this.hide();
    refs.overlay.onclick = (e) => {
        if (e.target === refs.overlay) this.hide();
    };
}
```

## Full Modal Example

```js
export class ModalComponent extends Component {
    refsAnnotation = {
        openBtn: HTMLButtonElement.prototype,
        closeBtn: HTMLButtonElement.prototype,
        overlay: HTMLElement.prototype,
        title: HTMLElement.prototype,
    };

    layout = () => html`
        <div>
            <button data-ref="openBtn">Open Modal</button>
        </div>
    `;

    teleports = {
        modal: {
            layout: () => html`
                <div class="modal-overlay" data-ref="overlay" style="display:none">
                    <div class="modal-content">
                        <h2 data-ref="title">Settings</h2>
                        <button data-ref="closeBtn">Close</button>
                    </div>
                </div>
            `,
            target: () => document.body,
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

    show() {
        this.getRefs().overlay.style.display = '';
    }

    hide() {
        this.getRefs().overlay.style.display = 'none';
    }
}
```

## When to Use Teleports

- Modals, tooltips, dropdowns that need to break out of parent containers (e.g., to avoid `overflow: hidden` issues).
- Notifications or toast messages that should be appended to `document.body`.
- Floating panels or context menus.

Teleports are fully integrated with the component lifecycle – they are created when the component mounts and destroyed when it unmounts.
