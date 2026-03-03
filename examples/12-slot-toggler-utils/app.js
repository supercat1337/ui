// @ts-check
import { Component, html, SlotToggler, fadeIn, delegateEvent } from '@supercat1337/ui';

export class App extends Component {
    constructor() {
        super();
        this.state = { activeTab: 'home' };
        this.tabs = new SlotToggler(this, ['home', 'profile', 'settings'], 'home');
    }

    connectedCallback() {
        const { nav } = this.getRefs();
        this.tabs.init();

        // @ts-ignore
        delegateEvent('click', nav, '[data-tab]', e => {
            const tabName = e.target.dataset.tab;
            this.switchTab(tabName);
        });
    }

    /** @param {string} tabName */
    switchTab(tabName) {
        if (this.state.activeTab === tabName || !tabName) return;

        this.state.activeTab = tabName;
        this.tabs.toggle(tabName);

        const slotElement = this.slotManager.getSlotElement(tabName);
        if (slotElement) fadeIn(slotElement, 300);

        this.update();
    }

    update() {
        if (!this.isConnected) return;
        const { nav } = this.getRefs();

        nav.querySelectorAll('[data-tab]').forEach((/** @type {HTMLButtonElement} */ btn) => {
            btn.classList.toggle('active', btn.dataset.tab === this.state.activeTab);
        });
    }

    layout = () => html`
        <div class="tabs-container">
            <nav data-ref="nav" class="tab-buttons">
                <button data-tab="home">Home</button>
                <button data-tab="profile">Profile</button>
                <button data-tab="settings">Settings</button>
            </nav>

            <div class="tab-content">
                <div data-slot="home"><h3>Home View</h3></div>
                <div data-slot="profile"><h3>User Profile</h3></div>
                <div data-slot="settings"><h3>System Settings</h3></div>
            </div>
        </div>
    `;
}
