import { createContext, useContext, useState, useEffect, useCallback } from "react";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

const BUNDLES = { en, ar };
const RTL_LANGS = ["ar"];

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  // Arabic is the default language on every load/refresh.
  const [lang, setLang] = useState("ar");

  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

  // Keep the document in sync so CSS logical properties and screen
  // readers both get the right direction.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  /** Walk a dotted key path ("auth.sign_in") through a bundle. */
  const resolve = (bundle, path) =>
    path.split(".").reduce((acc, part) => acc?.[part], bundle);

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
      if (Array.isArray(value)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "i18n.pick() called on an array — this field is likely already " +
              "in the target language and shouldn't go through pick(). Skipping.",
            value
          );
        }
        return "";
      }
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