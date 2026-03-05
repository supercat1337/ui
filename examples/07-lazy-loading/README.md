# 07 – Lazy Loading (ESM Dynamic Import)

This example demonstrates how to asynchronously load a component module only when it is needed, using dynamic `import()`. It also showcases the `SlotToggler` utility to manage different UI states (empty, loading, content) during the loading process.

## Key Concepts

- **Dynamic `import()`** – load ES modules on demand.
- **`SlotToggler`** – switch between multiple slots (`empty`, `loading`, `content`) with a simple API.
- **Refs annotation** – type‑safe access to the load button.
- **Error handling** – fallback to `empty` state if the module fails to load.

## How It Works

1. The main `App` component contains three slots: `empty` (default message), `loading` (spinner), and `content` (where the lazy‑loaded component will appear).
2. Clicking the "Fetch Profile Module" button triggers a dynamic import of `./UserProfile.js`.
3. While the module is being fetched, the `loading` slot is shown and the button is disabled.
4. After successful import, an instance of `UserProfile` is created, added to the `content` slot, and the toggler switches to `content`.
5. If the import fails, the `empty` slot is restored and the button re‑enabled.

## Code Structure

- `index.js` – main `App` component with the button, slot toggler, and dynamic import logic.
- `UserProfile.js` – the lazily loaded component (simple profile card).
