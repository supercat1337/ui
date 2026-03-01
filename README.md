# 🚀 Supercat UI Library

A lightweight, **isomorphic** UI library for building high-performance web interfaces with native JavaScript. Designed for **SEO-friendly** applications with seamless **SSR to Hydration** workflow.

## ✨ Key Features

- **Isomorphic by Design**: Use the exact same component classes on Node.js (SSR) and in the Browser.
- **Zero-Overhead Hydration**: Attach logic to pre-rendered HTML without re-painting the DOM.
- **Scoped Refs**: Built-in `data-ref` system that eliminates `querySelector` collisions.
- **Declarative Slots**: Easy component composition with native-like slot behavior.
- **Lifecycle Managed**: Controlled execution with `connectedCallback` and built-in server-side guards.

---

## 🛠 Core Concept: Isomorphic Lifecycle

The library uses a "Handshake" mechanism to sync Server and Client.

1. **Server (Node.js + JSDOM)**: Renders the component to a string. The library detects `window.isServer` and skips interactivity.
2. **Client (Browser)**: "Hydrates" the existing HTML. It connects the logic to the `data-component-root` and activates event listeners.

### Example: A Universal Component

```javascript
import { Component, html } from '@supercat1337/ui';

export class UserProfile extends Component {
    constructor(data) {
        super({ instanceId: `user-${data.id}` });
        this.data = data;
    }

    // Single source of truth for your UI
    layout = () => html`
        <div class="card">
            <h5 data-ref="name">${this.data.name}</h5>
            <button data-ref="btn">Follow</button>
        </div>
    `;

    connectedCallback() {
        // 1. Prepare data (runs on both)
        console.log('Component connected:', this.instanceId);

        // 2. Server guard (stops execution on Node.js)
        if (this.isServer) return;

        // 3. Browser-only interactivity
        this.getRefs().btn.onclick = () => alert('Following!');
    }
}
```

---

## 📂 Examples

Explore our [Examples Folder](./examples) to see the library in action:

- **01-04**: Basic interactivity, slots, and lifecycle.
- **05 Hydration**: Manual attachment to existing DOM.
- **06 Isomorphic SSR**: The complete Node.js + Browser workflow using `jsdom`.

---

## 🚀 Quick Start (SSR)

1. **Install JSDOM** (for server-side): `npm install jsdom`
2. **Set the flag**: `global.window.isServer = true;`
3. **Render**:

```javascript
const profile = new UserProfile({ id: 1, name: 'Alice' });
profile.mount(document.body); // Renders to JSDOM
const html = document.body.innerHTML; // Send this string to client
```

4. **Hydrate** (on client):

```javascript
const profile = new UserProfile({ id: 1, name: 'Alice' });
profile.mount(document.body, 'hydrate');
```

---

## ⚖️ License

MIT
