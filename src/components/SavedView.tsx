import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDose } from "../dose";
import { kickerLabel, storyPath } from "../magazine";
import type { Item } from "../types";

export function SavedView() {
  const dose = useDose();
  useEffect(() => {
    document.title = "Saved — Daily Dose";
    return () => { document.title = "Daily Dose"; };
  }, []);
  const items: Item[] = dose.personal.saved.map((record) => dose.findItem(record.href) ?? {
    cat: record.cat,
    title: record.title,
    note: record.note,
    source: record.source,
    href: record.href,
    tag: record.tag,
    read: record.read,
    image: record.image,
  });
  return (
    <article className="saved-page">
      <p className="kicker">On this device</p>
      <h1>Saved</h1>
      <p className="dek">Stories you keep, across editions. They stay in this browser.</p>
      {items.length === 0 ? <p className="status">Nothing saved yet.</p> : (
        <ul className="results">
          {items.map((item) => (
            <li key={item.href}>
              <Link to={storyPath(item)}>
                <span className="kicker" data-cat={item.cat}>{kickerLabel(item.cat)}</span>
                <strong dir="auto">{item.title}</strong>
                <em dir="auto">{item.note}</em>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
