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
