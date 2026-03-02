## Typing your Components

The `Component` class provides powerful typing for your DOM references (`data-ref`). You can choose between **Static-only typing** (for IDE autocompletion) or **Full typing** (Static + Runtime validation).

### 1. Static Typing (JSDoc only)

Use this approach if you only want IDE autocompletion and want to keep your JavaScript bundle as small as possible. This does not perform any checks at runtime.

To achieve this, define the types in the `@extends` block:

```javascript
/**
 * @extends {Component<{
 * submitBtn: HTMLButtonElement,
 * userName: HTMLInputElement
 * }>}
 */
class SimpleForm extends Component {
    connectedCallback() {
        const refs = this.getRefs();
        // IDE knows submitBtn is an HTMLButtonElement
        refs.submitBtn.disabled = true;
    }
}
```

### 2. Full Typing (Static + Runtime Validation)

Use this approach to ensure your HTML structure perfectly matches your JavaScript logic. By defining `refsAnnotation`, the component will automatically validate that all elements exist and are of the correct type during the `getRefs()` call.

```javascript
class UserCard extends Component {
    /**
     * Define refs for both IDE autocompletion and Runtime validation.
     * You can use either .prototype or the Constructor directly.
     */
    refsAnnotation = {
        avatar: HTMLImageElement.prototype,
        name: HTMLHeadingElement.prototype,
        bio: HTMLParagraphElement.prototype,
        followBtn: HTMLButtonElement, // Constructor works too!
    };

    connectedCallback() {
        // Validation happens inside getRefs()
        const refs = this.getRefs();

        // If 'avatar' was actually a <div> in HTML,
        // a descriptive Type Error would be thrown here.
        refs.avatar.src = 'user.jpg';
        refs.followBtn.onclick = () => this.follow();
    }
}
```

---

### Summary Table

| Feature                | Static Typing      | Full Typing                     |
| ---------------------- | ------------------ | ------------------------------- |
| **IDE Autocomplete**   | ✅ Yes             | ✅ Yes                          |
| **Runtime Validation** | ❌ No              | ✅ Yes                          |
| **Setup**              | JSDoc `@extends`   | Class property `refsAnnotation` |
| **Best for**           | Simple UI elements | Complex business logic & Forms  |
