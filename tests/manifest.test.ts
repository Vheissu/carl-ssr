import { describe, expect, it } from 'vitest';
import {
  createManifest,
  definePortableComponent,
  renderPortableComponent,
  renderTemplate,
  unsafeHtml
} from '../src';
import { readFileSync } from 'node:fs';

describe('portable component renderer', () => {
  it('renders templates with escaped placeholders', () => {
    const greeting = definePortableComponent<{ name: string }>({
      tagName: 'carl-greeting',
      shadow: 'open',
      styles: [':host{display:block}'],
      defaults: {
        name: 'friend'
      },
      template: '<p>Hello, {{ name }}.</p><slot></slot>'
    });

    expect(
      renderPortableComponent(greeting, {
        props: { name: 'Dwayne & Carl' },
        children: unsafeHtml('<span>Projected</span>')
      })
    ).toBe(
      '<carl-greeting><template shadowrootmode="open"><style>:host{display:block}</style><p>Hello, Dwayne &amp; Carl.</p><slot></slot></template><span>Projected</span></carl-greeting>'
    );
  });

  it('supports dotted paths and explicit raw placeholders', () => {
    expect(
      renderTemplate('<h2>{{ author.name }}</h2>{{{ trustedHtml }}}', {
        author: { name: 'Dwayne <D>' },
        trustedHtml: '<p>ok</p>'
      })
    ).toBe('<h2>Dwayne &lt;D&gt;</h2><p>ok</p>');
  });

  it('exports a stable manifest shape for other runtimes', () => {
    const component = definePortableComponent({
      tagName: 'carl-card',
      template: '<slot></slot>'
    });

    expect(createManifest([component])).toEqual({
      format: 'carl.manifest',
      version: 1,
      components: [
        {
          tagName: 'carl-card',
          shadow: { mode: 'open' },
          styles: [],
          defaults: {},
          template: '<slot></slot>'
        }
      ]
    });
  });

  it('renders the shared PHP fixture from JavaScript', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('./fixtures/portable.manifest.json', import.meta.url), 'utf8')
    );
    const greeting = manifest.components[0];
    const actionPanel = manifest.components[2];

    expect(
      renderPortableComponent(greeting, {
        props: { name: 'Dwayne & Carl' },
        attrs: { 'data-runtime': 'node', hidden: false },
        children: unsafeHtml('<p>Projected</p>')
      })
    ).toBe(
      '<carl-greeting data-runtime="node"><template shadowrootmode="open"><style>:host{display:block}.name{font-weight:700}</style><p>Hello, <span class="name">Dwayne &amp; Carl</span>.</p><slot></slot></template><p>Projected</p></carl-greeting>'
    );

    expect(
      renderPortableComponent(actionPanel, {
        props: { title: 'Danger & recovery' },
        children: unsafeHtml('<p>Body</p>'),
        slots: {
          actions: unsafeHtml('<button>Save</button>')
        }
      })
    ).toBe(
      '<carl-action-panel><template shadowrootmode="closed" shadowrootdelegatesfocus><style>:host{display:block}header{font-weight:700}</style><section><header>Danger &amp; recovery</header><main><slot></slot></main><footer><slot name="actions"></slot></footer></section></template><p>Body</p><span slot="actions"><button>Save</button></span></carl-action-panel>'
    );
  });
});
