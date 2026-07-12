import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useStudy } from "../lib/study";
import * as api from "../lib/api";

const LEVELS = ["easy", "medium", "hard"];

export default function Planner({ onDone }) {
  const { t } = useI18n();
  const { token } = useAuth();
  const { setPlan } = useStudy();

  const [hoursPerDay, setHours] = useState(3);
  const [days, setDays] = useState(7);
  const [courses, setCourses] = useState([{ name: "", difficulty: "medium" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const update = (i, key, value) =>
    setCourses(courses.map((c, j) => (j === i ? { ...c, [key]: value } : c)));

  const generate = async () => {
    if (!courses.some((c) => c.name.trim())) {
      setError(t("planner.err_no_courses"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const plan = await api.generatePlan({ courses, hoursPerDay, days, token });
      setPlan(plan);
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="page-title">{t("planner.title")}</h2>
      <p className="page-sub">{t("planner.sub")}</p>

      <div className="card mb-4">
        <h3 className="mb-3 text-[13px] font-bold">{t("planner.settings")}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="hours">
              {t("planner.hours")}
            </label>
            <input
              id="hours"
              type="number"
              min="1"
              max="12"
              className="field-input"
              value={hoursPerDay}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="days">
              {t("planner.days")}
            </label>
            <input
              id="days"
              type="number"
              min="1"
              max="30"
              className="field-input"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="mb-3 text-[13px] font-bold">{t("planner.courses")}</h3>

        {courses.map((c, i) => (
          <div key={i} className="mb-2.5 flex gap-2">
            <input
              className="field-input flex-1"
              value={c.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder={t("planner.course_ph")}
              aria-label={t("planner.course_name")}
            />
            <select
              className="field-input w-32"
              value={c.difficulty}
              onChange={(e) => update(i, "difficulty", e.target.value)}
              aria-label={t("planner.difficulty")}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {t(`study.${l}`)}
                </option>
              ))}
            </select>
            {courses.length > 1 && (
              <button
                onClick={() => setCourses(courses.filter((_, j) => j !== i))}
                aria-label={t("planner.remove")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--bg-secondary)", color: "var(--bad)" }}
              >
                <i className="ti ti-trash" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => setCourses([...courses, { name: "", difficulty: "medium" }])}
          className="btn-ghost mt-2 w-full"
        >
          + {t("planner.add_course")}
        </button>
      </div>

      {error && (
        <p className="mb-3 text-xs" style={{ color: "var(--bad)" }} role="alert">
          {error}
        </p>
      )}

      <button onClick={generate} disabled={busy} className="btn-primary w-full">
        {busy ? t("planner.generating") : t("planner.generate")}
      </button>
    </div>
  );
}
