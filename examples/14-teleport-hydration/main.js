// @ts-check

import { ProductComponent } from './ProductComponent.js';

// 1. Initialize the component with the specific SSR ID
const product = new ProductComponent('prod-101');

// 2. Hydrate the existing DOM structure
// This links the Buy Button in #app AND the Popup in body to this instance
// @ts-ignore
product.mount(document.getElementById('app'), 'hydrate');

console.log('Hydration finished. Elements are now interactive.');
