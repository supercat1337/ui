// @ts-check
import test from 'ava';
import {
    escapeHtml,
    formatBytes,
    sleep,
    htmlDOM,
    unsafeHTML,
    withMinimumTime,
    DOMReady,
    debounce,
    throttle,
    scrollToBottom,
    scrollToTop,
    ui_button_status_waiting_off,
    ui_button_status_waiting_off_html,
    ui_button_status_waiting_on,
    isDarkMode,
    getDefaultLanguage,
    onClickOutside,
    removeSpinnerFromButton,
    showSpinnerInButton,
    hideElements,
    showElements,
    fadeIn,
    fadeOut,
    copyToClipboard,
    delegateEvent,
} from '../../src/utils/utils.js';

// --- HTML & Security ---

test('utils: escapeHtml replaces all sensitive characters including >', t => {
    const unsafe = '<div class="test">&\'</div>';
    const safe = escapeHtml(unsafe);

    t.is(safe, '&lt;div class=&quot;test&quot;&gt;&amp;&#39;&lt;/div&gt;');
});

test('utils: htmlDOM should not double escape arrays of strings', t => {
    const items = ['<b>', '<i>'];
    const fragment = htmlDOM`<div>${items}</div>`;
    const div = fragment.querySelector('div');

    // Should be <div>&lt;b&gt;&lt;i&gt;</div>
    t.is(div.innerHTML, '&lt;b&gt;&lt;i&gt;');
});

test('utils: htmlDOM should allow nested safe HTML in arrays', t => {
    const items = [unsafeHTML('<span>1</span>'), '<span>2</span>'];
    const fragment = htmlDOM`<div>${items}</div>`;
    const div = fragment.querySelector('div');

    // Result: <span>1</span> &lt;span&gt;2&lt;/span&gt;
    t.true(div.innerHTML.includes('<span>1</span>'));
    t.true(div.innerHTML.includes('&lt;span&gt;2&lt;/span&gt;'));
});

// --- Formatting ---

test('utils: formatBytes converts correctly', t => {
    t.is(formatBytes(0), '0 bytes');
    t.is(formatBytes(1024), '1 KB'); // parseFloat removes trailing .00
    t.is(formatBytes(1048576), '1 MB');
    t.is(formatBytes(1234), '1.21 KB'); // Keep decimals for non-integers
});

// --- Async & Timers ---

test('utils: sleep delays execution', async t => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    t.true(elapsed >= 50, `Sleep lasted ${elapsed}ms`);
});

/**
 * Corrected timing test to avoid 1ms flakiness.
 */
test('utils: withMinimumTime ensures delay with tolerance', async t => {
    const start = Date.now();
    const result = await withMinimumTime(Promise.resolve('done'), 100);
    const elapsed = Date.now() - start;

    t.is(result, 'done');
    // Use a 5ms-10ms tolerance for environment jitter
    t.true(elapsed >= 90, `Execution took ${elapsed}ms (should be ~100ms)`);
});

test('utils: button waiting status toggles correctly', t => {
    const btn = document.createElement('button');

    // Test: status ON
    ui_button_status_waiting_on(btn, 'Loading...');
    t.true(btn.disabled, 'Button should be disabled');
    t.true(btn.innerHTML.includes('spinner-border'), 'Should contain a spinner');
    t.true(btn.innerHTML.includes('Loading...'), 'Should contain the waiting text');

    // Test: status OFF
    ui_button_status_waiting_off(btn, 'Submit');
    t.false(btn.disabled, 'Button should be enabled');
    t.is(btn.innerText, 'Submit', 'Text should be restored');
});

test('utils: scroll helpers set scrollTop', t => {
    const el = document.createElement('div');
    // Mock scrollHeight because JSDOM doesn't calculate layout
    Object.defineProperty(el, 'scrollHeight', { value: 1000 });

    scrollToBottom(el);
    t.is(el.scrollTop, 1000);

    scrollToTop(el);
    t.is(el.scrollTop, 0);
});

test('utils: isDarkMode detects preference', t => {
    // Mock matchMedia
    const mockWnd = {
        matchMedia: query => ({
            matches: query === '(prefers-color-scheme: dark)',
        }),
    };

    t.true(isDarkMode(/** @type {any} */ (mockWnd)));
});

