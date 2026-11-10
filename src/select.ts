import { TABS } from "./meta";
import type { Cat, Item, TabId } from "./types";

export function catsFor(tab: TabId): Cat[] {
  return TABS.find((entry) => entry.value === tab)?.cats ?? TABS[0].cats;
}

export function shuffleItems(items: Item[], seed: number): Item[] {
  if (seed === 0) return items;
  return items
    .map((item, index) => ({
      item,
      key: Math.abs(Math.sin((index + 1) * 12.9898 * seed) * 43758.5453) % 1,
    }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.item);
}

export function filterItems(items: Item[], tab: TabId, query: string, seed: number): Item[] {
  const cats = new Set(catsFor(tab));
  const needle = query.trim().toLowerCase();
  const matched = items.filter((item) => {
    if (!cats.has(item.cat)) return false;
    if (!needle) return true;
    const hay = [
      item.title,
      item.note,
      item.tag,
      item.source,
      item.read ?? "",
      item.article?.byline ?? "",
      item.article?.siteName ?? "",
      ...(item.article?.paragraphs ?? []),
      item.place?.area ?? "",
      item.place?.hours ?? "",
      item.app?.price ?? "",
      ...(item.app?.platforms ?? []),
    ].join(" ").toLowerCase();
    return hay.includes(needle);
  });
  return shuffleItems(matched, seed);
}

export function groupItems(items: Item[], tab: TabId): { cat: Cat; items: Item[] }[] {
  return catsFor(tab)
    .map((cat) => ({ cat, items: items.filter((item) => item.cat === cat) }))
    .filter((group) => group.items.length > 0);
}

export function spotlightPicks(items: Item[]): Item[] {
  const order: Cat[] = ["memes", "places", "gemPlaces", "things", "gemApps"];
  const picks: Item[] = [];
  for (const cat of order) {
    const found = items.find((item) => item.cat === cat);
    if (found) picks.push(found);
  }
  return picks;
}

export function countCats(items: Item[], cats: Cat[]): number {
  const wanted = new Set(cats);
  return items.filter((item) => wanted.has(item.cat)).length;
}
