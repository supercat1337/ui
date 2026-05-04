# 🚀 Component Library Examples

This directory contains a curated set of examples designed to demonstrate the power, flexibility, and performance of the library. Each example focuses on a specific core concept, moving from basic UI rendering to advanced architectural patterns.

## 📋 Summary Table

| Folder | Name | Key Concept |
|--------|------|-------------|
| `01-layout-diversity` | **Layout Diversity** | Using Strings, Functions, and DOM Nodes as layouts. |
| `02-interactive-counter` | **Interactive Counter** | State management, event handling, and `getRefs()`. |
| `03-todo-list` | **Todo List** | Complex state, arrays, and dynamic re-rendering. |
| `04-lifecycle-async` | **Async Lifecycle** | Fetching data with auto‑cancellation via AbortController, dynamic child components, and error handling. |
| `05-hydration` | **Client Hydration** | Attaching JS logic to existing HTML without re-rendering. |
| `06-ssr-generator` | **Isomorphic SSR** | Full Node.js + JSDOM server-side rendering workflow. |
| `07-lazy-loading` | **Lazy Loading** | ESM dynamic imports, loading states, and Slot management. |
| `08-css-modules` | **CSS Modules** | Style encapsulation and scoped class mapping in ESM. |
| `09-native-css-scripts` | **Native CSS Scripts** | Direct CSSOM manipulation and manual class-based scoping. |
| `10-instance-theming` | **Component Theming** | Reusing logic with CSS modifiers and `adoptedStyleSheets`. |
| `11-event-interop` | **Event Interop** | Direct component communication using `on`/`emit` and high-performance surgical DOM updates via `getRefs`. |
| `12-slot-toggler-utils` | **UI Utilities** | Using `SlotToggler`, `delegateEvent`, and `fadeIn` for high-level UI logic. |
| `13-teleports` | **Logical Teleports** | Render UI fragments to external DOM nodes (like body) while maintaining unified refs access and event handling. |
| `14-teleport-hydration` | **Teleport Hydration** | Connects logic to pre-rendered SSR markup across multiple DOM locations using `instanceId`. |
| `15-nested-portals` | **Nested Portals** | Rendering components with portals inside portals, preserving logical hierarchy and unified refs across multiple DOM targets. |
| `16-web-components` | **Web Components Integration** | Using custom elements with Shadow DOM inside BareDOM components and accessing their internal refs via the unified refs system. |
| `17-i18n` | **Internationalization** | Dynamic text updates using `setTextUpdateFunction` and `reloadText`, integration with external i18n libraries, language switching without re‑rendering. |
| `18-utilities` | **Utility Functions** | Collection of helper utilities: debounce, throttle, generateId, onClickOutside, and localStorage/sessionStorage wrapper with change subscriptions. |
| `19-moving-components` | **Moving Components (Same Parent)** | Moving a component between slots within the same parent or to an external container without unmounting, preserving state. |
| `20-moving-between-parents` | **Moving Components (Different Parents)** | Transferring a component from one parent component to another, preserving internal state and event listeners. |

## 🔍 Detailed Breakdown

### 01–03: The Fundamentals

- **Layout Diversity**: Learn the different ways to define your component's HTML. Whether you prefer template strings or direct DOM manipulation, the library stays out of your way.
- **Interactive Counter**: The basics of reactivity. Understand how to bridge the gap between user actions (events) and component state.
- **Todo List**: A deep dive into array rendering and dynamic updates.

### 04–06: Enterprise Features

- **Async Lifecycle**: Real-world apps need data. This example shows how to safely handle API calls within the component lifecycle, including automatic cancellation on unmount.
- **Client Hydration**: Perfect for performance-first apps. Learn how to take server-rendered HTML and "bring it to life" on the client.
- **Isomorphic SSR**: Explore server-side rendering using Node.js. This ensures your app is SEO-friendly and fast to load.

### 07–09: Optimization & Styling

- **Lazy Loading**: Don't make users download what they don't see. Master dynamic imports and slot-based placeholders.
- **CSS Modules**: Modern style encapsulation with scoped class names, seamlessly integrated into your components.
- **Native CSS Scripts**: Direct CSSOM manipulation and manual class-based scoping for complete control.

### 10–12: Advanced Architecture & Utilities

- **Component Theming**: Build a design system by using CSS modifiers to create multiple visual variations of a single JS component.
- **Event Interop**: The "Grand Finale" of component communication. See how components talk using the built-in `on`/`emit` system, and perform surgical DOM updates without full re-renders.
- **UI Utilities**: Practical helpers like `SlotToggler`, `delegateEvent`, and `fadeIn` to simplify common UI patterns.

### 13–16: Teleports, Hydration & Web Components

- **Logical Teleports**: Render fragments (modals, tooltips) anywhere in the DOM while keeping them logically attached to their parent.
- **Teleport Hydration**: Connect server-rendered teleported content to client-side logic using `instanceId`.
- **Nested Portals**: Place a teleported component inside another teleported component – everything just works.
- **Web Components Integration**: Use native custom elements with Shadow DOM inside BareDOM and access their internal `data-ref` children via the unified refs system.

### 17–18: Developer Experience

- **Internationalization**: Dynamic text updates without re-rendering using `setTextUpdateFunction` and `reloadText`. Integrate any i18n library (i18next, FormatJS, etc.) effortlessly.
- **Utility Functions**: A set of reusable helpers: debounce, throttle, generateId, onClickOutside, and a storage wrapper (localStorage/sessionStorage) with change subscriptions.

### 19–20: Dynamic Component Relocation

- **Moving Components (Same Parent)**: Move a component between slots or to an external container without unmounting – state and event listeners remain intact.
- **Moving Components (Different Parents)**: Transfer a component from one parent component to another, preserving its internal state and event handlers. Perfect for drag‑and‑drop dashboards and reorderable UIs.

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

3. **For SSR examples (06, 14)**:  
   Navigate to the specific folder and run the Node.js script:

   ```bash
   cd 06-ssr-generator
   node server.js
   ```

   (Similarly for `14-teleport-hydration`.)

Happy exploring!