import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerAtlasTimeServiceWorker } from "./pwa";
import "./styles.css";

registerAtlasTimeServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
