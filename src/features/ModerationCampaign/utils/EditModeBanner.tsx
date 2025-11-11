import * as React from "react";
import { useModeration } from "../../../context/ModerationContext";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  className?: string;
  onStartNew?: () => void;
};

const EditModeBanner: React.FC<Props> = ({ className }) => {
  const { data, resetAll } = useModeration();
  const isEditing = Boolean(data.campaignId);
  const { t } = useTranslation('translations');
  if (!isEditing) return null;

  const handleStartNew = () => {
    resetAll();
  };

  return (
    <div
      className={[
        "mb-4 w-full rounded-2xl border",
        "border-amber-300/30 bg-amber-50/70 dark:bg-amber-900/20",
        "p-4 md:p-5 flex items-start gap-3",
        className || "",
      ].join(" ")}
    >
      <div className="mt-0.5">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
      </div>

      <div className="flex-1">
        <div className="text-sm md:text-base font-medium text-amber-800 dark:text-amber-100">
          {t("editing_campaign")}
        </div>
        <div className="text-xs md:text-sm text-amber-800/80 dark:text-amber-200/80">
          <span className="font-medium">{data.name || "Campaña sin titulo"}</span>
          {t("new_prefer")}
        </div>
      </div>

      <button
        onClick={handleStartNew}
        className={[
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer",
          "text-sm font-semibold",
          "bg-white/70 dark:bg-neutral-900/50 hover:bg-amber-300/30 dark:hover:bg-amber-600/30",
          "border border-amber-300/40 dark:border-amber-300/30",
          "shadow-sm transition",
        ].join(" ")}
        title="Start a new campaign"
      >
        <RotateCcw className="h-4 w-4" />
        {t("start_new")}
      </button>
    </div>
  );
};

export default EditModeBanner;
