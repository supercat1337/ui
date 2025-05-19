// @ts-check
import { hideElements, showElements, Toggler } from "../utils.js";
import { Component } from "../component/component.js";
import { getHtml } from "./layout.js";
//import { Modal as bsModal } from "bootstrap/dist/js/bootstrap.bundle.js";

import * as bsModal from "bootstrap/js/src/modal.js";

/**
 * @typedef {Object} Refs
 * @property {HTMLHeadingElement} modal_title
 * @property {HTMLButtonElement} close_x_button
 * @property {HTMLDivElement} modal_body
 * @property {HTMLDivElement} section_with_content
 * @property {HTMLDivElement} section_error
 * @property {HTMLSpanElement} error_text
 * @property {HTMLDivElement} section_loading
 * @property {HTMLSpanElement} loading_text
 * @property {HTMLButtonElement} close_button
 * @property {HTMLButtonElement} submit_button
 */

const refsAnnotation = {
    modal_title: HTMLHeadingElement.prototype,
    close_x_button: HTMLButtonElement.prototype,
    modal_body: HTMLDivElement.prototype,
    section_with_content: HTMLDivElement.prototype,
    section_error: HTMLDivElement.prototype,
    error_text: HTMLSpanElement.prototype,
    section_loading: HTMLDivElement.prototype,
    loading_text: HTMLSpanElement.prototype,
    close_button: HTMLButtonElement.prototype,
    submit_button: HTMLButtonElement.prototype,
};

/**
 * Updates the text content of the component's elements.
 * @param {Modal} component - The component to update.
 * @returns {void}
 */
function textUpdater(component) {
    let refs = component.getRefs();
    let textResources = component.$internals.textResources;

    refs.modal_title.textContent = textResources.modal_title_text;
    refs.close_x_button.setAttribute(
        "aria-label",
        textResources.close_x_button_aria_label
    );
    refs.loading_text.textContent = textResources.loading_text_text;
    refs.close_button.textContent = textResources.close_button_text;
    refs.submit_button.textContent = textResources.submit_button_text;
}

let textResources_default = {
    modal_title_text: "Modal name",
    close_x_button_aria_label: "Close",
    loading_text_text: "Loading...",
    close_button_text: "Close",
    submit_button_text: "Add",
};

export class Modal extends Component {
    /**
     * Indicates whether the submit button should be hidden when the content mode is active.
     * @type {boolean}
     * */
    hideSubmitButtonOnContentMode = false;

    constructor() {
        super();
        this.defineSlots("modal_body");
        this.setLayout(getHtml(), refsAnnotation);

        this.$internals.textResources = textResources_default;
        this.setTextUpdateFunction(textUpdater);

        let that = this;

        this.toggler = new Toggler();
        this.toggler.addItem(
            "content",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                if (that.hideSubmitButtonOnContentMode) {
                    hideElements(refs.submit_button);
                } else {
                    showElements(refs.submit_button);
                }
                showElements(refs.section_with_content);
            },
            (key) => {
                if (!that.isConnected) return false;

                let refs = this.getRefs();
                hideElements(refs.section_with_content);
            }
        );

