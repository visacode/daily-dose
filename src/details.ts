import type { AppInfo, Item, PlaceInfo } from "./types";

function fact(item: Item, pattern: RegExp): string | undefined {
  return item.facts?.find(([label]) => pattern.test(label))?.[1];
}

export function placeDetails(item: Item): PlaceInfo {
  const weekday = fact(item, /^weekday hours/i);
  const weekend = fact(item, /^weekend hours/i);
  const combined = [weekday ? `Weekdays ${weekday}` : "", weekend ? `Weekends ${weekend}` : ""].filter(Boolean).join(" · ");
  const fromFacts: PlaceInfo = {
    hours: fact(item, /^hours$/i) || combined || undefined,
    price: fact(item, /price|ticket|admission|cost/i),
    area: fact(item, /^(address|location|venue|area|where)\b/i),
    phone: fact(item, /^phone\b/i),
    rating: fact(item, /rating/i),
  };
  const explicit = item.place ?? {};
  return {
    hours: explicit.hours || fromFacts.hours,
    price: explicit.price || fromFacts.price,
    area: explicit.area || fromFacts.area,
    phone: explicit.phone || fromFacts.phone,
    rating: explicit.rating || fromFacts.rating,
    photos: explicit.photos?.length ? explicit.photos : item.image ? [item.image] : [],
  };
}

export function appDetails(item: Item): AppInfo {
  const platformFact = fact(item, /platform/i);
  const fromFacts: AppInfo = {
    price: fact(item, /^price\b|free plan/i),
    rating: fact(item, /rating/i),
    platforms: platformFact ? platformFact.split(/,|·|\band\b/).map((part) => part.trim()).filter(Boolean) : undefined,
  };
  const explicit = item.app ?? {};
  return {
    icon: explicit.icon,
    screenshots: explicit.screenshots?.length ? explicit.screenshots : item.image ? [item.image] : [],
    rating: explicit.rating || fromFacts.rating,
    price: explicit.price || fromFacts.price,
    platforms: explicit.platforms?.length ? explicit.platforms : fromFacts.platforms,
    appStore: explicit.appStore,
    playStore: explicit.playStore,
  };
}

export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.length < 6) return null;
  return `tel:${digits}`;
}

export function directionsLinks(query: string): { google: string; apple: string } {
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`,
    apple: `https://maps.apple.com/?daddr=${encodeURIComponent(query)}`,
  };
}
