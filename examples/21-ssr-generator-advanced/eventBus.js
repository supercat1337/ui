// @ts-check

import { EventEmitter } from '@supercat1337/event-emitter';

/**
 * Global event bus for cross-component communication.
 * * It allows decoupled components to talk to each other without 
 * direct references. For example, ProductComponent emits an event 
 * that CartComponent listens for.
 * * @type {EventEmitter}
 */
const eventBus = new EventEmitter(); 

export { eventBus };