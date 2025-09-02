# ui

A simple UI library. This library contains a set of UI components that can be used to build web applications.

## Usage

Create user interface components effortlessly using the versatile `Component` class.

```js
import { createFromHTML } from "@supercat1337/dom-scope";
import { Component } from "@supercat1337/ui";

// 1. Parent component (has a slot `slot1`)
class ParentComponent extends Component {
    layout = /* html */ `
    <div class="parent">
        <h1 ref="title">Parent Component</h1>
        <div scope-ref="slot1"><!-- The child components will be inserted here --></div>
    </div>
`;
    slots = ["slot1"];
    refsAnnotation = {
        title: HTMLHeadingElement,
    };
}

// 2. Child component (also has a slot `slot1`)
class ChildComponent extends Component {
    layout = /* html */ `
    <div class="child">
        <p>This is a child component</p>
        <div scope-ref="slot1"><!-- The nested slot --></div>
    </div>
`;
    slots = ["slot1"];
}

// 3. Simple components for insertion
const LeafComponentA = new Component();
LeafComponentA.layout = /* html */ `<span>🍃 Leaf A</span>`;

const LeafComponentB = new Component();
LeafComponentB.layout = /* html */ `<span>🍂 Leaf B</span>`;

// 4. Assemble the structure:
const parent = new ParentComponent();
const child = new ChildComponent();

// Insert Leaf components into ChildComponent
child.addChildComponent("slot1", LeafComponentA, LeafComponentB);

// Insert ChildComponent into ParentComponent
parent.addChildComponent("slot1", child);
// 5. Mount everything in DOM

parent.mount(document.body);
```

## Functions

The following functions are included in this library:

-   `DOMReady`: A function that returns a promise that resolves when the DOM is ready.
-   `escapeHtml`: A function that escapes HTML characters in a string.
-   `ui_button_status_waiting_on`: A function that returns the HTML for a waiting button.
-   `ui_button_status_waiting_off`: A function that returns the HTML for a non-waiting button.
-   `ui_button_status_waiting_off_html`: A function that returns the HTML for a non-waiting button.
-   `scrollToTop`: A function that scrolls the window to the top of the page.
-   `scrollToBottom`: A function that scrolls the window to the bottom of the page.
-   `hideElements`: A function that hides elements on the page.
-   `showElements`: A function that shows elements on the page.
-   `showSpinnerInButton`: A function that shows a spinner in a button.
-   `removeSpinnerFromButton`: A function that removes a spinner from a button.
-   `unixtime`: A function that returns the current Unix timestamp.
-   `isDarkMode`: A function that returns true if the user is in dark mode, false otherwise.
-   `getDefaultLanguage`: A function that returns the default language of the user.
-   `formatBytes`: A function that formats a number of bytes into a human-readable string.
-   `copyToClipboard`: A function that copies a string to the clipboard.
-   `formatDateTime`: A function that formats a Unix timestamp into a human-readable date and time.
-   `formatDate`: A function that formats a Unix timestamp into a human-readable date.
-   `Toggler`: A class that represents a toggler. A toggler is a collection of items that can be toggled on and off.
-   `fadeIn`: A function that fades in an element.
-   `fadeOut`: A function that fades out an element.

## License

MIT License
