// @ts-check

import { Component, html } from '@supercat1337/ui';
import { MovableCard } from './MovableCard.js';

export class Panel extends Component {
    /**
     *
     * @param {number} panelId
     */
    constructor(panelId) {
        super();
        this.panelId = panelId;
    }

    refsAnnotation = {
        moveLeftBtn: HTMLButtonElement.prototype,
        moveRightBtn: HTMLButtonElement.prototype,
    };

    layout = () => html`
        <div class="panel">
            <h3>Panel ${this.panelId}</h3>
            <div class="controls">
                <button data-ref="moveLeftBtn">⬅️ Move to Left Slot</button>
                <button data-ref="moveRightBtn">➡️ Move to Right Slot</button>
            </div>
            <div class="slots">
                <div class="slot left">
                    <h4>Left Slot</h4>
                    <div data-slot="left"></div>
                </div>
                <div class="slot right">
                    <h4>Right Slot</h4>
                    <div data-slot="right"></div>
                </div>
            </div>
        </div>
    `;

    connectedCallback() {
        const refs = this.getRefs();
        refs.moveLeftBtn.onclick = () => this.moveCard('left');
        refs.moveRightBtn.onclick = () => this.moveCard('right');
    }

    // Method to move the card within this panel (to be called from outside)
    /**
     * @param {string} targetSlot
     */
    moveCard(targetSlot) {
        // 'card' must be set by the parent App
        if (this.card) {
            this.addComponentToSlot(targetSlot, this.card);
        }
    }

    // Method to set the card reference (called by parent)
    /**
     *
     * @param {MovableCard} card
     */
    setCard(card) {
        this.card = card;
    }
}
