import { AttributeMap, attrs } from './attributes';
import { assertCustomElementName, escapeHtml, escapeStyleText } from './escape';
import { HtmlValue, renderHtml } from './html';
import { renderLightDom, RenderOptions, ShadowOptions } from './component';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type PortableProps = Record<string, JsonValue | undefined>;

export interface PortableComponentDefinition<Props extends PortableProps = PortableProps> {
  tagName: string;
  shadow?: ShadowOptions | 'open' | 'closed' | false;
  styles?: string[];
  defaults?: Partial<Props>;
  template: string;
}

export interface PortableComponent<Props extends PortableProps = PortableProps> {
  readonly kind: 'carl.portable';
  readonly tagName: string;
  readonly shadow: ShadowOptions | false;
  readonly styles: readonly string[];
  readonly defaults: Partial<Props>;
  readonly template: string;
}

export interface CarlManifest {
  format: 'carl.manifest';
  version: 1;
  components: PortableComponentDefinition[];
}

export function definePortableComponent<Props extends PortableProps>(
  definition: PortableComponentDefinition<Props>
): PortableComponent<Props> {
  assertCustomElementName(definition.tagName);

  return {
    kind: 'carl.portable',
    tagName: definition.tagName,
    shadow: normalizePortableShadow(definition.shadow),
    styles: definition.styles ?? [],
    defaults: definition.defaults ?? {},
    template: definition.template
  };
}

export function createManifest(components: readonly PortableComponent[]): CarlManifest {
  return {
    format: 'carl.manifest',
    version: 1,
    components: components.map((component) => ({
      tagName: component.tagName,
      shadow: component.shadow,
      styles: [...component.styles],
      defaults: component.defaults,
      template: component.template
    }))
  };
}

export function renderPortableComponent<Props extends PortableProps>(
  component: PortableComponent<Props> | PortableComponentDefinition<Props>,
  options: RenderOptions<Props & Record<string, unknown>> = {}
): string {
  const portable: PortableComponent<Props> = isPortableComponent(component)
    ? component
    : definePortableComponent(component);
  const props = { ...portable.defaults, ...options.props } as Props;
  const hostAttributes = attrs(options.attrs as AttributeMap | undefined).render();
  const body = renderTemplate(portable.template, props);
  const children = options.children ?? options.slots?.default ?? '';
  const lightDom = renderLightDom(children as HtmlValue, options.slots);

  if (!portable.shadow) {
    return `<${portable.tagName}${hostAttributes}>${renderStyles(portable.styles)}${body}</${portable.tagName}>`;
  }

  return `<${portable.tagName}${hostAttributes}>${renderPortableShadowRoot(portable.shadow, portable.styles, body)}${lightDom}</${portable.tagName}>`;
}

export function renderTemplate(template: string, props: PortableProps): string {
  return template.replace(
    /\{\{\{\s*([A-Za-z_$][A-Za-z0-9_.$-]*)\s*\}\}\}|\{\{\s*([A-Za-z_$][A-Za-z0-9_.$-]*)\s*\}\}/g,
    (_match, rawPath: string | undefined, escapedPath: string | undefined) => {
      const path = rawPath ?? escapedPath ?? '';
      const value = readPath(props, path);

      if (value == null || value === false) {
        return '';
      }

      if (rawPath) {
        return String(value);
      }

      return escapeHtml(value);
    }
  );
}

function readPath(props: PortableProps, path: string): JsonValue | undefined {
  let current: unknown = props;

  for (const key of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, JsonValue | undefined>)[key];
  }

  return current as JsonValue | undefined;
}

function renderPortableShadowRoot(
  shadow: ShadowOptions,
  styles: readonly string[],
  body: string
): string {
  const delegatesFocus = shadow.delegatesFocus ? ' shadowrootdelegatesfocus' : '';
  return `<template shadowrootmode="${shadow.mode}"${delegatesFocus}>${renderStyles(styles)}${body}</template>`;
}

function renderStyles(styles: readonly string[]): string {
  return styles
    .map((style) => `<style>${escapeStyleText(style)}</style>`)
    .join('');
}

function normalizePortableShadow(
  shadow: PortableComponentDefinition['shadow']
): ShadowOptions | false {
  if (shadow === false) {
    return false;
  }

  if (!shadow || shadow === 'open' || shadow === 'closed') {
    return { mode: shadow ?? 'open' };
  }

  return shadow;
}

function isPortableComponent<Props extends PortableProps>(
  component: PortableComponent<Props> | PortableComponentDefinition<Props>
): component is PortableComponent<Props> {
  return (component as { kind?: unknown }).kind === 'carl.portable';
}
