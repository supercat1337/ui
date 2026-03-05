# 15 – Nested Portals

This example illustrates how to nest teleported components (portals) inside each other. A modal window is teleported to `document.body`, and inside that modal there is a tooltip component which also teleports its content to `document.body`. Both components maintain their logical parent‑child relationship and share a unified refs system.

## Key Concepts

- **Nested teleports** – a component inside a teleport can itself define teleports.
- **Unified refs** – all `data-ref` attributes from both the main layout and **all** teleported fragments are merged and accessible via `getRefs()`.
- **Lifecycle coordination** – when the parent modal is closed (unmounted), the nested tooltip is automatically cleaned up.
- **CSS state management** – toggling visibility with `.is-active` classes.

## How It Works

- `ModalWithTooltip` defines a teleport `overlay` that renders the modal backdrop and content into `document.body`.
- Inside the modal content there is a slot (`tooltip-slot`) where a `Tooltip` component is inserted.
- `Tooltip` itself defines a teleport `tooltip` that renders a floating tooltip, also into `document.body`.
- Both components' refs (including the tooltip’s trigger button and the tooltip tip) are available through `modal.getRefs()`.
- Clicking the "Open Modal" button shows the modal; hovering over the "Hover me" button inside the modal reveals the tooltip.

## Code Structure

- `ModalWithTooltip.js` – main component with nested teleports and the tooltip slot.
- `Tooltip.js` – the tooltip component (also teleported).

