---
title: BareDOM – Overview
version: 2.0.0
tags: [overview, introduction, philosophy, installation]
---

# BareDOM – Surgical Direct DOM Components

## What is BareDOM?

BareDOM (package `@supercat1337/ui`) is a **lightweight, Vanilla JS toolkit** for building web interfaces with native DOM components. It combines the structure of modern frameworks (components, slots, lifecycle) with a **direct DOM** approach – no virtual DOM, no wrappers, no hidden reactivity.

- **Surgical Direct DOM** – updates are targeted and explicit.
- **Type-safe** – static typing via JSDoc + runtime validation for `data-ref` elements.
- **Isomorphic** – server‑side rendering and hydration are built-in.
- **Minimal** – core ~5kB gzipped, two dependencies (`event-emitter`, `dom-scope`).

## Philosophy

Most frameworks use a **top‑down reactive model**: state change → re‑render entire tree → diff virtual DOM → patch real DOM. BareDOM flips this:

- **Direct DOM** – you work directly with real elements, no proxies or abstractions.
- **Surgical** – you target specific elements using `data-ref` and update only what needs to change.

This gives you **full control** and **predictable performance** (constant‑time updates).

## Interoperability & Ecosystem

BareDOM is a **non‑invasive** framework. It doesn’t try to replace the entire frontend ecosystem, nor does it dictate how you manage data or styles. This flexibility allows you to seamlessly integrate your favourite tools.

- **Reactivity:** Use any state management library (e.g., **MobX**, **Signals**, **Nano Stores**). Since BareDOM updates are explicit, you simply update the necessary `refs` inside a subscriber or an `autorun` function.
- **Animations:** The library provides direct access to real DOM nodes. Pass any `ref` to **GSAP**, **Anime.js**, or **Motion** immediately after the component is mounted.
- **Styling:** BareDOM works with standard `class` and `style` attributes. Use **Tailwind CSS**, **Bootstrap**, **CSS Modules**, or any **CSS‑in‑JS** solution without conflict.
- **Third‑party Widgets:** Any library that requires a “target” DOM element (like **Chart.js**, **Google Maps**, or **Select2**) can be easily initialised within `connectedCallback` using the component’s `refs`.

This openness makes BareDOM a great choice for projects that already rely on a specific set of tools.

## Installation

```bash
npm install @supercat1337/ui
```

## Quick Start

```js
import { Component, html } from '@supercat1337/ui';

class Hello extends Component {
    layout = html`<h1 data-ref="title">Hello, World!</h1>`;
    refsAnnotation = { title: HTMLHeadingElement.prototype };

    connectedCallback() {
        this.getRefs().title.style.color = 'coral';
    }
}

const app = new Hello();
app.mount(document.body);
```

## Where to Go Next

- [Components](./01-components.md)
- [Layouts & Refs](./02-layouts-refs.md)
- [Slots & Composition](./03-slots.md)
- [Lifecycle & Events](./04-lifecycle-events.md)
- [Teleports](./05-teleports.md)
- [Web Components Integration](./06-web-components.md)
- [Hydration (SSR)](./07-hydration.md)
- [Utility Functions](./08-utilities.md)
- [Examples & Tutorials](./09-examples.md)
- [Common Pitfalls](./10-common-pitfalls.md)
