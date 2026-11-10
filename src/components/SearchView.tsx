import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchHits, useDose } from "../dose";
import { kickerLabel, storyPath } from "../magazine";
import { filterItems } from "../select";

const RECENT_KEY = "daily-dose-recent";

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function SearchView() {
  const dose = useDose();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(readRecent);
  useEffect(() => {
    document.title = "Search — Daily Dose";
    return () => { document.title = "Daily Dose"; };
  }, []);
  if (!dose.edition) return null;
  const needle = query.trim();
  const groups = needle && dose.searchAll
    ? searchHits(dose.edition, dose.archive, needle)
    : needle
      ? [{ date: dose.edition.date, updated: dose.edition.updated, items: filterItems(dose.edition.items, "all", needle, 0) }]
      : [];

  const remember = (value: string) => {
    const clean = value.trim();
    if (clean.length < 2) return;
    setRecent((current) => {
      const next = [clean, ...current.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <article className="search-page">
      <p className="kicker">Index</p>
      <h1>Search</h1>
      <form onSubmit={(event) => { event.preventDefault(); remember(query); }}>
        <label className="search-label" htmlFor="issue-search">Search this issue</label>
        <input id="issue-search" className="search-field" value={query} placeholder="A place, a joke, an app" onChange={(event) => setQuery(event.target.value)} />
      </form>
      <p className="search-tools">
        <button type="button" aria-pressed={dose.searchAll} onClick={() => dose.setSearchAll(!dose.searchAll)}>{dose.searchAll ? "All editions on" : "All editions"}</button>
        {dose.searchAll && dose.archiveState === "loading" && <span>Opening the back issues…</span>}
      </p>
      {!needle && recent.length > 0 && (
        <p className="recent">
          {recent.map((term) => <button key={term} type="button" onClick={() => { setQuery(term); remember(term); }}>{term}</button>)}
        </p>
      )}
      {groups.map((group) => (
        <section key={group.date} className="block">
          {dose.searchAll && <div className="section-head"><h2>{group.updated}</h2></div>}
          {group.items.length === 0 ? <p className="status">Nothing matches.</p> : (
            <ul className="results">
              {group.items.map((item) => (
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
        </section>
      ))}
    </article>
  );
}
