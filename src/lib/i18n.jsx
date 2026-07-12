import { createContext, useContext, useState, useEffect, useCallback } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

const BUNDLES = { en, ar };
const RTL_LANGS = ["ar"];

/** Read the browser's preferred language, falling back to English. */
function detectLanguage() {
  const nav = navigator.languages?.[0] || navigator.language || "en";
  const base = nav.toLowerCase().split("-")[0];
  return BUNDLES[base] ? base : "en";
}

/** Walk a dotted key path ("auth.sign_in") through a bundle. */
function resolve(bundle, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], bundle);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLanguage);

  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

  // Keep the document in sync so CSS logical properties and screen
  // readers both get the right direction.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  /**
   * Translate a key. Supports {{placeholder}} interpolation:
   *   t("study.question_of", { n: 2, total: 5 })
   * Falls back to English, then to the key itself, so a missing string
   * shows up as an obvious key rather than an empty space.
   */
  const t = useCallback(
    (key, vars) => {
      let str = resolve(BUNDLES[lang], key) ?? resolve(BUNDLES.en, key) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`{{${k}}}`, "g"), v);
        }
      }
      return str;
    },
    [lang]
  );

  const toggleLang = useCallback(
    () => setLang((l) => (l === "ar" ? "en" : "ar")),
    []
  );

  /** Pick the right side of a bilingual content object from the API. */
  const pick = useCallback(
    (value) => {
      if (value == null) return "";
      if (typeof value === "string") return value;
      return value[lang] ?? value.en ?? "";
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, dir, t, pick, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
