// @ts-check
import { Component } from "../../dist/ui.bundle.esm.js";

// 1. Parent component (has a slot `slot1`)
class ParentComponent extends Component {
    layout = /* html */ `
    <div class="parent">
        <h1 ref="title">Parent Component</h1>
        <div scope-ref="slot1"><!-- The child components will be inserted here --></div>
    </div>
`;
    slots = ["slot1"];
    refsAnnotation = {
        title: HTMLHeadingElement,
    };
}

// 2. Child component (also has a slot `slot1`)
class ChildComponent extends Component {
    layout = /* html */ `
    <div class="child">
        <p>This is a child component</p>
        <div scope-ref="slot1"><!-- The nested slot --></div>
    </div>
`;
    slots = ["slot1"];
}

// 3. Simple components for insertion
const LeafComponentA = new Component();
LeafComponentA.layout = /* html */ `<span>🍃 Leaf A</span>`;

const LeafComponentB = new Component();
LeafComponentB.layout = /* html */ `<span>🍂 Leaf B</span>`;

// 4. Assemble the structure:
const parent = new ParentComponent();
const child = new ChildComponent();

// Insert Leaf components into ChildComponent
child.addChildComponent("slot1", LeafComponentA, LeafComponentB);
// Insert ChildComponent into ParentComponent
parent.addChildComponent("slot1", child);
// 5. Mount everything in DOM
parent.mount(document.body);

globalThis.app = { parent, child, LeafComponentA, LeafComponentB };
