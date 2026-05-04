/**
 * Internal storage for counters associated with each prefix.
 * @type {Map<string, number>}
 */
const counterMap = new Map();

/**
 * Generates a unique ID with the specified prefix using an auto-incrementing counter.
 * The counter is maintained per prefix, ensuring uniqueness for each prefix independently.
 * Ideal for creating IDs for HTML elements (e.g., `btn-1`, `modal-2`).
 *
 * @param {string} prefix - The prefix for the generated ID. Should be a valid HTML ID prefix.
 * @returns {string} A unique ID string in the format `${prefix}-${counter}`.
 *
 * @example
 * generateId('btn'); // "btn-1"
 * generateId('btn'); // "btn-2"
 * generateId('modal'); // "modal-1"
 */
export function generateId(prefix = "el") {
  // Retrieve the current counter for the given prefix, default to 0
  const currentCount = counterMap.get(prefix) ?? 0;
  const nextCount = currentCount + 1;

  // Store the updated counter
  counterMap.set(prefix, nextCount);

  // Return the combined ID
  return `${prefix}-${nextCount}`;
}

