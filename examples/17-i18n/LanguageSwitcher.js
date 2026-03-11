// @ts-check

import { Component, html } from '@supercat1337/ui';
import { setLanguage, t, onLanguageChange } from './i18n.js';

export class LanguageSwitcher extends Component {
    refsAnnotation = {
        btnEn: HTMLButtonElement.prototype,
        btnRu: HTMLButtonElement.prototype,
    };

    layout = html`
        <div>
            <button data-ref="btnEn">${t('english')}</button>
            <button data-ref="btnRu">${t('russian')}</button>
        </div>
    `;

    connectedCallback() {
        const refs = this.getRefs();

        refs.btnEn.onclick = () => setLanguage('en');
        refs.btnRu.onclick = () => setLanguage('ru');

        // Update button texts when language changes
        const unsubscribe = onLanguageChange(() => {
            refs.btnEn.textContent = t('english');
            refs.btnRu.textContent = t('russian');
        });

        this.once('disconnect', unsubscribe);
    }
}
