import * as React from "react";
import { motion } from "framer-motion";

type StepperProps = {
  steps: { id: number; title: string }[];
  current: number;
  onStepClick?: (index: number) => void;
};

export const StepperTop: React.FC<StepperProps> = ({ steps, current, onStepClick }) => {
  const pct = (current / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="relative">
        <div className="h-1 w-full rounded-full bg-white/50 dark:bg-neutral-800/70 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-700/50" />
        <motion.div
          className="absolute top-0 left-0 h-1 rounded-full bg-emerald-400/70"
          style={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>

      <div className="mt-2 flex justify-between">
        {steps.map((s, i) => {
          const active = i <= current;
          return (
            <button
              key={s.id}
              type="button"
              onClick={onStepClick ? () => onStepClick(i) : undefined}
              className={[
                "group relative flex flex-col items-center focus:outline-none",
                onStepClick ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
            >
              <div
                className={[
                  "w-8 h-8 rounded-full grid place-items-center text-sm font-semibold",
                  "border backdrop-blur",
                  active
                    ? "bg-emerald-500/25 text-emerald-700 dark:text-emerald-200 border-emerald-400/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                    : "bg-white/60 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 border-neutral-300/60 dark:border-neutral-700/60",
                ].join(" ")}
                aria-current={i === current ? "step" : undefined}
              >
                {s.id}
              </div>
              <span className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{s.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

type ControlsProps = {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
};

export const StepControls: React.FC<ControlsProps> = ({ canPrev, canNext, onPrev, onNext, nextLabel = "Siguiente" }) => (
  <div className="mt-6 flex items-center justify-between">
    <button
      type="button"
      onClick={onPrev}
      disabled={!canPrev}
      className={[
        "h-11 px-4 rounded-xl border transition-all",
        "bg-white/70 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-200",
        "border-neutral-300/70 dark:border-neutral-700/70",
        "hover:border-emerald-400/50 hover:text-emerald-600 disabled:opacity-50",
      ].join(" ")}
    >
      Paso anterior
    </button>

    <button
      type="button"
      onClick={onNext}
      disabled={!canNext}
      className={[
        "h-11 px-5 rounded-xl border transition-all",
        "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200",
        "border-emerald-400/60 hover:bg-emerald-500/30 disabled:opacity-50",
      ].join(" ")}
    >
      {nextLabel}
    </button>
  </div>
);
