# Carl SSR

Carl is an SSR library for standards-based web components. The Node renderer is the primary runtime and supports TypeScript render callbacks. PHP support is possible through Carl's portable manifest format, which is deliberately serializable instead of relying on arbitrary JavaScript execution.

The important boundary:

- Node can render rich TypeScript component functions.
- PHP can render portable Carl manifests.
- Neither runtime pretends that PHP can execute browser custom element classes, lifecycle callbacks, or arbitrary client-side JavaScript.

Carl outputs Declarative Shadow DOM by default:

```html
<carl-greeting>
  <template shadowrootmode="open">
    <p>Hello, Dwayne.</p>
    <slot></slot>
  </template>
  <p>Projected light DOM.</p>
</carl-greeting>
```

## Install

```sh
npm install carl-ssr
```

For this local checkout:

```sh
npm install
npm run verify
```

## Node Renderer

```ts
import { defineComponent, html, renderComponent, slot } from 'carl-ssr';

const Greeting = defineComponent<{ name: string }>({
  tagName: 'carl-greeting',
  styles: ':host{display:block}strong{font-weight:700}',
  defaults: {
    name: 'friend'
  },
  render: ({ props }) => html`<p>Hello, <strong>${props.name}</strong>.</p>${slot()}`
});

const markup = renderComponent(Greeting, {
  props: { name: 'Dwayne & Carl' },
  children: html`<p>Projected light DOM.</p>`
});
```

Interpolated values are escaped by default. Use `unsafeHtml()` only for trusted markup.

## Portable Manifests

Portable components use string templates with escaped placeholders:

```ts
import {
  createManifest,
  definePortableComponent,
  renderPortableComponent
} from 'carl-ssr';

const Greeting = definePortableComponent({
  tagName: 'carl-greeting',
  shadow: 'open',
  styles: [':host{display:block}.name{font-weight:700}'],
  defaults: {
    name: 'friend'
  },
  template: '<p>Hello, <span class="name">{{ name }}</span>.</p><slot></slot>'
});

console.log(renderPortableComponent(Greeting, { props: { name: 'Dwayne' } }));
console.log(JSON.stringify(createManifest([Greeting]), null, 2));
```

Supported placeholders:

- `{{ name }}` escapes the value.
- `{{ user.name }}` reads dotted object paths.
- `{{{ trustedHtml }}}` inserts raw markup and should only be used for trusted content.

## PHP Renderer

The PHP renderer consumes the same `carl.manifest` JSON:

```php
<?php

require __DIR__ . '/php/Carl.php';

use Carl\Html;
use Carl\Renderer;

$renderer = Renderer::fromManifestFile(__DIR__ . '/examples/card.manifest.json');

echo $renderer->render('carl-greeting', [
    'props' => [
        'name' => 'Dwayne & Carl',
    ],
    'children' => Html::raw('<p>Projected light DOM.</p>'),
]);
```

PHP strings are escaped by default. Use `Carl\Html::raw()` only for trusted light DOM.

## API Surface

- `defineComponent()` for Node-first TypeScript render functions.
- `definePortableComponent()` for components that can be exported to other runtimes.
- `renderComponent()` and `renderPortableComponent()` for string rendering.
- `createManifest()` for producing `carl.manifest` JSON.
- `html`, `attr`, `attrs`, `classMap`, `styleMap`, and `slot` for safe markup composition.

## Current Scope

This is a first working library slice. It handles safe HTML rendering, host attributes, styles, slots, Declarative Shadow DOM, and PHP-compatible manifests. Future work should add async rendering, streaming, hydration helpers, compiler integrations, and a broader manifest instruction set for conditionals and loops.
