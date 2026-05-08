import { describe, expect, it } from 'vitest';
import {
  createManifest,
  definePortableComponent,
  renderPortableComponent,
  renderTemplate,
  unsafeHtml
} from '../src';

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
});
