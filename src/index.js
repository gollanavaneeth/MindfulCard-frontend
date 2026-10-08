import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";
import "./premium.css";
import "./evaluate.css";
import "./functional.css";
import "./compare.css";
import "./integration.css";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
