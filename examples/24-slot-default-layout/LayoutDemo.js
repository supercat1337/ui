// @ts-check
import { Component, html } from '@supercat1337/ui';

export class LayoutDemo extends Component {
    static layout = html`
        <div class="layout-card">
            <h2>Slot Demo</h2>

            <section class="slot-box">
                <label>1. Empty Slot (Wait for input):</label>
                <div class="slot-target" data-slot="emptySlot"></div>
            </section>

            <section class="slot-box">
                <label>2. HTML Default (From layout string):</label>
                <div class="slot-target" data-slot="htmlSlot">
                    <p class="default-info">☘️ I am default content from HTML string</p>
                </div>
            </section>

            <section class="slot-box">
                <label>3. JS Default (From constructor):</label>
                <div class="slot-target" data-slot="jsSlot"></div>
            </section>
        </div>
    `;

    constructor() {
        super();

        this.slotManager.registerSlot('jsSlot', {
            defaultLayout: () => html`
                <div class="js-default">
                    <span class="badge">JS</span>
                    I was set in constructor!
                </div>
            `,
        });
    }
}
