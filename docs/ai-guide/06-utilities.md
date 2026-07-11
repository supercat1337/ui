---
title: BareDOM – Utility Functions & Classes
version: 2.0.0
tags: [utilities, helpers, dom, Toggler, SlotToggler]
---

# Utility Functions

BareDOM ships with a collection of pure helper functions that you can import and use anywhere.

## Localization (i18n)

For internationalisation, the library provides a separate package: [`@supercat1337/ui-localization`](https://github.com/supercat1337/ui-localization). It offers:

- Framework‑agnostic core (`Localization`) – works in Node.js, browser, or any JS environment.
- BareDOM integration (`ComponentLocalization`) – auto‑updates UI on language change and when components mount.
- Pluralisation using `Intl.PluralRules` – supports any language.
- Named placeholders (`"Hello, {name}!"`).
- Number and date formatting via `Intl`.

See the [Component Authoring Guide](./09-component-authoring-guide.md#localisation-with-componentlocalization) for a complete example.

> **Note:** This package is not included in the core `@supercat1337/ui` bundle – install it separately when you need i18n.

## DOM Helpers

| Function                                                 | Description                                        |
| -------------------------------------------------------- | -------------------------------------------------- |
| `DOMReady(callback, doc?)`                               | Executes callback when the DOM is fully loaded.    |
| `delegateEvent(eventType, ancestor, selector, listener)` | Attaches a delegated event listener.               |
| `fadeIn(element, duration?, wnd?)`                       | Fades in an element using `requestAnimationFrame`. |
| `fadeOut(element, duration?, wnd?)`                      | Fades out an element.                              |
| `hideElements(...elements) `                             | Adds the `d-none` class to each element.           |
| `showElements(...elements)`                              | Removes the `d-none` class.                        |
| `scrollToBottom(element)`                                | Scrolls the element to its bottom.                 |
| `scrollToTop(element)`                                   | Scrolls the element to its top.                    |
| `injectCoreStyles(doc?)`                                 | Injects minimal CSS (`.d-none`, etc.) into head.   |

---

## Utility Classes

### `Toggler` (Visibility Management)

`Toggler` is a general-purpose state manager. It manages a set of items where only one can be active at a time by toggling CSS classes or executing custom callbacks. It **does not** affect the DOM lifecycle (no unmounting).

**Important:** Always call `toggler.clear()` in your component's `disconnectedCallback`. This removes all internal references and callbacks, allowing the GC to reclaim DOM elements held in closures.

```js
import { Component, Toggler, injectCoreStyles } from '@supercat1337/ui';

injectCoreStyles();

class SimpleTabs extends Component {
    static layout = `
        <div>
            <button data-ref="btn1">Tab 1</button>
            <button data-ref="btn2">Tab 2</button>

            <div data-ref="pane1" class="d-none">Content 1</div>
            <div data-ref="pane2" class="d-none">Content 2</div>
        </div>
    `;

    refsAnnotation = {
        btn1: HTMLButtonElement.prototype,
        btn2: HTMLButtonElement.prototype,
        pane1: HTMLDivElement.prototype,
        pane2: HTMLDivElement.prototype,
    };

    connectedCallback() {
        const { btn1, btn2, pane1, pane2 } = this.getRefs();
        const toggler = new Toggler();

        // Register items with ON/OFF callbacks
        toggler.addItem(
            't1',
            () => pane1.classList.remove('d-none'),
            () => pane1.classList.add('d-none')
        );
        toggler.addItem(
            't2',
            () => pane2.classList.remove('d-none'),
            () => pane2.classList.add('d-none')
        );

        this.$on(btn1, 'click', () => toggler.setActive('t1'));
        this.$on(btn2, 'click', () => toggler.setActive('t2'));

        toggler.init('t1');
    }

    disconnectedCallback() {
        // ⚠️ Crucial: Clear the toggler to prevent memory leaks from DOM references in callbacks
        this.tabsToggler.clear();
    }
}
```

### `SlotToggler` (Lifecycle Management)

`SlotToggler` is a specialized version for toggling between multiple `data-slot` areas.
**Crucial Difference:** It automatically **mounts** the active slot's components and **unmounts** the inactive ones, triggering their `disconnectedCallback` and freeing resources.

```js
import { Component, SlotToggler } from '@supercat1337/ui';

class App extends Component {
    static layout = `
        <div data-slot="view1"></div>
        <div data-slot="view2"></div>
    `;

    connectedCallback() {
        // Automatically manages mount/unmount for components in these slots
        this.slotToggler = new SlotToggler(this, ['view1', 'view2']);

        this.addToSlot('view1', new HomeView());
        this.addToSlot('view2', new SettingsView());

        // Switching to 'view2' will physically unmount HomeView from the DOM
        this.slotToggler.setActive('view2');
    }
}
```

---

## UI Helpers (Button Status)

These functions manage button states (disabling and showing spinners). They require `injectCoreStyles()` to be called once in your app.

| Function                                          | Description                                               |
| ------------------------------------------------- | --------------------------------------------------------- |
| `ui_button_status_waiting_on(button, text)`       | Disables the button and shows a spinner with text.        |
| `ui_button_status_waiting_off(button, text)`      | Re-enables the button and restores the original text.     |
| `ui_button_status_waiting_off_html(button, html)` | Re-enables the button and sets the provided HTML content. |

---

## `Config`

Global configuration manager for SSR and hydration.

```js
import { Config } from '@supercat1337/ui';

// Example: accessing hydration data manually
const data = Config.getHydrationData('my-component-sid');
```
