import {
  createManifest,
  defineComponent,
  definePortableComponent,
  html,
  renderComponent,
  renderPortableComponent,
  slot
} from '../src';

const richGreeting = defineComponent<{ name: string }>({
  tagName: 'carl-rich-greeting',
  styles: ':host{display:block}strong{font-weight:700}',
  defaults: {
    name: 'friend'
  },
  render: ({ props }) => html`<p>Hello, <strong>${props.name}</strong>.</p>${slot()}`
});

console.log(
  renderComponent(richGreeting, {
    props: { name: 'Dwayne & Carl' },
    children: html`<p>Rendered by Node.</p>`
  })
);

const portableGreeting = definePortableComponent<{ name: string }>({
  tagName: 'carl-greeting',
  shadow: 'open',
  styles: [':host{display:block}.name{font-weight:700}'],
  defaults: {
    name: 'friend'
  },
  template: '<p>Hello, <span class="name">{{ name }}</span>.</p><slot></slot>'
});

console.log(renderPortableComponent(portableGreeting, { props: { name: 'PHP-safe Carl' } }));
console.log(JSON.stringify(createManifest([portableGreeting]), null, 2));
