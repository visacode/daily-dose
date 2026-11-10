import { useRiyadhNow } from "../hooks";
import { cardThumb } from "../media";
import { META } from "../meta";
import { groupItems } from "../select";
import type { Cat, Edition, Item } from "../types";
import { Poster } from "./Poster";

function heroPicks(items: Item[]): Item[] {
  const order: Cat[] = ["memes", "places", "gemPlaces", "things", "gemApps"];
  return order.flatMap((cat) => {
    const group = items.filter((item) => item.cat === cat);
    const pictured = group.find((item) => cardThumb(item));
    const pick = pictured ?? group[0];
    return pick ? [pick] : [];
  });
}

function greeting(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function Today({
  edition,
  latest,
  seen,
  anySeen,
  streak,
  liftingHref,
  pending,
  onOpen,
  onShuffle,
}: {
  edition: Edition;
  latest: boolean;
  seen: (href: string) => boolean;
  anySeen: boolean;
  streak: number;
  liftingHref: string;
  pending: boolean;
  onOpen: (item: Item) => void;
  onShuffle: () => void;
}) {
  const now = useRiyadhNow();
  const seenCount = edition.items.filter((item) => seen(item.href)).length;
  const picks = heroPicks(edition.items);
  const shelves = groupItems(edition.items, "all");
  return (
    <div className={`today ${pending ? "is-pending" : ""}`}>
      <header className="greet">
        <div>
          <p>{latest ? now.label : edition.updated}</p>
          <h1>{greeting(now.hour)}</h1>
        </div>
        <div className="greet-side">
          <time>{now.time ? `Riyadh ${now.time}` : "Riyadh"}</time>
          <button type="button" onClick={onShuffle} aria-label="Shuffle shelves">Shuffle</button>
        </div>
      </header>
      <p className="progress-line">
        <span>{seenCount} of {edition.items.length} seen</span>
        {streak > 0 && <span>{streak}-day streak</span>}
      </p>
      <div className="hero-row" aria-label="Spotlight">
        {picks.map((item) => (
          <Poster key={item.href} item={item} large seen={seen(item.href)} fresh={anySeen && !seen(item.href)} lifting={liftingHref === item.href} onOpen={onOpen} />
        ))}
      </div>
      {shelves.map((shelf) => (
        <section className="shelf" key={shelf.cat}>
          <div className="shelf-head">
            <h2>{META[shelf.cat].label}</h2>
            <span>{shelf.items.length}</span>
          </div>
          <div className="shelf-row">
            {shelf.items.map((item) => (
              <Poster key={item.href} item={item} seen={seen(item.href)} fresh={anySeen && !seen(item.href)} lifting={liftingHref === item.href} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
