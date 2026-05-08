import { assertSafeHtmlName, escapeHtml } from './escape';
import { HtmlFragment, html, unsafeHtml } from './html';

export type AttributeValue = string | number | bigint | boolean | null | undefined;
export type AttributeMap = Record<string, AttributeValue>;
export type ClassMap = Record<string, boolean | null | undefined>;
export type StyleMap = Record<string, string | number | null | undefined>;

export function attr(name: string, value: AttributeValue): HtmlFragment {
  return unsafeHtml(renderAttribute(name, value));
}

export function attrs(values: AttributeMap | undefined): HtmlFragment {
  if (!values) {
    return html``;
  }

  return unsafeHtml(
    Object.entries(values)
      .map(([name, value]) => renderAttribute(name, value))
      .join('')
  );
}

export function classMap(values: ClassMap): string {
  return Object.entries(values)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([name]) => name)
    .join(' ');
}

export function styleMap(values: StyleMap): string {
  return Object.entries(values)
    .filter(([, value]) => value != null)
    .map(([name, value]) => {
      assertSafeHtmlName(name, 'CSS property');
      return `${name}: ${String(value)}`;
    })
    .join('; ');
}

export function renderAttributes(values: AttributeMap | undefined): string {
  return attrs(values).render();
}

function renderAttribute(name: string, value: AttributeValue): string {
  assertSafeHtmlName(name, 'attribute');

  if (value == null || value === false) {
    return '';
  }

  if (value === true) {
    return ` ${name}`;
  }

  return ` ${name}="${escapeHtml(value)}"`;
}
