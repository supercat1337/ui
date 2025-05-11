// @ts-check

import { EventEmitter } from "@supercat1337/event-emitter";
import { selectRefs } from "dom-scope";

export class Component {
    /**
     * Property that holds the layout function of the component.
     * @type {(this:ThisType)=>string|Node}
     */
    layout;

    /**
     * Emits an event with the given arguments.
     * @param {string} event - The name of the event to emit.
     * @param {...any} data - The arguments to be passed to the event handlers.
     */
    emit(event, ...data) {
        // @ts-ignore
        if (!this.eventEmitter) this["event" + "Emitter"] = new EventEmitter();

        // @ts-ignore
        this.eventEmitter.emit(event, ...data);
    }

    /**
     * Subscribes to an event.
     * @param {string} event - The name of the event to subscribe to.
     * @param {Function} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    on(event, callback) {
        // @ts-ignore
        if (!this.eventEmitter) this["event" + "Emitter"] = new EventEmitter();

        // @ts-ignore
        return this.eventEmitter.on(event, callback);
    }

    /**
     * Sets the root element of the component.
     * @param {HTMLElement} root_element - The root element to set.
     */
    setRoot(root_element) {
        this["root_" + "element"] = root_element;
    }

    /**
     * Connects the component to the specified root_element element.
     * @param {HTMLElement} [root_element] - The root_element element to connect the component to.
     * @throws {Error} If the root element is not set.
     */
    connect(root_element) {
        if (root_element) {
            this.setRoot(root_element);
        }

        // @ts-ignore
        if (!this.root_element) {
            throw new Error("Root element is not set");
        }

        // @ts-ignore
        this["re" + "fs"] = selectRefs(this.root_element, this.refsAnnotation);

        // @ts-ignore
        if (!this.refs) {
            throw new Error("Failed to connect DOM");
        }

        this.emit("refsConnected");

        this.emit("connect");
    }

    /**
     * Sets the layout of the component.
     * @param {(component: this) => string|Node} layout - The layout string to be used for the component.
     * The layout string will be called with the component instance as the this value.
     */
    setLayout(layout) {
        let that = this;
        this.layout = () => {
            return layout(that);
        };
    }

    /**
     * Renders the layout of the component.
     * This method is called when the component should re-render its layout.
     * @param {HTMLElement} [root_element] - The root element to render the layout in.
     * @throws {Error} If the root element is not set.
     */
    renderLayout(root_element) {
        if (root_element) {
            this.setRoot(root_element);
        }

        // @ts-ignore
        if (!this.root_element) {
            throw new Error("Root element is not set");
        }
        // @ts-ignore
        this.root_element.innerHTML = "";
        let layout = this.layout();

        if (typeof layout == "string") {
            // @ts-ignore
            this.root_element.innerHTML = layout;
        } else if (layout instanceof Node) {
            // @ts-ignore
            this.root_element.appendChild(layout);
        }

        // connect to DOM

        // @ts-ignore
        this["re" + "fs"] = selectRefs(this.root_element, this.refsAnnotation);
        this.emit("refsConnected");

        this.emit("renderLayout");

        this.emit("connect");
    }

    /**
     * Checks if the data view is connected to a root element.
     * @returns {boolean} True if the data view is connected, false otherwise.
     */
    isConnected() {
        // @ts-ignore
        return !!this.root_element && !!this.refs;
    }
}
