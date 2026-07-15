import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useStudy } from "../lib/study";

export default function Dashboard({ onCreatePlan, onHome }) {
  const { t } = useI18n();
  const { plan, toggleSessionDone } = useStudy();
  const [tab, setTab] = useState("schedule");

  if (!plan) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        {onHome && (
          <button
            onClick={onHome}
            className="btn-ghost mb-6 flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <i className="ti ti-home" aria-hidden="true" />
            {t("nav.home")}
          </button>
        )}
        <i
          className="ti ti-calendar-off mb-3 block text-4xl"
          style={{ color: "var(--text-tertiary)" }}
          aria-hidden="true"
        />
        <p className="mb-1 font-bold">{t("dashboard.no_plan")}</p>
        <p className="mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("dashboard.no_plan_cta")}
        </p>
        <button onClick={onCreatePlan} className="btn-primary">
          {t("nav.planner")}
        </button>
      </div>
    );
  }

  const total = plan.sessions.length;
  const done = plan.sessions.filter((s) => s.done).length;
  const rate = total ? Math.round((done / total) * 100) : 0;

  // Group sessions by day for the schedule view.
  const byDay = plan.sessions.reduce((acc, s) => {
    (acc[s.day] ||= []).push(s);
    return acc;
  }, {});

  const TABS = [
    { id: "schedule", label: t("dashboard.schedule") },
    { id: "stats", label: t("dashboard.stats") },
    { id: "tips", label: t("dashboard.tips") },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {onHome && (
        <button
          onClick={onHome}
          className="btn-ghost mb-3 flex w-fit items-center gap-1.5 !px-3 !py-1.5 text-xs"
        >
          <i className="ti ti-home" aria-hidden="true" />
          {t("nav.home")}
        </button>
      )}
      <h2 className="page-title">{t("dashboard.title")}</h2>
      <p className="page-sub">{t("dashboard.sub")}</p>

      <div
        className="mb-5 flex gap-1 border-b"
        style={{ borderColor: "var(--border-secondary)" }}
      >
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className="px-4 py-2 text-sm font-medium transition"
            style={{
              color: tab === tb.id ? "var(--brand)" : "var(--text-secondary)",
              borderBottom:
                tab === tb.id
                  ? "2px solid var(--brand)"
                  : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <div className="space-y-5">
          {Object.entries(byDay).map(([day, sessions]) => (
            <div key={day}>
              <h3
                className="mb-2 text-xs font-bold uppercase tracking-wide"
                style={{ color: "var(--text-tertiary)" }}
              >
                {t("dashboard.day", { n: day })}
              </h3>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSessionDone(s.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-start transition"
                    style={{
                      background: s.done
                        ? "var(--bg-secondary)"
                        : "var(--surface-primary)",
                      borderColor: "var(--border-secondary)",
                      opacity: s.done ? 0.6 : 1,
                    }}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px]"
                      style={{
                        background: s.done ? "var(--brand)" : "transparent",
                        borderColor: s.done ? "var(--brand)" : "var(--input-border)",
                        color: "#fff",
                      }}
                    >
                      {s.done && <i className="ti ti-check" aria-hidden="true" />}
                    </span>
                    <span className="flex-1">
                      <span
                        className="block text-sm font-medium"
                        style={{
                          textDecoration: s.done ? "line-through" : "none",
                        }}
                      >
                        {s.course}
                      </span>
                      <span
                        className="block text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {t("dashboard.minutes", { n: s.duration })}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "stats" && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("dashboard.total_sessions"), value: total },
            { label: t("dashboard.completed"), value: done },
            { label: t("dashboard.completion_rate"), value: `${rate}%` },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
                {s.value}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "tips" && (
        <div className="space-y-2">
          {(plan.tips || []).map((tip, i) => (
            <div key={i} className="card flex gap-3 text-sm">
              <i
                className="ti ti-bulb shrink-0 text-lg"
                style={{ color: "var(--brand)" }}
                aria-hidden="true"
              />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}