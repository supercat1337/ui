// @ts-check
import { Component, html } from '../../dist/ui.bundle.esm.js';

// 1. Child component
class ChildComponent extends Component {
    layout = /* html */ `
    <div class="child">
        <p>This is a child component</p>
        <div data-slot="slot-name"><!-- The nested slot --></div>
    </div>
`;
}

// 2. Parent component (has a slot `slot1`)
class ParentComponent extends Component {
    layout = /* html */ `
    <div class="parent">
        <h1><span data-ref="title">Parent Component</span> <button data-ref="toggleButton" style="font-size: 1rem; padding: 0.5rem;">Collapse/Expand child component</button></h1>
        <div data-slot="slot1"><!-- The child components will be inserted here --></div>
    </div>
`;
    refsAnnotation = {
        title: HTMLSpanElement.prototype,
        toggleButton: HTMLButtonElement.prototype,
    };

    constructor() {
        super();
        this.child = new ChildComponent();
        // Add the child component to the "slot1" of the parent component
        this.addComponentToSlot('slot1', this.child);
    }

    /** @returns {typeof this.refsAnnotation} */
    getRefs() {
        return super.getRefs();
    }

    connectedCallback() {
        let refs = this.getRefs();

        refs.toggleButton.addEventListener('click', () => {
            if (this.child.isCollapsed) {
                this.child.expand();
            } else {
                this.child.collapse();
            }
        });
    }
}

// 3. Simple components for insertion
const LeafComponentA = new Component();
// set layout as a static string
LeafComponentA.layout = /* html */ `<div>🍃 Leaf A</div>`;

const LeafComponentB = new Component();
// set layout as an arrow function that returns a string
LeafComponentB.layout = () => /* html */ `<div>🍂 Leaf B ${new Date().toLocaleTimeString()}</div>`;
const LeafComponentC = new Component();
// set layout as a function that returns an HTMLElement
LeafComponentC.layout = function () {
    /*
    let leaf = document.createElement('div');
    let currentDateTime = new Date().toLocaleTimeString();
    leaf.textContent = `🌸 Leaf C ${currentDateTime}`;
    return leaf;
    */

    let leaf = html`<div>🌸 Leaf C ${new Date().toLocaleTimeString()}</div>`;
    return leaf;
};

const LeafComponentD = new Component();
// set layout as a function that returns a DocumentFragment. DocumentFragment contains multiple root elements. 
LeafComponentD.layout = function () {
    let fragment = html`<div>🌻 Leaf D1</div><div>🌻 Leaf D2</div><div>🌻 Leaf D3</div>`;

    return fragment;
};

const TextComponent = new Component();
TextComponent.layout = () => 'Just a text node component';

// 4. Assemble the structure:
const parent = new ParentComponent();
const child = parent.child;

// Insert Leaf components into ChildComponent
//child.addComponentToSlot('slot-name', LeafComponentA, LeafComponentB, LeafComponentC, LeafComponentD, TextComponent);

// 5. Mount everything in DOM
parent.mount(document.body);

LeafComponentA.mount(child.getRootNode(), "append");
LeafComponentB.mount(child.getRootNode(), "append");
LeafComponentC.mount(child.getRootNode(), "append");
LeafComponentD.mount(child.getRootNode(), "append");
TextComponent.mount(child.getRootNode(), "append");

globalThis.app = { parent, child, LeafComponentA, LeafComponentB, LeafComponentC, LeafComponentD, TextComponent};
