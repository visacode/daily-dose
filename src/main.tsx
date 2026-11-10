import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-600.css";
import "@fontsource/outfit/latin-700.css";
import "@fontsource/outfit/latin-800.css";
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
