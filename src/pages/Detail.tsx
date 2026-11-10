import { IonActionSheet, IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { useState } from "react";
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
  const [actions, setActions] = useState(false);
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
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <Reader
          item={item}
          list={list.some((entry) => entry.href === item.href) ? list : [item, ...list]}
          theme={useSystemTheme()}
          saved={dose.personal.isSaved(item.href)}
          onToggleSave={() => dose.personal.toggleSave(item, dose.edition?.date ?? "")}
          onMore={() => setActions(true)}
        />
      </IonContent>
      <IonActionSheet
        isOpen={actions}
        header={item.title}
        buttons={[
          { text: "Share", handler: () => { void dose.share(item); } },
          { text: "Open original", handler: () => { window.open(item.href, "_blank", "noopener"); } },
          { text: "Cancel", role: "cancel" },
        ]}
        onDidDismiss={() => setActions(false)}
      />
    </IonPage>
  );
}
