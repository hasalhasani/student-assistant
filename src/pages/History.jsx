import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";

const MODE_ICON = {
  mcq: "ti-list-check",
  flashcards: "ti-cards",
  chat: "ti-message-circle-2",
};

export default function History({ onHome }) {
  const { t, pick } = useI18n();
  const { history, historyLoading, historyError, isGuest } = useAuth();

  const HomeButton = () =>
    onHome ? (
      <button
        onClick={onHome}
        className="btn-ghost mb-3 flex w-fit items-center gap-1.5 !px-3 !py-1.5 text-xs"
      >
        <i className="ti ti-home" aria-hidden="true" />
        {t("nav.home")}
      </button>
    ) : null;

  if (isGuest) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <HomeButton />
        <i
          className="ti ti-user-off mb-3 block text-4xl"
          style={{ color: "var(--text-tertiary)" }}
          aria-hidden="true"
        />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("history.guest")}
        </p>
      </div>
    );
  }

  if (historyLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <HomeButton />
        <h2 className="page-title">{t("history.title")}</h2>
        <p className="page-sub">{t("history.loading")}</p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl"
              style={{ background: "var(--bg-secondary)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <HomeButton />
        <p className="text-sm" style={{ color: "var(--bad)" }}>
          {t("history.error")}
        </p>
      </div>
    );
  }

  const sessions = history?.sessions || [];
  const stats = history?.stats;

  return (
    <div className="mx-auto max-w-2xl">
      <HomeButton />
      <h2 className="page-title">{t("history.title")}</h2>
      <p className="page-sub">{t("history.sub")}</p>

      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: t("history.streak"), value: stats.streak_days },
            { label: t("history.sessions"), value: stats.sessions_total },
            { label: t("history.questions"), value: stats.questions_answered },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
                {s.value}
              </div>
              <div className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length === 0 ? (
        <p
          className="py-10 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          {t("history.empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="card flex items-center gap-3 !p-4">
              <i
                className={`ti ${MODE_ICON[s.mode] || "ti-book"} text-xl`}
                style={{ color: "var(--brand)" }}
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{pick(s.lesson)}</div>
                <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {t(`nav.${s.mode === "mcq" ? "mcq" : s.mode}`)} · {s.date}
                </div>
              </div>
              {s.score != null && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: "var(--accent)", color: "var(--brand-deep)" }}
                >
                  {s.score}/{s.total}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}