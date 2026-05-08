const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
}

export function escapeStyleText(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style');
}

export function assertSafeHtmlName(name: string, type: string): void {
  if (!/^[A-Za-z_:][A-Za-z0-9:._-]*$/.test(name)) {
    throw new Error(`Invalid ${type} name: ${name}`);
  }
}

export function assertCustomElementName(tagName: string): void {
  if (!/^[a-z][.0-9_a-z-]*-[.0-9_a-z-]*$/.test(tagName)) {
    throw new Error(`Carl components must use a valid custom element tag name: ${tagName}`);
  }
}
