---
title: BareDOM – Lifecycle & Events
version: 2.0.0
tags: [lifecycle, events, hooks, event-emitter]
---

# Lifecycle Hooks

Override these methods to execute code at specific moments:

| Method                   | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| `connectedCallback()`    | Called after the component is mounted to the DOM.                            |
| `disconnectedCallback()` | Called just before unmounting (good for cleanup).                            |
| `restoreCallback(data)`  | Called during hydration with server‑provided data (before the DOM is ready). |

```js
class MyComponent extends Component {
    connectedCallback() {
        console.log('Component is now in the DOM');
    }

    disconnectedCallback() {
        console.log('Component will be removed');
    }

    restoreCallback(data) {
        this.state = data;
    }
}
```

## Lifecycle Events

You can also subscribe to lifecycle events using the built‑in event emitter.

| Event Name        | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `'connect'`       | Fired after `connectedCallback`.                          |
| `'disconnect'`    | Fired after `disconnectedCallback`.                       |
| `'mount'`         | Fired after the component is fully inserted into the DOM. |
| `'unmount'`       | Fired after the component is removed from the DOM.        |
| `'prepareRender'` | Fired before the layout is rendered.                      |
| `'collapse'`      | Fired after the component is collapsed.                   |
| `'expand'`        | Fired after the component is expanded.                    |
| `'restore'`       | Fired after hydration state is restored.                  |

```js
this.on('mount', () => console.log('Mounted'));
this.on('disconnect', () => console.log('Disconnected'));
```

## Event Emitter

Components inherit an `EventEmitter` from `@supercat1337/event-emitter`. Use it for custom communication between components.

### `on(event, callback)`

Subscribes to an event. The callback receives two arguments:

- **`context`** – the object passed as the second argument to `emit()` (defaults to `{}`).
- **`component`** – a reference to the component instance that emitted the event (useful for introspection).

Returns an unsubscribe function.

```js
const unsubscribe = this.on('userLoggedIn', (ctx, component) => {
    console.log('User data:', ctx.user);
    console.log('Component ID:', component.instanceId);
});

// later
unsubscribe();
```

### `once(event, callback)`

Subscribes for one invocation only. The callback receives the same `(context, component)` signature.

### `emit(event, context)`

Emits an event with optional context data. The context is passed as the first argument to all listeners.

```js
this.emit('userLoggedIn', { user: 'Alice', timestamp: Date.now() });
```

### Destructuring the Context

You can use destructuring to extract specific properties from the context object:

```js
this.on('userLoggedIn', ({ user }, component) => {
    console.log(`Welcome, ${user.name}!`);
});
```

### Lifecycle Events

Lifecycle events follow the same pattern. When they are emitted internally, the context is an empty object (`{}`). You can still access the component instance as the second argument.

```js
this.on('mount', (ctx, component) => {
    console.log('Mounted!');
    // ctx is {} unless overridden
});
```

## DOM Events with Automatic Cleanup

Use `$on(element, event, callback)` to attach DOM event listeners that are automatically removed when the component unmounts. This is the **recommended** way to add event listeners inside your component, as it prevents memory leaks and eliminates the need for manual cleanup in `disconnectedCallback`.

```js
this.$on(this.getRefs().myButton, 'click', () => {
    alert('Clicked!');
});
```

The `$on` method returns an unsubscribe function if you need to remove the listener earlier.

For advanced scenarios, you can also use the component's internal `AbortController`:

```js
const signal = this.$internals.disconnectController.signal;
element.addEventListener('click', handler, { signal });
```

> **Important:** If you use `addEventListener` directly without the component’s built‑in helpers, you must manually remove the listener in `disconnectedCallback` to avoid memory leaks. The `$on` method (and the `AbortController` signal) handle this automatically.

## Automatic Cleanup with `addDisposer`

BareDOM provides a built‑in mechanism to manage the cleanup of third‑party resources. Instead of manually overriding `disconnectedCallback`, you can register “disposers” — functions that will be automatically executed when the component is unmounted.

The library ensures that even if one disposer throws an error, the rest of the cleanup chain will continue to execute.

