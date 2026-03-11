// @ts-check
import { Component, html } from '@supercat1337/ui';
import { BlueComponent, RedComponent } from './components.js';

export class App extends Component {
    layout = html`
        <div class="container">
            <h1>Static Styles Demo</h1>
            <p>Open DevTools -> Elements -> Styles to see adoptedStyleSheets.</p>
            <div data-slot="content"></div>
        </div>
    `;

    connectedCallback() {
        const components = [
            new BlueComponent(),
            new BlueComponent(),
            new RedComponent(),
            new RedComponent()
        ];

        this.addToSlot('content', ...components);
    }
}