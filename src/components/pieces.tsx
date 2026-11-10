import { Link } from "react-router-dom";
import { byline, kickerLabel, readMinutes, storyPath } from "../magazine";
import { cardThumb } from "../media";
import type { Item } from "../types";

export function Kicker({ item }: { item: Item }) {
  return <p className="kicker" data-cat={item.cat}>{kickerLabel(item.cat)}</p>;
}

export function MetaLine({ item }: { item: Item }) {
  const who = byline(item);
  return <p className="meta">{who}{who ? " · " : ""}{readMinutes(item)} min read</p>;
}

export function Photo({ item, kind = "wide", eager = false }: { item: Item; kind?: "wide" | "tall" | "square"; eager?: boolean }) {
  const src = cardThumb(item);
  if (!src) return null;
  return (
    <div className={`photo photo-${kind}`} data-cat={item.cat}>
      <img src={src} alt="" width={kind === "square" ? 400 : 1200} height={kind === "square" ? 400 : 800} loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

export function TitleLink({ item, className }: { item: Item; className?: string }) {
  return <Link to={storyPath(item)} className={className} dir="auto">{item.title}</Link>;
}
