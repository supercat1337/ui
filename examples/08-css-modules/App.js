// @ts-check

import { Component, html } from '@supercat1337/ui';
import { StyledButton } from './Button.js';

export class App extends Component {
    layout = html`
        <div class="container">
            <h2>CSS Modules Integration</h2>
            <div data-slot="buttonContainer"></div>
        </div>
    `;

    connectedCallback() {
        const saveBtn = new StyledButton({
            label: 'Save Changes',
            type: 'primary',
            isActive: true,
        });

        const cancelBtn = new StyledButton({
            label: 'Cancel',
            type: 'secondary',
        });

        this.addToSlot('buttonContainer', saveBtn, cancelBtn);
    }
}
