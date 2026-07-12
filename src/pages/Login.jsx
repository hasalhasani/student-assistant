import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { USE_MOCKS } from "../lib/endpoints";

const GRADES = [1, 2, 3, 4, 5, 6];
const AVAILABLE = [5]; // the rest are marked "soon", as in the original

export default function Login() {
  const { t, toggleLang } = useI18n();
  const { signIn, signUp, continueAsGuest, busy, error } = useAuth();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    grade: "5",
  });
  const [localError, setLocalError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    const needed =
      mode === "signup"
        ? [form.name, form.email, form.password]
        : [form.email, form.password];

    if (needed.some((v) => !v.trim())) {
      setLocalError(t("auth.err_required"));
      return;
    }

    const ok =
      mode === "signup"
        ? await signUp(form)
        : await signIn({ email: form.email, password: form.password });

    if (!ok) setLocalError(t("auth.err_failed"));
  };

  const shown = localError || error;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--surface-secondary)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <button onClick={toggleLang} className="btn-ghost text-xs">
            {t("common.language")}
          </button>
        </div>

        <div className="card text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{ background: "var(--accent)", color: "var(--brand)" }}
          >
            <i className="ti ti-school" aria-hidden="true" />
          </div>

          <h1 className="text-lg font-bold" style={{ color: "var(--brand-deep)" }}>
            {mode === "signup" ? t("auth.signup_title") : t("auth.welcome")}
          </h1>
          <p className="mb-5 mt-1.5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {mode === "signup" ? t("auth.signup_sub") : t("auth.welcome_sub")}
          </p>

          <form onSubmit={submit} className="text-start">
            {mode === "signup" && (
              <div className="mb-3.5">
                <label className="field-label" htmlFor="name">
                  {t("auth.name")}
                </label>
                <input
                  id="name"
                  className="field-input"
                  value={form.name}
                  onChange={set("name")}
                  placeholder={t("auth.name_ph")}
                />
              </div>
            )}

            <div className="mb-3.5">
              <label className="field-label" htmlFor="email">
                {t("auth.email")}
              </label>
              <input
                id="email"
                type="email"
                className="field-input"
                value={form.email}
                onChange={set("email")}
                placeholder={t("auth.email_ph")}
                dir="ltr"
              />
            </div>

            <div className="mb-3.5">
              <label className="field-label" htmlFor="password">
                {t("auth.password")}
              </label>
              <input
                id="password"
                type="password"
                className="field-input"
                value={form.password}
                onChange={set("password")}
                placeholder={t("auth.password_ph")}
                dir="ltr"
              />
            </div>

            {mode === "signup" && (
              <div className="mb-3.5">
                <label className="field-label" htmlFor="grade">
                  {t("auth.grade")}
                </label>
                <select
                  id="grade"
                  className="field-input"
                  value={form.grade}
                  onChange={set("grade")}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={String(g)} disabled={!AVAILABLE.includes(g)}>
                      {AVAILABLE.includes(g)
                        ? t("auth.grade_n", { n: g })
                        : t("auth.grade_soon", { n: g })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {shown && (
              <p className="mb-3 text-xs" style={{ color: "var(--bad)" }} role="alert">
                {shown}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "..." : mode === "signup" ? t("auth.sign_up") : t("auth.sign_in")}
            </button>
          </form>

          <button
            onClick={continueAsGuest}
            className="btn-ghost mt-3 w-full"
          >
            {t("auth.guest")}
          </button>
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {t("auth.guest_note")}
          </p>

          <div className="mt-5 text-xs" style={{ color: "var(--text-secondary)" }}>
            {mode === "signup" ? t("auth.have_account") : t("auth.no_account")}{" "}
            <button
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setLocalError(null);
              }}
              className="font-bold"
              style={{ color: "var(--brand)" }}
            >
              {mode === "signup" ? t("auth.sign_in") : t("auth.sign_up")}
            </button>
          </div>
        </div>

        {USE_MOCKS && (
          <p
            className="mt-4 text-center text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("common.demo_mode")}
          </p>
        )}
      </div>
    </div>
  );
}
