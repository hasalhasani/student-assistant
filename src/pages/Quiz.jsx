import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useStudy } from "../lib/study";
import * as api from "../lib/api";
import LessonPicker from "../components/LessonPicker";

export default function Quiz() {
  const { t, lang, pick } = useI18n();
  const { token } = useAuth();
  const { lesson, sessionId } = useStudy();

  const [questions, setQuestions] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    await api.ensureSession({ sessionId, lessonId: lesson.id, mode: "mcq" });
    const data = await api.generateMCQ({
      lessonId: lesson.id,
      sessionId,
      lang,
      token,
    });
    setQuestions(data.questions || []);
    setIdx(0);
    setPicked(null);
    setAnswers([]);
    setLoading(false);
  };

  const next = () => {
    const correct = picked === questions[idx].correct;
    setAnswers([...answers, correct]);
    setPicked(null);
    setIdx(idx + 1);
  };

  const reset = () => {
    setQuestions(null);
    setAnswers([]);
    setIdx(0);
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        {t("study.loading")}
      </p>
    );
  }

  if (!questions) {
    return <LessonPicker onStart={start} />;
  }

  /* ---------- score screen ---------- */
  if (idx >= questions.length) {
    const correct = answers.filter(Boolean).length;
    const total = questions.length;
    const ratio = correct / total;
    const msg =
      ratio >= 0.8
        ? t("study.score_great")
        : ratio >= 0.5
        ? t("study.score_good")
        : t("study.score_keep");

    return (
      <div className="mx-auto max-w-sm text-center">
        <div className="card">
          <h2 className="page-title mb-4">{t("study.score_title")}</h2>
          <div
            className="mx-auto mb-4 flex h-28 w-28 flex-col items-center justify-center rounded-full"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-4xl font-bold" style={{ color: "var(--brand)" }}>
              {correct}
            </span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {t("study.score_of", { total })}
            </span>
          </div>
          <p className="mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {msg}
          </p>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {t("study.correct")}
              </div>
              <div className="text-xl font-bold" style={{ color: "var(--ok)" }}>
                {correct}
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {t("study.wrong")}
              </div>
              <div className="text-xl font-bold" style={{ color: "var(--bad)" }}>
                {total - correct}
              </div>
            </div>
          </div>
          <button onClick={reset} className="btn-primary w-full">
            {t("study.again")}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- question ---------- */
  const q = questions[idx];
  const options = q.options;
  const progress = ((idx + 1) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <div
        className="mb-5 h-1.5 overflow-hidden rounded-full"
        style={{ background: "var(--msg-bot-bg)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: "var(--brand)" }}
        />
      </div>

      <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
        {t("study.question_of", { n: idx + 1, total: questions.length })}
      </p>
      <h2 className="mb-4 text-base font-bold leading-relaxed">{pick(q.question)}</h2>

      <div className="mb-4 space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className="flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-start text-sm transition"
            style={{
              background: picked === i ? "var(--active-bg)" : "var(--surface-primary)",
              borderColor: picked === i ? "var(--brand)" : "var(--border-secondary)",
              borderWidth: picked === i ? 2 : 1,
            }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: picked === i ? "var(--brand)" : "var(--bg-secondary)",
                color: picked === i ? "#fff" : "var(--text-secondary)",
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>

      <button onClick={next} disabled={picked === null} className="btn-primary w-full">
        {idx === questions.length - 1 ? t("study.finish") : t("study.next")}
      </button>
    </div>
  );
}