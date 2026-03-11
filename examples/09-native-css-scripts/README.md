# Native CSS & Static Styles Injection

This example demonstrates the library's built-in mechanism for managing component-specific CSS using the `static styles` property. It showcases how to define styles directly within a class and how the library handles efficient injection into the document.

## Core Concepts

### 1. Static Styles Declaration
Each component can define its own CSS using the `static styles` property. This can be a simple string or a `CSSStyleSheet` object.

```javascript
export class BlueComponent extends Component {
    static styles = `
        .blue-box {
            background-color: #e3f2fd;
            border: 2px solid #2196f3;
        }
    `;
    // ...
}

```

### 2. Lazy & Once-Only Injection

The styles are not injected when the file is imported. Instead, they are injected only when the first instance of the component is actually **mounted** or **hydrated**.

* **Lazy Loading:** If a component class is never used on a page, its CSS is never added to the DOM.
* **Deduplication:** The library uses an internal flag (`_stylesInjected`) to ensure that even if you create 1,000 instances of `BlueComponent`, the CSS is added to the document exactly once.

### 3. Modern CSS Integration (Constructable Stylesheets)

The library uses `document.adoptedStyleSheets` to manage these styles. This is more performant than creating multiple `<style>` tags because:

* It reduces DOM size.
* The browser parses the CSS only once.
* Styles are isolated via class naming (or can be used with Shadow DOM in the future).

## How it works

1. **Component Initialization:** When `app.mount()` is called, it triggers the mounting sequence for all child components.
2. **Style Check:** Before a component renders, the base `Component` class checks if `this.constructor.styles` exists and if it hasn't been injected yet.
3. **Symbol Marking:** The library marks its own stylesheets using a unique `Symbol.for('ui-component-sheet')`. This allows for clean extraction during SSR (Server-Side Rendering) without mixing with global or third-party styles.
4. **Attachment:** The style is pushed into `document.adoptedStyleSheets`.

## How to use this example

1. Open `index.html` in a browser.
2. Open **Developer Tools** (F12) and go to the **Elements** tab.
3. Look at the `document` properties or the Styles sidebar. Notice there are no dozens of `<style>` tags.
4. Check the console; it will show the count of `adoptedStyleSheets` reflecting only the unique component classes rendered.

```javascript
// Example console check
console.log(document.adoptedStyleSheets.length); // Returns 2 (one for BlueComponent, one for RedComponent)

```

## Advantages

* **Zero FOUC:** Styles are applied exactly as the component enters the DOM.
* **SSR Ready:** The styles are easily extractable on the server side thanks to the internal marking system.
* **Maintainable:** Keep your logic and your design in the same file without the need for complex build tools.
