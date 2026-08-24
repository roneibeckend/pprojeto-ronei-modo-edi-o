import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "hr", "div", "span", "section", "article",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "sub", "sup", "small", "mark",
  "ul", "ol", "li", "dl", "dt", "dd",
  "blockquote", "pre", "code",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  "a", "img", "figure", "figcaption",
];

const ALLOWED_ATTR = [
  "href", "title", "alt", "src", "width", "height", "colspan", "rowspan",
  "align", "style", "class", "target", "rel",
];

/**
 * Fallback sanitizer for non-browser environments (SSR / Workers), where
 * DOMPurify has no DOM to work with. Intentionally aggressive.
 */
function fallbackSanitize(html: string): string {
  return html
    // dangerous elements (with or without closing tag)
    .replace(
      /<\s*(script|style|iframe|object|embed|link|meta|form|input|button|svg|math|base|template)\b[\s\S]*?(<\s*\/\s*\1\s*>|$)/gi,
      "",
    )
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|link|meta|form|input|button|svg|math|base|template)\b[^>]*>/gi, "")
    // inline event handlers: onclick=..., onerror='...'
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    // javascript: / data: URLs in attributes
    .replace(/(href|src|xlink:href)\s*=\s*("|')\s*(javascript|vbscript|data)\s*:[^"']*\2/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*(javascript|vbscript|data)\s*:[^\s>]*/gi, '$1="#"');
}

/**
 * Sanitizes untrusted HTML (e-book chapters, imported DOCX/PDF content, etc.)
 * before it is injected via dangerouslySetInnerHTML or stored in the database.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return "";

  if (typeof window !== "undefined" && DOMPurify.isSupported) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
      FORBID_ATTR: ["srcset", "formaction", "onerror", "onload"],
    });
  }

  return fallbackSanitize(html);
}
