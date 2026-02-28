// @ts-check
import { Component, html } from '../../dist/ui.bundle.esm.js'; // '@supercat1337/ui';

/**
 * TodoItem Component
 * Represents a single task in the list.
 */
class TodoItem extends Component {
    /** @param {string} text */
    constructor(text) {
        super();
        this.text = text;
    }

    // Dynamic layout based on constructor data
    layout = () => html`
        <li
            class="list-group-item d-flex justify-content-between align-items-center animate-fadeIn"
        >
            <span>${this.text}</span>
            <button class="btn btn-sm btn-outline-danger" data-ref="removeBtn">&times;</button>
        </li>
    `;

    /** @type {Object<string, any>} */
    refsAnnotation = {
        removeBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        // Self-removal: the component removes itself from the DOM and parent slot logic
        this.getRefs().removeBtn.onclick = () => this.unmount();
    }
}

/**
 * TodoApp Component
 * Demonstrates automatic slot management.
 */
class TodoApp extends Component {
    layout = html`
        <div class="card shadow-sm mx-auto" style="width: 26rem;">
            <div class="card-header bg-white py-3">
                <h5 class="mb-0 text-center text-primary">Task Manager</h5>
            </div>
            <div class="card-body">
                <div class="input-group mb-3">
                    <input
                        type="text"
                        class="form-control"
                        data-ref="taskInput"
                        placeholder="New task..."
                    />
                    <button class="btn btn-primary" data-ref="addBtn">Add</button>
                </div>

                <ul class="list-group list-group-flush" data-slot="items-slot"></ul>
            </div>
        </div>
    `;

    /** @type {Object<string, any>} */
    refsAnnotation = {
        taskInput: HTMLInputElement.prototype,
        addBtn: HTMLButtonElement.prototype,
    };

    connectedCallback() {
        const refs = this.getRefs();

        const addTask = () => {
            const val = refs.taskInput.value.trim();
            if (!val) return;

            // Create the child component
            const newItem = new TodoItem(val);

            /**
             * AUTOMATIC MOUNTING:
             * By adding the component to the slot, the library takes care
             * of finding the 'items-slot' in the DOM and mounting the component.
             */
            this.addComponentToSlot('items-slot', newItem);

            // Clear UI
            refs.taskInput.value = '';
            refs.taskInput.focus();
        };

        refs.addBtn.onclick = addTask;

        /**
         * Called when the user presses a key while the input field is focused.
         * If the pressed key is 'Enter', the addTask() function is called.
         * @param {KeyboardEvent} e - The event object of the keydown event.
         */
        refs.taskInput.onkeydown = e => {
            if (e.key === 'Enter') addTask();
        };
    }
}

// --- Bootstrap ---
const app = new TodoApp();
app.mount(document.body);
