import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { usePrefersReducedMotion } from "../hooks";
import { byline, kickerLabel, readMinutes, storyPath } from "../magazine";
import { cardThumb } from "../media";
import type { Item } from "../types";

export function Mark({ className = "mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs><clipPath id="dd-clip"><path clipRule="evenodd" d="M13 14h8a18 18 0 0 1 0 36h-8zM20 21v22h1a11 11 0 0 0 0-22z" /></clipPath></defs>
      <path fill="currentColor" fillRule="evenodd" d="M13 14h8a18 18 0 0 1 0 36h-8zM20 21v22h1a11 11 0 0 0 0-22z" />
      <path fill="var(--accent)" fillRule="evenodd" d="M25 14h8a18 18 0 0 1 0 36h-8zM32 21v22h1a11 11 0 0 0 0-22z" />
      <path clipPath="url(#dd-clip)" fill="color-mix(in srgb, var(--accent) 62%, var(--ink))" fillRule="evenodd" d="M25 14h8a18 18 0 0 1 0 36h-8zM32 21v22h1a11 11 0 0 0 0-22z" />
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
