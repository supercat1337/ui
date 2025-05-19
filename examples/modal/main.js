// @ts-check

//import { PaginatedTable, DOMReady } from "../../dist/ui.bundle.esm.min.js";
import { createFromHTML } from "../../node_modules/dom-scope/dist/dom-scope.esm.js";
import { PaginatedTable, Modal, DOMReady } from "../../dist/ui.bundle.esm.js";

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
