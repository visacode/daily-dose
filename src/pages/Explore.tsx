import {
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Poster } from "../components/Poster";
import { itemHrefParam, searchHits, useDose } from "../dose";
import { META } from "../meta";
import type { Cat, Item } from "../types";

const FILTERS: { value: "all" | Cat; label: string }[] = [
  { value: "all", label: "All" },
  { value: "memes", label: "Memes" },
  { value: "places", label: "Places" },
  { value: "things", label: "Things" },
  { value: "gemPlaces", label: "Gem places" },
  { value: "gemApps", label: "Gem apps" },
];

const RECENT_KEY = "daily-dose-recent";

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function ExplorePage() {
  const dose = useDose();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Cat>("all");
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [shown, setShown] = useState(8);
  const { edition, index, personal, setQuick, searchAll, setSearchAll, archive, archiveState } = dose;
  if (!edition || !index) {
    return (
      <IonPage>
        <IonHeader><IonToolbar><IonTitle>Explore</IonTitle></IonToolbar></IonHeader>
        <IonContent />
      </IonPage>
    );
  }
  const needle = query.trim().toLowerCase();
  const matches = (item: Item) => filter === "all" || item.cat === filter;
  const local = edition.items.filter((item) => matches(item) && (!needle || `${item.title} ${item.note} ${item.tag} ${item.source}`.toLowerCase().includes(needle)));
  const hits = needle && searchAll ? searchHits(edition, archive, query).map((bucket) => ({ ...bucket, items: bucket.items.filter(matches) })).filter((bucket) => bucket.items.length) : [];
  const list = needle && !searchAll ? local : needle ? hits.flatMap((bucket) => bucket.items) : edition.items.filter(matches);
  const visible = list.slice(0, shown);
  const seen = (href: string) => personal.isSeen(href);

  const open = (item: Item) => {
    personal.markSeen(item.href);
    navigate(`/item/${itemHrefParam(item)}`);
  };
  const remember = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setRecent((current) => {
      const next = [clean, ...current.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Explore</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Explore</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonSearchbar
          value={query}
          debounce={200}
          placeholder="Search memes, Riyadh, apps"
          onIonInput={(event) => {
            setQuery(event.detail.value ?? "");
            setShown(8);
          }}
          onIonChange={(event) => remember(event.detail.value ?? "")}
        />
        {!needle && recent.length > 0 && (
          <div className="recent ion-padding-horizontal">
            {recent.map((term) => (
              <button key={term} type="button" onClick={() => { setQuery(term); remember(term); }}>{term}</button>
            ))}
          </div>
        )}
        <IonSegment scrollable value={filter} onIonChange={(event) => { setFilter(event.detail.value as "all" | Cat); setShown(8); }}>
          {FILTERS.map((entry) => (
            <IonSegmentButton key={entry.value} value={entry.value}>
              {entry.label}
            </IonSegmentButton>
          ))}
        </IonSegment>
        <div className="day-row ion-padding-horizontal">
          {index.days.map((day) => (
            <button key={day.date} type="button" className={day.date === edition.date ? "is-on" : ""} onClick={() => void dose.selectDay(day.date)}>
              {day.date === index.latest ? "Latest" : day.updated}
            </button>
          ))}
          <button type="button" className={searchAll ? "is-on" : ""} onClick={() => setSearchAll(!searchAll)}>{searchAll ? "All days on" : "All days"}</button>
        </div>
        {!needle && (
          <div className="tiles ion-padding">
            {(["memes", "places", "things", "gemPlaces", "gemApps"] as Cat[]).map((cat) => (
              <button key={cat} type="button" className={filter === cat ? "is-on" : ""} style={{ background: `linear-gradient(160deg, ${META[cat].a}, ${META[cat].b})` }} onClick={() => setFilter(filter === cat ? "all" : cat)}>
                <span>{META[cat].icon}</span>
                <strong>{META[cat].short}</strong>
              </button>
            ))}
          </div>
        )}
        <div className="result-grid">
          {visible.map((item) => (
            <Poster key={item.href} item={item} seen={seen(item.href)} fresh={personal.seen.length > 0 && !seen(item.href)} onOpen={open} onHold={setQuick} />
          ))}
        </div>
        {searchAll && archiveState === "loading" && <p className="ion-padding">Loading older days…</p>}
        <IonInfiniteScroll
          disabled={visible.length >= list.length}
          onIonInfinite={(event) => {
            setShown((count) => count + 8);
            void (event.target as unknown as { complete: () => Promise<void> }).complete();
          }}
        >
          <IonInfiniteScrollContent />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
}
