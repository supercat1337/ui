// @ts-check

import { Component, html } from '@supercat1337/ui';
import { StyledButton } from './Button.js';

export class App extends Component {
    layout = html`
        <div class="container">
            <h2>CSS Modules Integration</h2>
            <div data-ref="buttonContainer"></div>
        </div>
    `;

    connectedCallback() {
        const refs = this.getRefs();
        
        // Creating instances with different styles
        const saveBtn = new StyledButton({ 
            label: 'Save Changes', 
            type: 'primary',
            isActive: true 
        });

        const cancelBtn = new StyledButton({ 
            label: 'Cancel', 
            type: 'secondary' 
        });

        refs.buttonContainer.append(saveBtn, cancelBtn);
    }
}