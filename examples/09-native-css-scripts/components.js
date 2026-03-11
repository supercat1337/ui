// @ts-check
import { Component, html } from '@supercat1337/ui';

export class BlueComponent extends Component {
    static styles = `
        .blue-box {
            padding: 20px;
            background-color: #e3f2fd;
            border: 2px solid #2196f3;
            border-radius: 8px;
            color: #0d47a1;
            margin-bottom: 10px;
        }
        .blue-box h3 { margin-top: 0; }
    `;

    layout = () => html`
        <div class="blue-box">
            <h3>Blue Component</h3>
            <p>My styles were injected via static styles!</p>
        </div>
    `;
}

export class RedComponent extends Component {
    static styles = `
        .red-box {
            padding: 20px;
            background-color: #ffebee;
            border: 2px solid #f44336;
            border-radius: 8px;
            color: #b71c1c;
        }
        .red-box h3 { margin-top: 0; }
    `;

    layout = () => html`
        <div class="red-box">
            <h3>Red Component</h3>
            <p>I have my own isolated static styles.</p>
        </div>
    `;
}
