// @ts-check

import test from 'ava';
import { formatDateTime, formatDate, unixtime } from '../../src/utils/date-time.js';

test('formatDateTime: converts unix timestamp to GB format string', t => {
    // 1715850000 = May 16, 2024, 09:00:00 UTC
    const timestamp = 1715850000;
    const result = formatDateTime(timestamp);
    
    // en-GB uses DD/MM/YYYY
    t.regex(result, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    t.true(result.includes('16/05/2024'));
});

test('formatDate: converts unix timestamp to GB date string', t => {
    // 1715850000 = 16/05/2024
    const timestamp = 1715850000;
    const result = formatDate(timestamp);
    
    t.is(result, '16/05/2024');
});

test('unixtime: converts Date object to seconds', t => {
    const date = new Date('2026-03-10T12:00:00Z');
    const result = unixtime(date);
    
    // 1773144000 is the unix time for the date above
    t.is(result, 1773144000);
});

test('unixtime: defaults to current time if no argument provided', t => {
    const before = Math.floor(Date.now() / 1000);
    const result = unixtime();
    const after = Math.floor(Date.now() / 1000);
    
    t.true(result >= before && result <= after, 'Should return current unix time');
});