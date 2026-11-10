import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Row } from "./components/Cards";
import { Aurora } from "./components/Aurora";
import { Clock, Spotlight, StatTile, Ticker } from "./components/Chrome";
import { Reader } from "./components/Reader";
import { loadEdition, loadInitial, requestedDay } from "./data";
import { readStoredTheme, readStoredView, usePrefersReducedMotion, useViewportWidth } from "./hooks";
import { grad, META, TABS } from "./meta";
import { countCats, filterItems, groupItems, spotlightPicks } from "./select";
import type { DayIndex, Edition, ReaderState, TabId, ThemeName, ViewMode } from "./types";

export default function App() {
  const reduced = usePrefersReducedMotion();
  const width = useViewportWidth();
  const phone = width < 560;
  const sheet = width < 800;
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);
  const [view, setView] = useState<ViewMode>(readStoredView);
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState<DayIndex | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [fatal, setFatal] = useState("");
  const [banner, setBanner] = useState("");
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reader, setReader] = useState<ReaderState | null>(null);
  const [readerIn, setReaderIn] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
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
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f4f1fb" : "#07060f");
    try {
      localStorage.setItem("daily-dose-theme", theme);
    } catch {
      /* ignore private-mode storage failures */
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("daily-dose-view", view);
    } catch {
      /* ignore */
    }
  }, [view]);

  useEffect(() => {
    if (edition) document.title = `Daily Dose · ${edition.updated}`;
  }, [edition]);

  const visible = useMemo(
    () => (edition ? filterItems(edition.items, tab, query, seed) : []),
    [edition, tab, query, seed],
  );
  const groups = useMemo(() => groupItems(visible, tab), [visible, tab]);
  const ordered = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const picks = useMemo(() => (edition ? spotlightPicks(edition.items) : []), [edition]);

  const openItem = (item: (typeof ordered)[number]) => {
    if (!edition) return;
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
    const list = ordered.some((entry) => entry.href === item.href) ? ordered : edition.items;
    const wasOpen = readerRef.current !== null && readerIn;
    setReader({ item, list });
    if (wasOpen) {
      setReaderIn(true);
      return;
    }
    setReaderIn(false);
    openTimer.current = window.setTimeout(() => setReaderIn(true), reduced ? 0 : 20);
  };

  const closeReader = () => {
    window.clearTimeout(openTimer.current);
    setReaderIn(false);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setReader(null), reduced ? 0 : 320);
  };

  const stepReader = (delta: number) => {
    setReader((current) => {
      if (!current || current.list.length === 0) return current;
      const at = current.list.findIndex((entry) => entry.href === current.item.href);
      const next = (Math.max(0, at) + delta + current.list.length) % current.list.length;
      return { item: current.list[next], list: current.list };
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable));
      if (event.key === "/" && !typing && !readerRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!reader) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeReader();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepReader(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepReader(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [reader]);

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
      setQuery("");
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

  if (!edition || !index) {
    return (
      <main className="page status-screen">
        {fatal ? (
          <>
            <h1>Daily Dose</h1>
            <p>{fatal}</p>
            <button type="button" className="chip is-on" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
          </>
        ) : (
          <>
            <div className="hero hero-loading" />
            <p>Loading today’s finds…</p>
          </>
        )}
      </main>
    );
  }

  const sources = new Set(edition.items.map((item) => item.source)).size;
  const days = [...index.days].sort((a, b) => b.date.localeCompare(a.date));
  const onLatest = edition.date === index.latest;

  return (
    <main className="page">
      <a className="skip" href="#finds">Skip to finds</a>
      <header className="hero">
        <Aurora reduced={reduced} />
        <div className="hero-inner">
          <div className="hero-top">
            <span className="live-pill">
              <span className="live-dot" />
              Updated {edition.updated}
            </span>
            <span className="hero-actions">
              <Clock />
              <button
                type="button"
                className="hero-btn"
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "☀ Light" : "☾ Dark"}
              </button>
            </span>
          </div>
          <h1 className="hero-title">
            Daily <span className="gradient-text">Dose</span>
          </h1>
          <p className="hero-sub">
            {edition.items.length} finds from {sources} sources
            {onLatest ? " today" : ` on ${edition.updated}`}: what’s funny, what’s trending, and the gems most people miss.
            Tap any find to watch or read it here.{onLatest ? " Refreshes every morning around 9 AM." : ""}
          </p>
          <div className="stats">
            <StatTile label="Memes & funny" short="Memes" icon="😂" bot="Daily Memes" accent="memes" count={countCats(edition.items, ["memes"])} active={tab === "memes"} reduced={reduced} onPick={() => setTab("memes")} />
            <StatTile label="Trending now" short="Trends" icon="🔥" bot="Trend Spotter" accent="places" count={countCats(edition.items, ["places", "things"])} active={tab === "trends"} reduced={reduced} onPick={() => setTab("trends")} />
            <StatTile label="Hidden gems" short="Gems" icon="💎" bot="Hidden Gems" accent="gemPlaces" count={countCats(edition.items, ["gemPlaces", "gemApps"])} active={tab === "gems"} reduced={reduced} onPick={() => setTab("gems")} />
          </div>
        </div>
      </header>

      <Ticker items={edition.items} reduced={reduced} onOpen={openItem} />
      <Spotlight picks={picks} reduced={reduced} onOpen={openItem} />

      {!onLatest && (
        <p className="archive-banner">
          Viewing the {edition.updated} archive.
          <button type="button" onClick={() => void selectDay(index.latest)}>Back to latest</button>
        </p>
      )}
      {banner && <p className="banner" role="alert">{banner}</p>}

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Filter">
          {TABS.map((entry) => {
            const on = tab === entry.value;
            return (
              <button
                type="button"
                key={entry.value}
                role="tab"
                aria-selected={on}
                className={`chip ${on ? "is-on" : ""}`}
                style={on ? { background: `linear-gradient(90deg, ${entry.a}, ${entry.b})` } : undefined}
                onClick={() => setTab(entry.value)}
              >
                <span aria-hidden="true">{entry.icon}</span>
                <span>{phone ? entry.short : entry.label}</span>
                <span className="count-badge">{countCats(edition.items, entry.cats)}</span>
              </button>
            );
          })}
        </div>
        <label className="search">
          <span aria-hidden="true">⌕</span>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search GTA, Riyadh, café…"
            aria-label="Search finds"
            type="search"
          />
          {query !== "" && (
            <button type="button" className="clear-btn" aria-label="Clear search" onClick={() => setQuery("")}>✕</button>
          )}
        </label>
        <div className="tools">
          <button type="button" className={`chip ${view === "cards" ? "is-on" : ""}`} style={view === "cards" ? { background: "linear-gradient(90deg, #7C4DFF, #3DA5FF)" } : undefined} onClick={() => setView("cards")}>▣ Cards</button>
          <button type="button" className={`chip ${view === "list" ? "is-on" : ""}`} style={view === "list" ? { background: "linear-gradient(90deg, #7C4DFF, #3DA5FF)" } : undefined} onClick={() => setView("list")}>☰ List</button>
          <button type="button" className={`chip ${seed !== 0 ? "is-on" : ""}`} style={seed !== 0 ? { background: "linear-gradient(90deg, #FF3D7F, #FF9A3D)" } : undefined} onClick={() => setSeed(Math.random() * 1000 + 1)}>🎲 Shuffle</button>
          <label className="day-picker">
            <span className="sr-only">Edition</span>
            <select value={edition.date} aria-label="Choose a day" disabled={pending} onChange={(event) => void selectDay(event.target.value)}>
              {days.map((day) => (
                <option key={day.date} value={day.date}>
                  {day.date === index.latest ? `Latest · ${day.updated}` : day.updated}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div id="finds" className={pending ? "is-pending" : undefined}>
        <p className="result-count" aria-live="polite">
          {query.trim() ? `${visible.length} matching finds` : `${visible.length} finds`}
        </p>
        {groups.map((group) => {
          const meta = META[group.cat];
          return (
            <section className="section" key={`${group.cat}-${tab}-${seed}-${query}`}>
              <div className="section-head">
                <span className="section-icon" style={{ background: grad(group.cat) }} aria-hidden="true">{meta.icon}</span>
                <span className="section-copy">
                  <h2>{meta.label}</h2>
                  <p>{group.items.length} picks from {meta.bot}</p>
                </span>
                <span className="section-rule" style={{ background: grad(group.cat, 90) }} />
              </div>
              {view === "cards" ? (
                <div className="cards">
                  {group.items.map((item, itemIndex) => (
                    <Card key={`${seed}-${item.href}`} item={item} index={itemIndex} onOpen={openItem} />
                  ))}
                </div>
              ) : (
                <div className="list">
                  {group.items.map((item, itemIndex) => (
                    <Row key={`${seed}-${item.href}`} item={item} index={itemIndex} onOpen={openItem} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {visible.length === 0 && (
          <div className="empty">
            <div aria-hidden="true">🔍</div>
            <p>Nothing matches that search.</p>
            <button type="button" className="chip is-on" style={{ background: "linear-gradient(90deg, #7C4DFF, #FF3D7F)" }} onClick={() => { setQuery(""); setTab("all"); }}>
              Show everything
            </button>
          </div>
        )}
      </div>

      <footer className="colophon">
        <p>Video, posts, and maps play on this page. Open original leaves Daily Dose.</p>
        <p>{edition.date} · {edition.items.length} finds</p>
      </footer>

      {reader && (
        <Reader
          item={reader.item}
          list={reader.list}
          open={readerIn}
          sheet={sheet}
          theme={theme}
          onClose={closeReader}
          onStep={stepReader}
        />
      )}
    </main>
  );
}
