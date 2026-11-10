import { useEffect, useMemo, useRef, useState } from "react";
import { Explore } from "./components/Explore";
import { Poster } from "./components/Poster";
import { Reader } from "./components/Reader";
import { Shell, type ScreenId } from "./components/Shell";
import { Today } from "./components/Today";
import { Watch } from "./components/Watch";
import { loadEdition, loadInitial, requestedDay } from "./data";
import { usePrefersReducedMotion, useViewportWidth } from "./hooks";
import { isWatchItem, safeHttpUrl } from "./media";
import { usePersonal } from "./personal";
import { filterItems, shuffleItems } from "./select";
import type { Cat, DayIndex, Edition, Item, ReaderState, TabId, ThemeName } from "./types";

const RECENT_KEY = "daily-dose-recent";

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function transition(reduced: boolean, update: () => void) {
  const start = (document as Document & { startViewTransition?: (callback: () => void) => void }).startViewTransition;
  if (reduced || !start) {
    update();
    return;
  }
  start.call(document, update);
}

export default function App() {
  const reduced = usePrefersReducedMotion();
  const width = useViewportWidth();
  const wide = width >= 900;
  const [theme, setTheme] = useState<ThemeName>(() => {
    try {
      return localStorage.getItem("daily-dose-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const [screen, setScreen] = useState<ScreenId>("today");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Cat | "all">("all");
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState<DayIndex | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [fatal, setFatal] = useState("");
  const [banner, setBanner] = useState("");
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reader, setReader] = useState<ReaderState | null>(null);
  const [readerIn, setReaderIn] = useState(false);
  const [liftingHref, setLiftingHref] = useState("");
  const [searchAll, setSearchAll] = useState(false);
  const [archive, setArchive] = useState<Edition[]>([]);
  const [archiveState, setArchiveState] = useState<"idle" | "loading" | "ready">("idle");
  const personal = usePersonal();
  const closeTimer = useRef(0);
  const openTimer = useRef(0);
  const requestId = useRef(0);
  const readerRef = useRef<ReaderState | null>(null);
  readerRef.current = reader;

  useEffect(() => {
    let cancel = false;
    setFatal("");
    loadInitial(requestedDay())
      .then((result) => {
        if (cancel) return;
        setIndex(result.index);
        setEdition(result.edition);
      })
      .catch((error: unknown) => {
        if (cancel) return;
        setFatal(error instanceof Error ? error.message : "Could not load Daily Dose");
      });
    return () => {
      cancel = true;
    };
  }, [attempt]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f2f2f7" : "#000000");
    try {
      localStorage.setItem("daily-dose-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (edition) document.title = `Daily Dose · ${edition.updated}`;
  }, [edition]);

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

  const ordered = useMemo(() => (edition ? shuffleItems(edition.items, seed) : []), [edition, seed]);
  const watchItems = useMemo(() => (edition ? edition.items.filter(isWatchItem) : []), [edition]);
  const scope: TabId = "all";
  const archiveHits = useMemo(() => {
    if (!edition) return [];
    return [edition, ...archive]
      .map((day) => ({ date: day.date, updated: day.updated, items: filterItems(day.items, scope, query, 0).filter((item) => category === "all" || item.cat === category) }))
      .filter((day) => day.items.length > 0);
  }, [archive, category, edition, query]);

  const openItem = (item: Item, list?: Item[]) => {
    if (!edition) return;
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    personal.markSeen(item.href);
    setLiftingHref(item.href);
    const nextList = list && list.some((entry) => entry.href === item.href) ? list : ordered;
    const go = () => {
      setReader({ item, list: nextList });
      setReaderIn(false);
      openTimer.current = window.setTimeout(() => setReaderIn(true), reduced ? 0 : 16);
    };
    transition(reduced, go);
  };

  const closeReader = () => {
    window.clearTimeout(openTimer.current);
    const finish = () => {
      setReaderIn(false);
      window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(() => {
        setReader(null);
        setLiftingHref("");
      }, reduced ? 0 : 420);
    };
    transition(reduced, finish);
  };

  const stepReader = (delta: number) => {
    setReader((current) => {
      if (!current || current.list.length === 0) return current;
      const at = current.list.findIndex((entry) => entry.href === current.item.href);
      const next = current.list[(Math.max(0, at) + delta + current.list.length) % current.list.length];
      setLiftingHref(next.href);
      personal.markSeen(next.href);
      return { item: next, list: current.list };
    });
  };

  useEffect(() => {
    if (!reader) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeReader();
      else if (event.key === "ArrowRight") stepReader(1);
      else if (event.key === "ArrowLeft") stepReader(-1);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [reader, reduced]);

  const selectDay = async (date: string) => {
    if (!index || !edition || date === edition.date) return;
    const id = requestId.current + 1;
    requestId.current = id;
    setPending(true);
    setBanner("");
    try {
      const next = await loadEdition(date);
      if (requestId.current !== id) return;
      setEdition(next);
      setSeed(0);
      setReaderIn(false);
      setReader(null);
      const url = new URL(window.location.href);
      if (date === index.latest) url.searchParams.delete("day");
      else url.searchParams.set("day", date);
      window.history.replaceState(null, "", url);
    } catch (error) {
      if (requestId.current !== id) return;
      setBanner(error instanceof Error ? error.message : "Could not load that day");
    } finally {
      if (requestId.current === id) setPending(false);
    }
  };

  const shareItem = async (item: Item) => {
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
      setBanner("Link copied");
    } catch {
      setBanner(url);
    }
  };

  const remember = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setQuery(clean);
    setRecent((current) => {
      const next = [clean, ...current.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const savedItems = useMemo(() => {
    if (!edition) return [];
    return personal.saved.map((record) => {
      const full = [edition, ...archive].flatMap((day) => day.items).find((entry) => entry.href === record.href);
      return full ?? {
        cat: record.cat,
        title: record.title,
        note: record.note,
        source: record.source,
        href: record.href,
        tag: record.tag,
        read: record.read,
        image: record.image,
      };
    });
  }, [archive, edition, personal.saved]);

  if (!edition || !index) {
    return (
      <Shell screen="today" savedCount={0} theme={theme} onScreen={() => undefined} onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}>
        <div className="boot">
          {fatal ? (
            <>
              <h1>Daily Dose</h1>
              <p>{fatal}</p>
              <button type="button" className="text-btn" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </>
          ) : (
            <>
              <div className="shimmer hero-card" />
              <div className="shimmer-row">
                {Array.from({ length: 4 }, (_, i) => <div className="shimmer poster" key={i} />)}
              </div>
            </>
          )}
        </div>
      </Shell>
    );
  }

  const anySeen = personal.seen.length > 0;
  const seen = (href: string) => personal.isSeen(href);

  return (
    <Shell screen={screen} savedCount={personal.saved.length} theme={theme} onScreen={setScreen} onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {screen === "today" && (
        <Today
          edition={{ ...edition, items: ordered }}
          latest={edition.date === index.latest}
          seen={seen}
          anySeen={anySeen}
          streak={personal.streak.count}
          liftingHref={liftingHref}
          pending={pending}
          onOpen={(item) => openItem(item, ordered)}
          onShuffle={() => setSeed(Math.random() * 1000 + 1)}
        />
      )}
      {screen === "watch" && watchItems.length === 0 && <p className="empty-note">No videos in this day.</p>}
      {screen === "watch" && watchItems.length > 0 && (
        <Watch
          items={watchItems}
          startHref={watchItems[0].href}
          theme={theme}
          reduced={reduced}
          embedded
          onClose={() => setScreen("today")}
          onSeen={personal.markSeen}
          onToggleSave={(item) => personal.toggleSave(item, edition.date)}
          onShare={(item) => void shareItem(item)}
          isSaved={personal.isSaved}
        />
      )}
      {screen === "explore" && (
        <Explore
          edition={edition}
          index={index}
          query={query}
          category={category}
          recent={recent}
          searchAll={searchAll}
          archiveState={archiveState}
          hits={archiveHits}
          seen={seen}
          anySeen={anySeen}
          liftingHref={liftingHref}
          onQuery={setQuery}
          onSearch={remember}
          onCategory={setCategory}
          onOpen={(item) => openItem(item)}
          onSelectDay={(date) => void selectDay(date)}
          onToggleAll={() => setSearchAll((value) => !value)}
        />
      )}
      {screen === "saved" && (
        <div className="saved-screen">
          <header className="greet">
            <div>
              <p>On this device</p>
              <h1>Saved</h1>
            </div>
          </header>
          {savedItems.length === 0 ? (
            <p className="empty-note">Save a find and it stays here, across days.</p>
          ) : (
            <div className="result-grid">
              {savedItems.map((item) => (
                <Poster key={item.href} item={item} seen={seen(item.href)} fresh={anySeen && !seen(item.href)} lifting={liftingHref === item.href} onOpen={(entry) => openItem(entry, savedItems)} />
              ))}
            </div>
          )}
        </div>
      )}
      {banner && <p className="toast" role="status">{banner}</p>}
      {reader && (
        <Reader
          item={reader.item}
          list={reader.list}
          open={readerIn}
          sheet={!wide}
          theme={theme}
          saved={personal.isSaved(reader.item.href)}
          onClose={closeReader}
          onStep={stepReader}
          onToggleSave={() => personal.toggleSave(reader.item, edition.date)}
          onShare={() => void shareItem(reader.item)}
        />
      )}
    </Shell>
  );
}
