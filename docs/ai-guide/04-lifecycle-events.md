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

### ⚠️ SSR Considerations

When using Server‑Side Rendering (SSR), **lifecycle methods are not executed on the server**. The server only generates the initial HTML structure; all lifecycle hooks are called exclusively in the browser after hydration.

- `connectedCallback` and `disconnectedCallback` are **never invoked** during SSR.
- `restoreCallback` is only called on the client during hydration, not on the server.
- The `mount()` method is also a no‑op when `Config.isSSR` is `true`. Attempting to mount a component on the server will have no effect, as DOM manipulation is not available.

If you need to perform data fetching or initialisation that should happen on the server (e.g., to embed data in the HTML), do it **outside** the component lifecycle – for instance, in a dedicated method that you call manually during the build phase, or by passing data directly to the component constructor.

**Example:** Since `connectedCallback` runs only in the browser, you can safely place client‑only logic directly inside it without any environment check:

```js
connectedCallback() {
    // This code runs only in the browser (never on the server)
    const { button } = this.getRefs();
    button.addEventListener('click', () => this.handleClick());
}
```

If for any reason you need to conditionally execute code on the client inside a method that _could_ be called on the server (e.g., a custom helper), you can detect the environment using `Config.isSSR`:

```js
import { Config } from '@supercat1337/ui';

doSomething() {
    if (!Config.isSSR) {
        // Client‑only logic
    }
}
```

> **Note:** Even though lifecycle methods are not called on the server, the component's `layout` and slot contents **are** processed during SSR. Therefore, any static HTML structure you define (including `data-ref` and `data-slot`) will be present in the server‑generated output.

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
    layout = `
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
// (Wait, I can see my child's refs in my connectedCallback! ✅)
// Unmounting: Child disconnected → Parent disconnected
```

> **Note:** The same order applies to the `'connect'` and `'disconnect'` events emitted by the component's event emitter.

## Managing Subscriptions and Cleanup

Components can emit custom events using `emit`, and you can subscribe to them with `on` or `once`. However, **subscriptions persist even after the component is unmounted**. This means that if you subscribe inside `connectedCallback`, and the component is later unmounted and remounted, you will accumulate duplicate subscriptions.

### Best Practices

- **Use `addDisposer` for subscriptions that should be tied to the component's mount state.** Register your unsubscribe function so it is automatically called when the component unmounts.
    ```javascript
    connectedCallback() {
        const unsubscribe = this.on('some-event', () => { ... });
        this.addDisposer(unsubscribe);
    }
    ```
- **For permanent subscriptions (across mounts), subscribe in the constructor.** This ensures the subscription is created once and lasts for the entire lifetime of the component instance.
    ```javascript
    constructor() {
        super();
        this.on('global-event', () => { ... });
    }
    ```
- **Use `once` when you only need to react to the first occurrence.** `once` automatically unsubscribes after the first emission, which is safe to use anywhere. Even with `once`, if you want to be 100% sure no references remain if the event never fires, you can still wrap it in `addDisposer`.
- **For DOM events, always use `$on`.** It cleans up automatically when the component unmounts.

### Why Not to Subscribe Inside `connectedCallback` Without Cleanup?

If your component is dynamically mounted/unmounted (e.g., inside a `SlotToggler`), every mount will add a new subscription. The old subscriptions never disappear, leading to memory leaks and unintended multiple executions.

**Example of a problem:**

```javascript
class MyComponent extends Component {
    connectedCallback() {
        // ❌ This adds a new subscription on every mount
        this.on('refresh', () => this.update());
    }
}
```

**Correct approach with `addDisposer`:**

```javascript
class MyComponent extends Component {
    connectedCallback() {
        const unsubscribe = this.on('refresh', () => this.update());
        this.addDisposer(unsubscribe);
    }
}
```
