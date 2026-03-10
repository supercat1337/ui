// @ts-check
import { Component, html } from '@supercat1337/ui';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { Greeting } from './Greeting.js';
import { Counter } from './Counter.js';

class App extends Component {
    layout = html`
        <div class="app">
            <h1>i18n Demo</h1>
            <div data-slot="switcher"></div>
            <div data-slot="greeting"></div>
            <div data-slot="counter"></div>
        </div>
    `;

    constructor() {
        super();
        this.addToSlot('switcher', new LanguageSwitcher());
        this.addToSlot('greeting', new Greeting());
        this.addToSlot('counter', new Counter());
    }
}

// @ts-ignore
new App().mount(document.getElementById('app'));
