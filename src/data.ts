import type { AppInfo, Article, Cat, DayIndex, Edition, Item, PlaceInfo } from "./types";

const CATS = new Set<Cat>(["memes", "places", "things", "gemPlaces", "gemApps"]);

async function fetchJson<T>(file: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${file}`;
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${file} (${response.status})`);
  return response.json() as Promise<T>;
}

function strings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  return list.length ? list : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asArticle(value: unknown): Article | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Article;
  const article: Article = {
    html: optionalString(raw.html),
    paragraphs: strings(raw.paragraphs),
    byline: optionalString(raw.byline),
    published: optionalString(raw.published),
    siteName: optionalString(raw.siteName),
  };
  if (!article.html && !article.paragraphs && !article.byline && !article.published && !article.siteName) return undefined;
  return article;
}

function asPlace(value: unknown): PlaceInfo | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as PlaceInfo;
  const place: PlaceInfo = {
    hours: optionalString(raw.hours),
    price: optionalString(raw.price),
    area: optionalString(raw.area),
    phone: optionalString(raw.phone),
    rating: optionalString(raw.rating),
    photos: strings(raw.photos),
  };
  if (!place.hours && !place.price && !place.area && !place.phone && !place.rating && !place.photos) return undefined;
  return place;
}

function asApp(value: unknown): AppInfo | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as AppInfo;
  const app: AppInfo = {
    icon: optionalString(raw.icon),
    screenshots: strings(raw.screenshots),
    rating: optionalString(raw.rating),
    price: optionalString(raw.price),
    platforms: strings(raw.platforms),
    appStore: optionalString(raw.appStore),
    playStore: optionalString(raw.playStore),
  };
  if (!app.icon && !app.screenshots && !app.rating && !app.price && !app.platforms && !app.appStore && !app.playStore) return undefined;
  return app;
}

function normalizeItem(raw: unknown): Item | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Item>;
  if (!item.cat || !CATS.has(item.cat)) return null;
  if (typeof item.title !== "string" || typeof item.href !== "string") return null;
  const facts = Array.isArray(item.facts)
    ? item.facts
        .filter((fact): fact is [string, string] => Array.isArray(fact) && fact.length >= 2)
        .map((fact) => [String(fact[0]), String(fact[1])] as [string, string])
    : undefined;
  return {
    cat: item.cat,
    title: item.title,
    note: typeof item.note === "string" ? item.note : "",
    source: typeof item.source === "string" ? item.source : "",
    href: item.href,
    tag: typeof item.tag === "string" ? item.tag : "",
    read: typeof item.read === "string" ? item.read : undefined,
    facts,
    image: typeof item.image === "string" ? item.image : undefined,
    video: typeof item.video === "string" ? item.video : undefined,
    embed: item.embed,
    mapQuery: typeof item.mapQuery === "string" ? item.mapQuery : undefined,
    favicon: optionalString(item.favicon),
    videoStyle: item.videoStyle === "short" || item.videoStyle === "wide" ? item.videoStyle : undefined,
    article: asArticle(item.article),
    place: asPlace(item.place),
    app: asApp(item.app),
  };
}

export function requestedDay(): string | null {
  const day = new URLSearchParams(window.location.search).get("day");
  return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

export async function loadIndex(): Promise<DayIndex> {
  const data = await fetchJson<DayIndex>("index.json");
  if (!data.latest || !Array.isArray(data.days)) throw new Error("Day index is missing latest or days");
  return data;
}

export async function loadEdition(which: string): Promise<Edition> {
  const file = which === "today" ? "today.json" : `${which}.json`;
  if (which !== "today" && !/^\d{4}-\d{2}-\d{2}$/.test(which)) throw new Error("Unknown day");
  const data = await fetchJson<Edition>(file);
  const items = (data.items ?? []).map(normalizeItem).filter((item): item is Item => item !== null);
  if (!data.date || items.length === 0) throw new Error(`${file} has no finds`);
  return { date: data.date, updated: data.updated || data.date, items };
}

export async function loadInitial(requested: string | null): Promise<{ index: DayIndex; edition: Edition }> {
  const index = await loadIndex();
  const known = requested && index.days.some((day) => day.date === requested) ? requested : null;
  if (known) return { index, edition: await loadEdition(known) };
  try {
    return { index, edition: await loadEdition("today") };
  } catch {
    return { index, edition: await loadEdition(index.latest) };
  }
}
