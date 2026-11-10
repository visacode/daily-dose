import {
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import type { RefresherEventDetail } from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { Poster } from "../components/Poster";
import { itemHrefParam, useDose } from "../dose";
import { useRiyadhNow } from "../hooks";
import { META } from "../meta";
import { cardThumb } from "../media";
import { groupItems } from "../select";
import type { Cat, Item } from "../types";

function greeting(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function heroPicks(items: Item[]): Item[] {
  const order: Cat[] = ["memes", "places", "gemPlaces", "things", "gemApps"];
  return order.flatMap((cat) => {
    const group = items.filter((item) => item.cat === cat);
    const pick = group.find((item) => cardThumb(item)) ?? group[0];
    return pick ? [pick] : [];
  });
}

export function TodayPage() {
  const { edition, index, loading, error, pending, reload, personal, setQuick } = useDose();
  const now = useRiyadhNow();
  const navigate = useNavigate();
  const seen = (href: string) => personal.isSeen(href);
  const anySeen = personal.seen.length > 0;

  const refresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await reload();
    } finally {
      event.detail.complete();
    }
  };

  const open = (item: Item) => {
    personal.markSeen(item.href);
    navigate(`/item/${itemHrefParam(item)}`);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Today</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent />
        </IonRefresher>
        {loading && !edition && (
          <div className="ion-padding">
            <IonSkeletonText animated style={{ width: "46%", height: 18 }} />
            <IonSkeletonText animated style={{ width: "70%", height: 36, marginTop: 8 }} />
            <IonSkeletonText animated style={{ height: 360, marginTop: 16, borderRadius: 0 }} />
          </div>
        )}
        {error && !edition && <p className="ion-padding">{error}</p>}
        {edition && (
          <div className={pending ? "is-pending" : ""}>
            <div className="greet ion-padding-horizontal">
              <div>
                <p>{edition.date === index?.latest ? now.label : edition.updated}</p>
                <h1>{greeting(now.hour)}</h1>
              </div>
              <time>{now.time ? `Riyadh ${now.time}` : "Riyadh"}</time>
            </div>
            <p className="progress-line ion-padding-horizontal">
              {edition.items.filter((item) => seen(item.href)).length} of {edition.items.length} seen
              {personal.streak.count > 0 ? ` · ${personal.streak.count}-day streak` : ""}
            </p>
            <div className="hero-row">
              {heroPicks(edition.items).map((item) => (
                <Poster key={item.href} item={item} large seen={seen(item.href)} fresh={anySeen && !seen(item.href)} onOpen={open} onHold={setQuick} />
              ))}
            </div>
            {groupItems(edition.items, "all").map((shelf) => (
              <section className="shelf" key={shelf.cat}>
                <div className="shelf-head ion-padding-horizontal">
                  <h2>{META[shelf.cat].label}</h2>
                  <span>{shelf.items.length}</span>
                </div>
                <div className="shelf-row">
                  {shelf.items.map((item) => (
                    <Poster key={item.href} item={item} seen={seen(item.href)} fresh={anySeen && !seen(item.href)} onOpen={open} onHold={setQuick} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
