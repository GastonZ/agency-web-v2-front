import * as React from "react";
import { useTranslation } from "react-i18next";

export const SelectedSummary: React.FC<{ items?: string[] }> = ({ items }) => {
  
  const { t } = useTranslation('translations')
  
  return (
    <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
      {items && items.length > 0 ? (
        <>{t("selected")}: <span className="font-semibold">{items.join(", ")}</span></>
      ) : (
        <>{t("no_channels_selected")}</>
      )}
    </div>
  );
};
