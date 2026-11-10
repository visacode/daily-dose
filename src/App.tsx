import { IonActionSheet, IonApp, IonContent, IonModal, IonToast, setupIonicReact } from "@ionic/react";
import { IonReactHashRouter } from "@ionic/react-router";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoseProvider, itemHrefParam, useDose } from "./dose";
import { Tabs } from "./pages/Tabs";

setupIonicReact({ animated: true, swipeBackEnabled: true });

function QuickSheet() {
  const dose = useDose();
  const navigate = useNavigate();
  const [actions, setActions] = useState(false);
  const item = dose.quick;
  return (
    <>
      <IonModal isOpen={item !== null} initialBreakpoint={0.45} breakpoints={[0, 0.45, 0.92]} onDidDismiss={() => dose.setQuick(null)}>
        <IonContent className="ion-padding">
          {item && (
            <div className="quick-sheet">
              <p className="quick-kicker">{item.source} · {item.tag}</p>
              <h2 dir="auto">{item.title}</h2>
              <p dir="auto">{item.note}</p>
              <div className="quick-actions">
                <button type="button" onClick={() => dose.personal.toggleSave(item, dose.edition?.date ?? "")}>{dose.personal.isSaved(item.href) ? "Saved" : "Save"}</button>
                <button type="button" onClick={() => setActions(true)}>Share or open</button>
                <button type="button" onClick={() => { dose.setQuick(null); navigate(`/item/${itemHrefParam(item)}`); }}>Read</button>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
      <IonActionSheet
        isOpen={actions}
        header={item?.title}
        buttons={[
          { text: "Share", handler: () => { if (item) void dose.share(item); } },
          { text: "Open original", handler: () => { if (item) window.open(item.href, "_blank", "noopener"); } },
          { text: "Cancel", role: "cancel" },
        ]}
        onDidDismiss={() => setActions(false)}
      />
      <IonToast isOpen={dose.toast !== ""} message={dose.toast} duration={1800} onDidDismiss={() => dose.setToast("")} />
    </>
  );
}

function AppRoutes() {
  return (
    <>
      <Tabs />
      <QuickSheet />
    </>
  );
}

export default function App() {
  return (
    <IonApp>
      <DoseProvider>
        <IonReactHashRouter>
          <AppRoutes />
        </IonReactHashRouter>
      </DoseProvider>
    </IonApp>
  );
}
