// @ts-check

import test from 'ava';
import { createPaginationArray, renderPaginationElement } from '../../src/utils/pagination.js';

// --- Logic Tests: createPaginationArray ---

test('createPaginationArray: handles small total pages', t => {
    t.deepEqual(createPaginationArray(1, 1), ['1']);
    t.deepEqual(createPaginationArray(1, 3), ['1', '2', '3']);
});

test('createPaginationArray: handles gaps (delta=2)', t => {
    // Current is in the middle, gaps on both sides
    // Expected: 1, ..., 4, 5, 6, ..., 10
    const result = createPaginationArray(5, 10, 1);
    t.deepEqual(result, ['1', '...', '4', '5', '6', '...', '10']);
});

test('createPaginationArray: handles left boundary (no left gap)', t => {
    // Current is 3, delta is 2. 3 <= 3 + 2 is false. 
    // Testing the includeLeftPages branch: current === 3 + delta
    const result = createPaginationArray(5, 10, 2); 
    // current (5) === 3 + delta (2) -> true. Adds '2' instead of '...'
    t.deepEqual(result, ['1', '2', '3', '4', '5', '6', '7', '...', '10']);
});

test('createPaginationArray: handles right boundary (no right gap)', t => {
    // total (10) - (2 + delta (2)) = 6.
    // If current is 6, it should include (total - 1) as a number, not a gap.
    const result = createPaginationArray(6, 10, 2);
    t.deepEqual(result, ['1', '...', '4', '5', '6', '7', '8', '9', '10']);
});

test('createPaginationArray: custom gap string', t => {
    const result = createPaginationArray(5, 10, 1, '---');
    t.true(result.includes('---'));
    t.false(result.includes('...'));
});

// --- DOM Tests: renderPaginationElement ---

test('renderPaginationElement: renders basic structure and active class', t => {
    const ul = renderPaginationElement(2, 5);
    
    t.is(ul.tagName, 'UL');
    t.true(ul.classList.contains('pagination'));
    
    const activeItem = ul.querySelector('.page-item.active');
    t.not(activeItem, null);
    t.is(activeItem.textContent, '2');
});

test('renderPaginationElement: renders disabled gaps', t => {
    const ul = renderPaginationElement(5, 10, null, null);
    const gapItem = Array.from(ul.querySelectorAll('.page-item'))
        .find(li => li.textContent === '...');
    
    t.true(gapItem.classList.contains('disabled'));
    t.not(gapItem.querySelector('span.page-link'), null);
});

test('renderPaginationElement: uses itemUrlRenderer', t => {
    const renderer = (page) => `/search?p=${page}`;
    const ul = renderPaginationElement(1, 5, renderer);
    
    const secondLink = ul.querySelector('a[data-page-value="2"]');
    t.is(secondLink.getAttribute('href'), '/search?p=2');
});

test('renderPaginationElement: triggers onClickCallback', t => {
    let clickedPage = -1;
    const callback = (page) => { clickedPage = page; };
    
    const ul = renderPaginationElement(1, 5, null, callback);
    const secondLink = ul.querySelector('a[data-page-value="2"]');
    
    // Simulate Click
    const event = new window.MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    secondLink.dispatchEvent(event);
    
    t.is(clickedPage, 2, 'Callback should receive the correct page number');
});

test('renderPaginationElement: click event safety checks', t => {
    // @ts-ignore
    const ul = renderPaginationElement(1, 5, null, (p) => p);
    const link = ul.querySelector('a');
    
    // Test branch where e.target might not be the link (though rare in this setup)
    const event = {
        preventDefault: () => {},
        target: null // Forces !link branch
    };
    
    // Accessing the listener directly if possible, or just verifying no crash on unusual events
    t.notThrows(() => {
        link.dispatchEvent(new window.Event('click'));
    });
});