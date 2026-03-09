# 18 – Utility Functions

This example showcases a collection of handy utility functions that simplify common tasks in everyday web development. While these helpers are not part of the core library (to keep it minimal), they are provided as ready‑to‑use tools that integrate seamlessly with BareDOM components.

## Key Concepts

- **Debounce & Throttle** – control how often a function can be executed.
- **Unique ID generation** – create deterministic or random unique identifiers.
- **Click outside detection** – trigger a callback when the user clicks outside a given element.
- **Storage wrapper** – work with `localStorage` and `sessionStorage` using a simple API with automatic JSON serialization and change subscriptions.

## How It Works

The demo application (`main.js`) contains a single component that demonstrates all utilities in action:

- **Theme toggling** – the selected theme is saved in `localStorage` and restored on page load. Changes in other tabs are detected via the storage subscription.
- **Debounced search** – as you type in the input field, the debounced function waits 500ms after the last keystroke before updating the display.
- **Throttled button and scroll** – clicking the button rapidly or scrolling inside the box triggers the throttled function at most once per second.
- **Unique IDs** – the input and button elements receive generated IDs, shown in the log.
- **Click outside modal** – a modal can be opened; clicking outside (or on the overlay) closes it, thanks to `onClickOutside`.

All actions are logged in a scrollable panel, so you can see exactly when each utility fires.

## File Structure

- `main.js` – the main demo component integrating all utilities.
- `index.html` – the HTML container with basic structure.
- `style.css` – styling for the demo interface.
- `README.md` – this file.