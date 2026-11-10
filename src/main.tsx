import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/outfit";
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "@ionic/react/css/palettes/dark.system.css";
import App from "./App";
import { registerServiceWorker } from "./pwa";
import "./styles.css";

registerServiceWorker();

const viewDoc = document as unknown as { startViewTransition?: (update?: unknown) => unknown };
if (typeof viewDoc.startViewTransition === "function") {
  viewDoc.startViewTransition = (update?: unknown) => {
    const callback = typeof update === "function" ? (update as () => void | Promise<void>) : undefined;
    const done = Promise.resolve().then(callback).then(() => undefined);
    return { finished: done, ready: Promise.resolve(), updateCallbackDone: done, skipTransition() {}, types: new Set<string>() };
  };
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
