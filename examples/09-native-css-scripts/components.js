// @ts-check
import { Component, html } from '@supercat1337/ui';
// @ts-ignore
import blueSheet from './blue-component.css' with { type: 'css' };
// @ts-ignore
import redSheet from './red-component.css' with { type: 'css' };

export class BlueComponent extends Component {
    // We wrap layout in a class-based namespace
    layout = html`
        <div class="blue-component">
            <div class="card">
                <h2 class="title">Blue Component</h2>
                <p>Safe styles via .blue-component prefix.</p>
            </div>
        </div>
    `;

    connectedCallback() {
        if (!document.adoptedStyleSheets.includes(blueSheet)) {
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, blueSheet];
        }
    }
}

export class RedComponent extends Component {
    layout = html`
        <div class="red-component">
            <div class="card">
                <h2 class="title">Red Component</h2>
                <p>Safe styles via .red-component prefix.</p>
            </div>
        </div>
    `;

    connectedCallback() {
        if (!document.adoptedStyleSheets.includes(redSheet)) {
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, redSheet];
        }
    }
}
