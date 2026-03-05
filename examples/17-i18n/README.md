# 17 – Internationalization (i18n) with Dynamic Text Updates

This example demonstrates how to implement client‑side internationalization in a BareDOM application without re‑rendering the whole component tree. It uses the built‑in `setTextUpdateFunction` and `reloadText` methods to surgically update only the text nodes when the language changes.

## Key Concepts

- **`setTextUpdateFunction(callback)`** – registers a function that updates the component’s text content. The callback is called every time `reloadText()` is invoked.
- **`reloadText()`** – triggers the text update function, allowing you to refresh translations on the fly.
- **Centralized i18n service** – a simple event emitter broadcasts language changes to all subscribed components.
- **Zero‑overhead updates** – only the text nodes are touched; the DOM structure remains intact.

## How It Works

1. A small i18n service (`i18n.js`) holds the current language, translation dictionaries, and an event emitter. It exports `t(key)` to get a translated string and `setLanguage(lang)` to change the language (which emits an event).
2. Each component that needs translation:
   - Calls `setTextUpdateFunction` in `connectedCallback` to define how its text‑bearing refs should be updated.
   - Calls `reloadText()` immediately to set the initial text.
   - Subscribes to the i18n service’s `languageChanged` event and calls `reloadText()` when the language changes.
   - Unsubscribes in `disconnectedCallback` (or uses the built‑in `onDisconnect` helper).
3. The `LanguageSwitcher` component renders two buttons and calls `setLanguage` on click, triggering a global update.

## Code Structure

- `i18n.js` – simple i18n service with translations for English and Russian.
- `LanguageSwitcher.js` – component with two language buttons.
- `Greeting.js` – a component that displays a translated greeting.
- `Counter.js` – a component with a dynamic counter and a translated label.
- `main.js` – main app that assembles everything.
- `index.html` – basic HTML container.


Click the **English** / **Русский** buttons to see the text update immediately, without any page reload or component re‑render. The counter value stays unchanged – only the labels are refreshed.