        this.toggler.addItem(
            "error",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                refs.error_text.textContent =
                    this.$internals.textResources.error_text;
                hideElements(refs.submit_button);
                showElements(refs.section_error);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_error);
            }
        );

        this.toggler.addItem(
            "loading",
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                refs.loading_text.textContent =
                    this.$internals.textResources.loading_text;
                hideElements(refs.submit_button);
                showElements(refs.section_loading);
            },
            (key) => {
                if (!that.isConnected) return false;
                let refs = this.getRefs();
                hideElements(refs.section_loading);
            }
        );

        this.toggler.setActive("content");

        this.onConnect(() => {
            that.toggler.runCallbacks();

            let root = /** @type {Element} */ (that.$internals.root);

            // @ts-ignore
            that.$on(root, "hide.bs.modal", () => {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }

                that.$internals.eventEmitter.emit("hide", that);
            });
        });
    }

    /** @returns {{modal_title: HTMLHeadingElement, close_x_button: HTMLButtonElement, modal_body: HTMLDivElement, close_button: HTMLButtonElement, submit_button: HTMLButtonElement, section_with_content: HTMLDivElement, section_error: HTMLDivElement, error_text: HTMLSpanElement, section_loading: HTMLDivElement, loading_text: HTMLSpanElement}} */
    getRefs() {
        return super.getRefs();
    }

    /**
     * Displays the modal if the component is connected to the DOM.
     * Retrieves or creates a modal instance and calls its show method.
     * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
     */
    show(ctx = {}) {
        if (!this.isConnected) return;

        this.toggler.setActive("content");
        this.$internals.eventEmitter.emit("show", this, ctx);

        let modal_element = /** @type {Element} */ (this.$internals.root);
        // @ts-ignore
        let modal = bsModal.default.getOrCreateInstance(modal_element);
        modal.show();
    }

    /**
     * Displays the modal with the loading indicator if the component is connected to the DOM.
     * Retrieves or creates a modal instance, sets its backdrop to static, and calls its show method.
     * Emits the "show" event as well.
     * @param {object} [ctx={}] - An optional context object to be passed to the "show" event.
     */
    showLoading(ctx = {}) {
        if (!this.isConnected) return;

        this.toggler.setActive("loading");
        this.$internals.eventEmitter.emit("show", this, ctx);
        let modal_element = /** @type {Element} */ (this.$internals.root);
        // @ts-ignore
        let modal = bsModal.default.getOrCreateInstance(modal_element);
        modal.show();
    }

    /**
     * Sets the table view to its "content" state.
     * The table view will show its content.
     */
    setContentMode() {
        this.toggler.setActive("content");
    }

    /**
     * Sets the table view to its "loading" state.
     * The table view will display a loading message and activate the loading toggler.
     */
    setLoadingMode() {
        this.toggler.setActive("loading");
    }

    /**
     * Sets the table view to its "error" state.
     * The table view will display an error message and activate the error toggler.
     */
    setErrorMode() {
        this.toggler.setActive("error");
    }

    /**
     * Hides the modal if the component is connected to the DOM.
     * Retrieves or creates a modal instance and calls its hide method.
     */
    hide() {
        if (!this.isConnected) return;

        let modal_element = /** @type {Element} */ (this.$internals.root);
        let close_button = /** @type {HTMLButtonElement} */ (
            modal_element.querySelector('[data-bs-dismiss="modal"]')
        );
        close_button?.click();
    }

    /**
     * Subscribes to the "show" event.
     * This event is emitted whenever the modal is shown.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onShow(callback) {
        return this.$internals.eventEmitter.on("show", callback);
    }

    /**
     * Subscribes to the "hide" event.
     * This event is emitted whenever the modal is hidden.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onHide(callback) {
        return this.$internals.eventEmitter.on("hide", callback);
    }

    /**
     * Subscribes to the "response" event.
     * This event is emitted whenever the modal receives a response.
     * The callback is called with the component instance as the this value and the response as the second argument.
     * @param {(modal: this, response: Object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onResponse(callback) {
        return this.$internals.eventEmitter.on("response", callback);
    }

    /**
     * Emits the "response" event.
     * This event is emitted whenever the modal receives a response.
     * The callback is called with the component instance as the this value and the response as the second argument.
     * @param {Object} response - The response to be emitted.
     */
    emitResponse(response) {
        this.$internals.eventEmitter.emit("response", this, response);
    }

    /**
     * Subscribes to the "submit" event.
     * This event is emitted when the user clicks the submit button.
     * The callback is called with the component instance as the this value.
     * @param {(modal: this, ctx: object) => void} callback - The callback function to be executed when the event is triggered.
     * @returns {()=>void} A function that can be called to unsubscribe the listener.
     */
    onSubmit(callback) {
        return this.$internals.eventEmitter.on("submit", callback);
    }

    /**
     * Emits the "submit" event.
     * This event is emitted when the user clicks the submit button.
     * The callback is called with the component instance as the this value and the context object as the second argument.
     * @param {object} ctx - The context object to be passed to the callback.
     */
    emitSubmit(ctx) {
        this.$internals.eventEmitter.emit("submit", this, ctx);
    }

    /**
     * Sets the title of the modal.
     * @param {string} title - The new title text.
     */
    setTitleText(title) {
        this.$internals.textResources.modal_title_text = title;

        if (!this.isConnected) return;

        let refs = this.getRefs();

        refs.modal_title.textContent = title;
    }

    /**
     * Sets the text of the loading message in the table view.
     * @param {string} text - The text to be shown as the loading message.
     */
    setLoadingText(text) {
        this.$internals.textResources.loading_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.loading_text.textContent = text;
    }

    /**
     * Sets the text of the error message in the table view.
     * @param {string} text - The text to be shown as the error message.
     */
    setErrorText(text) {
        this.$internals.textResources.error_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.error_text.textContent = text;
    }

    /**
     * Sets the text of the submit button.
     * @param {string} text - The text to be shown as the submit button.
     */
    setSubmitButtonText(text) {
        this.$internals.textResources.submit_button_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.submit_button.textContent = text;
    }

    /**
     * Sets the text of the close button.
     * @param {string} text - The text to be shown as the close button.
     */
    setCloseButtonText(text) {
        this.$internals.textResources.close_button_text = text;

        if (!this.isConnected) return;
        let refs = this.getRefs();
        refs.close_button.textContent = text;
    }

    /**
     * Hides the close buttons of the modal.
     * If the component is not connected to the DOM, does nothing.
     */
    hideCloseButtons() {
        if (!this.isConnected) return;
        let refs = this.getRefs();

        refs.close_x_button.setAttribute("aria-hidden", "true");
        refs.close_x_button.style.visibility = "hidden";
        refs.close_button.setAttribute("aria-hidden", "true");
        refs.close_button.style.visibility = "hidden";
    }

    /**
     * Shows the close buttons of the modal.
     * If the component is not connected to the DOM, does nothing.
     */
    showCloseButtons() {
        if (!this.isConnected) return;
        let refs = this.getRefs();

        refs.close_x_button.removeAttribute("aria-hidden");
        refs.close_x_button.style.visibility = "visible";
        refs.close_button.removeAttribute("aria-hidden");
        refs.close_button.style.visibility = "visible";
    }
}