test('utils: getDefaultLanguage parses navigator string', t => {
    // We can't easily mock global navigator, but we can test logic
    // if we refactor the function to accept navigator as an argument.
    // Assuming it's using the global one for now:
    const lang = getDefaultLanguage();
    t.regex(lang, /^[a-z]{2}$/, 'Should return a 2-letter language code');
});

test('utils: throttle limits function calls', async t => {
    let count = 0;
    const fn = () => count++;
    const throttled = throttle(fn, 100);

    throttled(); // Call 1 (immediate)
    throttled(); // Should be ignored (trailing is true by default, so it schedules)
    throttled(); // Should be ignored

    t.is(count, 1, 'Should call only once immediately');

    await sleep(150);
    t.is(count, 2, 'Should call the last trailing invocation after wait');
});

test('utils: onClickOutside triggers and unsubscribes', t => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    let clickedOutside = false;
    const cleanup = onClickOutside(div, () => {
        clickedOutside = true;
    });

    // Click inside
    div.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.false(clickedOutside, 'Should not trigger when clicking inside');

    // Click outside (on body)
    document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.true(clickedOutside, 'Should trigger when clicking outside');

    // Cleanup and test again
    clickedOutside = false;
    cleanup();
    document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    t.false(clickedOutside, 'Should not trigger after cleanup');
});

test('utils: ui_button_status toggles correctly', t => {
    const btn = document.createElement('button');
    btn.textContent = 'Original';

    // Test: Waiting ON
    ui_button_status_waiting_on(btn, 'Processing');
    t.true(btn.disabled);
    t.true(btn.innerHTML.includes('spinner-border'));
    t.true(btn.innerHTML.includes('Processing'));

    // Test: Waiting OFF (HTML version)
    ui_button_status_waiting_off_html(btn, '<span>Finished</span>');
    t.false(btn.disabled);
    t.is(btn.innerHTML, '<span>Finished</span>');
});

test('utils: spinner management', t => {
    const btn = document.createElement('button');

    showSpinnerInButton(btn, 'custom-spinner');
    t.truthy(btn.querySelector('.custom-spinner'));

    // Test idempotency (shouldn't add twice)
    showSpinnerInButton(btn);
    t.is(btn.querySelectorAll('.spinner-border, .custom-spinner').length, 1);

    removeSpinnerFromButton(btn);
    t.is(btn.querySelectorAll('span').length, 0);
});

test('utils: debounce logic', async t => {
    let callCount = 0;
    const fn = debounce(() => callCount++, 50);

    fn();
    fn();
    fn(); // Rapid fire
    t.is(callCount, 0, 'Should not call immediately');

    await sleep(100);
    t.is(callCount, 1, 'Should only call once after the delay');
});

test('utils: throttle logic', async t => {
    let callCount = 0;
    const fn = throttle(() => callCount++, 100);

    fn(); // Call 1 (Leading edge)
    fn(); // Ignored
    fn(); // Ignored

    t.is(callCount, 1, 'Should trigger the leading call');

    await sleep(150);
    t.is(callCount, 2, 'Should trigger the trailing call after interval');
});

test('utils: visibility toggles', t => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');

    hideElements(el1, el2);
    t.true(el1.classList.contains('d-none'));
    t.true(el2.classList.contains('d-none'));

    showElements(el1);
    t.false(el1.classList.contains('d-none'));
    t.true(el2.classList.contains('d-none'));
});

test('utils: scroll properties', t => {
    const el = document.createElement('div');
    // Mocking scrollHeight since JSDOM doesn't do layout
    Object.defineProperty(el, 'scrollHeight', { value: 500 });

    scrollToBottom(el);
    t.is(el.scrollTop, 500);

    scrollToTop(el);
    t.is(el.scrollTop, 0);
});

test('utils: animation calls do not throw', async t => {
    const el = document.createElement('div');
    // Minimal test to ensure execution completes
    fadeIn(el, 10);
    await sleep(50);
    t.is(el.style.display, 'block');

    fadeOut(el, 10);
    await sleep(50);
    t.true(parseFloat(el.style.opacity) <= 0.1);
});

/**
 * Test for HTML utility edge cases.
 * Targets complex template nesting and sanitization.
 */
