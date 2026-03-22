---
title: BareDOM – Hydration (SSR)
version: 2.0.0
tags: [ssr, hydration, isomorphic]
---

# Server‑Side Rendering & Hydration

BareDOM components are **isomorphic** – they can render on the server (Node.js) and then be hydrated on the client, preserving state and attaching interactivity.

## How It Works

1. **On the server**, you instantiate components, call `serialize()` on each root component, and collect a **hydration manifest** (a flat map keyed by component `sid`). Then you render the component's HTML (by mounting to a temporary DOM) and inject the manifest as `window.__HYDRATION_DATA__`.
2. **On the client**, you instantiate the same component (with the same `sid`), then call `mount(container, 'hydrate')`. The library matches the existing DOM node, restores the serialized state via `restoreCallback(data)`, and attaches event listeners.

## Server‑Side Steps

### 1. Generate the Hydration Manifest

Use `generateManifest(...rootComponents)` to produce a flat object containing all component data.

```js
import { generateManifest } from '@supercat1337/ui';
import { RootApp } from './RootApp.js';

const app = new RootApp();
app.mount(); // mounts to a temporary container (e.g., document.createElement('div'))
const manifest = generateManifest(app);
```

`generateManifest` recursively traverses the component tree and collects:

- `className`: the component's constructor name.
- `data`: the result of calling `serialize()` on each component.
- `slots`: a map of slot names to child component SIDs.

### 2. Inject the Manifest

In your HTML template, insert a `<script>` tag with the manifest:

```html
<script>
    window.__HYDRATION_DATA__ = ${JSON.stringify(manifest)};
</script>
```

Or use `createManifestScript(manifest)` to generate the element, or `renderManifestHTML(manifest)` for a string version.

### 3. Render Component HTML

After mounting the component (in a DOM emulation like JSDOM), get its root node and serialize it to a string. The rendered HTML must include the `data-sid` attribute on each component root. BareDOM automatically adds this attribute when the component is rendered.

Example using JSDOM:

```js
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

const app = new RootApp();
app.mount(document.body);
const html = document.body.innerHTML;
```

## Client‑Side Hydration

On the client, instantiate the component with the same `sid` (optional, but must match the `data-sid` in the HTML), then call `mount` with mode `'hydrate'`.

```js
import { Component } from '@supercat1337/ui';

class HydratedWidget extends Component {
    refsAnnotation = { ... };
    state = { ... };

    restoreCallback(data) {
        // Called before DOM is ready, with data from the manifest
        this.state = data;
    }

    connectedCallback() {
        // DOM is ready, attach event listeners
        const refs = this.getRefs();
        refs.button.onclick = () => { ... };
    }
}

const widget = new HydratedWidget({ sid: 'root.profile' });
widget.mount(document.getElementById('ssr-widget'), 'hydrate');
```

## Important Notes

- The component's `layout` must be **identical** on server and client (e.g., using the same `html` templates). Hydration relies on matching the DOM structure.
- The `sid` is automatically assigned if not provided. You can set it explicitly to match server expectations.
- The `restoreCallback` is called **before** `connectedCallback`, giving you a chance to set up internal state before the DOM is ready.
- After hydration, the component is fully functional – all refs are available, and events work normally.

## Utilities for SSR

| Function                                        | Description                                           |
| ----------------------------------------------- | ----------------------------------------------------- |
| `generateManifest(...rootComponents)`           | Returns a flat hydration map.                         |
| `createManifestScript(manifest, variableName?)` | Creates a `<script>` element.                         |
| `renderManifestHTML(manifest, variableName?)`   | Returns the script as a string.                       |
| `serialize()` (component method)                | Override to return state to be saved in the manifest. |
| `restoreCallback(data)` (component method)      | Override to restore state from manifest data.         |

## Example

See `examples/05-hydration` and `examples/06-ssr-generator` for complete runnable examples.
