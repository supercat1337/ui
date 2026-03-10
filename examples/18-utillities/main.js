// @ts-check

import {
    Component,
    html,
    debounce,
    throttle,
    uniqueId,
    onClickOutside,
    local,
} from '@supercat1337/ui';

// Simple logger component
class Logger extends Component {
    refsAnnotation = {
        log: HTMLDivElement.prototype,
    };

    layout = html`<div class="log" data-ref="log"></div>`;

    /**
     * @param {string} message
     */
    log(message) {
        const logEl = this.getRefs().log;
        const entry = document.createElement('div');
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }
}

// Main demo component
class DemoApp extends Component {
    refsAnnotation = {
        themeToggle: HTMLButtonElement.prototype,
        themeDisplay: HTMLSpanElement.prototype,
        searchInput: HTMLInputElement.prototype,
        searchDebounced: HTMLSpanElement.prototype,
        throttleBtn: HTMLButtonElement.prototype,
        scrollArea: HTMLDivElement.prototype,
        throttleCounter: HTMLSpanElement.prototype,
        modalBtn: HTMLButtonElement.prototype,
        modal: HTMLDivElement.prototype,
        modalOverlay: HTMLDivElement.prototype,
        closeModalBtn: HTMLButtonElement.prototype,
    };

    // Logger instance will be added via slot
    logger = new Logger();

    constructor() {
        super();
        this.addToSlot('log-slot', this.logger);

        // Unique ID generation
        this.inputId = uniqueId('input-');
        this.buttonId = uniqueId('btn-');
    }

    layout = () => html`
        <div class="card">
            <h2>1. Storage (Theme)</h2>
            <button data-ref="themeToggle">Toggle Theme (saved)</button>
            <p>Current theme: <span data-ref="themeDisplay">light</span></p>
        </div>

        <div class="card">
            <h2>2. Debounce (Search)</h2>
            <label for="${this.inputId}">Type something:</label>
            <input
                type="text"
                id="${this.inputId}"
                data-ref="searchInput"
                placeholder="Type here..."
            />
            <p>Debounced value: <span data-ref="searchDebounced">(waiting...)</span></p>
        </div>

        <div class="card">
            <h2>3. Throttle (Scroll / Clicks)</h2>
            <button data-ref="throttleBtn" id="${this.buttonId}">Click rapidly (throttled)</button>
            <p>Throttle counter: <span data-ref="throttleCounter">0</span></p>
            <div
                data-ref="scrollArea"
                style="height:100px; overflow-y:scroll; border:1px solid #ccc; padding:0.5rem;"
            >
                <div style="height:300px;">Scroll inside this box (throttled logs)</div>
            </div>
        </div>

        <div class="card">
            <h2>4. onClickOutside (Modal)</h2>
            <button data-ref="modalBtn">Open Modal</button>
            <!-- Modal (hidden by default) -->
            <div data-ref="modal" class="modal" style="display:none;">
                <h3>Modal</h3>
                <p>Click outside or press Close</p>
                <button data-ref="closeModalBtn">Close</button>
            </div>
            <div data-ref="modalOverlay" class="modal-overlay" style="display:none;"></div>
        </div>

        <div class="card">
            <h2>Logs</h2>
            <div data-slot="log-slot"></div>
        </div>
    `;

    connectedCallback() {
        const refs = this.getRefs();

        // --- Storage: theme persistence ---
        const savedTheme = local.get('theme') || 'light';
        this.applyTheme(savedTheme);
        this.logger.log(`Theme loaded: ${savedTheme}`);

        refs.themeToggle.onclick = () => {
            const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
            local.set('theme', newTheme);
            this.applyTheme(newTheme);
            this.logger.log(`Theme changed to ${newTheme} (saved to storage)`);
        };

        // Subscribe to theme changes from other tabs
        this.themeUnsub = local.on('theme', newTheme => {
            if (newTheme) {
                this.applyTheme(newTheme);
                this.logger.log(`Theme updated from another tab: ${newTheme}`);
            }
        });

        // --- Debounce: search input ---
        const debouncedSearch = debounce((/** @type {string} */ value) => {
            refs.searchDebounced.textContent = value;
            this.logger.log(`Debounced search: ${value}`);
        }, 500);

        refs.searchInput.addEventListener('input', e => {
            // @ts-ignore
            debouncedSearch(e.target.value);
        });

        // --- Throttle: button clicks and scroll ---
        let throttleCounter = 0;
        const throttledClick = throttle(() => {
            throttleCounter++;
            refs.throttleCounter.textContent = String(throttleCounter);
            this.logger.log(`Throttled click #${throttleCounter}`);
        }, 1000);

        refs.throttleBtn.addEventListener('click', throttledClick);

        const throttledScroll = throttle(() => {
            this.logger.log('Throttled scroll event');
        }, 500);
        refs.scrollArea.addEventListener('scroll', throttledScroll);

        // Store for cleanup
        this.debouncedSearch = debouncedSearch;
        this.throttledClick = throttledClick;
        this.throttledScroll = throttledScroll;

        // --- onClickOutside: modal ---
        const modal = refs.modal;
        const overlay = refs.modalOverlay;
        const modalBtn = refs.modalBtn;
        const closeBtn = refs.closeModalBtn;

        const that = this;

        const showModal = () => {
            modal.style.display = 'block';
            overlay.style.display = 'block';
            // Set up outside click listener
            this.modalOutsideUnsub = onClickOutside(modal, () => {
                that.hideModal();
                this.logger.log('Modal closed by clicking outside');
            });
        };

        modalBtn.onclick = () => {
            showModal();
            this.logger.log('Modal opened');
        };
        closeBtn.onclick = () => {
            this.hideModal();
            this.logger.log('Modal closed by button');
        };
        overlay.onclick = () => this.hideModal(); // also close on overlay click

        // --- uniqueId already used in template ---
        this.logger.log(`Generated input ID: ${this.inputId}, button ID: ${this.buttonId}`);
    }

    hideModal() {
        const refs = this.getRefs();
        const modal = refs.modal;
        const overlay = refs.modalOverlay;

        modal.style.display = 'none';
        overlay.style.display = 'none';
        if (this.modalOutsideUnsub) {
            this.modalOutsideUnsub();
            this.modalOutsideUnsub = null;
        }
    }

    /**
     * @param {string} theme 
     */
    applyTheme(theme) {
        document.body.classList.toggle('dark', theme === 'dark');
        const display = this.getRefs().themeDisplay;
        if (display) display.textContent = theme;
    }

    disconnectedCallback() {
        // Clean up all subscriptions and timers
        this.debouncedSearch?.cancel();
        this.throttledClick?.cancel();
        this.throttledScroll?.cancel();
        this.themeUnsub?.();
        if (this.modalOutsideUnsub) this.modalOutsideUnsub();
    }
}

// Mount the app
const app = new DemoApp();
// @ts-ignore
app.mount(document.getElementById('app'));
