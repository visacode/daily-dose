import type { Cat, DayIndex, Edition, Item } from "./types";

const CATS = new Set<Cat>(["memes", "places", "things", "gemPlaces", "gemApps"]);

async function fetchJson<T>(file: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}data/${file}`;
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${file} (${response.status})`);
  return response.json() as Promise<T>;
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
