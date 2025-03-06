// @ts-check

import  Modal  from "bootstrap/js/src/modal.js";

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
  // @ts-ignore
  let modal = Modal.getOrCreateInstance(modal_element);
  modal.show();
}

/**
 * Returns the current Unix time in seconds.
 * @returns {number}
 */
export function unixtime() {
  return Math.floor((new Date).getTime() / 1000);
}

/**
 * Checks if the user prefers a dark color scheme.
 * Utilizes the `window.matchMedia` API to determine if the user's
 * system is set to a dark mode preference.
 * @returns {boolean} - Returns `true` if the user prefers dark mode, otherwise `false`.
 */
export function isDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
  }

  return false;
}

/**
 * Returns the user's default language, or "en" if none can be determined.
 * @returns {string} The user's default language, in the form of a two-letter
 *   language code (e.g. "en" for English, "fr" for French, etc.).
 */
export function getDefaultLanguage() {
  let m = (navigator.language).match(/^[a-z]+/);
  let lang = m ? m[0] : "en";
  return lang;
}

/**
 * Formats the given number of bytes into a human-readable string.
 *
 * @param {number} bytes - The number of bytes to be formatted.
 * @param {number} [decimals] - The number of decimal places to be used in the formatted string. Defaults to 2.
 * @param {string} [lang] - The language to be used for the size units in the formatted string. Defaults to the user's default language. 
 * @param {Object} [sizes] - An object containing the size units to be used in the formatted string. Defaults to the IEC standard units.
 * @returns {string} A human-readable string representation of the given number of bytes, in the form of a number followed by a unit of measurement (e.g. "3.5 KB", "1.2 GB", etc.).
 */
export function formatBytes(bytes, decimals = 2, lang, sizes) {
  lang = lang || "en";

  sizes = sizes || {
      "en": ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  };

  const get_size = sizes[lang] ? sizes[lang] : sizes["en"];

  if (bytes === 0) {
      return '0 ' + get_size[0];
  }

  let minus_str = bytes < 0 ? "-" : "";
  bytes = Math.abs(bytes);


  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return minus_str + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + get_size[i];
}

/**
 * Copies the given text to the clipboard using the Clipboard API.
 * @param {string} text - The text to be copied to the clipboard.
 * @returns {Promise<void>} A promise that resolves when the text has been successfully copied.
 */
export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

/**
 * Formats the given timestamp into a human-readable string representation of
 * a date and time. The date is formatted according to the user's locale, and
 * the time is formatted according to the user's locale with a 24-hour clock.
 * @param {number} timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date and time.
 */
export function formatDateTime(timestamp) {
  var t = new Date(timestamp * 1000);
  return `${t.toLocaleDateString('en-GB')} ${t.toLocaleTimeString('en-GB')}`;
}


/**
 * Formats the given timestamp into a human-readable string representation of
 * a date. The date is formatted according to the user's locale.
 * @param {number} timestamp - The timestamp to be formatted, in seconds since the Unix epoch.
 * @returns {string} A human-readable string representation of the given timestamp, in the form of a date.
 */
export function formatDate(timestamp) {
  var t = new Date(timestamp * 1000);
  return `${t.toLocaleDateString('en-GB')}`;
}