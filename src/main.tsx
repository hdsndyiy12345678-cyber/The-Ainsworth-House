import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import "./storybook.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
if (
  import.meta.env.PROD &&
  !window.__AINSWORTH_STANDALONE__ &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.warn("Offline preparation failed:", error));
  });
}
