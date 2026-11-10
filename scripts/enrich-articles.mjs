/**
 * Fills missing article text, preview images, favicons, and store links.
 * Fields a bot already wrote are left alone. A failed fetch keeps the summary.
 *
 * Usage: node scripts/enrich-articles.mjs [YYYY-MM-DD]
 */
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const root = path.resolve("public/data");
const dateArg = process.argv[2]?.trim();
const SKIP = /youtube\.com|youtu\.be|(^|\.)x\.com|twitter\.com|tiktok\.com|instagram\.com|google\.[^/]+\/maps|maps\.google/;
const ALLOWED = new Set(["P", "H1", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "FIGURE", "FIGCAPTION", "IMG", "A", "STRONG", "EM", "B", "I", "BR", "PRE", "CODE", "HR"]);

function read(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function writeIfChanged(file, data) {
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const full = path.join(root, file);
  const before = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  if (before === next) return false;
  fs.writeFileSync(full, next);
  return true;
}

function meta(doc, key) {
  const node = doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`);
  return node?.getAttribute("content")?.trim() || "";
}

function absolute(value, base) {
  if (!value) return "";
  try {
    const url = new URL(value, base);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return "";
  }
  return "";
}

function sanitize(html, base) {
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const rootNode = dom.window.document.getElementById("root");
  const visit = (node) => {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "OBJECT", "FORM"].includes(node.tagName)) {
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
      const safe = absolute(href, base);
      if (safe) node.setAttribute("href", safe);
    }
    if (node.tagName === "IMG") {
      const safe = absolute(src, base);
      if (!safe) node.remove();
      else {
        node.setAttribute("src", safe);
        node.setAttribute("alt", alt);
      }
    }
  };
  [...rootNode.children].forEach(visit);
  return rootNode.innerHTML.slice(0, 60000);
}

function paragraphsFrom(text) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part.length > 40)
    .slice(0, 40);
}

function tidy(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function empty(value) {
  return value == null || value === "" || (Array.isArray(value) && value.length === 0);
}

function skip(item) {
  if (["youtube", "x", "tiktok", "instagram"].includes(item.embed)) return true;
  return SKIP.test(item.href);
}

async function enrichItem(item) {
  if (skip(item)) return false;
  let html = "";
  let finalUrl = item.href;
  try {
    const response = await fetch(item.href, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "text/html",
        "user-agent": "Mozilla/5.0 (compatible; DailyDose/1.0; +https://visacode.github.io/daily-dose/)",
      },
    });
    if (!response.ok) {
      console.log(`skip ${response.status} ${item.title}`);
      return false;
    }
    finalUrl = response.url || item.href;
    const reader = response.body?.getReader();
    if (!reader) return false;
    const chunks = [];
    let received = 0;
    while (received < 400000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    html = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
  } catch (error) {
    console.log(`fail ${item.title}: ${error.message}`);
    return false;
  }

  const dom = new JSDOM(html, { url: finalUrl });
  const doc = dom.window.document;
  let changed = false;
  const image = absolute(meta(doc, "og:image") || meta(doc, "twitter:image"), finalUrl);
  const iconNode = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
  const favicon = absolute(iconNode?.getAttribute("href") || "/favicon.ico", finalUrl);
  const siteName = meta(doc, "og:site_name");
  const published = meta(doc, "article:published_time") || meta(doc, "pubdate");
  const author = meta(doc, "author") || meta(doc, "article:author");

  if (empty(item.image) && image) {
    item.image = image;
    changed = true;
  }
  if (empty(item.favicon) && favicon) {
    item.favicon = favicon;
    changed = true;
  }

  const links = [...doc.querySelectorAll("a[href]")].map((node) => absolute(node.getAttribute("href"), finalUrl)).filter(Boolean);
  const parsed = new Readability(doc).parse();
  const articleHtml = parsed?.content ? sanitize(parsed.content, finalUrl) : "";
  const articleText = parsed?.textContent || "";
  const hasArticle = item.article && (!empty(item.article.html) || !empty(item.article.paragraphs));
  if (!hasArticle && (articleHtml || articleText)) {
    item.article = {
      ...(item.article || {}),
      html: articleHtml || undefined,
      paragraphs: paragraphsFrom(articleText),
    };
    changed = true;
  }
  item.article = item.article || {};
  if (empty(item.article.byline) && (parsed?.byline || author)) {
    item.article.byline = tidy(parsed?.byline || author);
    changed = true;
  }
  if (empty(item.article.published) && (parsed?.publishedTime || published)) {
    item.article.published = tidy(parsed?.publishedTime || published);
    changed = true;
  }
  if (empty(item.article.siteName) && (parsed?.siteName || siteName)) {
    item.article.siteName = tidy(parsed?.siteName || siteName);
    changed = true;
  }
  if (item.article && !item.article.html && !item.article.paragraphs?.length && !item.article.byline && !item.article.published && !item.article.siteName) {
    delete item.article;
  }

  if (item.cat === "gemApps") {
    item.app = item.app || {};
    const appStore = links.find((href) => href.includes("apps.apple.com") || href.includes("itunes.apple.com"));
    const playStore = links.find((href) => href.includes("play.google.com"));
    if (empty(item.app.appStore) && appStore) {
      item.app.appStore = appStore;
      changed = true;
    }
    if (empty(item.app.playStore) && playStore) {
      item.app.playStore = playStore;
      changed = true;
    }
    if (empty(item.app.icon) && image) {
      item.app.icon = image;
      changed = true;
    }
    if (!item.app.appStore && !item.app.playStore && !item.app.icon && empty(item.app.screenshots) && empty(item.app.price) && empty(item.app.rating) && empty(item.app.platforms)) {
      delete item.app;
    }
  }

  if (changed) console.log(`enriched ${item.title}`);
  return changed;
}

async function pool(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item) await worker(item);
    }
  });
  await Promise.all(runners);
}

const index = read("index.json");
const dates = dateArg ? [dateArg] : index.days.map((day) => day.date);
let filesChanged = 0;

for (const date of dates) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error(`Skip bad date ${date}`);
    continue;
  }
  const file = `${date}.json`;
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`Missing ${file}`);
    continue;
  }
  const edition = read(file);
  await pool(edition.items, 4, enrichItem);
  if (writeIfChanged(file, edition)) filesChanged += 1;
  if (index.latest === date) writeIfChanged("today.json", edition);
}

console.log(`Article enrich touched ${filesChanged} edition file(s).`);
