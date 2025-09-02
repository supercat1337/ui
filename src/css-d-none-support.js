// @ts-check

/**
 * Enables support for the "d-none" class in the web component.
 * The "d-none" class is commonly used in Bootstrap to hide elements.
 * This method adds a CSS rule to the document to support the "d-none" class.
 *
 * @example
 * import { enableDNoneSupport } from "@supercat/ui";
 *
 * enableDNoneSupport();
 */
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
