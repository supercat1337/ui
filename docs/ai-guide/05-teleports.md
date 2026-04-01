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
    layout = `<div>Modal trigger</div>`;

    teleports = {
        overlay: {
            // ✅ layout returns a string (SSR‑friendly)
            layout: () => `
                <div class="modal-overlay" data-ref="overlay">
                    <div class="modal-content">
                        <h2 data-ref="title">Modal</h2>
                        <button data-ref="closeBtn">Close</button>
                    </div>
                </div>
            `,
            // ✅ use a CSS selector (string) – works on both server and client
            target: 'body',
            strategy: 'append',
        },
    };
}
```

### `TeleportConfig` Properties

| Property   | Type                                             | Description                                                                                                                        |
| ---------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `layout`   | `() => string \| DocumentFragment`               | A function that returns the content to teleport. **Prefer returning a string** for SSR compatibility.                              |
| `target`   | `Element` \| `string` \| `() => Element \| null` | Where to insert the content. **Use a CSS selector (string) when possible** – this makes the component usable in SSR without a DOM. |
| `strategy` | `'append'` \| `'prepend'` \| `'replace'`         | How to insert the content relative to existing children of the target.                                                             |

> **Note:** Teleports are initialized just before `connectedCallback`. This guarantees that when you access `this.getRefs()` inside `connectedCallback`, any refs inside teleports are already available.

## Accessing Teleported Refs

All `data-ref` elements inside teleports become part of the component's refs object, just like in the main layout. Use destructuring for cleaner access.

```js
connectedCallback() {
    const { closeBtn, overlay } = this.getRefs();
    // ✅ use $on for automatic cleanup
    this.$on(closeBtn, 'click', () => this.hide());
    this.$on(overlay, 'click', (e) => {
        if (e.target === overlay) this.hide();
    });
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

    layout = () => `
        <div>
            <button data-ref="openBtn">Open Modal</button>
        </div>
    `;

    teleports = {
        modal: {
            layout: () => `
                <div class="modal-overlay" data-ref="overlay" style="display:none">
                    <div class="modal-content">
                        <h2 data-ref="title">Settings</h2>
                        <button data-ref="closeBtn">Close</button>
                    </div>
                </div>
            `,
            target: 'body',
            strategy: 'append',
        },
    };

    connectedCallback() {
        const { openBtn, closeBtn, overlay } = this.getRefs();
        this.$on(openBtn, 'click', () => this.show());
        this.$on(closeBtn, 'click', () => this.hide());
        this.$on(overlay, 'click', e => {
            if (e.target === overlay) this.hide();
        });
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

## Modal Patterns: When to Use Teleports

Modals are a classic use case for teleports because they often need to break out of parent containers to avoid `overflow: hidden` or z‑index issues. However, the way you structure your components depends on the number of triggers.

### Pattern 1: Single Trigger (Button inside the Modal)

If the modal is opened by exactly one button (e.g., a settings modal), it’s often simplest to keep the button and the modal together in a single component. The modal’s teleported content is managed by the same component, and the button’s click event toggles visibility.

```js
class SettingsModal extends Component {
    static layout = () => `<button data-ref="openBtn">Settings</button>`;
    teleports = {
        /* modal content */
    };
    // ...
}
```

### Pattern 2: Multiple Triggers (Centralized Modal)

If the same modal needs to be opened from different places (e.g., “Edit” buttons in a list), create the modal as a **separate component** and control it via a shared reference. Each trigger component can import the modal instance and call an `open` method directly.

**Step 1: Create the modal component (exported)**

```js
// EditModal.js
import { Component, html } from '@supercat1337/ui';

export class EditModal extends Component {
    teleports = {
        modal: {
            layout: () => `
                <div class="modal-overlay" data-ref="overlay" style="display:none">
                    <div class="modal-content">
                        <form data-ref="form">
                            <input data-ref="nameInput" />
                            <button data-ref="saveBtn">Save</button>
                        </form>
                    </div>
                </div>
            `,
            target: 'body',
        },
    };

    open(itemData) {
        const { nameInput, overlay } = this.getRefs();
        nameInput.value = itemData.name;
        overlay.style.display = '';
    }

    close() {
        const { overlay } = this.getRefs();
        overlay.style.display = 'none';
    }

    connectedCallback() {
        const { saveBtn, overlay } = this.getRefs();
        this.$on(saveBtn, 'click', () => this.close());
        this.$on(overlay, 'click', e => {
            if (e.target === overlay) this.close();
        });
    }
}
```

**Step 2: Instantiate the modal once (e.g., in the main app)**

```js
// main.js
import { EditModal } from './EditModal.js';

const modal = new EditModal();
modal.mount(document.body); // mounts the teleport and the anchor (anchor is empty)
```

**Step 3: In each trigger component, import and use the modal**

```js
// TableRow.js
import { Component } from '@supercat1337/ui';
import { modal } from '../main.js'; // or pass it via props

export class TableRow extends Component {
    layout = `<button data-ref="editBtn">Edit</button>`;

    constructor(itemData) {
        super();
        this.itemData = itemData;
    }

    connectedCallback() {
        const { editBtn } = this.getRefs();
        this.$on(editBtn, 'click', () => {
            modal.open(this.itemData);
        });
    }
}
```

**Why this pattern works well:**

- **No event listeners between components** – you simply call a method on the shared modal instance.
- **Clean separation** – the modal handles its own DOM and teleport; triggers only need a reference.
- **Resource efficient** – only one modal instance exists, regardless of how many triggers.

## Server‑Side Rendering (SSR) and Teleports

When using teleports in a component that participates in SSR, follow these guidelines:

1. **Always return a string from the teleport’s `layout` function.**  
   This allows the server to generate the teleported HTML without a DOM. Example:

    ```js
    layout: () => `<div class="modal">...</div>`;
    ```

2. **Use a CSS selector (string) for `target`.**  
   Avoid passing a direct DOM element (e.g., `document.body`) because that element doesn’t exist on the server. A selector like `'body'` is safe – the client will resolve it after hydration.

    ```js
    target: 'body'; // ✅ works on server and client
    // target: document.body  // ❌ would break on server
    ```

3. **Teleported content will be part of the server‑generated HTML.**  
   The server will embed the teleported markup at the location of the teleport definition. On the client, the teleport is reconciled during hydration – no extra work is required.

4. **Lifecycle methods are not executed on the server.**  
   Any client‑only setup (e.g., showing/hiding logic) must be placed inside `connectedCallback` (which runs only in the browser).

By following these practices, your teleport‑based components will work seamlessly in both server‑rendered and client‑only environments.
