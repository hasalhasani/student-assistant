import { useState, useMemo } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useStudy } from "../lib/study";

const STUDY_DESTINATIONS = [
  { id: "chat", icon: "ti-message-circle-2", label: "nav.chat" },
  { id: "quiz", icon: "ti-list-check", label: "nav.mcq" },
  { id: "flashcards", icon: "ti-cards", label: "nav.flashcards" },
];

const PLAN_DESTINATIONS = [
  { id: "dashboard", icon: "ti-layout-dashboard", label: "nav.dashboard" },
  { id: "planner", icon: "ti-calendar-plus", label: "nav.planner" },
  { id: "history", icon: "ti-history", label: "nav.history" },
];

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "home.greeting_morning";
  if (h < 18) return "home.greeting_afternoon";
  return "home.greeting_evening";
}

/* A single expandable mode widget. Tapping the card body toggles the
   destination pills open; tapping "Start" (visible while closed) jumps
   straight to the default destination without needing to expand first. */
function ModeCard({
  open,
  onToggle,
  icon,
  title,
  sub,
  startLabel,
  destinations,
  defaultTarget,
  gradient,
  onNavigate,
}) {
  return (
    <div
      className="mode-card"
      style={{ "--mode-gradient": gradient }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onToggle()}
    >
      <div className="mode-card-top">
        <span className="mode-card-icon">
          <i className={`ti ${icon}`} aria-hidden="true" />
        </span>
        <span
          className="mode-card-chevron"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <i className="ti ti-chevron-down" aria-hidden="true" />
        </span>
      </div>

      <h3 className="mode-card-title">{title}</h3>
      <p className="mode-card-sub">{sub}</p>

      <div
        className="mode-card-destinations"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="mode-card-pills">
            {destinations.map((d) => (
              <button
                key={d.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(d.id);
                }}
                className="pill-btn"
              >
                <i className={`ti ${d.icon}`} aria-hidden="true" />
                {d.labelText}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!open && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(defaultTarget);
          }}
          className="mode-card-go"
        >
          {startLabel}
          <i className="ti ti-arrow-up-right" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function Home({ onNavigate }) {
  const { t } = useI18n();
  const { user, history } = useAuth();
  const { plan, toggleSessionDone } = useStudy();

  const [expanded, setExpanded] = useState(null); // "study" | "plan" | null

  const toggle = (mode) => setExpanded((e) => (e === mode ? null : mode));

  const streak = history?.stats?.streak_days ?? 0;
  const weekFilled = streak > 0 ? ((streak - 1) % 7) + 1 : 0;

  const upcoming = useMemo(
    () => (plan?.sessions || []).filter((s) => !s.done).slice(0, 5),
    [plan]
  );

  const studyDestinations = STUDY_DESTINATIONS.map((d) => ({
    ...d,
    labelText: t(d.label),
  }));
  const planDestinations = PLAN_DESTINATIONS.map((d) => ({
    ...d,
    labelText: t(d.label),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      {/* ---------- hero ---------- */}
      <div className="mb-8 flex items-center gap-4">
        <div className="home-lamp shrink-0">
          <span className="home-lamp-ring" aria-hidden="true" />
          <span
            className="home-lamp-ring"
            style={{ animationDelay: "1.3s" }}
            aria-hidden="true"
          />
          <i className="ti ti-bulb" aria-hidden="true" />
        </div>
        <div>
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--brand)" }}
          >
            {t("home.eyebrow")}
          </p>
          <h1
            className="mt-1 text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t(greetingKey(), { name: user?.name || t("common.guest") })}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("home.sub")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* ---------- mode widgets ---------- */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ModeCard
            open={expanded === "study"}
            onToggle={() => toggle("study")}
            icon="ti-brain"
            title={t("home.study_mode")}
            sub={t("home.study_mode_sub")}
            startLabel={t("home.start")}
            destinations={studyDestinations}
            defaultTarget="chat"
            gradient="linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)"
            onNavigate={onNavigate}
          />
          <ModeCard
            open={expanded === "plan"}
            onToggle={() => toggle("plan")}
            icon="ti-target-arrow"
            title={t("home.plan_mode")}
            sub={t("home.plan_mode_sub")}
            startLabel={t("home.start")}
            destinations={planDestinations}
            defaultTarget="dashboard"
            gradient="linear-gradient(135deg, #0f6e56 0%, #0b5744 100%)"
            onNavigate={onNavigate}
          />
        </div>

        {/* ---------- sidebar ---------- */}
        <div className="space-y-4">
          {/* streak */}
          <div className="card streak-widget">
            <div className="flex items-center gap-3">
              <span className="streak-flame">
                <i className="ti ti-flame" aria-hidden="true" />
              </span>
              <div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--brand-deep)" }}
                >
                  {streak}
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("home.streak_label")}
                </div>
              </div>
            </div>
            <div className="streak-week">
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className="streak-dot"
                  style={{
                    background:
                      i < weekFilled ? "var(--brand)" : "var(--bg-secondary)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* to-do, sourced from the active plan */}
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold">{t("home.todo_title")}</h3>
              {plan && (
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="text-[11px] font-bold"
                  style={{ color: "var(--brand)" }}
                >
                  {t("home.view_plan")}
                </button>
              )}
            </div>

            {!plan ? (
              <div className="py-4 text-center">
                <i
                  className="ti ti-calendar-plus mb-2 block text-2xl"
                  style={{ color: "var(--text-tertiary)" }}
                  aria-hidden="true"
                />
                <p
                  className="mb-3 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("home.no_plan")}
                </p>
                <button
                  onClick={() => onNavigate("planner")}
                  className="btn-primary !px-4 !py-2 text-xs"
                >
                  {t("nav.planner")}
                </button>
              </div>
            ) : upcoming.length === 0 ? (
              <p
                className="py-4 text-center text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t("home.todo_done")}
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSessionDone(s.id)}
                    className="todo-item"
                  >
                    <span className="todo-check" aria-hidden="true" />
                    <span className="flex-1 text-start text-[13px]">
                      {s.course}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {t("dashboard.minutes", { n: s.duration })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}