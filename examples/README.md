## 🚀 Examples Gallery

Each example is a self-contained project demonstrating a specific feature of the library.

| Folder                   | Name                    | Key Concept                                                  |
| ------------------------ | ----------------------- | ------------------------------------------------------------ |
| `01-layout-diversity`    | **Layout Diversity**    | Using Strings, Functions, and DOM Nodes as layouts.          |
| `02-interactive-counter` | **Interactive Counter** | State management, event handling, and `getRefs()`.           |
| `03-todo-list`           | **Todo List**           | Complex state, arrays, and dynamic re-rendering.             |
| `04-lifecycle-async`     | **Lifecycle & Async**   | Fetching data and using `connectedCallback` for async tasks. |
| `05-hydration`           | **Client Hydration**    | Attaching JS logic to existing HTML without re-rendering.    |
| `06-ssr-generator`       | **Isomorphic SSR**      | Full Node.js + JSDOM server-side rendering workflow.         |

---

## 🌟 Featured: 06-ssr-generator

This example demonstrates the **Isomorphic Architecture**. It allows you to use the exact same Component class to generate HTML on the server and then "hydrate" it in the browser.

### 1. Universal Component (`UserProfile.js`)

The component is designed to be "Environment Aware". It builds the structure everywhere, but only attaches logic in the browser.

```javascript
export class UserProfile extends Component {
    constructor(data) {
        super({ instanceId: `user-${data.id}` });
        this.data = data;
    }

    // Universal Layout
    layout = () => html`
        <div data-component-root="${this.instanceId}" class="card">
            <h5 data-ref="userName">${this.data.name}</h5>
            <button data-ref="followBtn">Follow</button>
        </div>
    `;

    connectedCallback() {
        // Safe check for Server-Side Rendering
        if (this.isServer) return;

        // Browser-only interactive logic
        this.getRefs().followBtn.onclick = () => alert('Hello from Browser!');
    }
}
```

### 2. The Server Generator (`server.js`)

Uses `jsdom` to simulate the DOM in Node.js. It sets `window.isServer = true` to inform the library that we are in "String Generation Mode".

```javascript
import { JSDOM } from 'jsdom';
import { UserProfile } from './UserProfile.js';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.window.isServer = true; // Activate SSR mode

const profile = new UserProfile({ id: 101, name: 'Alice' });
profile.mount(document.getElementById('app'));

// Result: Clean HTML string ready for the client
const htmlOutput = document.getElementById('app').innerHTML;
```

### 3. Client-Side Hydration

When the page loads, the library doesn't create new elements. It finds the `data-component-root` rendered by the server and simply connects the event listeners.

```javascript
// On the client
const profile = new UserProfile({ id: 101, name: 'Alice' });
profile.mount(document.getElementById('app'), 'hydrate');
```

---

## 🛠 How to run the examples

1. Navigate to the example folder:

```bash
cd examples/06-ssr-generator

```

2. Install dependencies (for SSR):

```bash
npm install

```

3. Run the server:

```bash
node server.js

```

4. Open the generated `index.html` in your browser.
