---
title: BareDOM – Slots & Composition
version: 2.0.0
tags: [slots, composition, addToSlot, SlotToggler, Toggler]
---

# Slots

Slots are placeholders in a component's layout where child components (or other content) can be inserted. Define a slot with the `data-slot` attribute.

```js
class Parent extends Component {
    layout = `
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

**Chaining:** `addToSlot` returns the component instance, so you can chain calls:

```js
this.addToSlot('a', compA).addToSlot('b', compB);
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

---

## `SlotToggler`

`SlotToggler` is a specialized utility for managing the lifecycle of components across multiple slots (e.g., in a tabbed UI or a multi‑step form). Unlike simple CSS toggling, `SlotToggler` **automatically unmounts** components in inactive slots and **mounts** them in the active slot. This ensures that only the visible view consumes DOM resources and that lifecycle hooks (`connectedCallback`, `disconnectedCallback`) are triggered correctly.

### Key Difference: `SlotToggler` vs. `Toggler`

- **`SlotToggler`**: Mounts/unmounts components. Best for performance and heavy views where you want to free resources when hidden.
- **`Toggler`**: Toggles CSS visibility (using the `d-none` class). Best for preserving component state (like form inputs) or simple static elements.

### Example: Tabbed Interface

```js
import { Component, SlotToggler } from '@supercat1337/ui';

class TabbedApp extends Component {
    layout = `
        <div class="tabs-container">
            <nav class="tab-menu">
                <button data-ref="tab1Btn">Dashboard</button>
                <button data-ref="tab2Btn">Settings</button>
            </nav>
            <div data-slot="dashboard"></div>
            <div data-slot="settings"></div>
        </div>
    `;

    refsAnnotation = {
        tab1Btn: HTMLButtonElement.prototype,
        tab2Btn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        const { tab1Btn, tab2Btn } = this.getRefs();

        // 1. Initialize SlotToggler with the component and slot names
        this.slotToggler = new SlotToggler(this, ['dashboard', 'settings']);

        // 2. Add components to slots (they will be managed by the toggler)
        this.addToSlot('dashboard', new HeavyDashboard());
        this.addToSlot('settings', new SettingsForm());

        // 3. Setup navigation using $on for automatic cleanup
        this.$on(tab1Btn, 'click', () => this.slotToggler.toggle('dashboard'));
        this.$on(tab2Btn, 'click', () => this.slotToggler.toggle('settings'));

        // 4. Set initial active slot
        this.slotToggler.init(); // activates the first slot (dashboard)
    }
}
```

---

## Advanced Composition: Lazy Loading

Slots can be used for dynamic content loading. In this example, we use a simple `Toggler` to switch between UI states because we are working with a single slot and static elements.

```js
// @ts-check
import { 
    Component, 
    html, 
    Toggler, 
    hideElements, 
    showElements 
} from '@supercat1337/ui';

class App extends Component {
    // 1. Define the layout with data-ref for elements and data-slot for dynamic content
    layout = `
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

    // Initialize Toggler instance to manage UI state transitions
    stateToggler = new Toggler();

    connectedCallback() {
        // 2. Destructure refs for cleaner access throughout the method
        const { 
            loadBtn, 
            emptyState, 
            loadingState, 
            errorState, 
            contentState 
        } = this.getRefs();

        // 3. Configure Toggler items using built-in visibility helpers
        // This ensures only one state is visible at a time
        this.stateToggler
            .addItem('empty', () => showElements(emptyState), () => hideElements(emptyState))
            .addItem('loading', () => showElements(loadingState), () => hideElements(loadingState))
            .addItem('error', () => showElements(errorState), () => hideElements(errorState))
            .addItem('content', () => showElements(contentState), () => hideElements(contentState))
            .init('empty');

        // 4. Use this.$on for event listening to ensure automatic unsubscription on unmount
        this.$on(loadBtn, 'click', async () => {
            // Guard clause to prevent concurrent loading requests
            if (loadBtn.disabled) return;

            this.stateToggler.setActive('loading');
            loadBtn.disabled = true;

            try {
                // Dynamic ESM import of the component
                const { UserProfile } = await import('./UserProfile.js');
                const profile = new UserProfile();

                // 'replace' mode automatically disconnects any previous component in this slot
                this.addToSlot('content', profile, 'replace');

                // Switch to success state
                this.stateToggler.setActive('content');
            } catch (err) {
                console.error('Failed to load ESM component:', err);
                
                // Update error UI and switch state
                errorState.textContent = `Failed to load: ${err.message}`;
                this.stateToggler.setActive('error');
                
                // Cleanup slot and allow retry
                this.clearSlotContent('content');
                loadBtn.disabled = false;
            }
        });

        // 5. Register cleanup for the Toggler instance to prevent memory leaks
        this.addDisposer(() => this.stateToggler.clear());
    }
}

export { App };
```

**Why `Toggler` and not `SlotToggler` in this case?**

- **Single Slot:** We only have one slot (`content`). We aren’t switching between multiple placeholders.
- **Static Elements:** UI states like “loading” and “error” are simple `div` elements already present in the layout, not separate `Component` instances.
- **Visibility vs. Presence:** `Toggler` just toggles CSS classes (visibility). `SlotToggler` would be overkill here as it is designed to physically mount/unmount different components across multiple slots.

---

## Further Reading

- [Lifecycle & Events](./04-lifecycle-events.md)
- [Teleports](./05-teleports.md)
