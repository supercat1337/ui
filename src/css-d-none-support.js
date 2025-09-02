// @ts-check

export function enableDNoneSupport() {
    const css = /* css */ `
.d-none {
    display: none !important;
}
`;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}
