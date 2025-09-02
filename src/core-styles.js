// @ts-check

export function injectCoreStyles() {
    const css = /* css */ `
.d-none {
    display: none !important;
}

html-fragment {
    display: contents;
}
`;

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);

    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}
