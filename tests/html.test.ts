import { describe, expect, it } from 'vitest';
import { attr, attrs, classMap, html, renderHtml, styleMap, unsafeHtml } from '../src';

describe('html', () => {
  it('escapes interpolated values', () => {
    expect(renderHtml(html`<p>${'<script>alert("x")</script>'}</p>`)).toBe(
      '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>'
    );
  });

  it('allows explicit unsafe html fragments', () => {
    expect(renderHtml(html`<div>${unsafeHtml('<span>trusted</span>')}</div>`)).toBe(
      '<div><span>trusted</span></div>'
    );
  });

  it('renders arrays and falsey conditional values predictably', () => {
    expect(renderHtml([html`<span>A</span>`, false, null, ' & B'])).toBe(
      '<span>A</span> &amp; B'
    );
  });
});

describe('attributes', () => {
  it('renders escaped, boolean, and omitted attributes', () => {
    expect(
      attrs({
        id: 'hello "world"',
        disabled: true,
        hidden: false,
        title: null
      }).render()
    ).toBe(' id="hello &quot;world&quot;" disabled');
  });

  it('throws on unsafe attribute names', () => {
    expect(() => attr('on click', 'nope').render()).toThrow('Invalid attribute name');
  });

  it('builds class and style strings', () => {
    expect(classMap({ active: true, muted: false, ready: true })).toBe('active ready');
    expect(styleMap({ color: 'red', opacity: 0.5, empty: null })).toBe('color: red; opacity: 0.5');
  });
});
