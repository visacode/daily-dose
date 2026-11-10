/**
 * Fills a missing `image` on items by reading og:image / twitter:image.
 * Skips YouTube and X, which the site embeds directly.
 *
 * Usage: node scripts/enrich-previews.mjs [YYYY-MM-DD]
 * With no date, enriches index.json `latest` and rewrites today.json to match.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public/data");
const dateArg = process.argv[2]?.trim();

function read(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function write(file, data) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`);
}

const index = read("index.json");
const date = dateArg || index.latest;
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("Pass a YYYY-MM-DD date, or leave it empty to use index.latest.");
  process.exit(1);
}

const edition = read(`${date}.json`);
let updated = 0;

function metaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decode(match[1]);
  }
  return null;
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function skip(item) {
  if (item.image) return true;
  if (item.embed === "youtube" || item.embed === "x") return true;
  return /youtube\.com|youtu\.be|\/\/(x|twitter)\.com\//.test(item.href);
}

for (const item of edition.items) {
  if (skip(item)) continue;
  try {
    const response = await fetch(item.href, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "text/html",
        "user-agent": "DailyDosePreview/1.0",
      },
    });
    if (!response.ok) {
      console.log(`skip ${response.status} ${item.title}`);
      continue;
    }
    const reader = response.body?.getReader();
    if (!reader) continue;
    const chunks = [];
    let received = 0;
    while (received < 180_000) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const html = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
    const raw = metaContent(html, "og:image") || metaContent(html, "twitter:image");
    if (!raw) {
      console.log(`no image ${item.title}`);
      continue;
    }
    const absolute = new URL(raw, response.url);
    if (absolute.protocol !== "https:" && absolute.protocol !== "http:") continue;
    item.image = absolute.href;
    updated += 1;
    console.log(`image ${item.title}`);
  } catch (error) {
    console.log(`fail ${item.title}: ${error.message}`);
  }
}

write(`${date}.json`, edition);
if (index.latest === date) write("today.json", edition);
const day = index.days.find((entry) => entry.date === date);
if (day) day.count = edition.items.length;
write("index.json", index);
console.log(`Updated ${updated} image field(s) in ${date}.json`);
