// @ts-check
import { Component, html } from '@supercat1337/ui';

export class MessageSender extends Component {
    /**
     * Component communicates by emitting events on itself.
     */
    send = () => {
        const payload = {
            text: 'Hello from child!',
            time: new Date().toLocaleTimeString(),
        };

        // Using the built-in emit method
        this.emit('custom-event', payload);
    };

    connectedCallback() {
        const { btn } = this.getRefs();

        this.$on(btn, "click", ()=>{
            this.send();
        });
    }

    layout = () => html`
        <div class="sender-card">
            <button data-ref="btn">Emit Event</button>
        </div>
    `;
}
