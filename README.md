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
import { PaginatedTable, Modal, DOMReady } from "@supercat1337/ui";
// dom-scope: an external dependency. For more details, visit https://github.com/supercat1337/dom-scope
import { createFromHTML } from "dom-scope";

// Example data for the table
const sampleData = {
    result: {
        current_page: 1,
        total_pages: 3,
        total: 30,
        page_size: 10,
        data: [
            {
                id: 1,
                name: "John Doe",
                email: "john@example.com",
                role: "Admin",
            },
            {
                id: 2,
                name: "Jane Smith",
                email: "jane@example.com",
                role: "User",
            },
            {
                id: 3,
                name: "Bob Johnson",
                email: "bob@example.com",
                role: "User",
            },
        ],
    },
};

// Simulating data loading from the server
async function fetchData(page = 1) {
    // Here we usually have a fetch request to API
    console.log(`Fetching page ${page}...`);
    await sleep(1000); // Simulating network delay

    // Return a copy of the data with the updated page
    return {
        ...sampleData,
        result: {
            ...sampleData.result,
            current_page: page,
        },
    };
}

// Helper function for creating a delay

/**
 * Creates a promise that resolves after a specified amount of milliseconds.
 * @param {number} ms - The amount of milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves after the specified amount of milliseconds.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main application code
DOMReady(async () => {
    // 1. Create a modal window
    const modal = new Modal();
    modal.setTitleText("User Management");
    modal.setSubmitButtonText("Save Changes");
    modal.setCloseButtonText("Cancel");
    modal.hideSubmitButtonOnContentMode = true; // Hide the submit button in regular mode

    // 2. Create a table with pagination
    const userTable = new PaginatedTable();

    // Configure table headers
    userTable.table.setConfig({
        headerHTML: `
      <th class="col-1">#</th>
      <th class="col-1">ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
    `,
    });

    // 3. Handle page change event
    userTable.onPageChanged(async (pageIndex) => {
        userTable.setLoading();
        const data = await fetchData(pageIndex);
        userTable.setData(data);
    });

    // 4. Add the table to the modal window
    modal.addChildComponent("modal_body", userTable);

    // 5. Create a button to open the modal window
    const openModalButton = /** @type {HTMLButtonElement} */ (
        createFromHTML(`
    <button class="btn btn-primary">
      <i class="bi bi-people-fill"></i> Show Users
    </button>
  `).firstElementChild
    );

    // 6. Handle opening the modal window
    openModalButton.addEventListener("click", async () => {
        modal.show();
        userTable.setLoading();
        const data = await fetchData();
        userTable.setData(data);
    });

    // 7. Add the button to the page
    // @ts-ignore
    document.getElementById("app-container").appendChild(openModalButton);

    // 8. Mount the modal window to DOM (but still hidden)
    modal.mount(document.body, "prepend");

    // Additional event handlers (example)
    modal.onShow((modalInstance) => {
        console.log("Modal opened", modalInstance);
    });

    modal.onHide((modalInstance) => {
        console.log("Modal closed", modalInstance);
    });

    // Export to the global scope for debugging
    globalThis.app = { modal, userTable };
});
```
