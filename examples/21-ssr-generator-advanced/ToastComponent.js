//@ts-check

import { Component, html, sleep } from '@supercat1337/ui';

export class ToastComponent extends Component {
    constructor({ message, duration = 3000 }) {
        super();
        this.message = message;
        this.duration = duration;
        // У тостов обычно нет постоянного instanceId, но для гидратации не нужны
    }

    layout = () => html`
        <div class="toast-item" style="display: none;">
            <span>${this.message}</span>
        </div>
    `;

    async connectedCallback() {
        const root = this.getRootNode();
        root.style.display = 'block';
        setTimeout(() => root.classList.add('is-visible'), 10);
        await sleep(this.duration);
        root.classList.remove('is-visible');
        await sleep(300);
        this.unmount();
    }
}
