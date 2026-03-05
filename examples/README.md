# 🚀 Component Library Examples

This directory contains a curated set of examples designed to demonstrate the power, flexibility, and performance of the library. Each example focuses on a specific core concept, moving from basic UI rendering to advanced architectural patterns.

## 📋 Summary Table

| Folder                   | Name                    | Key Concept                                                                                                                  |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `01-layout-diversity`    | **Layout Diversity**    | Using Strings, Functions, and DOM Nodes as layouts.                                                                          |
| `02-interactive-counter` | **Interactive Counter** | State management, event handling, and `getRefs()`.                                                                           |
| `03-todo-list`           | **Todo List**           | Complex state, arrays, and dynamic re-rendering.                                                                             |
| `04-lifecycle-async`     | **Lifecycle & Async**   | Fetching data and using `connectedCallback` for async tasks.                                                                 |
| `05-hydration`           | **Client Hydration**    | Attaching JS logic to existing HTML without re-rendering.                                                                    |
| `06-ssr-generator`       | **Isomorphic SSR**      | Full Node.js + JSDOM server-side rendering workflow.                                                                         |
| `07-lazy-loading`        | **Lazy Loading**        | ESM dynamic imports, loading states, and Slot management.                                                                    |
| `08-css-modules`         | **CSS Modules**         | Style encapsulation and scoped class mapping in ESM.                                                                         |
| `09-native-css-scripts`  | **Native CSS Scripts**  | Direct CSSOM manipulation and manual class-based scoping.                                                                    |
| `10-instance-theming`    | **Component Theming**   | Reusing logic with CSS modifiers and `adoptedStyleSheets`.                                                                   |
| `11-event-interop`       | **Event Interop**       | Direct component communication using `on`/`emit` and high-performance surgical DOM updates via `getRefs`.                    |
| `12-slot-toggler-utils`  | **UI Utilities**        | Using SlotToggler, delegateEvent, and fadeIn for high-level UI logic.                                                        |
| `13-teleports`           | **Logical Teleports**   | Render UI fragments to external DOM nodes (like body) while maintaining unified refs access and event handling.              |
| `14-teleport-hydration`  | **Teleport Hydration**  | Connects logic to pre-rendered SSR markup across multiple DOM locations using `instanceId`.                                  |
| `15-nested-portals`      | **Nested Portals**      | Rendering components with portals inside portals, preserving logical hierarchy and unified refs across multiple DOM targets. |
| `16-web-components`      | **Web Components Integration** | Using custom elements with Shadow DOM inside BareDOM components and accessing their internal refs via the unified refs system. |

---

## 🔍 Detailed Breakdown

### 01-03: The Fundamentals

- **Layout Diversity**: Learn the different ways to define your component's HTML. Whether you prefer template strings or direct DOM manipulation, the library stays out of your way.
- **Interactive Counter**: The basics of reactivity. Understand how to bridge the gap between user actions (events) and component state.
- **Todo List**: A deep dive into array rendering and dynamic updates.

### 04-06: Enterprise Features

- **Lifecycle & Async**: Real-world apps need data. This example shows how to safely handle API calls within the component lifecycle.
- **Client Hydration**: Perfect for performance-first apps. Learn how to take server-rendered HTML and "bring it to life" on the client.
- **Isomorphic SSR**: Explore server-side rendering using Node.js. This ensures your app is SEO-friendly and fast to load.

### 07-09: Optimization & Styling

- **Lazy Loading**: Don't make users download what they don't see. Master dynamic imports and slot-based placeholders.
- **CSS Strategies**: Compare modern **CSS Modules** in ESM with **Native CSSOM** manipulation via `adoptedStyleSheets`.

### 10-11: Advanced Architecture

- **Component Theming**: Learn how to build a design system by using CSS modifiers to create multiple visual variations of a single JS component.
- **Event Interop**: The "Grand Finale." See how components communicate using the built-in `on`/`emit` system, and learn how to perform surgical DOM updates for maximum performance without full re-renders.

---

## 🛠️ How to Run

1. **Install dependencies** in the root directory:

```bash
npm install

```

2. **Serve the examples**:
   Most examples can be viewed by running a local development server (like `live-server` or `vite`):

```bash
npm run examples

```

3. **For SSR examples (06)**:
   Navigate to the specific folder and run the Node.js script:

```bash
cd 06-ssr-generator
node server.js

```
