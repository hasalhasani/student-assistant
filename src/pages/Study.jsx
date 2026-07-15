import { useI18n } from "../lib/i18n";

const DESTINATIONS = [
  {
    id: "chat",
    icon: "ti-message-circle-2",
    titleKey: "nav.chat",
    descKey: "study_hub.chat_desc",
    gradient: "linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)",
  },
  {
    id: "quiz",
    icon: "ti-list-check",
    titleKey: "nav.mcq",
    descKey: "study_hub.quiz_desc",
    gradient: "linear-gradient(135deg, #ff9a3d 0%, #e8562f 100%)",
  },
  {
    id: "flashcards",
    icon: "ti-cards",
    titleKey: "nav.flashcards",
    descKey: "study_hub.flash_desc",
    gradient: "linear-gradient(135deg, #b18cff 0%, #7c5cff 100%)",
  },
];

export default function Study({ onNavigate }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="page-title">{t("nav.section_study")}</h2>
      <p className="page-sub">{t("study_hub.sub")}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {DESTINATIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => onNavigate(d.id)}
            className="mode-card w-full text-start"
            style={{ "--mode-gradient": d.gradient }}
          >
            <div className="mode-card-top">
              <span className="mode-card-icon">
                <i className={`ti ${d.icon}`} aria-hidden="true" />
              </span>
              <span className="mode-card-chevron" style={{ transform: "rotate(-90deg)" }}>
                <i className="ti ti-chevron-down" aria-hidden="true" />
              </span>
            </div>
            <h3 className="mode-card-title">{t(d.titleKey)}</h3>
            <p className="mode-card-sub">{t(d.descKey)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
