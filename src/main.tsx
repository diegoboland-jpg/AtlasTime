import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerAtlasTimeServiceWorker } from "./pwa";
import { applyKikirooBrand } from "./kikirooBrand";
import "./styles.css";
import "./kikiroo-brand.css";

applyKikirooBrand();
registerAtlasTimeServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
