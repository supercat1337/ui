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
                <div data-ref="errorState" class="error-message" class="d-none"></div>
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

    // Toggler for static UI states (empty, loading, error)
    stateToggler = new Toggler();

    // Reference to the currently loaded component (if any)
    loadedComponent = null;

    connectedCallback() {
        const refs = this.getRefs();

        // Setup Toggler items for static states
        this.stateToggler
            .addItem(
                'empty',
                () => showElements(refs.emptyState),
                () => hideElements(refs.emptyState)
            )
            .addItem(
                'loading',
                () => showElements(refs.loadingState),
                () => hideElements(refs.loadingState)
            )
            .addItem(
                'error',
                () => showElements(refs.errorState),
                () => hideElements(refs.errorState)
            )
            .addItem(
                'content',
                () => showElements(refs.contentState),
                () => hideElements(refs.contentState)
            )
            .init('empty');

        refs.loadBtn.onclick = async () => {
            if (this.loadedComponent) return; // already loaded

            this.stateToggler.setActive('loading');
            refs.loadBtn.disabled = true;

            try {
                const { UserProfile } = await import('./UserProfile.js');
                const profile = new UserProfile();

                // Replace any existing content in the content slot
                this.addToSlot('content', profile, 'replace');
                this.loadedComponent = profile;

                this.stateToggler.setActive('content');
            } catch (err) {
                console.error('Failed to load ESM component:', err);
                refs.errorState.textContent = `Failed to load: ${err.message}`;
                this.stateToggler.setActive('error');
                refs.loadBtn.disabled = false;
                this.clearSlotContent('content');
            }
        };
    }

    // Optional: cleanup when component unmounts
    disconnectedCallback() {
        if (this.loadedComponent) {
            this.loadedComponent.detachFromSlot();
            this.loadedComponent = null;
        }

        this.stateToggler.clear();
    }
}

export { App };
