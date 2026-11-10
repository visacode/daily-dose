import type { Cat, TabId } from "./types";

export type CatMeta = {
  label: string;
  short: string;
  bot: string;
  icon: string;
  a: string;
  b: string;
};

export const META: Record<Cat, CatMeta> = {
  memes: { label: "Memes & Funny", short: "Memes", bot: "Daily Memes", icon: "😂", a: "#FF3D7F", b: "#FF9A3D" },
  places: { label: "Trending Places", short: "Places", bot: "Trend Spotter", icon: "📍", a: "#FF6A3D", b: "#FFC53D" },
  things: { label: "Trending Things", short: "Things", bot: "Trend Spotter", icon: "🔥", a: "#7C4DFF", b: "#3DA5FF" },
  gemPlaces: { label: "Hidden Gem Places in Riyadh", short: "Gem places", bot: "Hidden Gems", icon: "💎", a: "#0FB5A6", b: "#3DD8FF" },
  gemApps: { label: "Hidden Gem Products & Apps", short: "Gem apps", bot: "Hidden Gems", icon: "🧩", a: "#16C172", b: "#B6E83D" },
};

export type TabDef = {
  value: TabId;
  label: string;
  short: string;
  icon: string;
  a: string;
  b: string;
  cats: Cat[];
};

export const TABS: TabDef[] = [
  { value: "all", label: "Everything", short: "All", icon: "✨", a: "#7C4DFF", b: "#FF3D7F", cats: ["memes", "places", "things", "gemPlaces", "gemApps"] },
  { value: "memes", label: "Memes", short: "Memes", icon: "😂", a: META.memes.a, b: META.memes.b, cats: ["memes"] },
  { value: "trends", label: "Trends", short: "Trends", icon: "🔥", a: META.things.a, b: META.places.b, cats: ["places", "things"] },
  { value: "gems", label: "Hidden Gems", short: "Gems", icon: "💎", a: META.gemPlaces.a, b: META.gemApps.b, cats: ["gemPlaces", "gemApps"] },
];

export function grad(cat: Cat, deg = 135): string {
  const meta = META[cat];
  return `linear-gradient(${deg}deg, ${meta.a}, ${meta.b})`;
}
