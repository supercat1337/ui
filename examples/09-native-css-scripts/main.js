// @ts-check
import { App } from './app.js';

const app = new App();
app.mount(document.getElementById('app'));

console.log('Adopted Stylesheets count:', document.adoptedStyleSheets.length);