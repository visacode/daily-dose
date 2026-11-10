import type { EmbedKind, Item } from "./types";

const YOUTUBE_ID = /^[\w-]{6,20}$/;
const MAP_FACT = /^(address|location|venue|where)\b/i;

function cleanId(value: string | null | undefined): string | null {
  if (!value) return null;
  const id = value.split("?")[0]?.split("&")[0] ?? "";
  return YOUTUBE_ID.test(id) ? id : null;
}

export function youtubeId(href: string): string | null {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return cleanId(url.pathname.split("/").filter(Boolean)[0]);
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const fromQuery = cleanId(url.searchParams.get("v"));
      if (fromQuery) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((part) => part === "shorts" || part === "embed" || part === "live" || part === "v");
      if (marker >= 0) return cleanId(parts[marker + 1]);
    }
  } catch {
    return null;
  }
  return null;
}

export function tweetStatusId(href: string): string | null {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "x.com" && host !== "twitter.com" && host !== "mobile.twitter.com" && host !== "mobile.x.com") return null;
    const match = url.pathname.match(/\/status\/(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function tiktokEmbedUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (!url.hostname.includes("tiktok.com")) return null;
    const match = url.pathname.match(/\/video\/(\d+)/);
    if (!match) return null;
    return `https://www.tiktok.com/embed/v2/${match[1]}`;
  } catch {
    return null;
  }
}

export function instagramEmbedUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (!url.hostname.endsWith("instagram.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if ((parts[0] === "p" || parts[0] === "reel" || parts[0] === "tv") && parts[1]) {
      return `https://www.instagram.com/${parts[0]}/${parts[1]}/embed`;
    }
  } catch {
    return null;
  }
  return null;
}

export function inferEmbed(item: Item): EmbedKind {
  if (item.embed) return item.embed;
  if (youtubeId(item.href) || (item.video ? youtubeId(item.video) : null)) return "youtube";
  if (tweetStatusId(item.href)) return "x";
  if (tiktokEmbedUrl(item.href)) return "tiktok";
  if (instagramEmbedUrl(item.href)) return "instagram";
  if (/google\.[^/]+\/maps|maps\.google\.|maps\.app\.goo\.gl/.test(item.href)) return "map";
  if (item.cat === "places" || item.cat === "gemPlaces") return "map";
  if (item.image) return "image";
  return "none";
}

export function youtubeEmbedUrl(item: Item): string | null {
  const id = youtubeId(item.href) || (item.video ? youtubeId(item.video) : null);
  if (!id) return null;
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function isYoutubeShort(item: Item): boolean {
  return /youtube\.com\/shorts\//.test(item.href) || /youtube\.com\/shorts\//.test(item.video ?? "");
}

export function mapQueryFor(item: Item): string {
  if (item.mapQuery?.trim()) return item.mapQuery.trim();
  try {
    const url = new URL(item.href);
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    if (query) return query;
    const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
    if (place?.[1]) return decodeURIComponent(place[1].replace(/\+/g, " "));
  } catch {
    /* fall through to facts and title */
  }
  const fact = item.facts?.find(([label]) => MAP_FACT.test(label));
  if (fact) return fact[1];
  if (item.cat === "gemPlaces" || item.tag === "Riyadh") return `${item.title}, Riyadh`;
  return item.title;
}

export function mapEmbedUrl(item: Item): string {
  const query = mapQueryFor(item);
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed&iwloc=near`;
}

export function shouldShowMap(item: Item): boolean {
  if (item.embed === "none") return false;
  const kind = inferEmbed(item);
  if (kind === "youtube" || kind === "x" || kind === "tiktok" || kind === "instagram") return false;
  if (kind === "map") return true;
  return item.cat === "places" || item.cat === "gemPlaces";
}

export function cardThumb(item: Item): string | null {
  if (item.image) return item.image;
  const id = youtubeId(item.href) || (item.video ? youtubeId(item.video) : null);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return null;
}

export function directVideoUrl(item: Item): string | null {
  if (!item.video) return null;
  if (youtubeId(item.video)) return null;
  return item.video;
}

export function isPlayable(item: Item): boolean {
  const kind = inferEmbed(item);
  return kind === "youtube" || kind === "tiktok" || kind === "instagram" || Boolean(directVideoUrl(item));
}

export function safeHttpUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

let twitterPromise: Promise<void> | null = null;

export function ensureTwitter(): Promise<void> {
  if (window.twttr?.widgets) return Promise.resolve();
  if (twitterPromise) return twitterPromise;
  const existing = document.querySelector<HTMLScriptElement>("script[data-daily-dose-twitter]");
  const script = existing ?? document.createElement("script");
  const created = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (window.twttr?.ready) {
        window.twttr.ready(() => resolve());
        return;
      }
      if (window.twttr?.widgets) {
        resolve();
        return;
      }
      reject(new Error("X widgets did not start"));
    };
    const fail = () => reject(new Error("X widgets failed to load"));
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });
    if (!existing) {
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.dataset.dailyDoseTwitter = "true";
      document.body.appendChild(script);
    }
  });
  twitterPromise = created;
  void created.catch(() => {
    script.remove();
    if (twitterPromise === created) twitterPromise = null;
  });
  return created;
}
