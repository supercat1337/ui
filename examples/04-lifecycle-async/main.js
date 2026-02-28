// @ts-check
import { Component, html } from '../../dist/ui.bundle.esm.js'; // '@supercat1337/ui';

/**
 * UserCard Component
 * Fetches user data and handles self-cleanup.
 */
class UserCard extends Component {
    /**
     * @param {number} userId
     * @param {Function} onRemove
     */
    constructor(userId, onRemove) {
        super();
        this.userId = userId;
        this.onRemove = onRemove;
    }

    layout = () => html`
        <div class="card mb-3 border-0 shadow-sm">
            <div class="card-body d-flex align-items-center py-2">
                <div class="flex-grow-1">
                    <div data-ref="loader">
                        <div class="spinner-border spinner-border-sm text-primary"></div>
                        <span class="ms-2 small text-muted">Loading ${this.userId}...</span>
                    </div>
                    <div data-ref="content" class="d-none">
                        <h6 class="mb-0" data-ref="name"></h6>
                        <p class="text-muted" data-ref="email"></p>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger border-0" data-ref="deleteBtn">
                    &times;
                </button>
            </div>
        </div>
    `;

    /** @type {Object<string, any>} */
    refsAnnotation = {
        loader: HTMLDivElement.prototype,
        content: HTMLDivElement.prototype,
        name: HTMLHeadingElement.prototype,
        email: HTMLParagraphElement.prototype,
        deleteBtn: HTMLButtonElement.prototype,
    };

    async connectedCallback() {
        const refs = this.getRefs();

        refs.deleteBtn.onclick = () => {
            if (this.onRemove) this.onRemove(this);
            this.unmount();
        };

        try {
            const signal = this.$internals.disconnectController.signal;
            const response = await fetch(
                `https://jsonplaceholder.typicode.com/users/${this.userId}`,
                { signal }
            );
            const user = await response.json();

            refs.name.textContent = user.name;
            refs.email.textContent = user.email;

            refs.loader.classList.add('d-none');
            refs.content.classList.remove('d-none');
        } catch (e) {
            let err = e instanceof Error ? e : new Error(String(e));
            if (err.name !== 'AbortError') {
                refs.loader.innerHTML = '<span class="text-danger small">Error</span>';
            }
        }
    }
}

/**
 * Main App Component
 * Demonstrates clean separation of static refs and dynamic slots.
 */
class App extends Component {
    layout = html`
        <div class="card shadow-lg border-0 mx-auto" style="width: 26rem;">
            <div class="card-header bg-white border-0 pt-4 pb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0 fw-bold">User Manager</h5>
                        <span class="text-muted small" data-ref="counterInfo">No users active</span>
                    </div>
                    <button class="btn btn-primary btn-sm px-3 shadow-sm" data-ref="addBtn">
                        + Add User
                    </button>
                </div>
            </div>

            <div
                class="card-body pt-0"
                style="min-height: 250px; max-height: 400px; overflow-y: auto;"
            >
                <hr class="opacity-10 mt-0" />

                <div data-ref="emptyMessage" class="text-center text-muted mt-5 small">
                    The list is currently empty.
                </div>

                <div data-slot="user-list"></div>
            </div>
        </div>
    `;

    /** @type {Object<string, any>} */
    refsAnnotation = {
        addBtn: HTMLButtonElement.prototype,
        emptyMessage: HTMLDivElement.prototype,
        counterInfo: HTMLSpanElement.prototype,
    };

    connectedCallback() {
        const refs = this.getRefs();
        let activeCount = 0;

        refs.addBtn.onclick = () => {
            // Logic to hide empty message via its Ref
            if (activeCount === 0) {
                refs.emptyMessage.classList.add('d-none');
            }

            activeCount++;
            refs.counterInfo.textContent = `Active users: ${activeCount}`;

            const randomId = Math.floor(Math.random() * 10) + 1;

            const userCard = new UserCard(randomId, (/** @type {Component} */ comp) => {
                this.slotManager.removeComponent(comp);

                activeCount--;
                refs.counterInfo.textContent =
                    activeCount > 0 ? `Active users: ${activeCount}` : 'No users active';

                if (activeCount === 0) {
                    refs.emptyMessage.classList.remove('d-none');
                }
            });

            this.addComponentToSlot('user-list', userCard);
        };
    }
}

// --- Bootstrap ---
new App().mount(document.body);
