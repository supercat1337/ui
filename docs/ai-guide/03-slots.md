---
title: BareDOM – Slots & Composition
version: 2.0.0
tags: [slots, composition, addToSlot]
---

# Slots

Slots are placeholders in a component's layout where child components (or other content) can be inserted. Define a slot with the `data-slot` attribute.

```js
class Parent extends Component {
    layout = html`
        <div class="card">
            <header data-slot="header"></header>
            <main data-slot="content"></main>
        </div>
    `;

    constructor() {
        super();
        this.addToSlot('header', new HeaderComponent());
        this.addToSlot('content', new ContentComponent());
    }
}
```

## Adding Child Components

Use `addToSlot(slotName, componentOrComponents, mode?)`.

- `slotName`: the name of the slot (value of `data-slot`).
- `componentOrComponents`: a single `Component` instance or an array.
- `mode`: `'append'` (default), `'prepend'`, or `'replace'`.

```js
// Append one
this.addToSlot('sidebar', new Sidebar());

// Prepend an array
this.addToSlot('main', [new Article(), new Comments()], 'prepend');

// Replace existing content (clears slot first)
this.addToSlot('content', new NewContent(), 'replace');
```

**Chaining:** `addToSlot` returns the component instance, so you can chain multiple calls.

```js
this.addToSlot('header', new Header()).addToSlot('footer', new Footer());
```

## Managing Slots

| Method                       | Description                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `getSlotNames()`             | Returns an array of slot names defined in the component.                                                                                       |
| `hasSlotContent(slotName)`   | Checks if a slot has any child components.                                                                                                     |
| `clearSlotContent(slotName)` | Removes all child components from a slot. Returns `true` if the slot was cleared.                                                              |
| `getSlotElement(slotName)`   | Returns the DOM element that acts as the slot container (the element with `data-slot`). Useful for direct DOM manipulation.                    |
| `detachFromSlot()`           | Removes the component from its parent slot (if any). The component remains alive and can be re‑attached elsewhere. Returns `true` if detached. |

```js
// Clear a slot
if (this.hasSlotContent('sidebar')) {
    this.clearSlotContent('sidebar');
}

// Get the slot's DOM element for styling
const slotEl = this.getSlotElement('content');
if (slotEl) slotEl.classList.add('highlight');

// Detach this component from its parent
this.detachFromSlot();
// later, attach it elsewhere
parentComponent.addToSlot('new-slot', this);
```

## The `SlotToggler` Utility

`SlotToggler` helps you toggle between multiple slots (e.g., tabs). It automatically hides inactive slots and shows the active one.

```js
import { SlotToggler } from '@supercat1337/ui';

class Tabs extends Component {
    layout = html`
        <div data-slot="tab1"></div>
        <div data-slot="tab2"></div>
        <div data-slot="tab3"></div>
    `;

    constructor() {
        super();
        this.addToSlot('tab1', new Tab1());
        this.addToSlot('tab2', new Tab2());
        this.addToSlot('tab3', new Tab3());

        this.toggler = new SlotToggler(this, ['tab1', 'tab2', 'tab3'], 'tab1');
    }

    switchTo(tab) {
        this.toggler.toggle(tab);
    }
}
```

**Important:** The `SlotToggler` expects that the slot elements are direct children of the component's root. It works by adding/removing the `d-none` class to the slot containers. You must have the core styles injected (call `injectCoreStyles()` once in your app) for the `d-none` class to work.

### Example: Lazy Loading with Slots

The following example demonstrates how to load a component dynamically and manage UI states (empty, loading, error, content) using a `Toggler`. Only the dynamic component lives in a slot; static states are simple DOM elements whose visibility is toggled via CSS.

```js
import { Component, html, Toggler, hideElements, showElements } from '@supercat1337/ui';

class App extends Component {
    layout = html`
        <div class="app-wrapper">
            <h2>Async Module Loading</h2>
            <button data-ref="loadBtn">Fetch Profile Module</button>

            <div class="stage">
                <div data-ref="emptyState">No profile loaded yet.</div>
                <div data-ref="loadingState" class="d-none">
                    <div class="loader">Fetching ESM module...</div>
                </div>
                <div data-ref="errorState" class="error-message d-none"></div>
                <div data-slot="content" data-ref="contentState" class="d-none"></div>
            </div>
        </div>
    `;

    refsAnnotation = {
        loadBtn: HTMLButtonElement.prototype,
        emptyState: HTMLElement.prototype,
        loadingState: HTMLElement.prototype,
        errorState: HTMLElement.prototype,
        contentState: HTMLElement.prototype,
    };

    // Toggler for UI states (empty, loading, error, content)
    stateToggler = new Toggler();

    // Reference to the currently loaded component (if any)
    loadedComponent = null;

    connectedCallback() {
        const refs = this.getRefs();

        // Setup Toggler items for each state (chaining enabled)
        this.stateToggler
            .addItem('empty', () => showElements(refs.emptyState), () => hideElements(refs.emptyState))
            .addItem('loading', () => showElements(refs.loadingState), () => hideElements(refs.loadingState))
            .addItem('error', () => showElements(refs.errorState), () => hideElements(refs.errorState))
            .addItem('content', () => showElements(refs.contentState), () => hideElements(refs.contentState))
            .init('empty'); // activate the 'empty' state initially

        refs.loadBtn.onclick = async () => {
            if (this.loadedComponent) return; // already loaded

            this.stateToggler.setActive('loading');
            refs.loadBtn.disabled = true;

            try {
                const { UserProfile } = await import('./UserProfile.js');
                const profile = new UserProfile();

                // Insert the component into the content slot (replaces any previous content)
                this.addToSlot('content', profile, 'replace');
                this.loadedComponent = profile;

                this.stateToggler.setActive('content');
            } catch (err) {
                console.error('Failed to load ESM component:', err);
                refs.errorState.textContent = `Failed to load: ${err.message}`;
                this.stateToggler.setActive('error');
                refs.loadBtn.disabled = false;
                this.clearSlotContent('content');
            }
        };
    }

    disconnectedCallback() {
        // Clean up when the component is removed
        if (this.loadedComponent) {
            this.loadedComponent.detachFromSlot();
            this.loadedComponent = null;
        }
        this.stateToggler.clear(); // remove all items and prevent memory leaks
    }
}
```

**Why `Toggler` and not `SlotToggler`?**  
- Here we only have one slot (`content`). The static UI states are simple DOM elements, not components. `Toggler` is perfect for toggling their visibility via CSS classes.  
- `SlotToggler` is intended for switching between **multiple slots**, each potentially containing child components. It automatically mounts/unmounts components when switching, which is unnecessary in this single‑slot scenario.

This pattern is ideal for lazy‑loading heavy components, code‑splitting, or handling asynchronous data fetching with clear error feedback.

> **Note:** A full runnable version of this example is available in [`examples/07-lazy-loading`](./examples/07-lazy-loading).
