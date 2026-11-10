import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public/data");
const CATS = new Set(["memes", "places", "things", "gemPlaces", "gemApps"]);
const EMBEDS = new Set(["youtube", "x", "tiktok", "instagram", "image", "map", "none"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    fail(`Missing public/data/${file}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (error) {
    fail(`public/data/${file} is not valid JSON (${error.message})`);
    return null;
  }
}

function httpUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function checkStringList(where, value) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) fail(`${where} must be an array of strings`);
}

function checkArticle(where, article) {
  if (!article || typeof article !== "object") {
    fail(`${where} must be an object`);
    return;
  }
  if (article.html !== undefined && typeof article.html !== "string") fail(`${where}.html must be a string`);
  if (article.paragraphs !== undefined) checkStringList(`${where}.paragraphs`, article.paragraphs);
  for (const key of ["byline", "published", "siteName"]) {
    if (article[key] !== undefined && typeof article[key] !== "string") fail(`${where}.${key} must be a string`);
  }
}

function checkPlace(where, place) {
  if (!place || typeof place !== "object") {
    fail(`${where} must be an object`);
    return;
  }
  for (const key of ["hours", "price", "area", "phone", "rating"]) {
    if (place[key] !== undefined && typeof place[key] !== "string") fail(`${where}.${key} must be a string`);
  }
  if (place.photos !== undefined) {
    checkStringList(`${where}.photos`, place.photos);
    if (Array.isArray(place.photos) && place.photos.some((entry) => !httpUrl(entry))) fail(`${where}.photos must be http(s) URLs`);
  }
}

function checkApp(where, app) {
  if (!app || typeof app !== "object") {
    fail(`${where} must be an object`);
    return;
  }
  for (const key of ["rating", "price"]) {
    if (app[key] !== undefined && typeof app[key] !== "string") fail(`${where}.${key} must be a string`);
  }
  for (const key of ["icon", "appStore", "playStore"]) {
    if (app[key] !== undefined && !httpUrl(app[key])) fail(`${where}.${key} must be an http(s) URL`);
  }
  if (app.platforms !== undefined) checkStringList(`${where}.platforms`, app.platforms);
  if (app.screenshots !== undefined) {
    checkStringList(`${where}.screenshots`, app.screenshots);
    if (Array.isArray(app.screenshots) && app.screenshots.some((entry) => !httpUrl(entry))) fail(`${where}.screenshots must be http(s) URLs`);
  }
}

function checkEdition(file, data) {
  if (!data || typeof data !== "object") return;
  if (!DATE.test(data.date || "")) fail(`${file}: date must be YYYY-MM-DD`);
  if (typeof data.updated !== "string" || !data.updated.trim()) fail(`${file}: updated must be a non-empty string`);
  if (!Array.isArray(data.items) || data.items.length === 0) {
    fail(`${file}: items must be a non-empty array`);
    return;
  }
  data.items.forEach((item, index) => {
    const where = `${file} items[${index}]`;
    if (!item || typeof item !== "object") {
      fail(`${where} must be an object`);
      return;
    }
    for (const key of ["cat", "title", "note", "source", "href", "tag"]) {
      if (typeof item[key] !== "string" || !item[key].trim()) fail(`${where}.${key} is required`);
    }
    if (item.cat && !CATS.has(item.cat)) fail(`${where}.cat must be memes, places, things, gemPlaces, or gemApps`);
    if (item.href && !/^https?:\/\//.test(item.href)) fail(`${where}.href must be an http(s) URL`);
    if (item.read !== undefined && typeof item.read !== "string") fail(`${where}.read must be a string`);
    if (item.image !== undefined && (typeof item.image !== "string" || !/^https?:\/\//.test(item.image))) {
      fail(`${where}.image must be an http(s) URL`);
    }
    if (item.video !== undefined && (typeof item.video !== "string" || !/^https?:\/\//.test(item.video))) {
      fail(`${where}.video must be an http(s) URL`);
    }
    if (item.embed !== undefined && !EMBEDS.has(item.embed)) {
      fail(`${where}.embed must be youtube, x, tiktok, instagram, image, map, or none`);
    }
    if (item.mapQuery !== undefined && typeof item.mapQuery !== "string") fail(`${where}.mapQuery must be a string`);
    if (item.favicon !== undefined && (typeof item.favicon !== "string" || !/^https?:\/\//.test(item.favicon))) {
      fail(`${where}.favicon must be an http(s) URL`);
    }
    if (item.videoStyle !== undefined && item.videoStyle !== "short" && item.videoStyle !== "wide") {
      fail(`${where}.videoStyle must be short or wide`);
    }
    if (item.article !== undefined) checkArticle(`${where}.article`, item.article);
    if (item.place !== undefined) checkPlace(`${where}.place`, item.place);
    if (item.app !== undefined) checkApp(`${where}.app`, item.app);
    if (item.facts !== undefined) {
      if (!Array.isArray(item.facts)) fail(`${where}.facts must be an array of [label, value]`);
      else {
        item.facts.forEach((fact, factIndex) => {
          if (!Array.isArray(fact) || fact.length !== 2 || typeof fact[0] !== "string" || typeof fact[1] !== "string") {
            fail(`${where}.facts[${factIndex}] must be [label, value] strings`);
          }
        });
      }
    }
  });
  const hrefs = data.items.map((item) => item && item.href);
  const duplicate = hrefs.find((href, index) => href && hrefs.indexOf(href) !== index);
  if (duplicate) fail(`${file}: duplicate href ${duplicate}`);
}

const index = readJson("index.json");
const today = readJson("today.json");

if (index) {
  if (!DATE.test(index.latest || "")) fail("index.json: latest must be YYYY-MM-DD");
  if (!Array.isArray(index.days) || index.days.length === 0) fail("index.json: days must be a non-empty array");
  else {
    const seen = new Set();
    for (const day of index.days) {
      if (!day || !DATE.test(day.date || "")) {
        fail("index.json: every day needs a YYYY-MM-DD date");
        continue;
      }
      if (seen.has(day.date)) fail(`index.json lists ${day.date} more than once`);
      seen.add(day.date);
      if (typeof day.updated !== "string" || !day.updated.trim()) fail(`index.json ${day.date}: updated must be a string`);
      const edition = readJson(`${day.date}.json`);
      if (!edition) continue;
      checkEdition(`${day.date}.json`, edition);
      if (edition.date !== day.date) fail(`${day.date}.json date field is ${edition.date}`);
      if (edition.updated !== day.updated) fail(`${day.date}.json updated does not match index.json`);
      if (Array.isArray(edition.items) && day.count !== edition.items.length) {
        fail(`index.json count for ${day.date} is ${day.count}, file has ${edition.items.length} items`);
      }
    }
    if (index.latest && !seen.has(index.latest)) fail("index.json latest is not listed in days");
  }
}

if (today) {
  checkEdition("today.json", today);
  if (index?.latest && today.date !== index.latest) {
    fail(`today.json date is ${today.date} but index.latest is ${index.latest}`);
  }
  if (index?.latest) {
    const latestPath = path.join(root, `${index.latest}.json`);
    if (fs.existsSync(latestPath)) {
      const latest = JSON.parse(fs.readFileSync(latestPath, "utf8"));
      if (JSON.stringify(latest) !== JSON.stringify(today)) {
        fail(`today.json must be identical to ${index.latest}.json`);
      }
    }
  }
}

if (fs.existsSync(root)) {
  const dated = fs.readdirSync(root).filter((name) => DATE.test(name.slice(0, -5)) && name.endsWith(".json"));
  const listed = new Set((index?.days || []).map((day) => `${day.date}.json`));
  for (const name of dated) {
    if (!listed.has(name)) fail(`${name} is not listed in index.json`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`OK ${index.days.length} edition(s), latest ${index.latest}, ${today.items.length} items in today.json`);
