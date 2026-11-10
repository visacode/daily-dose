import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDose } from "../dose";
import { appDetails, placeDetails } from "../details";
import { useRiyadhNow } from "../hooks";
import { coverStory, greeting, issueMinutes, issueNo, kickerLabel, quoteOfDay, readMinutes, sectionCounts, sectionPath, storyPath, without } from "../magazine";
import { cardThumb, isWatchItem } from "../media";
import type { Cat, Item } from "../types";
import { Kicker, MetaLine, Photo, Reveal, TitleLink } from "./pieces";

function Lead({ item }: { item: Item }) {
  return (
    <Reveal>
    <article className="lead">
      <Photo item={item} kind="wide" />
      <Kicker item={item} />
      <h2><TitleLink item={item} /></h2>
      <p className="standfirst" dir="auto">{item.note}</p>
      <MetaLine item={item} />
    </article>
    </Reveal>
  );
}

function Secondary({ item }: { item: Item }) {
  return (
    <Reveal>
    <article className="secondary">
      <Photo item={item} kind="square" />
      <div>
        <Kicker item={item} />
        <h3><TitleLink item={item} /></h3>
        <MetaLine item={item} />
      </div>
    </article>
    </Reveal>
  );
}

export function MemeCard({ item }: { item: Item }) {
  return (
    <Reveal>
    <article className="meme-card">
      <Photo item={item} kind="wide" />
      <Kicker item={item} />
      <h3><TitleLink item={item} /></h3>
      <p dir="auto">{item.note}</p>
    </article>
    </Reveal>
  );
}

export function PlaceCard({ item }: { item: Item }) {
  const place = placeDetails(item);
  return (
    <Reveal>
    <article className="place-card">
      <Photo item={item} kind="wide" />
      <Kicker item={item} />
      <h3><TitleLink item={item} /></h3>
      <p className="meta">{[place.area, place.price].filter(Boolean).join(" · ") || item.tag}</p>
    </article>
    </Reveal>
  );
}

export function Brief({ item }: { item: Item }) {
  return (
    <Reveal>
    <article className="brief">
      <Kicker item={item} />
      <h3><TitleLink item={item} /></h3>
      <p dir="auto">{item.note}</p>
      <MetaLine item={item} />
    </article>
    </Reveal>
  );
}

export function AppRow({ item }: { item: Item }) {
  const app = appDetails(item);
  const letter = item.title.trim().charAt(0).toUpperCase();
  return (
    <Reveal>
    <article className="app-row">
      {app.icon ? <img className="app-icon" src={app.icon} alt="" width={48} height={48} loading="lazy" decoding="async" /> : <span className="app-mark" aria-hidden="true">{letter}</span>}
      <div>
        <h3><TitleLink item={item} /></h3>
        <p dir="auto">{item.note}</p>
      </div>
      <p className="meta">{app.price || app.rating || item.tag}</p>
    </article>
    </Reveal>
  );
}

function SectionBlock({ cat, items, href, children }: { cat: Cat | "gems"; items: Item[]; href: string; children: ReactNode }) {
  if (!items.length) return null;
  const label = cat === "gems" ? "Hidden Gems" : kickerLabel(cat === "gemPlaces" ? "gemPlaces" : cat === "gemApps" ? "gemApps" : cat);
  return (
    <section className="block" data-cat={cat}>
      <div className="section-head">
        <h2>{label}</h2>
        <Link to={href}>All in {label}</Link>
      </div>
      {children}
    </section>
  );
}

