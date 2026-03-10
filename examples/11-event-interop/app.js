// @ts-check
import { Component, html } from '@supercat1337/ui';
import { MessageSender } from './message-sender.js';

export class App extends Component {
    constructor() {
        super();
        this.state = {
            /** @type {string[]} */
            log: [],
        };

        // 1. Create the child instance
        const sender = new MessageSender();

        // 2. Subscribe to its internal emitter directly
        sender.on('custom-event', (/** @type {{text:string, time:string}} */ data) => {
            this.state.log.push(`Received: ${data.text} at ${data.time}`);
            this.update();
        });

        this.addToSlot('main', sender);
    }

    refsAnnotation = {
        list: HTMLUListElement.prototype
    }

    update() {
        if (!this.isConnected) return;

        let refs = this.getRefs();
        let items = this.state.log.map(item => html`<li>${item}</li>`);

        refs.list.replaceChildren(...items);
    }

    layout = () => html`
        <div class="app-container">
            <h1>Component Event Emitter</h1>
            <div data-slot="main"></div>

            <div class="event-log">
                <h3>Event Log:</h3>
                <ul data-ref="list"></ul>
            </div>
        </div>
    `;
}
