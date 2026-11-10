import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { useParams } from "react-router-dom";
import { Reader } from "../components/Reader";
import { useDose } from "../dose";

function useSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const href = decodeURIComponent(id ?? "");
  const dose = useDose();
  const item = dose.findItem(href);
  const list = dose.edition?.items ?? (item ? [item] : []);
  if (!item) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start"><IonBackButton defaultHref="/tabs/today" /></IonButtons>
            <IonTitle>Find</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">That find is not in the loaded days.</IonContent>
      </IonPage>
    );
  }
  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/today" text="" />
          </IonButtons>
          <IonTitle>{item.title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <Reader
          pageMode
          item={item}
          list={list.some((entry) => entry.href === item.href) ? list : [item, ...list]}
          open
          sheet
          theme={useSystemTheme()}
          saved={dose.personal.isSaved(item.href)}
          onClose={() => window.history.back()}
          onStep={() => undefined}
          onToggleSave={() => dose.personal.toggleSave(item, dose.edition?.date ?? "")}
          onShare={() => void dose.share(item)}
        />
      </IonContent>
    </IonPage>
  );
}
