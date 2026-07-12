import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useStudy } from "../lib/study";
import * as api from "../lib/api";
import LessonPicker from "../components/LessonPicker";

export default function Flashcards() {
  const { t, pick } = useI18n();
  const { token } = useAuth();
  const { lesson, sessionId } = useStudy();

  const [cards, setCards] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({ easy: 0, medium: 0, hard: 0 });
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    const data = await api.generateFlashcards({
      lessonId: lesson.id,
      sessionId,
      token,
    });
    setCards(data.questions || []);
    setIdx(0);
    setFlipped(false);
    setRatings({ easy: 0, medium: 0, hard: 0 });
    setLoading(false);
  };

  const rate = (level) => {
    setRatings((r) => ({ ...r, [level]: r[level] + 1 }));
    setFlipped(false);
    setIdx(idx + 1);
  };

  const reset = () => {
    setCards(null);
    setIdx(0);
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        {t("study.loading")}
      </p>
    );
  }

  if (!cards) return <LessonPicker onStart={start} />;

  /* ---------- done ---------- */
  if (idx >= cards.length) {
    const levels = [
      { key: "easy", color: "var(--ok)" },
      { key: "medium", color: "#8A5A00" },
      { key: "hard", color: "var(--bad)" },
    ];
    return (
      <div className="mx-auto max-w-sm text-center">
        <div className="card">
          <h2 className="mb-5 text-lg font-bold" style={{ color: "var(--brand-deep)" }}>
            {t("study.flash_done")}
          </h2>
          <div className="mb-5 grid grid-cols-3 gap-2">
            {levels.map(({ key, color }) => (
              <div
                key={key}
                className="rounded-xl p-3"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  {t(`study.${key}`)}
                </div>
                <div className="text-xl font-bold" style={{ color }}>
                  {ratings[key]}
                </div>
              </div>
            ))}
          </div>
          <button onClick={reset} className="btn-primary w-full">
            {t("study.again")}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- card ---------- */
  const card = cards[idx];

  return (
    <div className="mx-auto max-w-xl">
      <p className="mb-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        {t("study.card_of", { n: idx + 1, total: cards.length })}
      </p>

      <button
        onClick={() => setFlipped(!flipped)}
        className="card mb-4 flex min-h-52 w-full flex-col items-center justify-center px-6 text-center transition"
        style={{
          background: flipped ? "var(--active-bg)" : "var(--surface-primary)",
          borderColor: flipped ? "var(--brand)" : "var(--border-secondary)",
        }}
      >
        <p className="text-lg font-bold leading-relaxed">
          {flipped ? pick(card.back) : pick(card.front)}
        </p>
        {!flipped && (
          <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {t("study.flip")}
          </p>
        )}
      </button>

      {flipped && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => rate("hard")}
            className="btn-ghost"
            style={{ color: "var(--bad)" }}
          >
            {t("study.hard")}
          </button>
          <button
            onClick={() => rate("medium")}
            className="btn-ghost"
            style={{ color: "#8A5A00" }}
          >
            {t("study.medium")}
          </button>
          <button
            onClick={() => rate("easy")}
            className="btn-ghost"
            style={{ color: "var(--ok)" }}
          >
            {t("study.easy")}
          </button>
        </div>
      )}
    </div>
  );
}
