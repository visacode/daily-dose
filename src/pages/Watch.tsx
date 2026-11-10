import { IonContent, IonPage } from "@ionic/react";
import { useState } from "react";
import { Watch } from "../components/Watch";
import { useDose } from "../dose";
import { isWatchItem } from "../media";

function useSystemTheme(): "dark" | "light" {
  const [theme] = useState<"dark" | "light">(() => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  return theme;
}

export function WatchPage() {
  const { edition, personal, share } = useDose();
  const theme = useSystemTheme();
  const items = (edition?.items ?? []).filter(isWatchItem);
  return (
    <IonPage>
      <IonContent scrollY={false} className="watch-content">
        {items.length === 0 ? (
          <p className="ion-padding">No videos in this day.</p>
        ) : (
          <Watch
            items={items}
            startHref={items[0].href}
            theme={theme}
            reduced={window.matchMedia("(prefers-reduced-motion: reduce)").matches}
            embedded
            onClose={() => undefined}
            onSeen={personal.markSeen}
            onToggleSave={(item) => personal.toggleSave(item, edition?.date ?? "")}
            onShare={(item) => void share(item)}
            isSaved={personal.isSaved}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
