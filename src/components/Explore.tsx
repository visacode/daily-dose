import { META } from "../meta";
import type { Cat, DayIndex, Edition, Item } from "../types";
import { Poster } from "./Poster";

const CATS: Cat[] = ["memes", "places", "things", "gemPlaces", "gemApps"];

export function Explore({
  edition,
  index,
  query,
  category,
  recent,
  searchAll,
  archiveState,
  hits,
  seen,
  anySeen,
  liftingHref,
  onQuery,
  onSearch,
  onCategory,
  onOpen,
  onSelectDay,
  onToggleAll,
}: {
  edition: Edition;
  index: DayIndex;
  query: string;
  category: Cat | "all";
  recent: string[];
  searchAll: boolean;
  archiveState: "idle" | "loading" | "ready";
  hits: { date: string; updated: string; items: Item[] }[];
  seen: (href: string) => boolean;
  anySeen: boolean;
  liftingHref: string;
  onQuery: (value: string) => void;
  onSearch: (value: string) => void;
  onCategory: (cat: Cat | "all") => void;
  onOpen: (item: Item) => void;
  onSelectDay: (date: string) => void;
  onToggleAll: () => void;
}) {
  const needle = query.trim().toLowerCase();
  const local = edition.items.filter((item) => {
    if (category !== "all" && item.cat !== category) return false;
    if (!needle) return false;
    return `${item.title} ${item.note} ${item.tag} ${item.source} ${item.read ?? ""}`.toLowerCase().includes(needle);
  });
  const browsing = needle === "";
  return (
    <div className="explore">
      <header className="explore-head">
        <h1>Explore</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(query.trim());
          }}
        >
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search memes, Riyadh, apps"
            aria-label="Search finds"
            enterKeyHint="search"
          />
        </form>
      </header>
      {browsing && recent.length > 0 && (
        <div className="recent">
          {recent.map((term) => (
            <button key={term} type="button" onClick={() => onSearch(term)}>{term}</button>
          ))}
        </div>
      )}
      {browsing && (
        <div className="tiles">
          {CATS.map((cat) => (
            <button key={cat} type="button" className={category === cat ? "is-on" : ""} style={{ background: `linear-gradient(160deg, ${META[cat].a}, ${META[cat].b})` }} onClick={() => onCategory(category === cat ? "all" : cat)}>
              <span>{META[cat].icon}</span>
              <strong>{META[cat].short}</strong>
            </button>
          ))}
        </div>
      )}
      <div className="day-row" aria-label="Archive">
        {index.days.map((day) => (
          <button key={day.date} type="button" className={day.date === edition.date ? "is-on" : ""} onClick={() => onSelectDay(day.date)}>
            {day.date === index.latest ? "Latest" : day.updated}
          </button>
        ))}
        <button type="button" className={searchAll ? "is-on" : ""} onClick={onToggleAll}>{searchAll ? "All days on" : "All days"}</button>
      </div>
      {browsing && category !== "all" && (
        <div className="result-grid">
          {edition.items.filter((item) => item.cat === category).map((item) => (
            <Poster key={item.href} item={item} seen={seen(item.href)} fresh={anySeen && !seen(item.href)} lifting={liftingHref === item.href} onOpen={onOpen} />
          ))}
        </div>
      )}
      {!browsing && !searchAll && (
        <div className="result-grid">
          {local.map((item) => (
            <Poster key={item.href} item={item} seen={seen(item.href)} fresh={anySeen && !seen(item.href)} lifting={liftingHref === item.href} onOpen={onOpen} />
          ))}
          {local.length === 0 && <p className="empty-note">Nothing for that search on this day.</p>}
        </div>
      )}
      {!browsing && searchAll && hits.map((bucket) => (
        <section key={bucket.date} className="shelf">
          <div className="shelf-head">
            <h2>{bucket.updated}</h2>
            <span>{bucket.items.length}</span>
          </div>
          <div className="result-grid">
            {bucket.items.map((item) => (
              <Poster key={`${bucket.date}-${item.href}`} item={item} seen={seen(item.href)} fresh={anySeen && !seen(item.href)} lifting={liftingHref === item.href} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
      {searchAll && archiveState === "loading" && <p className="empty-note">Loading older days…</p>}
    </div>
  );
}
