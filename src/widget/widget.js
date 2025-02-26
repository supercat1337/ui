// @ts-check
import { Component } from "../component/component.js";

export class Widget extends Component {

    /** @type {typeof this.refsAnnotation} */
    refs

    refsAnnotation = {
        section_with_content: HTMLElement.prototype,
        section_without_content: HTMLElement.prototype,
        section_error: HTMLElement.prototype,
        section_loading: HTMLElement.prototype,
        error_text: HTMLElement.prototype,
        loading_text: HTMLElement.prototype,
        no_content_text: HTMLElement.prototype
    };

    /** @type {"content"|"no_content"|"error"|"loading"} */
    #status = "loading"

    constructor() {
        super();
        this.on("connect", () => {
            this.setStatus(this.#status);
        });
    }

    /**
     * Sets the status of the table view.
     * @param {"content"|"no_content"|"error"|"loading"} status - the new status of the table view
     * @param {string} [text] - the text to be shown in the table view when the status is "error"
     */
    setStatus(status, text) {
        this.#status = status;
        if (!this.isConnected()) return;

        switch (this.#status) {
            case "content":

                this.refs.section_with_content.classList.toggle("d-none", false);
                this.refs.section_without_content.classList.toggle("d-none", true);
                this.refs.section_error.classList.toggle("d-none", true);
                this.refs.section_loading.classList.toggle("d-none", true);
                break;
            case "no_content":
                if (typeof text == "string") {
                    this.refs.no_content_text.innerText = text;
                }

                this.refs.section_with_content.classList.toggle("d-none", true);
                this.refs.section_without_content.classList.toggle("d-none", false);
                this.refs.section_error.classList.toggle("d-none", true);
                this.refs.section_loading.classList.toggle("d-none", true);
                break;
            case "error":
                if (typeof text == "string") {
                    this.refs.error_text.innerText = text;
                }

                this.refs.section_with_content.classList.toggle("d-none", true);
                this.refs.section_without_content.classList.toggle("d-none", true);
                this.refs.section_error.classList.toggle("d-none", false);
                this.refs.section_loading.classList.toggle("d-none", true);
                break;
            case "loading":
                if (typeof text == "string") {
                    this.refs.loading_text.innerText = text;
                }

                this.refs.section_with_content.classList.toggle("d-none", true);
                this.refs.section_without_content.classList.toggle("d-none", true);
                this.refs.section_error.classList.toggle("d-none", true);
                this.refs.section_loading.classList.toggle("d-none", false);
                break;
        }
    }

}