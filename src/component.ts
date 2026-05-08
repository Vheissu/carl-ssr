import { attr, attrs, AttributeMap } from './attributes';
import { assertCustomElementName, escapeStyleText } from './escape';
import { html, HtmlValue, renderHtml, unsafeHtml } from './html';

export type ShadowMode = 'open' | 'closed';

export interface ShadowOptions {
  mode: ShadowMode;
  delegatesFocus?: boolean;
}

export interface RenderContext<Props extends Record<string, unknown>> {
  props: Readonly<Props>;
  attrs: Readonly<AttributeMap>;
  children: HtmlValue;
  slots: Readonly<Record<string, HtmlValue>>;
}

export interface ComponentOptions<Props extends Record<string, unknown>> {
  tagName: string;
  shadow?: ShadowMode | ShadowOptions | false;
  styles?: string | string[];
  defaults?: Partial<Props>;
  render: (context: RenderContext<Props>) => HtmlValue;
}

export interface Component<Props extends Record<string, unknown> = Record<string, unknown>> {
  readonly kind: 'carl.component';
  readonly tagName: string;
  readonly shadow: ShadowOptions | false;
  readonly styles: readonly string[];
  readonly defaults: Partial<Props>;
  render(context: RenderContext<Props>): HtmlValue;
}

export interface RenderOptions<Props extends Record<string, unknown>> {
  props?: Partial<Props>;
  attrs?: AttributeMap;
  children?: HtmlValue;
  slots?: Record<string, HtmlValue>;
}

export function defineComponent<Props extends Record<string, unknown>>(
  options: ComponentOptions<Props>
): Component<Props> {
  assertCustomElementName(options.tagName);

  return {
    kind: 'carl.component',
    tagName: options.tagName,
    shadow: normalizeShadow(options.shadow),
    styles: Array.isArray(options.styles)
      ? options.styles
      : options.styles
        ? [options.styles]
        : [],
    defaults: options.defaults ?? {},
    render: options.render
  };
}

export function renderComponent<Props extends Record<string, unknown>>(
  component: Component<Props>,
  options: RenderOptions<Props> = {}
): string {
  const props = { ...component.defaults, ...options.props } as Props;
  const slots = options.slots ?? {};
  const children = options.children ?? slots.default ?? '';
  const context: RenderContext<Props> = {
    props,
    attrs: options.attrs ?? {},
    children,
    slots
  };

  const hostAttributes = attrs(options.attrs).render();
  const body = renderHtml(component.render(context));
  const lightDom = renderLightDom(children, slots);

  if (!component.shadow) {
    return `<${component.tagName}${hostAttributes}>${renderStyles(component.styles)}${body}</${component.tagName}>`;
  }

  return `<${component.tagName}${hostAttributes}>${renderShadowRoot(component.shadow, component.styles, body)}${lightDom}</${component.tagName}>`;
}

export function slot(name?: string, fallback?: HtmlValue): HtmlValue {
  return html`<slot${name ? attr('name', name) : html``}>${fallback ?? ''}</slot>`;
}

export function slotted(name: string, value: HtmlValue): HtmlValue {
  return html`<span${attr('slot', name)}>${value}</span>`;
}

export function renderToString<Props extends Record<string, unknown>>(
  component: Component<Props>,
  options?: RenderOptions<Props>
): string {
  return renderComponent(component, options);
}

export function renderLightDom(children: HtmlValue, slots: Record<string, HtmlValue> = {}): string {
  const namedSlots = Object.entries(slots)
    .filter(([name]) => name !== 'default')
    .map(([name, value]) => slotted(name, value));

  return renderHtml([children, namedSlots]);
}

function renderShadowRoot(shadow: ShadowOptions, styles: readonly string[], body: string): string {
  const shadowAttributes = [
    attr('shadowrootmode', shadow.mode),
    shadow.delegatesFocus ? unsafeHtml(' shadowrootdelegatesfocus') : html``
  ];

  return `<template${renderHtml(shadowAttributes)}>${renderStyles(styles)}${body}</template>`;
}

function renderStyles(styles: readonly string[]): string {
  return styles
    .map((style) => `<style>${escapeStyleText(style)}</style>`)
    .join('');
}

function normalizeShadow(
  shadow: ShadowMode | ShadowOptions | false | undefined
): ShadowOptions | false {
  if (shadow === false) {
    return false;
  }

  if (!shadow || shadow === 'open' || shadow === 'closed') {
    return { mode: shadow ?? 'open' };
  }

  return shadow;
}
