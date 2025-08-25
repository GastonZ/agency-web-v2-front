import * as React from "react";

export const GlassCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children, ...props }) => (
  <div
    className={[
      "relative w-full rounded-2xl p-5 md:p-6",
      "bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl",
      "border border-neutral-200/80 dark:border-neutral-800/80",
      "ring-1 ring-inset ring-emerald-400/15",
      className,
    ].join(" ")}
    {...props}
  >
    <div className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(80%_80%_at_50%_0%,#000_30%,transparent)]" />
    {children}
  </div>
);

export const SectionTitle: React.FC<{ title: string; subtitle?: string; titleKey?: string; subtitleKey?: string }> =
({ title, subtitle }) => (
  <div className="mb-4">
    <h3 className="text-lg md:text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-300">
      {title}
    </h3>
    {subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300/80 mt-1">{subtitle}</p>}
  </div>
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = "", children, ...props }) => (
  <label
    className={[
      "text-xs font-medium uppercase tracking-wide",
      "text-neutral-700 dark:text-neutral-300",
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </label>
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input
    className={[
      "w-full h-11 rounded-xl px-3 md:px-4",
      "bg-white/70 dark:bg-neutral-950/40",
      "border border-neutral-300/70 dark:border-neutral-700/70",
      "focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50",
      "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
      className,
    ].join(" ")}
    {...props}
  />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = "", rows = 4, ...props }) => (
  <textarea
    rows={rows}
    className={[
      "w-full rounded-xl px-3 md:px-4 py-2",
      "bg-white/70 dark:bg-neutral-950/40",
      "border border-neutral-300/70 dark:border-neutral-700/70",
      "focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50",
      "placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all",
      className,
    ].join(" ")}
    {...props}
  />
);

export const Chip: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}> = ({ active, onClick, children, className = "", ariaLabel }) => (
  <button
    type="button"
    aria-pressed={active}
    aria-label={ariaLabel}
    onClick={onClick}
    className={[
      "px-3 h-9 rounded-full text-sm border transition-all",
      active
        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
        : "bg-white/50 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/50 hover:text-emerald-500",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);
