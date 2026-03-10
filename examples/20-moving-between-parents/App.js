// @ts-check

import { Component, html } from '@supercat1337/ui';
import { Panel } from './Panel.js';
import { MovableCard } from './MovableCard.js';

export class App extends Component {
  refsAnnotation = {
    toPanel1Left: HTMLButtonElement.prototype,
    toPanel1Right: HTMLButtonElement.prototype,
    toPanel2Left: HTMLButtonElement.prototype,
    toPanel2Right: HTMLButtonElement.prototype,
  };

  layout = () => html`
    <div class="app">
      <h2>Moving Components Between Different Parents</h2>
      <div class="global-controls">
        <button data-ref="toPanel1Left">📦 Move Card to Panel 1 Left</button>
        <button data-ref="toPanel1Right">📦 Move Card to Panel 1 Right</button>
        <button data-ref="toPanel2Left">📦 Move Card to Panel 2 Left</button>
        <button data-ref="toPanel2Right">📦 Move Card to Panel 2 Right</button>
      </div>
      <div class="panels">
        <div data-slot="panel1"></div>
        <div data-slot="panel2"></div>
      </div>
    </div>
  `;

  constructor() {
    super();
    // Create two panels
    this.panel1 = new Panel(1);
    this.panel2 = new Panel(2);

    // Create one movable card
    this.card = new MovableCard();

    // Set the card reference on both panels (they need it to move internally)
    this.panel1.setCard(this.card);
    this.panel2.setCard(this.card);

    // Initially place the card in panel1 left slot
    this.panel1.addToSlot('left', this.card);

    // Add panels to the main slots
    this.addToSlot('panel1', this.panel1);
    this.addToSlot('panel2', this.panel2);
  }

  connectedCallback() {
    const refs = this.getRefs();

    refs.toPanel1Left.onclick = () => this.panel1.addToSlot('left', this.card);
    refs.toPanel1Right.onclick = () => this.panel1.addToSlot('right', this.card);
    refs.toPanel2Left.onclick = () => this.panel2.addToSlot('left', this.card);
    refs.toPanel2Right.onclick = () => this.panel2.addToSlot('right', this.card);
  }
}