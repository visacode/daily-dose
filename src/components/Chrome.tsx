import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useCountUp, useRiyadhClock } from "../hooks";
import { grad, META } from "../meta";
import { isPlayable } from "../media";
import type { Cat, Item } from "../types";

export function Clock() {
  const now = useRiyadhClock();
  if (!now) return null;
  return <span className="clock">Riyadh {now}</span>;
}

export function StatTile({
  label,
  short,
  icon,
  bot,
  accent,
  count,
  active,
  reduced,
  onPick,
}: {
  label: string;
  short: string;
  icon: string;
  bot: string;
  accent: Cat;
  count: number;
  active: boolean;
  reduced: boolean;
  onPick: () => void;
}) {
  const shown = useCountUp(count, reduced);
  return (
    <button type="button" className={`stat ${active ? "is-active" : ""}`} onClick={onPick}>
      <span className="stat-bar" style={{ background: grad(accent, 90) }} />
      <span className="stat-top">
        <span className="stat-label">
          <span className="wide-only">{label}</span>
          <span className="short-only">{short}</span>
        </span>
        <span aria-hidden="true">{icon}</span>
      </span>
      <span className="stat-count">{shown}</span>
      <span className="stat-bot wide-only">from {bot}</span>
    </button>
  );
}

export function Ticker({ items, reduced, onOpen }: { items: Item[]; reduced: boolean; onOpen: (item: Item) => void }) {
  const loop = !reduced && items.length > 1 ? items.concat(items) : items;
  return (
    <div className={`ticker ${reduced ? "is-static" : ""}`}>
      <div className="ticker-track">
        {loop.map((item, index) => (
          <button type="button" className="ticker-item" key={`${item.href}-${index}`} onClick={() => onOpen(item)}>
            <span className="ticker-dot" style={{ background: grad(item.cat, 90) }} />
            <span className="ticker-title">{item.title}</span>
            <span className="ticker-source">{item.source}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Spotlight({
  picks,
  reduced,
  onOpen,
}: {
  picks: Item[];
  reduced: boolean;
  onOpen: (item: Item) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fill, setFill] = useState(false);
  const downX = useRef<number | null>(null);
  const swiped = useRef(false);
  const total = picks.length;
  const safeIndex = total === 0 ? 0 : index % total;
  const signature = picks.map((item) => item.href).join("|");

  useEffect(() => {
    setIndex(0);
  }, [signature]);

  useEffect(() => {
    if (paused || reduced || total < 2) return;
    const id = window.setTimeout(() => setIndex((current) => (current + 1) % total), 5500);
    return () => window.clearTimeout(id);
  }, [safeIndex, paused, reduced, total, signature]);

  useEffect(() => {
    setFill(false);
    const id = window.setTimeout(() => setFill(true), reduced ? 0 : 40);
    return () => window.clearTimeout(id);
  }, [safeIndex, signature, reduced]);

  if (total === 0) return null;
  const item = picks[safeIndex];
  const meta = META[item.cat];
  const go = (delta: number) => setIndex((current) => (current + delta + total) % total);
  const open = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    onOpen(item);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".spotlight-nav")) return;
    downX.current = event.clientX;
    swiped.current = false;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (downX.current === null) return;
    const delta = event.clientX - downX.current;
    if (Math.abs(delta) > 48) {
      swiped.current = true;
      go(delta < 0 ? 1 : -1);
    }
    downX.current = null;
  };

  return (
    <section
      className="spotlight"
      aria-roledescription="carousel"
      aria-label="Spotlight"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <button type="button" className="spotlight-art" style={{ background: grad(item.cat) }} onClick={open}>
        <span className={`spotlight-emoji ${fill ? "is-in" : ""}`} aria-hidden="true">{meta.icon}</span>
      </button>
      <div className="spotlight-copy">
        <div className="spotlight-meta">
          <span className="spotlight-pill" style={{ background: grad(item.cat, 90) }}>Spotlight · {meta.short}</span>
          <span className="spotlight-source">{item.source} · {item.tag}</span>
        </div>
        <button type="button" className={`spotlight-text ${fill ? "is-in" : ""}`} onClick={open}>
          <h2 dir="auto">{item.title}</h2>
          <p dir="auto">{item.note}</p>
        </button>
        <div className="spotlight-nav">
          <button type="button" className="pill-btn" style={{ background: grad(item.cat, 90), color: "#fff", borderColor: "transparent" }} onClick={open}>
            {isPlayable(item) ? "▶ Watch notes" : "Read →"}
          </button>
          <button type="button" className="icon-btn" aria-label="Previous spotlight" onClick={() => go(-1)}>‹</button>
          <button type="button" className="icon-btn" aria-label="Next spotlight" onClick={() => go(1)}>›</button>
          <div className="dots">
            {picks.map((pick, dot) => (
              <button
                type="button"
                key={pick.href}
                className={`dot ${dot === safeIndex ? "is-on" : ""}`}
                aria-label={`Show ${pick.title}`}
                style={dot === safeIndex ? { background: grad(pick.cat, 90), width: 22 } : undefined}
                onClick={() => setIndex(dot)}
              />
            ))}
          </div>
        </div>
      </div>
      {!reduced && (
        <div className="spotlight-progress" aria-hidden="true">
          <span style={{ width: fill && !paused ? "100%" : "0%", background: grad(item.cat, 90), transition: fill && !paused ? "width 5500ms linear" : "none" }} />
        </div>
      )}
    </section>
  );
}
