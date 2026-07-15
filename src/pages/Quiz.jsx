import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useStudy } from "../lib/study";
import * as api from "../lib/api";
import LessonPicker from "../components/LessonPicker";

export default function Quiz({ onHome }) {
  const { t, lang, pick } = useI18n();
  const { token } = useAuth();
  const { lesson, sessionId } = useStudy();

  const [questions, setQuestions] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  // Whether the current question has been answered (locks the options
  // and reveals correct/incorrect coloring) — reset on every new question.
  const [answered, setAnswered] = useState(false);
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
    setAnswered(false);
    setAnswers([]);
    setLoading(false);
  };

  // Selecting an option locks it in immediately and reveals the
  // correct/incorrect state — it does not advance to the next question.
  const choose = (i) => {
    if (answered) return;
    setPicked(i);
    setAnswered(true);
  };

  const next = () => {
    const correct = picked === questions[idx].correct_index;
    setAnswers([...answers, correct]);
    setPicked(null);
    setAnswered(false);
    setIdx(idx + 1);
  };

  const reset = () => {
    setQuestions(null);
    setAnswers([]);
    setIdx(0);
    setPicked(null);
    setAnswered(false);
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        {t("study.loading")}
      </p>
    );
  }

  if (!questions) {
    return (
      <div>
        {onHome && (
          <button
            onClick={onHome}
            className="btn-ghost mb-3 flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <i className="ti ti-home" aria-hidden="true" />
            {t("nav.home")}
          </button>
        )}
        <LessonPicker onStart={start} />
      </div>
    );
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
        {onHome && (
          <button
            onClick={onHome}
            className="btn-ghost mb-3 flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <i className="ti ti-home" aria-hidden="true" />
            {t("nav.home")}
          </button>
        )}
        <div className="card">
          <h2 className="page-title mb-1">{t("study.score_title")}</h2>
          {lesson && (
            <p className="mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
              {pick(lesson.name)}
            </p>
          )}
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
  const isCorrectPick = answered && picked === q.correct_index;

  // Decide each option's visual state once the question is answered:
  // the correct option always goes green; the picked-but-wrong option
  // goes red; everything else stays neutral and slightly dimmed.
  const optionStyle = (i) => {
    if (!answered) {
      return {
        background: picked === i ? "var(--active-bg)" : "var(--surface-primary)",
        borderColor: picked === i ? "var(--brand)" : "var(--border-secondary)",
        borderWidth: picked === i ? 2 : 1,
        opacity: 1,
      };
    }
    if (i === q.correct_index) {
      return {
        background: "#E9F9EE",
        borderColor: "var(--ok)",
        borderWidth: 2,
        opacity: 1,
      };
    }
    if (i === picked) {
      return {
        background: "#FDE8E8",
        borderColor: "var(--bad)",
        borderWidth: 2,
        opacity: 1,
      };
    }
    return {
      background: "var(--surface-primary)",
      borderColor: "var(--border-secondary)",
      borderWidth: 1,
      opacity: 0.55,
    };
  };

  const badgeStyle = (i) => {
    if (!answered) {
      return {
        background: picked === i ? "var(--brand)" : "var(--bg-secondary)",
        color: picked === i ? "#fff" : "var(--text-secondary)",
      };
    }
    if (i === q.correct_index) return { background: "var(--ok)", color: "#fff" };
    if (i === picked) return { background: "var(--bad)", color: "#fff" };
    return { background: "var(--bg-secondary)", color: "var(--text-secondary)" };
  };

  return (
    <div className="mx-auto max-w-2xl">
      {onHome && (
        <button
          onClick={onHome}
          className="btn-ghost mb-3 flex w-fit items-center gap-1.5 !px-3 !py-1.5 text-xs"
        >
          <i className="ti ti-home" aria-hidden="true" />
          {t("nav.home")}
        </button>
      )}
      <div className="mb-3">
        <h2 className="page-title !mb-0.5">{t("nav.mcq")}</h2>
        {lesson && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {pick(lesson.name)}
          </p>
        )}
      </div>
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
            onClick={() => choose(i)}
            disabled={answered}
            className="flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-start text-sm transition disabled:cursor-default"
            style={optionStyle(i)}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={badgeStyle(i)}
            >
              {answered && i === q.correct_index ? (
                <i className="ti ti-check" aria-hidden="true" />
              ) : answered && i === picked ? (
                <i className="ti ti-x" aria-hidden="true" />
              ) : (
                String.fromCharCode(65 + i)
              )}
            </span>
            <span className="flex-1">{opt}</span>
          </button>
        ))}
      </div>

      {answered && (
        <div
          className="mb-4 rounded-2xl px-4 py-3 text-sm"
          style={{
            background: isCorrectPick ? "#E9F9EE" : "#FDE8E8",
            color: isCorrectPick ? "var(--ok)" : "var(--bad)",
          }}
        >
          <p className="mb-0.5 font-bold">
            {isCorrectPick ? t("study.correct") : t("study.wrong")}
          </p>
          {q.explanation && (
            <p className="font-normal" style={{ color: "var(--text-secondary)" }}>
              {pick(q.explanation)}
            </p>
          )}
        </div>
      )}

      <button
        onClick={next}
        disabled={!answered}
        className="btn-primary w-full"
      >
        {idx === questions.length - 1 ? t("study.finish") : t("study.next")}
      </button>
    </div>
  );
}