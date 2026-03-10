// @ts-check
import test from 'ava';
import { uniqueId } from '../../src/utils/unique-id.js';

test('uniqueId: generates incrementing IDs', t => {
    // Note: Starting value depends on whether other tests in this file 
    // have already called uniqueId().
    const first = uniqueId();
    const second = uniqueId();
    
    t.is(Number(second), Number(first) + 1, 'Each call should increment the counter');
});

test('uniqueId: applies string prefix correctly', t => {
    const prefix = 'comp-';
    const id = uniqueId(prefix);
    
    t.true(id.startsWith(prefix), 'Result should start with the provided prefix');
    t.regex(id, /comp-\d+/, 'Result should match the prefix followed by digits');
});

test('uniqueId: returns string even without prefix', t => {
    const id = uniqueId();
    t.is(typeof id, 'string', 'The output should always be a string for consistency');
});

test('uniqueId: handles empty string prefix', t => {
    const id = uniqueId('');
    t.regex(id, /^\d+$/, 'Should return only digits when prefix is an empty string');
});