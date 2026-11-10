import { useEffect } from "react";
import { useDose } from "../dose";
import { kickerLabel } from "../magazine";
import type { Cat } from "../types";
import { AppRow, Brief, MemeCard, PlaceCard } from "./Front";

const COPY: Record<string, { title: string; stand: string; cats: Cat[] }> = {
  memes: { title: "Memes", stand: "The jokes, clips, and posts moving through the group chat.", cats: ["memes"] },
  places: { title: "Places", stand: "Where Riyadh is actually going this week.", cats: ["places"] },
  things: { title: "Things", stand: "Objects, launches, and ideas with a little heat on them.", cats: ["things"] },
  gems: { title: "Hidden Gems", stand: "Quiet rooms, modest prices, and tools worth keeping.", cats: ["gemPlaces", "gemApps"] },
};

export function SectionView({ which }: { which: keyof typeof COPY }) {
  const { edition } = useDose();
  const copy = COPY[which];
  useEffect(() => {
    document.title = `${copy.title} — Daily Dose`;
    return () => { document.title = "Daily Dose"; };
  }, [copy.title]);
  if (!edition) return null;
  const items = edition.items.filter((item) => copy.cats.includes(item.cat));
  const places = items.filter((item) => item.cat === "places" || item.cat === "gemPlaces");
  const apps = items.filter((item) => item.cat === "gemApps");
  return (
    <article className="section-page">
      <p className="kicker">The issue</p>
      <h1>{copy.title}</h1>
      <p className="dek">{copy.stand}</p>
      {items.length === 0 && <p className="status">Nothing filed here in this issue.</p>}
      {which === "memes" && <div className="meme-grid">{items.map((item) => <MemeCard key={item.href} item={item} />)}</div>}
      {which === "places" && <div className="place-grid">{items.map((item) => <PlaceCard key={item.href} item={item} />)}</div>}
      {which === "things" && <div className="briefs">{items.map((item) => <Brief key={item.href} item={item} />)}</div>}
      {which === "gems" && (
        <>
          {places.length > 0 && (
            <section className="block">
              <div className="section-head"><h2>{kickerLabel("gemPlaces")}</h2></div>
              <div className="place-grid">{places.map((item) => <PlaceCard key={item.href} item={item} />)}</div>
            </section>
          )}
          {apps.length > 0 && (
            <section className="block">
              <div className="section-head"><h2>{kickerLabel("gemApps")}</h2></div>
              <div className="app-list">{apps.map((item) => <AppRow key={item.href} item={item} />)}</div>
            </section>
          )}
        </>
      )}
    </article>
  );
}
