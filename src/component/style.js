// @ts-check
export const UI_COMPONENT_SHEET = Symbol('isUIComponentSheet');

export function extractComponentStyles(doc = document) {
    if (!doc.adoptedStyleSheets) return '';

    return doc.adoptedStyleSheets
        .filter(sheet => sheet[UI_COMPONENT_SHEET] === true)
        .map(sheet => {
            return Array.from(sheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
        })
        .join('\n');
}

