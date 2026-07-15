import { useState, useEffect, lazy, Suspense } from "react";
import { useI18n } from "./lib/i18n";
import { useAuth } from "./lib/auth";
import { useStudy } from "./lib/study";
import { USE_MOCKS } from "./lib/endpoints";
import DevPanel from "./components/DevPanel";

// One chunk per feature — fetched on first visit, not on load.
const Home = lazy(() => import("./pages/Home"));
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
      // Sirāj — the lesson-bound tutor.
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

  const [page, setPage] = useState("home"); // Home is the landing page
  const [theme, setTheme] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);

  // Which sidebar panel is showing — "study" (المراجعة) or "plan" (التخطيط).
  // Only one renders at a time; the other stays hidden until picked.
  const sectionForPage = (id) => NAV.findIndex((g) => g.items.some((it) => it.id === id));
  const [navSection, setNavSection] = useState(0);

  // Keep the visible panel in sync with whatever page is active — e.g.
  // navigating to "history" from Home should reveal the التخطيط panel.
  useEffect(() => {
    const idx = sectionForPage(page);
    if (idx !== -1) setNavSection(idx);
  }, [page]);

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

  const go = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  const goHome = () => go("home");

  const PAGES = {
    home: <Home onNavigate={go} />,
    chat: <Chat onHome={goHome} />,
    quiz: <Quiz onHome={goHome} />,
    flashcards: <Flashcards onHome={goHome} />,
    dashboard: <Dashboard onCreatePlan={() => setPage("planner")} onHome={goHome} />,
    planner: <Planner onDone={() => setPage("dashboard")} onHome={goHome} />,
    history: <History onHome={goHome} />,
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
          {page !== "home" && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden"
              aria-label="Menu"
            >
              <i className="ti ti-menu-2 text-xl" aria-hidden="true" />
            </button>
          )}
          <button
            onClick={() => go("home")}
            className="flex items-center gap-3 text-start"
            aria-label={t("nav.home")}
          >
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
          </button>
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
          <button
            onClick={toggleLang}
            className="btn-ghost !px-3 !py-1.5 text-xs"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          >
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
        {/* ---------- sidebar ----------
            Hidden on Home: Home carries its own navigation via the mode
            widgets, so the nav list only reappears once the person is
            inside a feature. */}
        {page !== "home" && (
          <aside
            className={`${
              menuOpen ? "flex" : "hidden"
            } w-56 shrink-0 flex-col gap-3 overflow-y-auto border-e p-3 md:flex`}
            style={{
              background: "var(--surface-secondary)",
              borderColor: "var(--border-secondary)",
            }}
          >
            {/* Tab switcher — picks which of the two panels below is
                visible. Only one of المراجعة / التخطيط shows at a time. */}
            <div
              className="flex gap-1 rounded-2xl border p-1"
              style={{
                background: "var(--surface-primary)",
                borderColor: "var(--border-secondary)",
              }}
            >
              {NAV.map((group, gi) => {
                const accent = gi === 0 ? "var(--brand)" : "#0f6e56";
                const active = navSection === gi;
                return (
                  <button
                    key={group.section}
                    onClick={() => setNavSection(gi)}
                    className="flex-1 rounded-xl px-2 py-2 text-[11px] font-bold uppercase tracking-wide transition"
                    style={{
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? accent : "var(--text-tertiary)",
                    }}
                  >
                    {t(group.section)}
                  </button>
                );
              })}
            </div>

            {/* Only the selected group's items render — switching tabs
                swaps the panel instead of stacking both. */}
            {(() => {
              const group = NAV[navSection];
              const accent = navSection === 0 ? "var(--brand)" : "#0f6e56";
              return (
                <div
                  key={group.section}
                  className="rounded-2xl border p-3"
                  style={{
                    background: "var(--surface-primary)",
                    borderColor: "var(--border-secondary)",
                    boxShadow: "0 1px 4px var(--shadow)",
                  }}
                >
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: accent }}
                      aria-hidden="true"
                    />
                    <span
                      className="text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t(group.section)}
                    </span>
                  </div>
                  {group.items.map((item) => {
                    const active = page === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => go(item.id)}
                        className="mb-1 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition last:mb-0"
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
              );
            })()}

            {isGuest && (
              <p
                className="mt-auto px-1 text-[11px] leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t("auth.guest_note")}
              </p>
            )}
          </aside>
        )}

        {/* ---------- main ----------
            Chat manages its own scrolling, so it gets a fixed-height flex
            container instead of the page-level overflow used elsewhere. */}
        <main
          className={
            page === "chat"
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