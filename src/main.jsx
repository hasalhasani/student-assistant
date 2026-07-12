import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./lib/i18n";
import { AuthProvider } from "./lib/auth";
import { StudyProvider } from "./lib/study";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <StudyProvider>
          <App />
        </StudyProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>
);
