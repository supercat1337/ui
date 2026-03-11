// @ts-nocheck
import test from 'ava';
import { JSDOM } from 'jsdom';
import { 
    prepareTeleportNode, 
    findExistingTeleport, 
    claimTeleportNode 
} from '../../../src/component/internals/teleport-utils.js';

test.beforeEach(t => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    t.context.dom = dom;
    t.context.document = dom.window.document;
});

test('prepareTeleportNode: should set correct attributes', t => {
    const { document } = t.context;
    const node = document.createElement('div');
    
    prepareTeleportNode(node, 'modal', '0.1', 'inst-123');

    t.is(node.getAttribute('data-component-teleport'), 'modal');
    t.is(node.getAttribute('data-component-root'), 'inst-123');
    t.is(node.getAttribute('data-parent-sid'), '0.1');
});

test('findExistingTeleport: should find node by SID and name', t => {
    const { document } = t.context;
    const sid = '0.master.0';
    const name = 'tooltip';
    
    const node = document.createElement('div');
    node.setAttribute('data-parent-sid', sid);
    node.setAttribute('data-component-teleport', name);
    document.body.appendChild(node);

    const found = findExistingTeleport(document, sid, name);
    
    t.not(found, null);
    t.is(found, node);
});

test('claimTeleportNode: should update instanceId and remove parentSid', t => {
    const { document } = t.context;
    const node = document.createElement('div');
    node.setAttribute('data-parent-sid', 'old-sid');
    
    claimTeleportNode(node, 'new-instance-456');

    t.is(node.getAttribute('data-component-root'), 'new-instance-456');
    t.false(node.hasAttribute('data-parent-sid'), 'parentSid should be removed after claiming');
});
