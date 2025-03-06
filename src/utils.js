// @ts-check

import { Modal } from "node_modules/bootstrap/dist/js/bootstrap.bundle.js";

/**
 * Executes the provided callback function when the DOM is fully loaded.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it is added as a listener to the 'DOMContentLoaded' event.
 * @param {() => void} callback - The function to be executed when the DOM is ready.
 */
export function DOMReady(callback) {
  document.readyState === "interactive" || document.readyState === "complete"
    ? callback()
    : document.addEventListener("DOMContentLoaded", callback);
}

/**
 * Escapes the given string from HTML interpolation.
 * Replaces the characters &, <, ", and ' with their corresponding HTML entities.
 * @param {string} unsafe - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHtml(unsafe) {
  return unsafe.replace(
    /[&<"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        '"': "&quot;",
        "'": "&#39;", // ' -> &apos; for XML only
      }[m])
  );
}

/**
 * Sets the status of the button to "waiting" (i.e. disabled and showing a spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button while it is waiting.
 */
export function ui_button_status_waiting_on(el, text) {
  el.disabled = true;
  el.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' +
    escapeHtml(text);
}

/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner).
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} text - The text to be shown in the button.
 */
export function ui_button_status_waiting_off(el, text) {
  el.disabled = false;
  el.innerText = text;
}

/**
 * Sets the status of the button back to "enabled" (i.e. not disabled and without spinner)
 * and sets its innerHTML to the given HTML string.
 * @param {HTMLButtonElement} el - The button element to set the status for.
 * @param {string} html - The HTML string to be set as the button's innerHTML.
 */
export function ui_button_status_waiting_off_html(el, html) {
  el.disabled = false;
  el.innerHTML = html;
}

/**
 * Scrolls the specified element to the top.
 * Sets the scrollTop property to 0, effectively
 * scrolling to the top of the content.
 * @param {HTMLElement} element - The element to scroll to the top.
 */
export function scrollToTop(element) {
  element.scrollTop = 0;
}

/**
 * Scrolls the specified element to the bottom.
 * Sets the scrollTop property to the element's scrollHeight,
 * effectively scrolling to the bottom of the content.
 * @param {HTMLElement} element - The element to scroll to the bottom.
 */
export function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

/**
 * Adds the "d-none" class to the given elements, hiding them from view.
 * @param {...HTMLElement} elements - The elements to hide.
 */
export function hideElements(...elements) {
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    element.classList.add("d-none");
  }
}

/**
 * Removes the "d-none" class from the given elements, making them visible.
 * @param {...HTMLElement} elements - The elements to show.
 */
export function showElements(...elements) {
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    element.classList.remove("d-none");
  }
}

/**
 * Adds a spinner to the button (if it doesn't already have one).
 * The spinner is prepended to the button's contents.
 * @param {HTMLButtonElement} button - The button to add the spinner to.
 * @param {string} [customClassName] - The class name to use for the spinner.
 *                                      If not provided, 'spinner-border spinner-border-sm' is used.
 */
export function showSpinnerInButton(button, customClassName = null) {
  if (button.getElementsByClassName("spinner-border")[0]) return;

  let spinner = document.createElement("span");

  if (customClassName) {
    spinner.className = customClassName;
  } else {
    spinner.className = "spinner-border spinner-border-sm";
  }

  button.prepend(spinner);
}

/**
 * Removes the spinner from the given button.
 * @param {HTMLButtonElement} button - The button which should have its spinner removed.
 */
export function removeSpinnerFromButton(button) {
  let spinner = button.querySelector(".spinner-border");
  if (spinner) spinner.remove();
}

/**
 * Hides the given modal element.
 * @param {Element} modal_element - The modal element to hide.
 */
export function hideModal(modal_element) {
  /*
  let modal = Modal.getOrCreateInstance(modal_element);
  modal.hide();
  let modal_backdrop = document.querySelector(".modal-backdrop");
  if (modal_backdrop) {
      modal_backdrop.classList.remove("show");

      setTimeout(() => {
          modal_backdrop.remove();
      }, 500);
  }*/

  let close_button = /** @type {HTMLButtonElement} */ (
    modal_element.querySelector('[data-bs-dismiss="modal"]')
  );
  close_button?.click();
}

/**
 * Displays the given modal element by creating or retrieving its instance
 * and calling the show method on it.
 * @param {Element} modal_element - The modal element to be displayed.
 */
export function showModal(modal_element) {
  let modal = Modal.getOrCreateInstance(modal_element);
  modal.show();
}
