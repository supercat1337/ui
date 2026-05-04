// @ts-check
import test from 'ava';
import { generateId } from '../../src/utils/unique-id.js';

test('generateId: generates incrementing IDs', t => {
    // Note: Starting value depends on whether other tests in this file 
    // have already called generateId().
    const first = generateId();
    const second = generateId();
    
    t.is(Number(second), Number(first) + 1, 'Each call should increment the counter');
});

test('generateId: applies string prefix correctly', t => {
    const prefix = 'comp-';
    const id = generateId(prefix);
    
    t.true(id.startsWith(prefix), 'Result should start with the provided prefix');
    t.regex(id, /comp-\d+/, 'Result should match the prefix followed by digits');
});

test('generateId: returns string even without prefix', t => {
    const id = generateId();
    t.is(typeof id, 'string', 'The output should always be a string for consistency');
});

test('generateId: handles empty string prefix', t => {
    const id = generateId('');
    t.regex(id, /^\d+$/, 'Should return only digits when prefix is an empty string');
});