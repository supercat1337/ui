// @ts-check

export function getHtmlLayout() {
    let html = /* html */ `
<table class="table table-striped">
    <thead>
        <tr ref="header_row">

        </tr>
    </thead>
    <tbody ref="section_with_content" class="d-none">
    </tbody>
    <tbody ref="section_without_content" class="d-none">
        <tr>
            <td ref="no_content_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                No items
            </td>
        </tr>
    </tbody>
    <tbody ref="section_error" class="d-none">
        <tr>
            <td ref="error_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                Error
            </td>
        </tr>
    </tbody>
    <tbody ref="section_loading" class="">
        <tr>
            <td ref="loading_text" class="col-12 text-center py-4" colspan="100"
                style="white-space: initial; word-wrap: break-word;">
                Loading...
            </td>
        </tr>
    </tbody>

</table>
`;

    return html;
}
