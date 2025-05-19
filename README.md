# ui

A simple UI library. This library contains a set of UI components that can be used to build web applications.

## Usage

Create user interface components effortlessly using the versatile `Component` class.

```js
import { createFromHTML } from "@supercat1337/dom-scope";
import { Component } from "@supercat1337/ui";

// 1. Parent component (has a slot `slot1`)
class ParentComponent extends Component {
    refsAnnotation = {
        title: HTMLHeadingElement,
    };

    get refs() {
        return this.getRefs();
    }

    constructor() {
        super();
        this.setLayout(/* html */ `
            <div class="parent">
                <h1 ref="title">Parent Component</h1>
                <div scope-ref="slot1"><!-- The child components will be inserted here --></div>
            </div>
        `);
        this.defineSlots("slot1"); // Defines the slot
    }
}

// 2. Child component (also has a slot `slot1`)
class ChildComponent extends Component {
    constructor() {
        super();
        this.setLayout(/* html */ `
            <div class="child">
                <p>This is a child component</p>
                <div scope-ref="slot1"><!-- The nested slot --></div>
            </div>
        `);
        this.defineSlots("slot1");
    }
}

// 3. Simple components for insertion
const LeafComponentA = new Component();
LeafComponentA.setLayout(`<span>🍃 Leaf A</span>`);

const LeafComponentB = new Component();
LeafComponentB.setLayout(`<span>🍂 Leaf B</span>`);

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

## Components for displaying RPC responses

This library includes the following components for displaying RPC responses:

-   `Pagination`: A component for navigating through paginated lists.
-   `Table`: A component for rendering tabular data.
-   `PaginatedTable`: A component that combines table and pagination functionalities for RPC data.

All components are designed to handle and present data from RPC responses.

## Example

```js
// @ts-check
import { PaginatedTable, DOMReady } from "@supercat1337/ui";

let dataResponse = {
    result: {
        current_page: 1,
        total_pages: 3,
        total: 30,
        page_size: 10,
        data: [
            {
                id: 1,
                column_1: "Value 1",
                column_2: "Value 2",
                column_3: "Value 3",
            },
            {
                id: 2,
                column_1: "Value 4",
                column_2: "Value 5",
                column_3: "Value 6",
            },
            {
                id: 3,
                column_1: "Value 7",
                column_2: "Value 8",
                column_3: "Value 9",
            },
        ],
    },
};

/**
 * A promise-based sleep function.
 * @param {number} ms - The amount of milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves after the specified amount of milliseconds.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

DOMReady(() => {
    let paginatedTable = new PaginatedTable();

    paginatedTable.onPageChanged(async (index) => {
        paginatedTable.setLoading();
        // in a real application, you would fetch new data here

        await sleep(1000);
        dataResponse.result.current_page = index;

        paginatedTable.setData(dataResponse);
    });

    paginatedTable.title = "Data";
    paginatedTable.table.setConfig({
        headerHTML:
            "<th>#</th> <th>id</th>  <th>Column 1</th> <th>Column 2</th> <th>Column 3</th>",
    });
    paginatedTable.setData(dataResponse);

    if (!document.body.firstElementChild)
        throw new Error("No root element found.");

    paginatedTable.mount(document.body.firstElementChild);
});
```
