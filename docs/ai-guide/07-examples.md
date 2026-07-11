---
title: BareDOM – Examples & Tutorials
version: 2.0.0
tags: [examples, tutorials, demos]
---

# Examples

The library includes a collection of runnable examples in the `examples/` folder. Each example demonstrates a specific concept.

| Folder                      | Name                                  | Key Concept                                                      |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `01-layout-diversity`       | Layout Diversity                      | Using strings, functions, and DOM nodes as layouts.              |
| `02-interactive-counter`    | Interactive Counter                   | State, events, and `getRefs()`.                                  |
| `03-todo-list`              | Todo List                             | Complex state and dynamic re‑rendering.                          |
| `04-lifecycle-async`        | Lifecycle & Async                     | Fetching data in `connectedCallback`.                            |
| `05-hydration`              | Client Hydration                      | Attaching logic to existing HTML.                                |
| `06-ssr-generator`          | Isomorphic SSR                        | Full Node.js server‑side rendering.                              |
| `07-lazy-loading`           | Lazy Loading                          | Dynamic imports and slot placeholders.                           |
| `08-css-modules`            | CSS Modules                           | Style encapsulation in ESM.                                      |
| `09-native-css-scripts`     | Native CSS Scripts                    | Direct CSSOM manipulation.                                       |
| `10-instance-theming`       | Component Theming                     | CSS modifiers and `adoptedStyleSheets`.                          |
| `11-event-interop`          | Event Interop                         | Component communication via `on`/`emit`.                         |
| `12-slot-toggler-utils`     | UI Utilities                          | High‑level UI logic helpers.                                     |
| `13-teleports`              | Logical Teleports                     | Rendering fragments to external DOM nodes.                       |
| `14-teleport-hydration`     | Teleport Hydration                    | Hydrating teleported SSR markup.                                 |
| `15-nested-portals`         | Nested Portals                        | Rendering components with portals inside portals.                |
| `16-web-components`         | Web Components Integration            | Using custom elements with Shadow DOM.                           |
| `17-i18n`                   | Internationalization                  | Dynamic text updates without re‑rendering.                       |
| `18-utilities`              | Utility Functions                     | Debounce, throttle, generateId, onClickOutside, storage wrapper. |
| `19-moving-components`      | Moving Components (Same Parent)       | Moving a component between slots.                                |
| `20-moving-between-parents` | Moving Components (Different Parents) | Transferring a component between parents.                        |

## Running Examples

```bash
npm install
npm run examples
```

This will start a live server at `http://localhost:8080` and open the examples index.

---

## Tutorial: Building a Simple Todo App

Let's build a minimal todo list to illustrate the key concepts: components, slots, refs, and lifecycle. We'll use Bootstrap for styling (optional) but focus on the BareDOM patterns. We'll also follow the recommended practice of keeping templates in separate `.html` files.

### Step 1: Create the TodoItem Component

Each todo item is a standalone component that knows how to render itself and can remove itself when the delete button is clicked.

**TodoItem.template.html:**

```html
<li class="list-group-item d-flex justify-content-between align-items-center">
    <span data-ref="text"></span>
    <button class="btn btn-sm btn-outline-danger" data-ref="removeBtn">&times;</button>
</li>
```

**TodoItem.js:**

```js
import { Component } from '@supercat1337/ui';
import template from './TodoItem.template.html';

class TodoItem extends Component {
    static layout = template;

    constructor(text) {
        super();
        this.text = text;
    }

    refsAnnotation = {
        text: HTMLSpanElement.prototype,
        removeBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        const refs = this.getRefs();
        refs.text.textContent = this.text;
        // ✅ Use $on for automatic cleanup
        this.$on(refs.removeBtn, 'click', () => this.unmount());
    }
}
```

**Key points:**

- The layout is a static string imported from an HTML file — it does **not** support interpolation, so we set the text via `ref` in `connectedCallback`.
- `unmount()` automatically detaches the component from its parent slot and cleans up event listeners.
- We use `this.$on()` instead of `onclick` to ensure the listener is removed when the component unmounts.

