---
title: BareDOM – Component Authoring Guide (Real‑World Patterns)
version: 2.0.0
tags: [component, authoring, localization, store, slots, services, build]
---

# Component Authoring Guide

This guide distils best practices from production‑grade applications built with BareDOM. It shows you how to structure a component, manage localisation, handle state, integrate with services, and organise your project for maintainability and performance.

## 1. Project Structure for a Component

Every feature is organised as a folder under `src/App/`, containing:

```
src/App/YourFeature/
├── index.js          # Main component (often the container with slots)
├── template.html     # Layout (imported as a string)
├── locales.js        # Localisation dictionary + L10n class (optional)
└── SubScreens/       # If the feature uses multiple screens
    ├── ScreenA/
    │   ├── index.js
    │   ├── template.html
    │   └── locales.js
    └── ScreenB/ ...
```

**Why?**

- Separation of concerns: HTML, logic, and translations are in distinct files.
- Easy to read, maintain, and test.
- Aligns with modern frontend practices.

## 2. Importing HTML Templates

BareDOM components can use `static layout = template` where `template` is an imported HTML string.

**Step 1**: Declare a module for `.html` files in your `types.d.ts` (or `src/types.d.ts`):

```typescript
declare module '*.html' {
    const content: string;
    export default content;
}
```

**Step 2**: Import the template in your component:

```javascript
import template from './template.html';

export class YourScreen extends Component {
    static layout = template;
    // ...
}
```

**Why?**

- The template is a plain string – works with SSR and hydration.
- No need to embed HTML inside JavaScript, improving readability and editor support.
- The build tool (e.g., esbuild) inlines the HTML content during bundling.

## 3. Localisation with `ComponentLocalization`

Each screen that displays text should have a `locales.js` file exporting an `L10n` class.

**Step 1**: Define the dictionary (supports plural forms):

```javascript
// locales.js
import { ComponentLocalization } from '@supercat1337/ui-localization';

const dictionary = {
    en: {
        title: 'Welcome',
        itemsCount: [
            '{count} items',
            '{count} item',
            '{count} items',
            '{count} items',
            '{count} items',
            '{count} items',
        ],
    },
    ru: {
        title: 'Добро пожаловать',
        itemsCount: [
            '{count} элементов',
            '{count} элемент',
            '{count} элемента',
            '{count} элемента',
            '{count} элементов',
            '{count} элементов',
        ],
    },
};

export class L10n extends ComponentLocalization {
    constructor(options) {
        super(dictionary, options);
    }
    get title() {
        return this.t('title');
    }
    getItemsText(count) {
        return this.plural(count, this.t('itemsCount'));
    }
}
```

**Step 2**: In your component, instantiate `L10n` and pass the `update` function:

```javascript
// index.js
import { Component } from '@supercat1337/ui';
import { L10n } from './locales.js';
import template from './template.html';

export class MyScreen extends Component {
    static layout = template;

    refsAnnotation = {
        title: HTMLHeadingElement.prototype,
        counter: HTMLSpanElement.prototype,
    };

    constructor() {
        super();
        this.itemCount = 0;

        /** @type {L10n<this>} */
        this.l10n = new L10n({
            component: this,
            update: (l10n, comp) => {
                const refs = comp.getRefs();
                refs.title.innerText = l10n.title;
                // initial value – will be updated directly later
                refs.counter.innerText = l10n.getItemsText(comp.itemCount);
            },
        });
    }

    // No need to call refresh() in connectedCallback – update runs automatically
    // when language changes or component connects.

    addItem() {
        this.itemCount++;
        // Prefer direct updates for performance
        const refs = this.getRefs();
        refs.counter.innerText = this.l10n.getItemsText(this.itemCount);
    }
}
```

**Important rules** (from `@supercat1337/ui-localization` documentation):

- **Do NOT** add a JSDoc type annotation to `refsAnnotation` – let TypeScript infer the exact shape.
- The `update` function runs automatically on:
    - Component connection (if already connected, runs immediately).
    - Language change (globally).
- You may call `this.l10n.refresh()` manually if many texts depend on state, but **prefer direct updates** for single values.
- The library **does not** auto‑detach on unmount; this is intentional because components may be remounted (e.g., in `SlotToggler`). The `update` function checks `component.isConnected` before running, so it’s safe.

## 4. State Management with `Store`

For local component state (e.g., progress, file name), use `@supercat1337/store`. It provides reactive subscriptions that are easy to clean up.

```javascript
import { Store } from '@supercat1337/store';

constructor() {
    super();
    this.store = new Store();
    this.store.setItems({
        loaded_bytes: 0,
        total_bytes: 0,
        filename: '',
        percent: 0,
    });
}

connectedCallback() {
    const refs = this.getRefs();

    const updateFilename = () => {
        refs.filename.innerText = this.store.getItem('filename');
    };
    this.addDisposer(this.store.subscribe('filename', updateFilename));
    updateFilename();
    // ... similar for other fields
}
```

**Why `Store`?**

- Lightweight, reactive, and integrates with `addDisposer` for automatic cleanup.
- Avoids manual DOM updates scattered across callbacks – subscriptions centralise the logic.

## 5. Services and Dependency Injection

Services (e.g., `FileDownloaderService`) are plain modules that expose methods and event subscriptions. They are imported directly and used inside components.

**Example** (from `DownloadScreen`):

```javascript
import { FileDownloaderService } from '@services/file-downloader/service.js';

connectedCallback() {
    const refs = this.getRefs();
    this.$on(refs.downloadButton, 'click', () => {
        FileDownloaderService.downloadFile();
    });
}
```

