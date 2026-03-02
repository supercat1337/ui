// @ts-check
import { Component, html } from '@supercat1337/ui';
import { BlueComponent, RedComponent } from './components.js'

export class App extends Component {
    constructor() {
        super();
        this.addComponentToSlot('slot', new BlueComponent(), new RedComponent());
    }

    layout = html`
        <div class="container">
            <h1>Native CSS Modules Example</h1>
            <div data-slot="slot"></div>
        </div>
    `;
}
