import { useState, useEffect, lazy, Suspense } from "react";
import { useI18n } from "./lib/i18n";
import { useAuth } from "./lib/auth";
import { useStudy } from "./lib/study";
import { USE_MOCKS } from "./lib/endpoints";
import DevPanel from "./components/DevPanel";

// One chunk per feature — fetched on first visit, not on load.
const Assistant = lazy(() => import("./pages/Assistant"));
const Chat = lazy(() => import("./pages/Chat"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Planner = lazy(() => import("./pages/Planner"));
const History = lazy(() => import("./pages/History"));
const Login = lazy(() => import("./pages/Login"));

const NAV = [
  {
    section: "nav.section_study",
    items: [
      // The general assistant — the landing page.
      { id: "assistant", icon: "ti-sparkles", label: "nav.assistant" },
      // Sirāj — the lesson-bound tutor. Same idea, different scope.
      { id: "chat", icon: "ti-message-circle-2", label: "nav.chat" },
      { id: "quiz", icon: "ti-list-check", label: "nav.mcq" },
      { id: "flashcards", icon: "ti-cards", label: "nav.flashcards" },
    ],
  },
  {
    section: "nav.section_plan",
    items: [
      { id: "dashboard", icon: "ti-layout-dashboard", label: "nav.dashboard" },
      { id: "planner", icon: "ti-calendar-plus", label: "nav.planner" },
      { id: "history", icon: "ti-history", label: "nav.history" },
    ],
  },
];

function Loading() {
  return (
    <div className="flex h-full flex-1 items-center justify-center py-16">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2"
        style={{
          borderColor: "var(--border-secondary)",
          borderTopColor: "var(--brand)",
        }}
      />
    </div>
  );
}

export default function App() {
  const { t, toggleLang } = useI18n();
  const { user, signOut, isGuest, history, historyLoading } = useAuth();
  const { plan, setPlan } = useStudy();

  const [page, setPage] = useState("assistant"); // the general chat is the landing page
  const [theme, setTheme] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  /*
    Bridge: when the history webhook comes back with a saved plan,
    hand it to StudyContext so the Dashboard renders it. Only fills an
    empty slot — never clobbers a plan the user just generated.
  */
  useEffect(() => {
    if (history?.plan && !plan) setPlan(history.plan);
  }, [history, plan, setPlan]);

  if (!user) {
    return (
      <>
        <Suspense fallback={<Loading />}>
          <Login />
        </Suspense>
        <DevPanel />
      </>
    );
  }

  const PAGES = {
    assistant: <Assistant />,
    chat: <Chat />,
    quiz: <Quiz />,
    flashcards: <Flashcards />,
    dashboard: <Dashboard onCreatePlan={() => setPage("planner")} />,
    planner: <Planner onDone={() => setPage("dashboard")} />,
    history: <History />,
  };

  const go = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: "var(--surface-primary)" }}
    >
      {/* ---------- top bar ---------- */}
      <header
        className="flex shrink-0 items-center justify-between border-b px-5 py-3"
        style={{
          borderColor: "var(--border-secondary)",
          boxShadow: "0 2px 8px var(--shadow)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
            aria-label="Menu"
          >
            <i className="ti ti-menu-2 text-xl" aria-hidden="true" />
          </button>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: "var(--brand)" }}
          >
            <i className="ti ti-school" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div
              className="text-[15px] font-bold"
              style={{ color: "var(--brand-deep)" }}
            >
              {t("app.name")}
            </div>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {user.name || t("common.guest")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History loading in the background — the app didn't wait for it. */}
          {historyLoading && (
            <span
              className="hidden items-center gap-1.5 text-[11px] sm:flex"
              style={{ color: "var(--text-tertiary)" }}
            >
              <span
                className="h-3 w-3 animate-spin rounded-full border-2"
                style={{
                  borderColor: "var(--border-secondary)",
                  borderTopColor: "var(--brand)",
                }}
              />
              {t("history.loading")}
            </span>
          )}
          {USE_MOCKS && (
            <span
              className="hidden rounded-full px-2.5 py-1 text-[10px] sm:inline"
              style={{ background: "#FAEEDA", color: "#633806" }}
            >
              {t("common.demo_mode")}
            </span>
          )}
          <button onClick={toggleLang} className="btn-ghost !px-3 !py-1.5 text-xs">
            {t("common.language")}
          </button>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="btn-ghost !px-3 !py-1.5"
            aria-label={
              theme === "light" ? t("common.theme_dark") : t("common.theme_light")
            }
          >
            <i
              className={`ti ${theme === "light" ? "ti-moon" : "ti-sun"}`}
              aria-hidden="true"
            />
          </button>
          <button
            onClick={signOut}
            className="btn-ghost !px-3 !py-1.5"
            aria-label={t("nav.logout")}
          >
            <i className="ti ti-logout" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ---------- sidebar ---------- */}
        <aside
          className={`${
            menuOpen ? "flex" : "hidden"
          } w-52 shrink-0 flex-col border-e p-3 md:flex`}
          style={{
            background: "var(--surface-secondary)",
            borderColor: "var(--border-secondary)",
          }}
        >
          {NAV.map((group) => (
            <div key={group.section} className="mb-4">
              <div
                className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t(group.section)}
              </div>
              {group.items.map((item) => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className="mb-1 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition"
                    style={{
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "var(--brand-deep)" : "var(--text-secondary)",
                      borderColor: active ? "var(--brand-soft)" : "transparent",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <i className={`ti ${item.icon} text-lg`} aria-hidden="true" />
                    {t(item.label)}
                  </button>
                );
              })}
            </div>
          ))}

          {isGuest && (
            <p
              className="mt-auto px-1 text-[11px] leading-relaxed"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("auth.guest_note")}
            </p>
          )}
        </aside>

        {/* ---------- main ---------- */}
        {/* ---------- main ----------
            Chat pages manage their own scrolling, so they get a fixed-height
            flex container instead of the page-level overflow used elsewhere. */}
        <main
          className={
            page === "assistant" || page === "chat"
              ? "flex flex-1 flex-col overflow-hidden p-6 pb-14"
              : "flex-1 overflow-y-auto p-6 pb-14"
          }
        >
          <Suspense fallback={<Loading />}>{PAGES[page]}</Suspense>
        </main>
      </div>

      <DevPanel />
    </div>
  );
}