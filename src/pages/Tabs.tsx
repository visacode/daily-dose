import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from "@ionic/react";
import { bookmark, home, play, search } from "ionicons/icons";
import { Navigate, Route } from "react-router-dom";
import { ExplorePage } from "./Explore";
import { SavedPage } from "./Saved";
import { TodayPage } from "./Today";
import { WatchPage } from "./Watch";

export function Tabs() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/today" element={<TodayPage />} />
        <Route path="/tabs/watch" element={<WatchPage />} />
        <Route path="/tabs/explore" element={<ExplorePage />} />
        <Route path="/tabs/saved" element={<SavedPage />} />
        <Route path="/tabs" element={<Navigate to="/tabs/today" replace />} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="today" href="/tabs/today">
          <IonIcon icon={home} />
          <IonLabel>Today</IonLabel>
        </IonTabButton>
        <IonTabButton tab="watch" href="/tabs/watch">
          <IonIcon icon={play} />
          <IonLabel>Watch</IonLabel>
        </IonTabButton>
        <IonTabButton tab="explore" href="/tabs/explore">
          <IonIcon icon={search} />
          <IonLabel>Explore</IonLabel>
        </IonTabButton>
        <IonTabButton tab="saved" href="/tabs/saved">
          <IonIcon icon={bookmark} />
          <IonLabel>Saved</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
