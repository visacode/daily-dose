import { cardThumb, isWatchItem } from "./media";
import { META } from "./meta";
import type { Cat, DayIndex, Item } from "./types";

export function issueNo(index: DayIndex, date: string): string {
  const ordered = index.days.map((day) => day.date).sort();
  const place = ordered.indexOf(date);
  const value = place >= 0 ? place + 1 : ordered.length || 1;
  return String(value).padStart(2, "0");
}

export function topPath(date: string, latest: string): string {
  return date === latest ? "/" : `/issue/${date}`;
}

export function sectionPath(date: string, latest: string, section: string): string {
  return date === latest ? `/${section}` : `/issue/${date}/${section}`;
}

export function storyPath(item: { href: string }): string {
  return `/story/${encodeURIComponent(item.href)}`;
}

export function readMinutes(item: Item): number {
  const text = [item.note, item.read ?? "", item.article?.byline ?? "", ...(item.article?.paragraphs ?? [])].join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function byline(item: Item): string {
  const parts = [item.article?.byline, item.source, item.article?.siteName]
    .map((part) => part?.replace(/\s+/g, " ").trim())
    .filter((part): part is string => Boolean(part));
  return [...new Set(parts)].join(" · ");
}

export function kickerLabel(cat: Cat): string {
  return META[cat].short;
}

export function pullQuote(item: Item): string | null {
  const source = (item.read && item.read !== item.note ? item.read : item.note).replace(/\s+/g, " ").trim();
  const sentences = source.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter((part) => part.length > 48);
  if (sentences.length > 1) return sentences[1];
  if (sentences[0] && sentences[0] !== item.note) return sentences[0];
  return null;
}

function scoreCover(item: Item): number {
  let score = 0;
  if (cardThumb(item)) score += 5;
  if (item.article?.html || item.article?.paragraphs?.length) score += 3;
  if (item.note.length > 80) score += 2;
  if (item.cat === "places" || item.cat === "things") score += 2;
  if (isWatchItem(item)) score += 1;
  return score;
}

export function coverStory(items: Item[]): Item | undefined {
  return items
    .map((item, index) => ({ item, index, score: scoreCover(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.item;
}

export function without(items: Item[], used: Set<string>): Item[] {
  return items.filter((item) => !used.has(item.href));
}

export function greeting(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function issueMinutes(items: Item[]): number {
  return items.reduce((sum, item) => sum + readMinutes(item), 0);
}

const SECTION_ORDER: Cat[] = ["memes", "places", "things", "gemPlaces", "gemApps"];

export function sectionCounts(items: Item[]): { cat: Cat; label: string; count: number }[] {
  return SECTION_ORDER.map((cat) => ({
    cat,
    label: META[cat].short,
    count: items.filter((item) => item.cat === cat).length,
  })).filter((entry) => entry.count > 0);
}

export function quoteOfDay(items: Item[], date: string): { text: string; source: string; word: string } | null {
  const choices = items.flatMap((item) => {
    const text = pullQuote(item) ?? (item.note.trim().length > 70 ? item.note.trim() : null);
    const tag = item.tag.trim();
    return text ? [{ text, source: item.source, word: tag.length <= 32 ? tag : "" }] : [];
  });
  if (!choices.length) return null;
  const seed = date.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return choices[seed % choices.length];
}

export function storyHrefFromPath(pathname: string): string | null {
  const hashPath = window.location.hash.replace(/^#/, "").split("?")[0];
  const path = hashPath.startsWith("/story/") ? hashPath : pathname;
  if (!path.startsWith("/story/")) return null;
  const raw = path.slice("/story/".length);
  try { return decodeURIComponent(raw); } catch { return raw; }
}
