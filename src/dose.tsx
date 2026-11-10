import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { loadEdition, loadInitial, requestedDay } from "./data";
import { safeHttpUrl } from "./media";
import { usePersonal } from "./personal";
import { filterItems } from "./select";
import type { DayIndex, Edition, Item } from "./types";

type Dose = {
  edition: Edition | null;
  index: DayIndex | null;
  loading: boolean;
  error: string;
  pending: boolean;
  archive: Edition[];
  archiveState: "idle" | "loading" | "ready";
  searchAll: boolean;
  setSearchAll: (value: boolean) => void;
  reload: () => Promise<void>;
  selectDay: (date: string) => Promise<void>;
  personal: ReturnType<typeof usePersonal>;
  toast: string;
  setToast: (message: string) => void;
  share: (item: Item) => Promise<void>;
  quick: Item | null;
  setQuick: (item: Item | null) => void;
  findItem: (href: string) => Item | undefined;
};

const DoseContext = createContext<Dose | null>(null);

export function DoseProvider({ children }: { children: ReactNode }) {
  const personal = usePersonal();
  const [index, setIndex] = useState<DayIndex | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [archive, setArchive] = useState<Edition[]>([]);
  const [archiveState, setArchiveState] = useState<"idle" | "loading" | "ready">("idle");
  const [searchAll, setSearchAll] = useState(false);
  const [toast, setToast] = useState("");
  const [quick, setQuick] = useState<Item | null>(null);

  const load = useCallback(async () => {
    setError("");
    const result = await loadInitial(requestedDay());
    setIndex(result.index);
    setEdition(result.edition);
  }, []);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    load()
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not load Daily Dose");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [load]);

  useEffect(() => {
    personal.touchStreak();
  }, [personal.touchStreak]);

  useEffect(() => {
    if (!searchAll || !index || !edition) return;
    const missing = index.days.filter((day) => day.date !== edition.date);
    if (missing.length === 0) {
      setArchiveState("ready");
      return;
    }
    let cancel = false;
    setArchiveState("loading");
    (async () => {
      const loaded: Edition[] = [];
      for (const day of missing) {
        if (cancel) return;
        try {
          loaded.push(await loadEdition(day.date));
          if (!cancel) setArchive([...loaded]);
        } catch {
          /* skip a day that fails to load */
        }
      }
      if (!cancel) setArchiveState("ready");
    })();
    return () => {
      cancel = true;
    };
  }, [searchAll, index, edition]);

  const selectDay = useCallback(async (date: string) => {
    if (!index || !edition || date === edition.date) return;
    setPending(true);
    try {
      const next = await loadEdition(date);
      setEdition(next);
    } catch (reason: unknown) {
      setToast(reason instanceof Error ? reason.message : "Could not load that day");
    } finally {
      setPending(false);
    }
  }, [edition, index]);

  const share = useCallback(async (item: Item) => {
    const url = safeHttpUrl(item.href) ?? item.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.note, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch {
      setToast(url);
    }
  }, []);

  const findItem = useCallback((href: string) => {
    return [edition, ...archive].flatMap((day) => day?.items ?? []).find((item) => item.href === href)
      ?? personal.saved.map((record) => ({
        cat: record.cat,
        title: record.title,
        note: record.note,
        source: record.source,
        href: record.href,
        tag: record.tag,
        read: record.read,
        image: record.image,
      })).find((item) => item.href === href);
  }, [archive, edition, personal.saved]);

  const value = useMemo<Dose>(() => ({
    edition,
    index,
    loading,
    error,
    pending,
    archive,
    archiveState,
    searchAll,
    setSearchAll,
    reload: load,
    selectDay,
    personal,
    toast,
    setToast,
    share,
    quick,
    setQuick,
    findItem,
  }), [archive, archiveState, edition, error, findItem, index, load, loading, pending, personal, quick, searchAll, selectDay, share, toast]);

  return <DoseContext.Provider value={value}>{children}</DoseContext.Provider>;
}

export function useDose(): Dose {
  const value = useContext(DoseContext);
  if (!value) throw new Error("useDose outside DoseProvider");
  return value;
}

export function itemHrefParam(item: Item): string {
  return encodeURIComponent(item.href);
}

export function searchHits(edition: Edition, archive: Edition[], query: string) {
  return [edition, ...archive]
    .map((day) => ({ date: day.date, updated: day.updated, items: filterItems(day.items, "all", query, 0) }))
    .filter((day) => day.items.length > 0);
}
