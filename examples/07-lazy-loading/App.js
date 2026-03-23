// @ts-check

import { Component, html, Toggler, hideElements, showElements } from '@supercat1337/ui';

class App extends Component {
    layout = html`
        <div class="app-wrapper">
            <h2>Async Module Loading</h2>
            <button data-ref="loadBtn">Fetch Profile Module</button>

            <div class="stage">
                <div data-ref="emptyState">No profile loaded yet.</div>
                <div data-ref="loadingState" class="d-none">
                    <div class="loader">Fetching ESM module...</div>
                </div>
                <div data-ref="errorState" class="error-message d-none"></div>
                <div data-slot="content" data-ref="contentState" class="d-none"></div>
            </div>
        </div>
    `;

    refsAnnotation = {
        loadBtn: HTMLButtonElement.prototype,
        emptyState: HTMLElement.prototype,
        loadingState: HTMLElement.prototype,
        errorState: HTMLElement.prototype,
        contentState: HTMLElement.prototype,
    };

    stateToggler = new Toggler();

    connectedCallback() {
        const { loadBtn, emptyState, loadingState, errorState, contentState } = this.getRefs();

        this.stateToggler
            .addItem(
                'empty',
                () => showElements(emptyState),
                () => hideElements(emptyState)
            )
            .addItem(
                'loading',
                () => showElements(loadingState),
                () => hideElements(loadingState)
            )
            .addItem(
                'error',
                () => showElements(errorState),
                () => hideElements(errorState)
            )
            .addItem(
                'content',
                () => showElements(contentState),
                () => hideElements(contentState)
            )
            .init('empty');

        this.$on(loadBtn, 'click', async () => {
            if (loadBtn.disabled) return;

            this.stateToggler.setActive('loading');
            loadBtn.disabled = true;

            try {
                const { UserProfile } = await import('./UserProfile.js');
                const profile = new UserProfile();

                this.addToSlot('content', profile, 'replace');
                this.stateToggler.setActive('content');
            } catch (err) {
                console.error('Failed to load:', err);
                errorState.textContent = `Error: ${err.message}`;

                this.stateToggler.setActive('error');
                this.clearSlotContent('content');
                loadBtn.disabled = false;
            }
        });

        this.addDisposer(() => this.stateToggler.clear());
    }
}

export { App };
