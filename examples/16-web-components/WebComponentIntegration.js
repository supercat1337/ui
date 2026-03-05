// @ts-check
import { Component, html } from '@supercat1337/ui';

// 1. Define a Web Component with Shadow DOM
class FancyCard extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <div class="card">
                <h3 data-ref="cardTitle">Default Title</h3>
                <button data-ref="cardBtn">Click me</button>
            </div>
        `;
    }
}
customElements.define('fancy-card', FancyCard);

// 2. BareDOM component that uses the Web Component and accesses its internal refs
export class WebComponentIntegration extends Component {
    // Annotation includes refs from both the light DOM and the Web Component's shadow DOM
    refsAnnotation = {
        // light DOM refs
        mainBtn: HTMLButtonElement.prototype,
        // shadow DOM refs (will be available after adding shadowRoot)
        cardTitle: HTMLHeadingElement.prototype,
        cardBtn: HTMLButtonElement.prototype,
    };

    layout = html`
        <div>
            <button data-ref="mainBtn">Main Button</button>
            <fancy-card></fancy-card>
        </div>
    `;

    constructor() {
        super();

        // Subscribe to the event fired just before refs are updated
        this.on('before-update-refs', () => {
            let rootNode = this.getRootNode();
            // Find the Web Component instance inside the root element
            const fancyCard = /** @type {FancyCard} */ rootNode.querySelector('fancy-card');
            if (fancyCard?.shadowRoot) {
                // Add its shadowRoot to the list of additional roots to scan for data-ref
                this.$internals.additionalRoots.push(fancyCard.shadowRoot);
            }
        });
    }

    connectedCallback() {
        const refs = this.getRefs();
        // Now all refs (light + shadow) are available
        refs.mainBtn.addEventListener('click', () => {
            refs.cardTitle.textContent = 'Updated from main button!';
        });

        refs.cardBtn.addEventListener('click', () => {
            alert('Card button clicked!');
        });
    }
}
