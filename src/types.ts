export type Cat = "memes" | "places" | "things" | "gemPlaces" | "gemApps";
export type EmbedKind = "youtube" | "x" | "tiktok" | "instagram" | "image" | "map" | "none";
export type TabId = "all" | "memes" | "trends" | "gems";
export type ViewMode = "cards" | "list";
export type ThemeName = "dark" | "light";

export type Item = {
  cat: Cat;
  title: string;
  note: string;
  source: string;
  href: string;
  tag: string;
  read?: string;
  facts?: [string, string][];
  image?: string;
  video?: string;
  embed?: EmbedKind;
  mapQuery?: string;
};

export type Edition = {
  date: string;
  updated: string;
  items: Item[];
};

export type DayRef = {
  date: string;
  updated: string;
  count: number;
};

export type DayIndex = {
  latest: string;
  days: DayRef[];
};

export type ReaderState = {
  item: Item;
  list: Item[];
};
