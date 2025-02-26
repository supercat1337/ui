// @ts-check

export function getHtmlLayout() {
    return /* html */ `
<div class="d-flex flex-column" style="min-height: 80vh">
    <div class="flex-grow-1 mt-3">
        <h1 class="display-6">
            <span ref="title">Table</span>
            <button class="btn btn-outline-secondary btn-sm ms-2" ref="add_data_button">
                Add
            </button>

            <button class="btn btn-outline-secondary btn-sm ms-2" ref="update_data_button">
                Update
            </button>
        </h1>
    
        <table class="table table-striped" ref="table" scope-ref="table">
        </table>

    </div>
</div>
<div aria-label="Page navigation" class="mt-5 d-flex justify-content-center" ref="pagination_section" scope-ref="pagination">
</div>
`;
}