### Step 2: Create the TodoApp Component

The main app manages the input field, the add button, and the slot where todo items appear.

**TodoApp.template.html:**

```html
<div class="card shadow-sm mx-auto" style="width: 26rem;">
    <div class="card-header bg-white py-3">
        <h5 class="mb-0 text-center text-primary">Task Manager</h5>
    </div>
    <div class="card-body">
        <div class="input-group mb-3">
            <input
                type="text"
                class="form-control"
                data-ref="taskInput"
                placeholder="New task..."
            />
            <button class="btn btn-primary" data-ref="addBtn">Add</button>
        </div>
        <ul class="list-group list-group-flush" data-slot="items-slot"></ul>
    </div>
</div>
```

**TodoApp.js:**

```js
import { Component } from '@supercat1337/ui';
import template from './TodoApp.template.html';
import { TodoItem } from './TodoItem.js';

class TodoApp extends Component {
    static layout = template;

    refsAnnotation = {
        taskInput: HTMLInputElement.prototype,
        addBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        const refs = this.getRefs();

        const addTask = () => {
            const val = refs.taskInput.value.trim();
            if (!val) return;

            const newItem = new TodoItem(val);
            this.addToSlot('items-slot', newItem);

            refs.taskInput.value = '';
            refs.taskInput.focus();
        };

        // ✅ Use $on instead of onclick/onkeydown
        this.$on(refs.addBtn, 'click', addTask);
        this.$on(refs.taskInput, 'keydown', e => {
            if (e.key === 'Enter') addTask();
        });
    }
}
```

**Key points:**

- The layout defines a slot named `items-slot`. This is where each new todo item will be inserted.
- `addToSlot` automatically finds the DOM element with `data-slot="items-slot"` and mounts the child component. No manual DOM manipulation is needed.
- The app does not keep an explicit list of items – it relies on the slot system. When an item calls `unmount()`, it is automatically removed from the slot and cleaned up.
- All event listeners are attached using `this.$on()` for automatic cleanup on unmount.

### Step 3: Mount the App

Create an entry point that instantiates the app and mounts it to the document body.

```js
// main.js
import { TodoApp } from './TodoApp.js';

const app = new TodoApp();
app.mount(document.body);
```

### Step 4: HTML Page

The HTML includes Bootstrap for styling, an import map, and the script entry point.

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Example 03: Todo List (Dynamic Slots)</title>
        <link
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
            rel="stylesheet"
        />
        <script type="importmap">
            {
                "imports": {
                    "@supercat1337/ui": "../../dist/ui.bundle.esm.js"
                }
            }
        </script>
        <style>
            html,
            body {
                height: 100%;
                margin: 0;
                background-color: #f8f9fa;
            }
        </style>
    </head>
    <body class="d-flex justify-content-center align-items-center">
        <script type="module" src="./main.js" async></script>
    </body>
</html>
```

### Build Setup

To run this example, make sure your build tool (esbuild with the HTML plugin) supports importing `.html` files as strings. See the [Components guide](./01-components.md#recommended-external-html-templates) for setup instructions.

### Key Takeaways

- **Components** are self‑contained classes that define their own layout and refs.
- **Layouts** are best stored in separate `.html` files and imported as strings; they are static and do not support interpolation — use `data-ref` + `connectedCallback` for dynamic content.
- **Refs** provide direct access to DOM elements with full type safety.
- **Slots** simplify composition: you define a placeholder with `data-slot`, then use `addToSlot()` to insert child components. The library handles mounting and unmounting.
- **Unmounting** is automatic: calling `unmount()` on a component removes it from its parent slot and cleans up all resources.
- **Lifecycle** methods like `connectedCallback()` are perfect for setting up event listeners and populating dynamic data after the component is in the DOM.
- **Always use `this.$on()`** for event listeners to ensure automatic cleanup and prevent memory leaks.

For more advanced patterns, explore the other examples in the repository. A complete runnable version of this todo app is available in [`examples/03-todo-list`](./examples/03-todo-list).
