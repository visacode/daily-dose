import { useRef, useState } from "react";
import { grad, META } from "../meta";
import { cardThumb, isPlayable } from "../media";
import type { Item } from "../types";

export function Poster({
  item,
  large = false,
  seen = false,
  fresh = false,
  lifting = false,
  onOpen,
  onHold,
}: {
  item: Item;
  large?: boolean;
  seen?: boolean;
  fresh?: boolean;
  lifting?: boolean;
  onOpen: (item: Item) => void;
  onHold?: (item: Item) => void;
}) {
  const meta = META[item.cat];
  const thumb = cardThumb(item);
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(thumb) && !broken;
  const holdTimer = useRef(0);
  return (
    <button
      type="button"
      className={`poster ${large ? "is-hero" : ""} ${seen ? "is-seen" : ""}`}
      onClick={() => onOpen(item)}
      onPointerDown={() => {
        if (!onHold) return;
        holdTimer.current = window.setTimeout(() => onHold(item), 420);
      }}
      onPointerUp={() => window.clearTimeout(holdTimer.current)}
      onPointerLeave={() => window.clearTimeout(holdTimer.current)}
      onContextMenu={(event) => {
        if (!onHold) return;
        event.preventDefault();
        onHold(item);
      }}
    >
      {showImage && thumb ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          decoding="async"
          style={lifting ? { viewTransitionName: "dose-media" } : undefined}
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="poster-art" style={{ background: grad(item.cat, 160) }} aria-hidden="true">
          <span>{meta.icon}</span>
        </span>
      )}
      <span className="poster-scrim">
        <span className="poster-kicker">{meta.short} · {item.source}</span>
        <strong dir="auto">{item.title}</strong>
        {large && <em dir="auto">{item.note}</em>}
      </span>
      {isPlayable(item) && <span className="poster-play" aria-hidden="true">▶</span>}
      {fresh && <span className="poster-new">New</span>}
    </button>
  );
}
