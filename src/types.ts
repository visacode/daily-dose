export type Cat = "memes" | "places" | "things" | "gemPlaces" | "gemApps";
export type EmbedKind = "youtube" | "x" | "tiktok" | "instagram" | "image" | "map" | "none";
export type TabId = "all" | "memes" | "trends" | "gems" | "saved";
export type ViewMode = "cards" | "list";
export type ThemeName = "dark" | "light";
export type VideoStyle = "short" | "wide";

export type Article = {
  html?: string;
  paragraphs?: string[];
  byline?: string;
  published?: string;
  siteName?: string;
};

export type PlaceInfo = {
  hours?: string;
  price?: string;
  area?: string;
  phone?: string;
  photos?: string[];
  rating?: string;
};

export type AppInfo = {
  icon?: string;
  screenshots?: string[];
  rating?: string;
  price?: string;
  platforms?: string[];
  appStore?: string;
  playStore?: string;
};

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
  favicon?: string;
  videoStyle?: VideoStyle;
  article?: Article;
  place?: PlaceInfo;
  app?: AppInfo;
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

export type SavedRecord = {
  href: string;
  title: string;
  note: string;
  source: string;
  cat: Cat;
  tag: string;
  date: string;
  image?: string;
  read?: string;
};
