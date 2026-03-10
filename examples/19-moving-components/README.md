# 19 – Moving Components Between Slots and Containers

This example demonstrates how to **move a component from one slot to another** (or to an arbitrary DOM container) **without unmounting it**. The component retains its internal state and event listeners throughout the move – only its physical location in the DOM changes.

## Key Concepts

- **State preservation** – a component’s local state (like a counter) is not lost when moving.
- **Slot reassignment** – `addToSlot()` automatically detaches the component from its previous slot (if any) and attaches it to the new one, moving the DOM element.
- **Mounting to an external container** – calling `mount()` on an already mounted component relocates its root element to the new target without destroying the instance (the library’s `mount` method detects that the component is already connected and simply moves the root).
- **Unified refs** – `getRefs()` continues to work correctly after the move.

## How It Works

1. A `Counter` component has a simple state (click count) and renders a button and a display.
2. The `MoveDemo` parent contains two slots (`left` and `right`) and also provides an external container (`#external-box`).
3. Buttons allow moving the counter:
   - **Move to Left / Right** – `addToSlot(slotName, this.counter)` moves the counter to the specified slot. The library handles detachment from any previous slot and re‑attachment.
   - **Move to External Container** – `this.counter.mount(externalContainer)` relocates the component to the external container. Because the component is already mounted, `mount` simply moves its root element (no unmount/re‑mount occurs).
   - **Move Back to Left** – after being external, you can re‑attach it to a slot using `addToSlot` again.
4. Throughout all moves, the counter’s value persists – no unmounting or re‑creation happens.

## Code Structure

- `Counter.js` – a simple stateful component with a counter.
- `MoveDemo.js` – the main component with slots and control buttons.
- `main.js` – entry point that mounts the demo.
- `index.html` – includes the external container and links the styles.
- `style.css` – styling for the demo.