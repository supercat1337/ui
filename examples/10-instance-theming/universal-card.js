// @ts-check
import { Component, html } from '@supercat1337/ui';
// Importing the stylesheet as a native CSS Module Script
// @ts-ignore
import styles from './universal-card.css' with { type: 'css' };

export class UniversalCard extends Component {
    /**
     * @param {string} theme - The CSS modifier class (e.g., 'is-light', 'is-dark')
     * @param {string} title - The text content for the card
     */
    constructor(theme, title) {
        super();
        this.theme = theme;
        this.title = title;
    }

    /**
     * Renders the component with a base class and a theme modifier.
     */
    layout = () => {
        return html`
            <div class="universal-card ${this.theme}">
                <h3>${this.title}</h3>
                <p>This instance uses the <strong>${this.theme}</strong> modifier.</p>
            </div>
        `;
    };

    /**
     * Standard lifecycle method to attach the shared stylesheet once.
     */
    connectedCallback() {
        if (!document.adoptedStyleSheets.includes(styles)) {
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, styles];
        }
    }
}
