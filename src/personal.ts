import { useCallback, useEffect, useState } from "react";
import type { Item, SavedRecord } from "./types";

const SAVED_KEY = "daily-dose-saved";
const SEEN_KEY = "daily-dose-seen";
const STREAK_KEY = "daily-dose-streak";

export type Streak = { lastDay: string; count: number };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function riyadhDay(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function previousDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  return date.toISOString().slice(0, 10);
}

export function snapshot(item: Item, date: string): SavedRecord {
  return {
    href: item.href,
    title: item.title,
    note: item.note,
    source: item.source,
    cat: item.cat,
    tag: item.tag,
    date,
    image: item.image,
    read: item.read,
  };
}

export function usePersonal() {
  const [saved, setSaved] = useState<SavedRecord[]>(() => {
    const parsed = readJson<SavedRecord[]>(SAVED_KEY, []);
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.href === "string") : [];
  });
  const [seen, setSeen] = useState<string[]>(() => {
    const parsed = readJson<string[]>(SEEN_KEY, []);
    return Array.isArray(parsed) ? parsed.filter((href) => typeof href === "string") : [];
  });
  const [streak, setStreak] = useState<Streak>(() => {
    const parsed = readJson<Streak>(STREAK_KEY, { lastDay: "", count: 0 });
    return parsed && typeof parsed.count === "number" ? parsed : { lastDay: "", count: 0 };
  });

  useEffect(() => writeJson(SAVED_KEY, saved), [saved]);
  useEffect(() => writeJson(SEEN_KEY, seen), [seen]);
  useEffect(() => writeJson(STREAK_KEY, streak), [streak]);

  const toggleSave = useCallback((item: Item, date: string) => {
    setSaved((current) => {
      if (current.some((entry) => entry.href === item.href)) return current.filter((entry) => entry.href !== item.href);
      return [snapshot(item, date), ...current].slice(0, 400);
    });
  }, []);

  const markSeen = useCallback((href: string) => {
    setSeen((current) => (current.includes(href) ? current : [href, ...current].slice(0, 2000)));
  }, []);

  const touchStreak = useCallback(() => {
    const today = riyadhDay();
    setStreak((current) => {
      if (current.lastDay === today) return current;
      const count = current.lastDay === previousDay(today) ? current.count + 1 : 1;
      return { lastDay: today, count };
    });
  }, []);

  return {
    saved,
    seen,
    streak,
    toggleSave,
    markSeen,
    touchStreak,
    isSaved: (href: string) => saved.some((entry) => entry.href === href),
    isSeen: (href: string) => seen.includes(href),
  };
}
