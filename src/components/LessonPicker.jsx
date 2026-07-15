import { useState, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { useStudy } from "../lib/study";
import * as api from "../lib/api";

/**
 * Subject grid + lesson list. Shared by Chat, Quiz, and Flashcards —
 * selection lives in StudyContext, so choosing a lesson in one feature
 * carries into the others.
 */
export default function LessonPicker({ onStart, startLabel }) {
  const { t, lang, pick } = useI18n();
  const { subject, lesson, selectSubject, selectLesson } = useStudy();
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch whenever the language toggles, so names stay in sync.
  useEffect(() => {
    setLoading(true);
    api.fetchSubjects(lang).then((s) => {
      setSubjects(s);
      setLoading(false);
    });
  }, [lang]);

  useEffect(() => {
    if (!subject) {
      setLessons([]);
      return;
    }
    api.fetchLessons(subject.id, lang).then(setLessons);
  }, [subject, lang]);

  if (loading) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        {t("study.loading")}
      </p>
    );
  }

  return (
    <div>
      <h2 className="page-title">{t("study.pick_subject")}</h2>
      <p className="page-sub">{t("study.pick_lesson")}</p>

      <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {subjects.map((s) => {
          const isActive = subject?.id === s.id;
          return (
            <button
              key={s.id}
              disabled={s.soon}
              onClick={() => selectSubject(s)}
              className="card relative text-start transition disabled:cursor-default disabled:opacity-55"
              style={
                isActive
                  ? {
                      borderColor: "var(--brand)",
                      borderWidth: 2,
                      background: "var(--active-bg)",
                    }
                  : undefined
              }
            >
              {s.soon && (
                <span
                  className="absolute top-2.5 rounded-full px-2 py-0.5 text-[10px]"
                  style={{
                    insetInlineEnd: "0.625rem",
                    background: "#FAEEDA",
                    color: "#633806",
                  }}
                >
                  {t("study.soon")}
                </span>
              )}
              <i
                className={`ti ${s.icon} mb-2.5 block text-3xl`}
                style={{ color: "var(--brand-deep)" }}
                aria-hidden="true"
              />
              <div className="text-[15px] font-bold">{pick(s.name)}</div>
            </button>
          );
        })}
      </div>

      {subject && (
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold">
            <i className="ti ti-book" style={{ color: "var(--brand)" }} aria-hidden="true" />
            {t("study.lessons")}
          </h3>

          {lessons.length === 0 ? (
            <p
              className="py-5 text-center text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("study.no_lessons")}
            </p>
          ) : (
            lessons.map((l, i) => {
              const isActive = lesson?.id === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => selectLesson(l)}
                  className="mb-2 flex w-full items-center justify-between rounded-2xl border px-3.5 py-2.5 text-start transition"
                  style={{
                    background: isActive ? "var(--active-bg)" : "var(--bg-secondary)",
                    borderColor: isActive ? "var(--brand)" : "var(--border-tertiary)",
                    borderWidth: isActive ? 2 : 1,
                  }}
                >
                  <span className="text-sm">{pick(l.name)}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px]"
                    style={{
                      background: "var(--surface-primary)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {i + 1}
                  </span>
                </button>
              );
            })
          )}

          <button
            onClick={onStart}
            disabled={!lesson}
            className="btn-primary mt-4 w-full"
          >
            {startLabel || t("study.start")}
          </button>
        </div>
      )}
    </div>
  );
}