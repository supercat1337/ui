---
title: BareDOM – Utility Functions & Classes
version: 2.0.0
tags: [utilities, helpers, dom]
---

# Utility Functions

BareDOM ships with a collection of pure helper functions that you can import and use anywhere.

## DOM Helpers

| Function                                                 | Description                                        |
| -------------------------------------------------------- | -------------------------------------------------- |
| `DOMReady(callback, doc?)`                               | Executes callback when the DOM is fully loaded.    |
| `delegateEvent(eventType, ancestor, selector, listener)` | Attaches a delegated event listener.               |
| `fadeIn(element, duration?, wnd?)`                       | Fades in an element using `requestAnimationFrame`. |
| `fadeOut(element, duration?, wnd?)`                      | Fades out an element.                              |
| `hideElements(...elements)`                              | Adds the `d-none` class to each element.           |
| `showElements(...elements)`                              | Removes the `d-none` class.                        |
| `scrollToBottom(element)`                                | Scrolls the element to its bottom.                 |
| `scrollToTop(element)`                                   | Scrolls the element to its top.                    |
| `injectCoreStyles(doc?)`                                 | Injects minimal CSS (`.d-none`, `html-fragment`).  |
| `extractComponentStyles(doc?)`                           | Extracts all `<style>` content as a string.        |

## Async & Timing

| Function                            | Description                                              |
| ----------------------------------- | -------------------------------------------------------- |
| `sleep(ms)`                         | Returns a promise that resolves after `ms` milliseconds. |
| `debounce(func, wait, immediate?)`  | Returns a debounced version of `func`.                   |
| `throttle(func, wait, options?)`    | Returns a throttled version of `func`.                   |
| `withMinimumTime(promise, minTime)` | Ensures a promise takes at least `minTime` ms.           |

## String & Formatting

| Function                                       | Description                                                   |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `escapeHtml(unsafe)`                           | Escapes `&`, `<`, `>`, `"`, `'`.                              |
| `unsafeHTML(html)`                             | Marks a string as safe to bypass escaping in `html` template. |
| `formatBytes(bytes, decimals?, lang?, sizes?)` | Converts bytes to human‑readable string.                      |
| `formatDate(unix_timestamp)`                   | Returns a localized date string.                              |
| `formatDateTime(unix_timestamp)`               | Returns a localized date + time string.                       |
| `getDefaultLanguage()`                         | Returns user's language (or `'en'`).                          |
| `unixtime(dateObject?)`                        | Returns Unix timestamp (seconds).                             |

## Pagination

| Function                                                                      | Description                                                             |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `createPaginationArray(current, total, delta?, gap?)`                         | Returns an array of page numbers with gaps (e.g., `[1, 2, "...", 10]`). |
| `renderPaginationElement(current, total, itemUrlRenderer?, onClickCallback?)` | Returns a Bootstrap‑style `<ul>` pagination element.                    |

## Storage Helpers

| Function                 | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `createStorage(storage)` | Wraps `localStorage`/`sessionStorage` with JSON serialization and change subscriptions. |
| `local`                  | Pre‑wrapped `localStorage` with subscriptions.                                          |
| `session`                | Pre‑wrapped `sessionStorage` with subscriptions.                                        |

```js
import { local } from '@supercat1337/ui';
local.set('theme', 'dark');
local.on('theme', (newVal, oldVal) => console.log('Theme changed', newVal));
```

## Misc

| Function                                              | Description                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| `copyToClipboard(text, wnd?)`                         | Copies text to the clipboard.                                 |
| `isDarkMode(wnd?)`                                    | Detects if the user prefers dark mode.                        |
| `uniqueId(prefix?)`                                   | Generates a unique ID with an optional prefix.                |
| `onClickOutside(element, callback)`                   | Calls callback when a click occurs outside the given element. |
| `showSpinnerInButton(button, customClassName?, doc?)` | Adds a spinner inside a button.                               |
| `removeSpinnerFromButton(button)`                     | Removes the spinner from a button.                            |
| `ui_button_status_waiting_on(button, text)`           | Disables button and shows spinner.                            |
| `ui_button_status_waiting_off(button, text)`          | Restores button.                                              |
| `ui_button_status_waiting_off_html(button, html)`     | Restores button with HTML content.                            |

## Utility Classes

### `Toggler`

Manages a set of items where only one can be active at a time.

```js
import { Toggler } from '@supercat1337/ui';

const toggler = new Toggler();
toggler.addItem(
    'tab1',
    name => showTab1(),
    name => hideTab1()
);
toggler.addItem(
    'tab2',
    name => showTab2(),
    name => hideTab2()
);
toggler.init('tab1'); // activates tab1, calls its on callback
toggler.setActive('tab2'); // switches to tab2
```

### `SlotToggler`

A specialized version for toggling slots (see [Slots](./03-slots.md)).

```js
new SlotToggler(component, slotNames, activeSlotName);
```

### `Config`

Configuration manager for SSR flags and hydration data access.

```js
import { Config } from '@supercat1337/ui';
console.log(Config.isSSR); // true on server, false on client
Config.checkRefsFlag = false; // disable runtime ref validation
```

---

## Full List

For a complete list of exported utilities, refer to the TypeScript definitions (`ui.esm.d.ts`).
