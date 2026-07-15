import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useStudy } from "../lib/study";
import * as api from "../lib/api";
import LessonPicker from "../components/LessonPicker";

export default function Flashcards({ onHome }) {
  const { t, lang, pick } = useI18n();
  const { token } = useAuth();
  const { lesson, sessionId } = useStudy();

  const [cards, setCards] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState({ easy: 0, medium: 0, hard: 0 });
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    await api.ensureSession({ sessionId, lessonId: lesson.id, mode: "flashcard" });
    const data = await api.generateFlashcards({
      lessonId: lesson.id,
      sessionId,
      lang,
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

  if (!cards) {
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

  /* ---------- done ---------- */
  if (idx >= cards.length) {
    const levels = [
      { key: "easy", color: "var(--ok)" },
      { key: "medium", color: "#8A5A00" },
      { key: "hard", color: "var(--bad)" },
    ];
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
          <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--brand-deep)" }}>
            {t("study.flash_done")}
          </h2>
          {lesson && (
            <p className="mb-4 text-xs" style={{ color: "var(--text-secondary)" }}>
              {pick(lesson.name)}
            </p>
          )}
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
  const progress = ((idx + 1) / cards.length) * 100;

  return (
    <div className="mx-auto max-w-xl">
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
        <h2 className="page-title !mb-0.5">{t("nav.flashcards")}</h2>
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

      <p className="mb-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        {t("study.card_of", { n: idx + 1, total: cards.length })}
      </p>

      {/* Flip card — a real 3D rotation, front and back stacked and
          rotated with backface-visibility hidden, same as StudyBody. */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="mb-4 cursor-pointer"
        style={{ perspective: "900px", height: "13rem" }}
      >
        <div
          className="relative h-full w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* front */}
          <div
            className="card absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: "var(--active-bg)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--brand)" }}>
              {t("study.flip")}
            </p>
            <p className="text-lg font-bold leading-relaxed">{pick(card.front)}</p>
          </div>

          {/* back */}
          <div
            className="card absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "var(--msg-bot-bg)",
              borderColor: "var(--brand)",
            }}
          >
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--brand)" }}>
              {lang === "en" ? "Answer" : "الاجابة"}
            </p>
            <p className="text-lg font-bold leading-relaxed">{pick(card.back)}</p>
          </div>
        </div>
      </div>

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