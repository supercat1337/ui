// @ts-check

import { Component, html, SlotToggler } from '@supercat1337/ui';

class App extends Component {
    layout = html`
        <div class="app-wrapper">
            <h2>Async Module Loading</h2>
            <button data-ref="loadBtn">Fetch Profile Module</button>

            <div class="stage">
                <div data-slot="empty">No profile loaded yet.</div>

                <div data-slot="loading">
                    <div class="loader">Fetching ESM module...</div>
                </div>

                <div data-slot="content"></div>
            </div>
        </div>
    `;

    // Type annotation for the load button
    refsAnnotation = {
        loadBtn: HTMLButtonElement.prototype,
    };

    /** @type {SlotToggler} */
    toggler = new SlotToggler(this, ['empty', 'loading', 'content'], 'empty');

    connectedCallback() {
        const refs = this.getRefs();

        // Initialize the toggler with three possible slots
        this.toggler.init();

        refs.loadBtn.onclick = async () => {
            // Prevent multiple loads if already active
            if (this.toggler.activeSlotName === 'content') return;

            // Switch to loading state and disable UI
            this.toggler.toggle('loading');
            refs.loadBtn.disabled = true;

            try {
                // Dynamic import of the ESM module
                const { UserProfile } = await import('./UserProfile.js');

                // Create the component instance
                const profile = new UserProfile();

                this.addComponentToSlot("content", profile);

                // Finally, switch to the content slot
                this.toggler.toggle('content');
            } catch (err) {
                console.error('Failed to load ESM component:', err);
                // Revert to empty state on error
                this.toggler.toggle('empty');
                refs.loadBtn.disabled = false;
            }
        };
    }
}

export { App };