export function Front() {
  const { edition, index } = useDose();
  const now = useRiyadhNow();
  const navigate = useNavigate();
  if (!edition || !index) return null;
  const items = edition.items;
  const cover = coverStory(items);
  const used = new Set<string>();
  if (cover) used.add(cover.href);
  const rest = without(items, used);
  const lead = rest[0];
  const secondary = rest.slice(1, 4);
  for (const item of [lead, ...secondary]) if (item) used.add(item.href);
  const ranked = without(items, used).slice(0, 5);
  for (const item of ranked) used.add(item.href);
  const left = without(items, used);
  const of = (cat: Cat) => left.filter((item) => item.cat === cat);
  const watch = items.filter(isWatchItem).filter((item) => item.href !== cover?.href).slice(0, 8);
  const daily = quoteOfDay(items, edition.date);
  const counts = sectionCounts(items);
  const minutes = issueMinutes(items);
  const path = (section: string) => sectionPath(edition.date, index.latest, section);
  const surprise = () => {
    const pick = items[Math.floor(Math.random() * items.length)];
    if (pick) navigate(storyPath(pick));
  };

  return (
    <>
      <section className="dose-card">
        <div>
          <p className="kicker">Today's Dose</p>
          <h2>No. {issueNo(index, edition.date)}</h2>
          <p className="meta">{edition.updated} · Riyadh</p>
          <p className="dek">{greeting(now.hour)}</p>
          <p className="meta">{minutes}-minute read for the whole issue</p>
        </div>
        <button type="button" className="text-btn" onClick={surprise}>Surprise me</button>
      </section>
      <section className="numbers" aria-label="By the numbers">
        <div><strong>{items.length}</strong><span>Stories</span></div>
        <div><strong>{minutes}</strong><span>Minutes</span></div>
        {counts.map((entry) => (
          <div key={entry.cat}><strong>{entry.count}</strong><span>{entry.label}</span></div>
        ))}
      </section>
      {daily && (
        <blockquote className="pull daily-quote">
          <p className="kicker">Quote{daily.word ? ` · ${daily.word}` : ""}</p>
          <p dir="auto">{daily.text}</p>
          <footer>{daily.source}</footer>
        </blockquote>
      )}
      {cover && (
        <Reveal>
        <Link className="cover" to={storyPath(cover)}>
          <Photo item={cover} kind="tall" eager />
          <div className="cover-copy">
            <Kicker item={cover} />
            <h1 dir="auto">{cover.title}</h1>
            <p className="dek" dir="auto">{cover.note}</p>
            <p className="meta">{cover.source} · {cover.tag} · {readMinutes(cover)} min read</p>
          </div>
        </Link>
        </Reveal>
      )}
      <div className="spread">
        <div className="spread-main">
          {(lead || secondary.length > 0) && (
            <div className="lead-grid">
              {lead && <Lead item={lead} />}
              <div className="secondaries">
                {secondary.map((item) => <Secondary key={item.href} item={item} />)}
              </div>
            </div>
          )}
          {watch.length > 0 && (
            <section className="block">
              <div className="section-head"><h2>Watch</h2></div>
              <div className="watch-strip">
                {watch.map((item) => {
                  const src = cardThumb(item);
                  return (
                    <Link key={item.href} className="watch-card" to={storyPath(item)}>
                      <div className="photo photo-wide">
                        {src && <img src={src} alt="" width={640} height={360} loading="lazy" decoding="async" />}
                      </div>
                      <span className="play" aria-hidden="true">Play</span>
                      <span className="watch-title" dir="auto">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          {ranked.length > 0 && (
            <section className="block">
              <div className="section-head"><h2>Most interesting</h2></div>
              <ol className="ranked">
                {ranked.map((item) => (
                  <li key={item.href}>
                    <TitleLink item={item} />
                    <span className="meta">{kickerLabel(item.cat)} · {item.source}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <SectionBlock cat="memes" items={of("memes")} href={path("memes")}>
            <div className="meme-grid">{of("memes").map((item) => <MemeCard key={item.href} item={item} />)}</div>
          </SectionBlock>
          <SectionBlock cat="places" items={of("places")} href={path("places")}>
            <div className="place-grid">{of("places").map((item) => <PlaceCard key={item.href} item={item} />)}</div>
          </SectionBlock>
          <SectionBlock cat="things" items={of("things")} href={path("things")}>
            <div className="briefs">{of("things").map((item) => <Brief key={item.href} item={item} />)}</div>
          </SectionBlock>
          <SectionBlock cat="gemPlaces" items={of("gemPlaces")} href={path("gems")}>
            <div className="place-grid">{of("gemPlaces").map((item) => <PlaceCard key={item.href} item={item} />)}</div>
          </SectionBlock>
          <SectionBlock cat="gemApps" items={of("gemApps")} href={path("gems")}>
            <div className="app-list">{of("gemApps").map((item) => <AppRow key={item.href} item={item} />)}</div>
          </SectionBlock>
        </div>
        <aside className="rail">
          <p className="kicker">In this issue</p>
          <p className="rail-no">No. {issueNo(index, edition.date)}</p>
          <ul>
            {(["memes", "places", "things", "gemPlaces", "gemApps"] as Cat[]).map((cat) => {
              const group = items.filter((item) => item.cat === cat);
              const first = group[0];
              if (!first) return null;
              const section = cat === "gemPlaces" || cat === "gemApps" ? "gems" : cat;
              return (
                <li key={cat}>
                  <Link to={path(section)}>
                    <span>{kickerLabel(cat)}</span>
                    <strong dir="auto">{first.title}</strong>
                  </Link>
                  <em>{group.length}</em>
                </li>
              );
            })}
          </ul>
          <Link className="rail-archive" to="/archive">Past editions</Link>
        </aside>
      </div>
    </>
  );
}
