# 15 – Nested Portals

This example demonstrates how to nest teleported components (portals) inside each other. A modal window is teleported to `document.body`, and inside that modal there is a tooltip component which also teleports its content to `document.body`. Both components maintain their logical parent‑child relationship and share a unified refs system.

## Key Concepts

- **Nested teleports** – a component inside a teleport can itself define teleports.
- **Unified refs** – all `data-ref` attributes from both the main layout and **all** teleported fragments are merged and accessible via `getRefs()`.
- **Lifecycle coordination** – when the parent modal is closed (unmounted), the nested tooltip is automatically cleaned up.
- **Auto‑cleanup of event listeners** – using `this.$on()` ensures listeners are removed when the component disconnects.

## How It Works

- `ModalWithTooltip` defines a teleport `overlay` that renders the modal backdrop and content into `document.body`.
- Inside the modal content there is a slot (`tooltip-slot`) where a `Tooltip` component is inserted.
- `Tooltip` itself defines a teleport `tooltip` that renders a floating tooltip, also into `document.body`.
- Both components' refs (including the tooltip’s trigger button and the tooltip tip) are available through `modal.getRefs()`.
- Clicking the "Open Modal" button shows the modal; hovering over the "Hover me" button inside the modal reveals the tooltip.

## Files

- `ModalWithTooltip.js` – main component with nested teleports and the tooltip slot.
- `Tooltip.js` (inside the same file) – the tooltip component (also teleported).
- `main.js` – entry point.
- `index.html` – container.
- `style.css` – styling for the modal and tooltip.