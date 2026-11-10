import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/outfit";
import App from "./App";
import { registerServiceWorker } from "./pwa";
import "./styles.css";

registerServiceWorker();

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
