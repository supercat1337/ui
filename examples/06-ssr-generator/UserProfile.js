// @ts-check
import { Component, Config, html } from '@supercat1337/ui';

/**
 * @typedef {Object} UserProfileState
 * @property {string} name
 * @property {string} role
 */

/**
 * UserProfile Component
 * Handles both SSR rendering and Client-side hydration.
 */
export class UserProfile extends Component {
    /** @type {UserProfileState} */
    state = {
        name: '',
        role: ''
    };

    /** @type {Object<string, HTMLElement>} */
    refsAnnotation = {
        userName: Config.window.HTMLHeadingElement.prototype,
        userRole: Config.window.HTMLParagraphElement.prototype,
        followBtn: Config.window.HTMLButtonElement.prototype,
    };

    /**
     * Restore component state from hydration manifest.
     * Called automatically during mount(..., 'hydrate') if SID is present.
     * @param {UserProfileState} data - The state data retrieved from the manifest.
     */
    restoreCallback(data) {
        this.state.name = data.name;
        this.state.role = data.role;
    }

    serialize() {
        return {
            name: this.state.name,
            role: this.state.role
        }
    }

    /**
     * Component layout template.
     * Reactive to this.state changes.
     */
    layout = () => html`
        <div class="card shadow-sm" style="width: 18rem;">
            <div class="card-body text-center">
                <h5 class="card-title" data-ref="userName">${this.state.name}</h5>
                <p class="text-muted" data-ref="userRole">${this.state.role}</p>
                <button class="btn btn-outline-primary w-100" data-ref="followBtn">Follow</button>
            </div>
        </div>
    `;

    /**
     * Lifecycle method called when the component is attached to the DOM.
     * Used for event binding and DOM synchronization.
     */
    connectedCallback() {
        const refs = this.getRefs();
        
        // Synchronize text content with potentially restored state
        refs.userName.textContent = this.state.name;
        refs.userRole.textContent = this.state.role;

        refs.followBtn.onclick = () => {
            refs.followBtn.classList.replace('btn-outline-primary', 'btn-success');
            refs.followBtn.textContent = 'Following';
            console.log(`Now following ${this.state.name}`);
        };
    }
}