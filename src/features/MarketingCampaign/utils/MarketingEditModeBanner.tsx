import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useMarketing } from "../../../context/MarketingContext";

const MarketingEditModeBanner: React.FC = () => {
  const { data, resetAll } = useMarketing();
  if (!data.campaignId) return null;

  return (
    <div className="mb-4 w-full rounded-2xl border border-amber-300/30 bg-amber-50/70 dark:bg-amber-900/20 p-4 md:p-5 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm md:text-base font-medium text-amber-800 dark:text-amber-100">
          Estás editando esta campaña
        </div>
        <div className="text-xs md:text-sm text-amber-800/80 dark:text-amber-200/80">
          <span className="font-medium">{data.basics?.name || "Campaña sin nombre"}</span>
          {" — Si preferís, podés limpiar todo y comenzar una nueva."}
        </div>
      </div>
      <button
        onClick={resetAll}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-white/70 dark:bg-neutral-900/50 hover:bg-white border border-amber-300/40 dark:border-amber-300/30 shadow-sm transition"
        title="Comenzar una nueva campaña"
      >
        <RotateCcw className="h-4 w-4" />
        Comenzar nueva
      </button>
    </div>
  );
};

export default MarketingEditModeBanner;
