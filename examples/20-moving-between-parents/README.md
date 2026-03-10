# 20 – Moving Components Between Different Parents

This example demonstrates how to move a component from a slot in one parent component to a slot in **another parent component**, preserving its internal state and event listeners throughout the move.

## Key Concepts

- **Changing parentage** – a component can be transferred from one parent to another without being destroyed.
- **State persistence** – local state (e.g., a counter) is preserved across moves.
- **Cross‑parent slot reassignment** – `addToSlot()` automatically detaches the component from its previous parent (if any) and attaches it to the new parent’s slot.
- **Unified refs** – after the move, the component’s `getRefs()` continue to work, and it becomes accessible via the new parent’s refs if declared.

## How It Works

1. A `MovableCard` component has a simple counter and displays a random color for visual distinction.
2. Two independent `Panel` components are created, each containing two slots (`left` and `right`).
3. Initially, one `MovableCard` is placed in Panel 1’s left slot.
4. Buttons allow moving the card:
   - Between slots **within the same panel**.
   - From one panel to the other (e.g., Panel 1 left → Panel 2 right).
5. Throughout all moves, the card’s counter value and its color remain unchanged – no unmounting or re‑creation occurs.

## Code Structure

- `MovableCard.js` – a stateful component with a counter and a random background color.
- `Panel.js` – a component that contains two slots and buttons to move the card internally.
- `App.js` – the main component that creates two panels and provides buttons for cross‑panel moves.
- `main.js` – entry point.
- `style.css` – styling for panels and cards.