// @ts-check

/**
 * Injects the core CSS styles into the document.
 * The core styles include support for the "d-none" class, which is commonly used in Bootstrap to hide elements.
 * The core styles also include support for the "html-fragment" element, which is used as a container for HTML fragments.
 * @param {Document|null} [doc=window.document] - The document to inject the styles into. Defaults to the global document.
 * @returns {void}
 */

export function injectCoreStyles(doc = window.document) {
    
    if (doc === null) {
        throw new Error("Document is null. Cannot inject core styles.");
    }

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

    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
}
