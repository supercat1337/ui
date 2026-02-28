## 🚀 Examples Overview

| #   | Name                                                                      | Key Concept                          | Complexity   |
| --- | ------------------------------------------------------------------------- | ------------------------------------ | ------------ |
| 01  | [Counter](./examples/01-counter)          | Reactive state and `refs`            | Basic        |
| 02  | [Slots](./examples/02-slots)              | Nesting and content projection       | Basic        |
| 03  | [External Logic](./examples/03-external)  | Interaction with outside state/APIs  | Intermediate |
| 04  | [Lifecycle](./examples/04-lifecycle)      | `connectedCallback` and Cleanup      | Intermediate |
| 05  | [Client Hydration](./examples/05-hydrate) | Attaching to existing DOM            | Advanced     |
| 06  | **[Isomorphic SSR](./examples/06-ssr)**   | **Same class for Node.js & Browser** | **Expert**   |

---

### 🌟 Featured: Example 06 - Isomorphic SSR & Hydration

This is the most powerful way to use the library. It demonstrates how to render a component on a **Node.js server** and "revive" it in the **browser** without duplicating code.

#### 1. The Universal Component

Write your UI logic once. Use the `this.isServer` guard to separate structural logic from browser interactions.

```javascript
export class UserProfile extends Component {
    constructor(data) {
        super({ instanceId: `user-${data.id}` });
        this.data = data;
    }

    layout = () => html`
        <div data-component-root="${this.instanceId}" class="card">
            <h5 data-ref="userName">${this.data.name}</h5>
            <button data-ref="followBtn">Follow</button>
        </div>
    `;

    connectedCallback() {
        // This part runs on BOTH but we stop here on the server
        if (this.isServer) return;

        // Browser-only interactive logic
        this.getRefs().followBtn.onclick = () => console.log('Followed!');
    }
}
```

#### 2. Server-Side Rendering (Node.js)

Using `jsdom`, you can generate the full HTML of your component on the backend. This is perfect for SEO and fast initial page loads.

```javascript
global.window.isServer = true; // Tell the library to skip events
const profile = new UserProfile({ id: 101, name: 'Alice' });
profile.mount(document.getElementById('app'));
// Now export document.body.innerHTML to the client...
```

#### 3. Client-Side Hydration

The browser receives the HTML and "hydrates" it. The library finds the existing `data-component-root`, maps the `refs`, and executes the `connectedCallback` logic after the `isServer` check.

```javascript
const profile = new UserProfile({ id: 101, name: 'Alice' });
profile.mount(document.getElementById('app'), 'hydrate');
```

---

### 💡 Core Concept: The "Server-Safe" Lifecycle

When building isomorphic components, follow this pattern in your `connectedCallback`:

1. **Preparation**: Perform logic needed for both environments (rare).
2. **The Guard**: `if (this.isServer) return;`.
3. **Interaction**: Attach event listeners, start timers, or initialize `IntersectionObserver`.

This ensures your server-side rendering is lightning fast and error-free, while your client-side UI remains snappy and interactive.
