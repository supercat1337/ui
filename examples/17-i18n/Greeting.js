// @ts-check

import { Component, html } from '@supercat1337/ui';
import { t, onLanguageChange } from './i18n.js';

export class Greeting extends Component {
  refsAnnotation = {
    message: HTMLParagraphElement.prototype
  };

  layout = html`<p data-ref="message"></p>`;

  connectedCallback() {
    // Unsubscribe when the component disconnects
    const unsubscribe = onLanguageChange(() => this.reloadText());

    this.setTextUpdateFunction(() => {
      this.getRefs().message.textContent = t('greeting', { name: 'John' });
    });

    this.reloadText();

    this.onDisconnect(unsubscribe);
  }
}