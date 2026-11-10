import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { Poster } from "../components/Poster";
import { itemHrefParam, useDose } from "../dose";
import type { Item } from "../types";

export function SavedPage() {
  const { personal, edition, archive, setQuick } = useDose();
  const navigate = useNavigate();
  const items: Item[] = personal.saved.map((record) => {
    const full = [edition, ...archive].flatMap((day) => day?.items ?? []).find((entry) => entry.href === record.href);
    return full ?? {
      cat: record.cat,
      title: record.title,
      note: record.note,
      source: record.source,
      href: record.href,
      tag: record.tag,
      read: record.read,
      image: record.image,
    };
  });
  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Saved</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Saved</IonTitle>
          </IonToolbar>
        </IonHeader>
        <p className="ion-padding-horizontal ion-text-wrap">On this device, across days.</p>
        {items.length === 0 ? (
          <p className="ion-padding">Save a find and it stays here.</p>
        ) : (
          <div className="result-grid">
            {items.map((item) => (
              <Poster
                key={item.href}
                item={item}
                seen={personal.isSeen(item.href)}
                onOpen={(entry) => {
                  personal.markSeen(entry.href);
                  navigate(`/item/${itemHrefParam(entry)}`);
                }}
                onHold={setQuick}
              />
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
