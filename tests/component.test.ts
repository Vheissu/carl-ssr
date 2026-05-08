import { describe, expect, it } from 'vitest';
import { defineComponent, html, renderComponent, slot } from '../src';

describe('component renderer', () => {
  it('renders a custom element with declarative shadow DOM by default', () => {
    const greeting = defineComponent<{ name: string }>({
      tagName: 'carl-greeting',
      styles: ':host{display:block}',
      defaults: {
        name: 'friend'
      },
      render: ({ props }) => html`<p>Hello, <strong>${props.name}</strong>.</p>${slot()}`
    });

    expect(
      renderComponent(greeting, {
        props: { name: 'Dwayne & Carl' },
        attrs: { class: 'welcome' },
        children: html`<span>Light DOM</span>`
      })
    ).toBe(
      '<carl-greeting class="welcome"><template shadowrootmode="open"><style>:host{display:block}</style><p>Hello, <strong>Dwayne &amp; Carl</strong>.</p><slot></slot></template><span>Light DOM</span></carl-greeting>'
    );
  });

  it('supports closed shadow roots and delegatesFocus', () => {
    const button = defineComponent<{ label: string }>({
      tagName: 'carl-button',
      shadow: { mode: 'closed', delegatesFocus: true },
      render: ({ props }) => html`<button>${props.label}</button>`
    });

    expect(renderComponent(button, { props: { label: 'Save' } })).toBe(
      '<carl-button><template shadowrootmode="closed" shadowrootdelegatesfocus><button>Save</button></template></carl-button>'
    );
  });

  it('renders light DOM components without a shadow template', () => {
    const badge = defineComponent<{ label: string }>({
      tagName: 'carl-badge',
      shadow: false,
      render: ({ props }) => html`<span>${props.label}</span>`
    });

    expect(renderComponent(badge, { props: { label: 'New' }, children: 'ignored' })).toBe(
      '<carl-badge><span>New</span></carl-badge>'
    );
  });
});
