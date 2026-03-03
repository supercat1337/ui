// @ts-check
import { ModalComponent } from './ModalComponent.js';

const modal = new ModalComponent();

// Mounting to #app will render the 'openBtn' layout
// @ts-ignore
modal.mount(document.getElementById('app'));
