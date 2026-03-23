# Idea: Declarative Shadow DOM Scanning (`data-scan-shadow`)

## Background

Currently, BareDOM's reference scanner (`getRefs`) only traverses the component's main DOM tree (Light DOM). To access elements inside a Web Component's Shadow DOM, developers must manually register the `shadowRoot` using the `before-update-refs` event and `$internals.additionalRoots`. This creates boilerplate and requires knowledge of internal library mechanics.

## Proposal

Introduce a declarative attribute, `data-scan-shadow`, that can be placed on any element in the `layout`. When the scanner encounters this attribute, it automatically adds that element's `shadowRoot` (if it exists) to the pool of scanning targets.

### Key Benefits

- **Declarative UI:** No more manual logic in the `constructor`.
- **Cleaner Code:** Removes the need to touch `$internals` for 99% of use cases.
- **Better DX:** High-level abstraction for a complex DOM operation.

---

## Implementation Example

### Current Approach (Complex)

```javascript
class UserProfile extends Component {
    layout = html`<my-avatar data-ref="avatar"></my-avatar>`;

    constructor() {
        super();

        this.on('before-update-refs', () => {
            const { avatar } = this.getRootNode().querySelector('my-avatar');
            if (avatar?.shadowRoot) {
                this.$internals.additionalRoots.push(avatar.shadowRoot);
            }
        });
    }
}
```

### Proposed Approach (Surgical & Clean)

By simply adding the attribute in the HTML, the library handles the registration internally.

```javascript
class UserProfile extends Component {
    // Elements inside <my-avatar>'s Shadow DOM become available automatically
    layout = html`
        <div class="profile">
            <my-avatar data-scan-shadow></my-avatar>
            <h2 data-ref="userName">John Doe</h2>
        </div>
    `;

    refsAnnotation = {
        userName: HTMLHeadingElement.prototype,
        avatarImage: HTMLImageElement.prototype, // Located inside <my-avatar>
    };

    connectedCallback() {
        const { userName, avatarImage } = this.getRefs();
        // Transparent access to both Light and Shadow DOM
        avatarImage.src = '/path/to/img.png';
    }
}
```

---

## Expected Behavior

1.  **Scanner Logic:** During the `updateRefs` phase, the engine checks for the `data-scan-shadow` attribute.
2.  **Validation:** If the element has an `open` shadow root, it is pushed to `additionalRoots`.
3.  **Recursive Support:** Ideally, it should support nested scanning if a component inside a shadow root also has the `data-scan-shadow` attribute.
4.  **Error Handling:** If the attribute is present but `shadowRoot` is null (e.g., closed shadow root or not a custom element), the scanner should skip it silently or log a warning in dev mode.

---

## Idea: The `subscribeTo` Helper for External Events

### Background

When a component needs to listen to an external emitter (a global store, another component, or a shared service), the developer must manually ensure the subscription is removed when the **subscriber** unmounts to prevent memory leaks. Manually capturing the `unsubscribe` function and passing it to `addDisposer()` is a repetitive task that is easy to forget.

### Proposal

Introduce a dedicated method, `this.subscribeTo(emitter, event, callback)`, which acts as a bridge. It subscribes to the source and automatically registers the unsubscription function within the current component's disposer queue.

### Key Philosophy: Shared Responsibility

- **Subscriber's Duty:** If the subscriber unmounts, `subscribeTo` ensures all its external "hooks" are severed.
- **Emitter's Duty:** It is assumed that if the emitter (source) is destroyed or unmounted, it handles its own internal cleanup or becomes inert. Even if it doesn't, the subscriber's own cleanup via `addDisposer` serves as a secondary safety net.

### Implementation Example

```javascript
class MyComponent extends Component {
    connectedCallback() {
        // ✅ Simple, explicit, and leak-proof
        this.subscribeTo(globalStore, 'data-updated', data => {
            this.state.items = data;
            this.update();
        });
    }
}
```

**Internal Implementation Logic:**

```javascript
subscribeTo(emitter, event, callback) {
    const unsubscribe = emitter.on(event, callback);
    this.addDisposer(unsubscribe);
    return unsubscribe;
}
```

### Key Benefits

- **Improved DX:** Shorter syntax for a common pattern.
- **Explicit Intent:** The name `subscribeTo` clearly signals an external dependency, unlike the internal-sounding `this.on()`.
- **Zero API Bloat:** Keeps the standard `on()` and `once()` methods simple and predictable without adding complex `options` arguments.

---

## Idea: Helper for External Subscriptions (`subscribeTo`)

### Status: Deferred / Low Priority

**Decision:** Do not include in the core API for now. Rely on the explicit `addDisposer` pattern.

### Reasoning

- **API Minimalism:** Adding `subscribeTo` increases the surface area of the `Component` class without providing new functionality.
- **Explicit vs. Implicit:** `this.addDisposer(emitter.on(...))` is perfectly transparent and shows exactly how the cleanup is handled.
- **Universal Pattern:** `addDisposer` is a universal tool for all types of resources (events, timers, sockets). Promoting a specific helper for events might obscure this general pattern.

### Example of the Recommended Pattern

Developers should continue using the explicit pattern in `connectedCallback`:

```javascript
connectedCallback() {
    const unsub = globalStore.on('update', () => this.refresh());
    this.addDisposer(unsub);
}
```