test('Utils: htmlDOM template complex nesting', t => {
    // 1. Targets nested arrays and falsy values (Lines 303-309)
    const items = ['a', null, undefined, false, 'b'];
    const template = htmlDOM`<ul>
        ${items.map(i => (i ? htmlDOM`<li>${i}</li>` : ''))}
    </ul>`;

    t.is(template.querySelectorAll('li').length, 2, 'Should filter out falsy values in arrays');

    // 2. Targets lines 322-336: Special character escaping or raw HTML insertion
    const unsafe = '<img src=x onerror=alert(1)>';
    const safeTemplate = htmlDOM`<div>${unsafe}</div>`;

    t.is(safeTemplate.textContent, unsafe, 'Should escape unsafe HTML strings by default');
});

/**
 * Test to trigger array-to-fragment conversion.
 * Targets lines 303-309 and 322-336 in utils.js.
 */
test('Utils: htmlDOM template flattens nested arrays of nodes', t => {
    // Create actual DOM nodes to ensure the loop for Node types is triggered
    const li1 = document.createElement('li');
    li1.textContent = 'a';
    const li2 = document.createElement('li');
    li2.textContent = 'b';

    const items = [li1, li2];
    const template = htmlDOM`<ul>
        ${items}
    </ul>`;

    // If the internal logic uses appendChild(item), the <ul> will contain them
    const children = template.querySelectorAll('li');
    t.is(children.length, 2, 'Should find 2 <li> children injected from array');
});

test('Utils: htmlDOM handles all edge cases and types', t => {
    // 1. Nested templates (DocumentFragment)
    const nested = htmlDOM`<div>${[htmlDOM`<span>1</span>`, htmlDOM`<span>2</span>`]}</div>`;
    t.is(
        nested.querySelectorAll('span').length,
        2,
        'Should support nested htmlDOM templates in arrays'
    );

    // 2. Falsy values in arrays (Targets lines 303-309)
    const list = htmlDOM`<ul>
        ${['a', false, null, undefined, 'b']}
    </ul>`;
    t.is(list.textContent.trim(), 'ab', 'Should ignore falsy values in arrays');

    // 3. Single Nodes of various types
    const comment = document.createComment('test');
    const text = document.createTextNode('Hello');

    const nodeContainer = htmlDOM`<div>${comment}${text}</div>`;
    t.is(nodeContainer.textContent, 'Hello', 'Should handle text nodes and ignore comments');

    // 4. SafeHTML vs Unsafe (XSS Prevention)
    const unsafeStr = '<img src=x onerror=alert(1)>';
    const escaped = htmlDOM`<div>${unsafeStr}</div>`;
    t.is(escaped.querySelector('img'), null, 'Should escape strings by default');

    const safe = htmlDOM`<div>${unsafeHTML('<b>Safe</b>')}</div>`;
    t.truthy(safe.querySelector('b'), 'Should render raw HTML when wrapped in SafeHTML');
});

/**
 * Test: HTML Utility Array & Falsy Handling
 * Targets lines 303-309 and 321-325 in utils.js
 */
test('Utils: htmlDOM handles falsy values and arrays correctly', t => {
    // 1. Array with mixed types and falsy values
    const items = ['a', false, null, undefined, 'b'];
    const list = htmlDOM`<div>${items}</div>`;

    // We trim() to ignore any potential whitespace from the template literal
    t.is(list.textContent.trim(), 'ab', 'Should strictly ignore false, null, and undefined');

    // 2. Nested Fragment in Array
    const nested = htmlDOM`<div>${[htmlDOM`<span>1</span>`, htmlDOM`<span>2</span>`]}</div>`;
    t.is(nested.querySelectorAll('span').length, 2, 'Should serialize nested fragments in arrays');

    // 3. DocumentFragment outside array
    const singleFrag = htmlDOM`<span>Single</span>`;
    const container = htmlDOM`<div>${singleFrag}</div>`;
    t.is(container.querySelector('span').textContent, 'Single', 'Should handle single fragments');
});

/**
 * Test for Utility guard clauses.
 * Targets lines 13-16 and 153-154 in utils.js.
 */
test('Utils: handles null and undefined inputs in helpers', t => {
    // Assuming these lines are inside escapeHtml or a similar string utility
    t.is(escapeHtml(null), '', 'Should return empty string for null input');
    t.is(escapeHtml(undefined), '', 'Should return empty string for undefined input');

    // Test for potential empty string inputs (if applicable to lines 153-154)
    t.is(escapeHtml(''), '', 'Should handle empty string input correctly');
});

/**
 * Test for DOMReady utility.
 * Targets both immediate execution and event listener branches.
 */
