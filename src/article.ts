const ALLOWED = new Set(["P", "H1", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "FIGURE", "FIGCAPTION", "IMG", "A", "STRONG", "EM", "B", "I", "BR", "PRE", "CODE", "HR"]);

function cleanUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "https://example.invalid");
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return null;
  }
  return null;
}

export function sanitizeArticleHtml(html: string): string {
  if (!html.trim() || typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const visit = (node: Element) => {
    if (node.tagName === "SCRIPT" || node.tagName === "STYLE" || node.tagName === "NOSCRIPT" || node.tagName === "IFRAME" || node.tagName === "OBJECT") {
      node.remove();
      return;
    }
    [...node.children].forEach(visit);
    if (!ALLOWED.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }
    const href = node.getAttribute("href");
    const src = node.getAttribute("src");
    const alt = node.getAttribute("alt") || "";
    [...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name));
    if (node.tagName === "A") {
      const safe = cleanUrl(href);
      if (safe) node.setAttribute("href", safe);
      node.setAttribute("rel", "noopener noreferrer");
      node.setAttribute("target", "_blank");
    }
    if (node.tagName === "IMG") {
      const safe = cleanUrl(src);
      if (!safe) {
        node.remove();
        return;
      }
      node.setAttribute("src", safe);
      node.setAttribute("alt", alt);
      node.setAttribute("loading", "lazy");
      node.setAttribute("decoding", "async");
    }
  };

  [...root.children].forEach(visit);
  return root.innerHTML;
}