### Method: `addDisposer(fn)`

Registers a function to be called during the unmounting process. You can call `addDisposer` multiple times from anywhere in your component (typically inside `connectedCallback`). All registered functions are executed in order when the component is unmounted, and the internal list is cleared afterwards.

```js
connectedCallback() {
    const refs = this.getRefs();

    // 1. Timers
    const timerId = setInterval(() => this.updateTime(), 1000);
    this.addDisposer(() => clearInterval(timerId));

    // 2. External reactivity (e.g., MobX)
    const disposer = autorun(() => {
        refs.title.textContent = store.title;
    });
    this.addDisposer(disposer);

    // 3. Third‑party library instances
    const chart = new Chart(refs.canvas, config);
    this.addDisposer(() => chart.destroy());
}
```

### Why use `addDisposer`?

1. **Safety:** Each disposer is wrapped in a `try...catch` block. An error in one cleanup task won’t stop others.
2. **Cleaner Code:** You can keep the initialisation and cleanup logic together in `connectedCallback`.
3. **Automatic Management:** All registered disposers are cleared and the list is reset automatically after unmounting, preventing memory leaks.

> **Note:** If you override `disconnectedCallback`, you can still use `addDisposer` alongside it. The disposers run after `disconnectedCallback` (but before the final DOM removal). This gives you flexibility to combine both approaches.

## Integrating Third‑Party Libraries

The `connectedCallback` method is the ideal place to initialise third‑party solutions. Because BareDOM guarantees that all elements (including those in teleports) are present in the DOM by this point, you can safely pass `refs` to external constructors.

**Example: Integration with MobX and Chart.js using `addDisposer`**

```js
import { Component, html } from '@supercat1337/ui';
import { autorun } from 'mobx';
import Chart from 'chart.js/auto';

class Dashboard extends Component {
    layout = html`
        <div>
            <canvas data-ref="canvas"></canvas>
            <div data-ref="status"></div>
        </div>
    `;

    connectedCallback() {
        const refs = this.getRefs();

        // 1. Initialise a third‑party library
        const chart = new Chart(refs.canvas, {
            /* config */
        });
        this.addDisposer(() => chart.destroy());

        // 2. Connect external reactivity
        const disposer = autorun(() => {
            refs.status.textContent = `Update count: ${store.updateCount}`;
            chart.update(); // update chart data manually
        });
        this.addDisposer(disposer);
    }
}
```

**Why this pattern is better:**

- **Cleaner code:** The initialisation and cleanup logic stay together in `connectedCallback`. No need to manually override `disconnectedCallback`.
- **Safety:** Even if one disposer throws an error, the others still run.
- **Automatic:** All disposers are executed when the component unmounts, preventing memory leaks.

> **Note:** The `$on` method (or the internal `AbortController`) is still the recommended way to attach DOM event listeners. For general cleanup of non‑DOM resources (timers, subscriptions, library instances), `addDisposer` is the perfect fit.

## Order of Lifecycle Hooks

When a component tree is mounted or unmounted, the lifecycle hooks are called in a specific order:

- **`connectedCallback`** (and the `'connect'` event) are called **bottom‑up**: child components are connected **before** their parent. This ensures that when a parent's `connectedCallback` runs, all its children are already attached and have their refs available.

- **`disconnectedCallback`** (and the `'disconnect'` event) are also called **bottom‑up**: child components are disconnected **before** their parent. This allows each component to clean up its own resources before the parent is removed.

Both mounting and unmounting traverse from leaves to root, mirroring the natural DOM lifecycle and preventing race conditions.

```js
class Child extends Component {
    connectedCallback() {
        console.log('Child connected');
    }
    disconnectedCallback() {
        console.log('Child disconnected');
    }
}

class Parent extends Component {
    connectedCallback() {
        console.log('Parent connected');
    }
    disconnectedCallback() {
        console.log('Parent disconnected');
    }
}

// Mounting: Child connected → Parent connected
// Unmounting: Child disconnected → Parent disconnected
```

> **Note:** The same order applies to the `'connect'` and `'disconnect'` events emitted by the component's event emitter.
