// @ts-check

import { PaginatedTable, DOMReady } from "../../dist/ui.bundle.esm.min.js";
//import { PaginatedTable, DOMReady } from "../../dist/ui.esm.js";

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

  if (document.body.firstElementChild)
    paginatedTable.setRoot(
      /** @type {HTMLElement} */ (document.body.firstElementChild)
    );

  paginatedTable.pagination.on("page-changed", async (index) => {
    paginatedTable.setStatus("loading");
    await sleep(1000);
    dataResponse.result.current_page = index;
    paginatedTable.render(dataResponse);
  });

  paginatedTable.title = "Data";
  paginatedTable.tableView.setConfig({
    table_row_header_string:
      "<th>#</th> <th>id</th>  <th>Column 1</th> <th>Column 2</th> <th>Column 3</th>",
  });

  paginatedTable.renderLayout();
  paginatedTable.render(dataResponse);
});