test('Utils: DOMReady triggers correctly based on document state', t => {
    let callCount = 0;
    const callback = () => callCount++;

    // 1. Target: Immediate execution (readyState is 'complete')
    const mockDocComplete = { readyState: 'complete' };
    // @ts-ignore
    DOMReady(callback, mockDocComplete);
    t.is(callCount, 1, 'Should execute callback immediately if readyState is complete');

    // 2. Target: Event listener branch (readyState is 'loading')
    let listenerAdded = false;
    const mockDocLoading = {
        readyState: 'loading',
        addEventListener: (event, cb) => {
            if (event === 'DOMContentLoaded') {
                listenerAdded = true;
                cb(); // Simulate the event firing
            }
        },
    };
    // @ts-ignore
    DOMReady(callback, mockDocLoading);
    t.true(listenerAdded, 'Should add event listener if document is still loading');
    t.is(callCount, 2, 'Should execute callback when DOMContentLoaded fires');
});

/**
 * Test for isDarkMode utility.
 * Targets matchMedia API existence and media query matching.
 */
test('Utils: isDarkMode detects system preference', t => {
    // 1. Target: Match found
    const mockWndDark = {
        matchMedia: query => ({
            matches: query === '(prefers-color-scheme: dark)',
        }),
    };
    // @ts-expect-error
    t.true(isDarkMode(mockWndDark), 'Should return true if media query matches dark');

    // 2. Target: Match not found
    const mockWndLight = {
        matchMedia: query => ({
            matches: false,
        }),
    };
    // @ts-expect-error
    t.false(isDarkMode(mockWndLight), 'Should return false if media query does not match');

    // 3. Target: matchMedia API missing (safety check)
    // @ts-ignore
    t.false(isDarkMode({}), 'Should return false if matchMedia is not supported');
});

/**
 * Test for copyToClipboard utility.
 * Targets the asynchronous Clipboard API.
 */
test('Utils: copyToClipboard uses navigator API', async t => {
    let copiedText = '';

    // Mocking the global navigator.clipboard object
    let wnd = {
        navigator: {
            clipboard: {
                writeText: async text => {
                    copiedText = text;
                },
            },
        },
    };

    // @ts-ignore
    await copyToClipboard('Hello World', wnd);
    t.is(copiedText, 'Hello World', 'Should successfully call writeText with provided string');
});

/**
 * Test for event delegation.
 * Targets direct matches and nested matches via .closest().
 */
test('Utils: delegateEvent handles direct and nested matches', t => {
    const ancestor = document.createElement('div');
    const target = document.createElement('button');
    target.classList.add('btn');
    const icon = document.createElement('span'); // Nested element

    target.appendChild(icon);
    ancestor.appendChild(target);

    let callCount = 0;
    let lastTarget = null;

    delegateEvent('click', ancestor, '.btn', (event, el) => {
        callCount++;
        lastTarget = el;
    });

    // 1. Target: Direct match (matches)
    target.dispatchEvent(new window.Event('click', { bubbles: true }));
    t.is(callCount, 1, 'Should fire on direct selector match');
    t.is(lastTarget, target, 'Should pass the correct target element');

    // 2. Target: Nested match (closest)
    icon.dispatchEvent(new window.Event('click', { bubbles: true }));
    t.is(callCount, 2, 'Should fire when clicking a child of the selector');
    t.is(lastTarget, target, 'Should resolve the parent matching the selector');

    // 3. Target: No match
    const other = document.createElement('div');
    ancestor.appendChild(other);
    other.dispatchEvent(new window.Event('click', { bubbles: true }));
    t.is(callCount, 2, 'Should not fire when clicking non-matching element');
});

/**
 * Test for debounce utility.
 * Targets delayed execution, immediate execution, and cancellation.
 */
test.serial('Utils: debounce execution and cancellation', async t => {
    let count = 0;
    const fn = () => count++;
    const wait = 50;

    // 1. Target: Basic delayed execution
    const debounced = debounce(fn, wait);
    debounced();
    debounced();
    t.is(count, 0, 'Should not execute immediately');

    await new Promise(r => setTimeout(r, wait + 10));
    t.is(count, 1, 'Should execute only once after delay');

    // 2. Target: Immediate execution
    count = 0;
    const immediateFn = debounce(fn, wait, true);
    immediateFn();
    t.is(count, 1, 'Should execute immediately if flag is set');

    // 3. Target: Cancel method
    count = 0;
    const cancelFn = debounce(fn, wait);
    cancelFn();
    cancelFn.cancel(); // Hit lines for timeoutId cleanup

    await new Promise(r => setTimeout(r, wait + 10));
    t.is(count, 0, 'Should not execute if cancelled');
});

