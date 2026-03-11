// @ts-check

/**
 * Creates and returns a CSSStyleSheet from a string or an existing sheet.
 * Marks it with a special symbol for library tracking.
 * * @param {string | CSSStyleSheet} styles - CSS string or existing stylesheet.
 * @param {symbol} marker - Unique symbol to mark the sheet as internal.
 * @param {any} window - The window object for constructor access.
 * @returns {CSSStyleSheet | null}
 */
export function createComponentStyleSheet(styles, marker, window) {
    if (typeof window.CSSStyleSheet === 'undefined') return null;

    let sheet;
    if (styles instanceof window.CSSStyleSheet) {
        sheet = styles;
    } else {
        sheet = new window.CSSStyleSheet();
        // @ts-ignore
        sheet.replaceSync(styles);
    }

    // Mark it as ours so SSR and other components can identify it
    sheet[marker] = true;
    return sheet;
}

/**
 * Injects a stylesheet into the document's adoptedStyleSheets.
 * Ensures no duplicates by checking the marker.
 * * @param {Document} doc - The target document.
 * @param {CSSStyleSheet} sheet - The sheet to inject.
 */
export function injectSheet(doc, sheet) {
    if (!doc.adoptedStyleSheets) {
        // Fallback for environments without adoptedStyleSheets support
        // @ts-ignore
        doc.adoptedStyleSheets = [];
    }

    // Double check to prevent adding the exact same instance twice
    if (!doc.adoptedStyleSheets.includes(sheet)) {
        doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
    }
}