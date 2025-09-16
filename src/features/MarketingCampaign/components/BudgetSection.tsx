import * as React from "react";
import { GlassCard, SectionTitle, Label } from "../../ModerationCampaign/components/Primitives";

type Props = {
  value: number;                       // monto actual
  onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
  currency?: string;                   // "ARS" | "USD" ...
};

const BudgetSection: React.FC<Props> = ({
  value, onChange,
  min = 2000, max = 20000, step = 500,
  currency = "ARS",
}) => {
  const nf = React.useMemo(() => new Intl.NumberFormat("es-AR", { style: "currency", currency }), [currency]);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <GlassCard>
      <SectionTitle title="Selección de pauta" subtitle="Definí el presupuesto de publicidad" />

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <Label>Monto</Label>
          <div className="text-2xl font-semibold mt-1 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">
            {nf.format(value)}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(clamp(value - step))}
            className="h-9 px-3 rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/60"
          >
            – {step.toLocaleString("es-AR")}
          </button>
          <button
            type="button"
            onClick={() => onChange(clamp(value + step))}
            className="h-9 px-3 rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/60"
          >
            + {step.toLocaleString("es-AR")}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs opacity-70 mt-1">
          <span>{nf.format(min)}</span>
          <span>{nf.format((min + max) / 2)}</span>
          <span>{nf.format(max)}</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default BudgetSection;
