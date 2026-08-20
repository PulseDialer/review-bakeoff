// Allowlist sanitiser for merge-field document HTML.
//
// This is the ONLY thing standing between an authored template and the signing
// page's origin, so the allowlists below are a security boundary. Anything that
// can retarget a relative URL, navigate, or embed a document must stay out.

export const ALLOWED_ELEMENTS = new Set([
  'p', 'br', 'strong', 'em', 'u', 'span', 'div',
  'h1', 'h2', 'h3', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'ul', 'ol', 'li', 'img', 'a',
]);

export const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'style']);

export const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'data:']);

export function sanitiseDocumentHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  walk(doc.body);
  return doc.body.innerHTML;
}

function walk(node: Element): void {
  for (const child of Array.from(node.children)) {
    if (!ALLOWED_ELEMENTS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    for (const attr of Array.from(child.attributes)) {
      if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) child.removeAttribute(attr.name);
    }
    walk(child);
  }
}
