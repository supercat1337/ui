// @ts-check
import { Component, html } from '@supercat1337/ui';
import { Counter } from './Counter.js';

export class MoveDemo extends Component {
    refsAnnotation = {
        moveLeftBtn: HTMLButtonElement.prototype,
        moveRightBtn: HTMLButtonElement.prototype,
        moveExternalBtn: HTMLButtonElement.prototype,
        moveBackBtn: HTMLButtonElement.prototype,
        externalContainer: HTMLDivElement.prototype,
    };

    layout = () => html`
        <div class="demo">
            <div class="controls">
                <button data-ref="moveLeftBtn">⬅️ Move to Left Slot</button>
                <button data-ref="moveRightBtn">➡️ Move to Right Slot</button>
                <button data-ref="moveExternalBtn">📦 Move to External Container</button>
                <button data-ref="moveBackBtn">↩️ Move Back to Left Slot</button>
            </div>

            <div class="slots">
                <div class="slot left">
                    <h3>Left Slot</h3>
                    <div data-slot="left"></div>
                </div>
                <div class="slot right">
                    <h3>Right Slot</h3>
                    <div data-slot="right"></div>
                </div>
            </div>

            <div class="external">
                <h3>External Container</h3>
                <div data-ref="externalContainer" class="external-box"></div>
            </div>
        </div>
    `;

    constructor() {
        super();
        // Create the counter once
        this.counter = new Counter();
        // Initially place it in the left slot
        this.addToSlot('left', this.counter);
    }

    connectedCallback() {
        const refs = this.getRefs();

        refs.moveLeftBtn.onclick = () => this.moveToSlot('left');
        refs.moveRightBtn.onclick = () => this.moveToSlot('right');

        refs.moveExternalBtn.onclick = () => this.moveToExternal();
        refs.moveBackBtn.onclick = () => this.moveToSlot('left');
    }

    /**
     *
     * @param {string} slotName
     */
    moveToSlot(slotName) {
        // Add to the new slot (automatically moves the DOM element)
        this.addToSlot(slotName, this.counter);
    }

    moveToExternal() {
        let { externalContainer } = this.getRefs();
        this.counter.mount(externalContainer);
    }
}
