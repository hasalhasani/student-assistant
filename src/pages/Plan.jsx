import { useI18n } from "../lib/i18n";

const DESTINATIONS = [
  {
    id: "dashboard",
    icon: "ti-layout-dashboard",
    titleKey: "nav.dashboard",
    descKey: "plan_hub.dashboard_desc",
    gradient: "linear-gradient(135deg, #0f6e56 0%, #0b5744 100%)",
  },
  {
    id: "planner",
    icon: "ti-calendar-plus",
    titleKey: "nav.planner",
    descKey: "plan_hub.planner_desc",
    gradient: "linear-gradient(135deg, #2fb8c9 0%, #1f8a97 100%)",
  },
];

export default function Plan({ onNavigate }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="page-title">{t("nav.section_plan")}</h2>
      <p className="page-sub">{t("plan_hub.sub")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
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
