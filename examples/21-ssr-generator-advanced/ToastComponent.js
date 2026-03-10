//@ts-check

import { Component, html, sleep } from '@supercat1337/ui';

/**
 * ToastComponent displays a temporary notification message.
 * It manages its own lifecycle by unmounting itself after a set duration.
 * * This component is typically created dynamically on the client side 
 * and doesn't require hydration or a fixed instanceId.
 * * @extends {Component}
 */
export class ToastComponent extends Component {
    /**
     * @param {Object} options
     * @param {string} options.message - The text message to display.
     * @param {number} [options.duration=3000] - Visibility duration in milliseconds.
     */
    constructor({ message, duration = 3000 }) {
        super();
        this.message = message;
        this.duration = duration;
    }

    /**
     * Defines the toast structure.
     * Initial display is set to none to allow for a controlled fade-in/slide-in effect.
     */
    layout = () => html`
        <div class="toast-item" style="display: none;">
            <span>${this.message}</span>
        </div>
    `;

    /**
     * Handles the toast lifecycle: entry animation, waiting, exit animation, and unmounting.
     * This method is marked async to utilize the sleep helper for timing.
     */
    async connectedCallback() {
        const root = this.getRootNode();

        // 1. Show the element and trigger the CSS transition
        root.style.display = 'block';
        // Small delay to ensure the browser registers the display change before adding the class
        setTimeout(() => root.classList.add('is-visible'), 10);

        // 2. Wait for the specified duration
        await sleep(this.duration);

        // 3. Start the exit animation
        root.classList.remove('is-visible');

        // 4. Wait for the CSS transition to complete (e.g., 300ms) before removing from DOM
        await sleep(300);

        // 5. Self-destruct: remove the component from the DOM and clean up references
        this.unmount();
    }
}