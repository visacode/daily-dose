import { useState } from "react";
import { FadeImg } from "./FadeImg";
import { grad, META } from "../meta";
import { cardThumb, isPlayable } from "../media";
import type { Item } from "../types";

type Marks = {
  seen?: boolean;
  fresh?: boolean;
  saved?: boolean;
  dateLabel?: string;
  onToggleSave?: () => void;
};

function initialOf(title: string): string {
  const match = title.replace(/^[^A-Za-z0-9\u0600-\u06FF]+/, "").charAt(0);
  return match ? match.toUpperCase() : "•";
}

export function Card({ item, index, onOpen, seen, fresh, saved, dateLabel, onToggleSave }: { item: Item; index: number; onOpen: (item: Item) => void } & Marks) {
  const meta = META[item.cat];
  const thumb = cardThumb(item);
  const [broken, setBroken] = useState(false);
  const showPhoto = Boolean(thumb) && !broken;
  const playable = isPlayable(item);
  return (
    <article
      className={`card ${showPhoto ? "has-photo" : "is-plain"} ${seen ? "is-seen" : ""}`}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
    >
      <div className="card-media" style={showPhoto ? undefined : { background: grad(item.cat, 125) }}>
        {showPhoto && thumb && <FadeImg src={thumb} className="card-photo" onBroken={() => setBroken(true)} />}
        {!showPhoto && <span className="card-letter">{initialOf(item.title)}</span>}
        <span className="card-scrim" />
        <span className="card-chips">
          <span className="card-chip">{item.source}</span>
          <span className="card-chip card-chip-ghost">{item.tag}</span>
        </span>
        {fresh && <span className="new-badge">New</span>}
        {onToggleSave && (
          <button type="button" className={`card-save ${saved ? "is-on" : ""}`} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save"} onClick={(event) => { event.stopPropagation(); onToggleSave(); }}>
            {saved ? "★" : "☆"}
          </button>
        )}
        <span className="card-cat" aria-hidden="true">{meta.icon}</span>
        {playable && <span className="play-badge" aria-hidden="true">▶</span>}
        <span className="card-accent" style={{ background: grad(item.cat, 90) }} />
      </div>
      <div className="card-body">
        {dateLabel && <span className="date-label">{dateLabel}</span>}
        <h3 dir="auto">{item.title}</h3>
        <p dir="auto">{item.note}</p>
        <span className="card-cta" style={{ color: meta.a }}>
          {playable ? "Watch" : "Read"} <span aria-hidden="true">→</span>
        </span>
      </div>
    </article>
  );
}

export function Row({ item, index, onOpen, seen, fresh, dateLabel }: { item: Item; index: number; onOpen: (item: Item) => void } & Marks) {
  const meta = META[item.cat];
  const thumb = cardThumb(item);
  const [broken, setBroken] = useState(false);
  const playable = isPlayable(item);
  return (
    <article
      className={`row ${seen ? "is-seen" : ""}`}
      style={{ animationDelay: `${Math.min(index, 16) * 25}ms` }}
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
    >
      {thumb && !broken ? (
        <FadeImg src={thumb} className="row-thumb" onBroken={() => setBroken(true)} />
      ) : (
        <span className="row-icon" style={{ background: grad(item.cat) }} aria-hidden="true">{meta.icon}</span>
      )}
      <span className="row-copy">
        <span className="row-title" dir="auto">{fresh ? "New · " : ""}{dateLabel ? `${dateLabel} · ` : ""}{item.title}</span>
        <span className="row-note" dir="auto">{item.source} · {item.note}</span>
      </span>
      <span className="row-go" style={{ color: meta.a }} aria-hidden="true">{playable ? "▶" : "›"}</span>
    </article>
  );
}