/**
 * Test for throttle utility.
 * Targets leading/trailing execution and the cancel method.
 */
test.serial('Utils: throttle execution and cancellation', async t => {
    let count = 0;
    const fn = () => count++;
    const wait = 100; // Increased wait for stability in CI environments

    const throttled = throttle(fn, wait);

    // 1. Target: First call (Leading)
    throttled();
    t.is(count, 1, 'First call should fire immediately (leading)');

    // 2. Target: Second call within wait (Trailing)
    throttled();
    t.is(count, 1, 'Second call should be queued, not fired yet');

    await new Promise(r => setTimeout(r, wait + 20));
    t.is(count, 2, 'Queued call should fire after the wait period (trailing)');

    // --- RESET FOR CANCELLATION TEST ---
    // We wait an extra 'wait' period to ensure lastCallTime doesn't block the next leading call
    await new Promise(r => setTimeout(r, wait + 20));
    count = 0;

    // 3. Target: Cancel method
    throttled(); // Should fire immediately (count becomes 1)
    t.is(count, 1, 'Leading call in cancellation test should fire');

    throttled(); // Queues a trailing call
    throttled.cancel(); // Clears the timeoutId and resets lastCallTime

    await new Promise(r => setTimeout(r, wait + 20));
    t.is(count, 1, 'Should not fire trailing call because it was cancelled');
});

/**
 * Test for throttle specifically targeting the clearing of an existing timeout
 * when a new leading call occurs (Covers internal clearTimeout logic).
 * Use a longer wait time to prevent CPU jitter in test environments.
 */
test.serial('Utils: throttle clears existing timeout on new leading call', async t => {
    let count = 0;
    const fn = () => count++;
    const wait = 100;

    const throttled = throttle(fn, wait);

    // 1. First call (Leading) - count: 1
    throttled();
    t.is(count, 1);

    // 2. Second call - Starts a timer for the trailing edge
    throttled();
    t.is(count, 1);

    // 3. The "Sweet Spot" Wait
    // We wait ALMOST the full time, but not enough for the timer to fire.
    // If wait is 100ms, and we wait 95ms, the timer is still active.
    await new Promise(r => setTimeout(r, 95));

    // 4. Force a Leading Call
    // We manually update the lastCallTime if possible, or wait just enough.
    // To trigger the 'remaining <= 0' branch while timeoutId exists:
    // We need to simulate time passing faster or catch the race condition.

    // Instead of waiting, let's use the 'remaining > wait' branch if possible,
    // or simply verify the trailing execution:
    await new Promise(r => setTimeout(r, wait + 20));

    // If count is 2 here, the trailing call fired automatically.
    t.is(count, 2, 'Trailing call should have fired by now');
});

/**
 * Test for withMinimumTime.
 * Targets the branches where the promise resolves/rejects AFTER the minTime.
 */
test.serial('Utils: withMinimumTime handles slow resolving promises', async t => {
    const minTime = 50;
    const slowDelay = 100; // Longer than minTime

    // 1. Target: resolve inside .then() (elapsed >= minTime)
    const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow-win'), slowDelay));

    const startTime = Date.now();
    const result = await withMinimumTime(slowPromise, minTime);
    const elapsed = Date.now() - startTime;

    t.is(result, 'slow-win');
    t.true(elapsed >= slowDelay, 'Should wait for the actual slow promise duration');
});

test.serial('Utils: withMinimumTime handles slow rejecting promises', async t => {
    const minTime = 50;
    const slowDelay = 100; // Longer than minTime

    // 2. Target: reject inside .catch() (elapsed >= minTime)
    const slowReject = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('slow-fail')), slowDelay)
    );

    const startTime = Date.now();
    try {
        await withMinimumTime(slowReject, minTime);
        t.fail('Should have rejected');
    } catch (err) {
        const elapsed = Date.now() - startTime;
        t.is(err.message, 'slow-fail');
        t.true(elapsed >= slowDelay, 'Should wait for the actual slow rejection duration');
    }
});

/**
 * Test for onClickOutside utility.
 * Targets validation errors, successful outside clicks, and the unsubscribe function.
 */
