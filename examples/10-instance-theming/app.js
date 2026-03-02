// @ts-check
import { Component, html } from '@supercat1337/ui';
import { UniversalCard } from './universal-card.js';

export class App extends Component {
    constructor() {
        super();
        
        // Creating different flavors of the same component
        const lightCard = new UniversalCard('is-light', 'Light Mode');
        const darkCard = new UniversalCard('is-dark', 'Dark Mode');

        // Declaratively adding them to the pre-defined slot
        this.addComponentToSlot('content', lightCard, darkCard);
    }

    layout = html`
        <div class="container">
            <h1>Component Theming Example</h1>
            <div data-slot="content"></div>
        </div>
    `;
}