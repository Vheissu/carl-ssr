import { escapeHtml } from './escape';

export type HtmlPrimitive = string | number | bigint | boolean | null | undefined;
export type HtmlValue = HtmlPrimitive | HtmlFragment | HtmlValue[];

type HtmlPart =
  | { kind: 'literal'; value: string }
  | { kind: 'value'; value: HtmlValue }
  | { kind: 'raw'; value: string };

export class HtmlFragment {
  readonly #parts: HtmlPart[];

  constructor(parts: HtmlPart[]) {
    this.#parts = parts;
  }

  render(): string {
    return this.#parts.map(renderPart).join('');
  }

  toString(): string {
    return this.render();
  }
}

export function html(strings: TemplateStringsArray, ...values: HtmlValue[]): HtmlFragment {
  const parts: HtmlPart[] = [];

  for (let index = 0; index < strings.length; index += 1) {
    parts.push({ kind: 'literal', value: strings[index] ?? '' });

    if (index < values.length) {
      parts.push({ kind: 'value', value: values[index] });
    }
  }

  return new HtmlFragment(parts);
}

export function unsafeHtml(value: string): HtmlFragment {
  return new HtmlFragment([{ kind: 'raw', value }]);
}

export function isHtmlFragment(value: unknown): value is HtmlFragment {
  return value instanceof HtmlFragment;
}

export function renderHtml(value: HtmlValue): string {
  if (value == null || value === false) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(renderHtml).join('');
  }

  if (isHtmlFragment(value)) {
    return value.render();
  }

  return escapeHtml(value);
}

function renderPart(part: HtmlPart): string {
  if (part.kind === 'literal' || part.kind === 'raw') {
    return part.value;
  }

  return renderHtml(part.value);
}