**Pattern:**

- Services are stateless or manage global state (like download progress).
- Components subscribe to service events via `onScreenChange` (or similar) to update their UI.

In the `FileDownloaderApp` root component, the service is used to drive the screen toggler:

```javascript
connectedCallback() {
    this.slotToggler = new SlotToggler(this, ['get_info_screen', ...], 'get_info_screen');
    this.slotToggler.init();

    this.addDisposer(
        FileDownloaderService.onScreenChange((screenName, params) => {
            // Update the target screen with params
            const screenMap = { ... };
            screenMap[screenName]?.setState?.(params);
            this.slotToggler.toggle(screenName);
        })
    );
}
```

## 6. Screen Switching with `SlotToggler`

`SlotToggler` physically mounts/unmounts components in slots, which is ideal for multi‑screen flows (wizards, tabs). It triggers `connectedCallback`/`disconnectedCallback` automatically, so resources are freed when a screen is hidden.

**Define slots** in the parent layout:

```html
<!-- template.html -->
<div>
    <div data-slot="get_info_screen"></div>
    <div data-slot="download_screen"></div>
    <!-- ... -->
</div>
```

**Add screens** in the constructor (for SSR support) and initialise `SlotToggler` in `connectedCallback`:

```javascript
constructor() {
    super();
    this.screenA = new ScreenA();
    this.screenB = new ScreenB();
    this.addToSlot('slotA', this.screenA);
    this.addToSlot('slotB', this.screenB);
}

connectedCallback() {
    this.slotToggler = new SlotToggler(this, ['slotA', 'slotB'], 'slotA');
    this.slotToggler.init();
}
```

**To switch**:

```javascript
this.slotToggler.toggle('slotB');
```

**Remember:**

- Always call `init()` after creating the toggler to set the initial active slot (unless you want all slots to be empty initially).
- You can pass `params` to the target screen via its `setState` method before toggling.

## 7. Integrating with Build Tools (esbuild)

The project uses `esbuild` to bundle the frontend. Key configurations:

- **Import HTML as string**: Use a plugin that loads `.html` files as strings. For example:

```javascript
// esbuild plugin (simplified)
import fs from 'fs';
export const htmlPlugin = () => ({
    name: 'html',
    setup(build) {
        build.onLoad({ filter: /\.html$/ }, async args => {
            const contents = await fs.promises.readFile(args.path, 'utf8');
            return { contents: JSON.stringify(contents), loader: 'text' };
        });
    },
});
```

With this, `import template from './template.html'` yields a string.

- **Aliases**: Configure `resolve.alias` to simplify imports:

```javascript
alias: {
    '@services': './src/services',
    '@utils': './src/utils',
    // ...
}
```

- **TypeScript/JSDoc**: The `types.d.ts` at the project root declares modules for `.html` and `.css`, so no TypeScript errors occur.

## 8. Summary of Best Practices

| Aspect                | Recommendation                                                                |
| --------------------- | ----------------------------------------------------------------------------- |
| Layout                | Store HTML in separate `.html` files and import as string.                    |
| Localisation          | Create `locales.js` with an `L10n` class; attach in constructor.              |
| Component state       | Use `Store` for reactive state; subscribe with `addDisposer`.                 |
| DOM refs              | Define `refsAnnotation` without JSDoc type annotation (for inference).        |
| Event listeners       | Always use `this.$on()` for auto‑cleanup.                                     |
| Cleanup               | Use `addDisposer` for timers, subscriptions, and external resources.          |
| Service communication | Import services directly; subscribe to service events in `connectedCallback`. |
| Multi‑screen flows    | Use `SlotToggler` with slots defined in the parent layout.                    |
| Build                 | Configure esbuild to handle HTML imports and aliases; include `types.d.ts`.   |
| SSR                   | Add slot content in the **constructor** so it’s included in server manifest.  |

## 9. Example: Full Component Skeleton

A complete minimal screen with localisation and store:

```javascript
// DownloadingScreen/index.js
import { Component } from '@supercat1337/ui';
import { Store } from '@supercat1337/store';
import { L10n } from './locales.js';
import template from './template.html';

export class DownloadingScreen extends Component {
    static layout = template;

    refsAnnotation = {
        filename: HTMLSpanElement.prototype,
        progressBar: HTMLDivElement.prototype,
        // ...
    };

    constructor() {
        super();
        this.store = new Store();
        this.store.setItems({ loaded_bytes: 0, total_bytes: 0, filename: '', percent: 0 });

        this.l10n = new L10n({
            component: this,
            update: (l10n, comp) => {
                const refs = comp.getRefs();
                refs.filename.innerText = comp.store.getItem('filename');
                // update other texts...
            },
        });
    }

    connectedCallback() {
        const refs = this.getRefs();
        const updateProgress = () => {
            const pct = this.store.getItem('percent');
            refs.progressBar.style.width = pct + '%';
        };
        this.addDisposer(this.store.subscribe('percent', updateProgress));
        updateProgress();

        this.$on(refs.stopButton, 'click', () => {
            FileDownloaderService.stopDownload();
        });
    }

    setState({ loaded_bytes, total_bytes, filename, percent }) {
        if (loaded_bytes !== undefined) this.store.setItem('loaded_bytes', loaded_bytes);
        // ...
    }
}
```

---

## Next Steps

Now that you understand the real‑world patterns, explore the [examples](./09-examples.md) folder for complete runnable demos, and refer to the [Common Pitfalls](./10-common-pitfalls.md) guide to avoid typical mistakes.

```

```
