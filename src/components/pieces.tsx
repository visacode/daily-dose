import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePrefersReducedMotion } from "../hooks";
import { byline, kickerLabel, readMinutes, storyPath } from "../magazine";
import { cardThumb } from "../media";
import type { Item } from "../types";

export function Mark({ className = "mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path fill="currentColor" d="M8 8h28v7H8zm0 41h28v7H8zM14 8h12v48H14z" />
      <path fill="currentColor" fillRule="evenodd" d="M22 14h10c16 0 26 7.2 26 18S48 50 32 50H22V14zm8 8h-2v20h2c8.5 0 14-4.4 14-10s-5.5-10-14-10z" />
      <path d="M34 38.5c1.2-6 5-8 7.6-8s6.4 2 7.6 8" fill="none" stroke="var(--memes)" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="41.6" cy="29.6" r="2.1" fill="var(--memes)" />
    </svg>
  );
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced);
  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setShown(true);
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);
  return <div ref={ref} className={`reveal ${shown ? "is-in" : ""} ${className}`.trim()}>{children}</div>;
}

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