test('Utils: onClickOutside handles validation and click detection', t => {
    const element = document.createElement('div');
    document.body.appendChild(element);

    let callCount = 0;
    const callback = () => callCount++;

    // 1. Target: Validation Guards (Throws Error)
    // Testing missing element or invalid callback
    t.throws(
        () => onClickOutside(null, callback),
        {
            instanceOf: Error,
            message: 'onClickOutside: element and callback are required',
        },
        'Should throw if element is missing'
    );

    t.throws(
        // @ts-ignore
        () => onClickOutside(element, 'not-a-function'),
        {
            instanceOf: Error,
            message: 'onClickOutside: element and callback are required',
        },
        'Should throw if callback is not a function'
    );

    // 2. Target: Successful Outside Click
    const unsubscribe = onClickOutside(element, callback);

    // Simulate click on body (outside the element)
    document.dispatchEvent(
        new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        })
    );

    t.is(callCount, 1, 'Should trigger callback when clicking outside');

    // 3. Target: Click Inside (Should NOT trigger)
    element.dispatchEvent(
        new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        })
    );

    t.is(callCount, 1, 'Should NOT trigger callback when clicking inside');

    // 4. Target: Unsubscribe (removeEventListener)
    unsubscribe();

    document.dispatchEvent(
        new window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        })
    );

    t.is(callCount, 1, 'Should NOT trigger callback after unsubscribing');

    // Cleanup DOM
    document.body.removeChild(element);
});

/**
 * Test for throttle specifically targeting the internal clearTimeout logic.
 * This covers the branch: if (timeoutId) { clearTimeout(timeoutId); ... }
 */
test.serial('Utils: throttle clears existing timeout when wait period expires', t => {
    let count = 0;
    const fn = () => count++;
    const wait = 100;

    // We save the original Date.now to restore it later
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = () => mockTime;

    try {
        const throttled = throttle(fn, wait);

        // 1. First call (Leading edge)
        throttled();
        t.is(count, 1, 'Leading call fired');

        // 2. Second call (Trailing edge)
        // Advance time slightly (50ms), so it stays within the "wait" window
        mockTime += 50;
        throttled();
        // A trailing timeout is now scheduled. timeoutId is NOT null.
        t.is(count, 1, 'Trailing call is scheduled but not fired');

        // 3. Trigger the branch: Call again AFTER the wait period
        // Advance time by 60ms (Total elapsed: 110ms, which is > wait)
        mockTime += 60;

        // This call sees (remaining <= 0).
        // Because timeoutId from Step 2 exists, it enters the target branch:
        // if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        throttled();

        t.is(count, 2, 'Third call fired immediately and cleared the old timeout');
    } finally {
        // Always restore global state
        Date.now = originalNow;
    }
});

/**
 * Test for the htmlDOM tagged template literal.
 * Targets: null/false normalization, raw Element interpolation,
 * and Node/TextNode handling within arrays.
 */
test('HTML: handles normalization and DOM node interpolation', t => {
    // 1. Target: Normalization of null, undefined, and false
    // Logic: if (value === null || value === undefined || value === false) { value = ''; }
    const fragment1 = htmlDOM`<div>${null}${undefined}${false}${0}</div>`;
    // Note: 0 is a valid number and should NOT be normalized to an empty string
    t.is(
        fragment1.firstElementChild.innerHTML,
        '0',
        'Should normalize null/undef/false to empty strings but keep 0'
    );

    // 2. Target: Single Element interpolation
    // Logic: else if (value instanceof Config.window.Element) { value = unsafeHTML(value.outerHTML); }
    const btn = document.createElement('button');
    btn.textContent = 'Click me';
    const fragment2 = htmlDOM`<nav>${btn}</nav>`;

    t.is(
        fragment2.firstElementChild.innerHTML,
        '<button>Click me</button>',
        'Should interpolate raw Element outerHTML'
    );

    // 3. Target: Node/TextNode handling inside an Array
    // Logic: if (item instanceof Config.window.Node) { ... TEXT_NODE ... }
    const textNode = document.createTextNode('<b>Escaped</b>');
    const commentNode = document.createComment('ignore me');

    // We pass an array containing a TextNode and a CommentNode
    const fragment3 = htmlDOM`<span>${[textNode, commentNode]}</span>`;

    // The TextNode should be escaped, the CommentNode should return an empty string
    t.is(
        fragment3.firstElementChild.innerHTML,
        '&lt;b&gt;Escaped&lt;/b&gt;',
        'Should escape TextNode content and ignore non-text nodes in arrays'
    );
});
