import * as React from "react";
import { motion } from "framer-motion";
import { Lock, Check, Zap } from "lucide-react";
import { CHANNELS } from "../../../../context/ModerationContext";
import { CHANNEL_META } from "./ChannelMeta";

const base =
  "group relative w-full rounded-2xl p-4 text-left transition-all border backdrop-blur outline-none";

export const ChannelCard: React.FC<{
  channel: (typeof CHANNELS)[number];
  active: boolean;
  available?: boolean;
  onToggle: () => void;
}> = ({ channel, active, available = true, onToggle }) => {
  const { title, subtitle, description, bullets, tags, Icon } =
    CHANNEL_META[channel];

  const disabled = !available;

  const classes = [
    base,
    "overflow-hidden",
    disabled
      ? "cursor-not-allowed opacity-60 bg-white/40 dark:bg-neutral-900/30 border-neutral-300/40 dark:border-neutral-700/40"
      : active
        ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-900 dark:text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
        : "bg-white/60 dark:bg-neutral-900/40 border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/50",
    !disabled && "hover:-translate-y-[1px]",
    "focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60 dark:focus-visible:ring-offset-neutral-950/40",
  ].join(" ");

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onToggle()}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={classes}
      disabled={disabled}
      role="checkbox"
      aria-checked={active}
      title={disabled ? "Próximamente" : undefined}
    >
      {/* “tech glow” + grid sutil */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className={[
            "absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl transition-opacity",
            disabled
              ? "opacity-0"
              : active
                ? "bg-emerald-400/35 opacity-100"
                : "bg-emerald-300/20 opacity-0 group-hover:opacity-100",
          ].join(" ")}
        />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(0,0,0,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.15)_1px,transparent_1px)] [background-size:22px_22px] dark:opacity-[0.12]" />
      </div>

      {/* Badge estado */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <div
            className={[
              "h-11 w-11 grid place-items-center rounded-xl border transition-colors",
              disabled
                ? "border-neutral-300/40 dark:border-neutral-700/40 bg-white/50 dark:bg-neutral-900/30"
                : active
                  ? "border-emerald-400/60 bg-emerald-500/20"
                  : "border-neutral-300/60 dark:border-neutral-700/60 bg-white/60 dark:bg-neutral-900/40 group-hover:border-emerald-400/40",
            ].join(" ")}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold leading-5 truncate">{title}</div>

              {active && !disabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-400/30 px-2 py-0.5 text-[11px]">
                  <Check className="h-3 w-3" />
                  Activo
                </span>
              )}

              {!active && !disabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-neutral-300/50 dark:border-neutral-700/50 px-2 py-0.5 text-[11px]">
                  <Zap className="h-3 w-3" />
                  Disponible
                </span>
              )}
            </div>

            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {subtitle}
              {disabled && " — No disponible todavía"}
            </div>
          </div>
        </div>

        {disabled && (
          <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-800/80 text-white border border-white/10">
            <Lock className="h-3 w-3" />
            Próximamente
          </div>
        )}
      </div>

      {/* Descripción */}
      <div className="relative mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-6 font-semibold">
        {description}
      </div>

      {/* “Ideal para” (bullets) */}
      <div className="relative mt-3 space-y-1">
        <div className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Ideal para
        </div>
        <ul className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-[7px] h-1 w-1 rounded-full bg-emerald-500/80 flex-none" />
              <span className="leading-5">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      <div className="relative mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className={[
              "rounded-full px-2 py-1 text-[11px] border",
              disabled
                ? "border-neutral-300/40 dark:border-neutral-700/40 text-neutral-500 dark:text-neutral-500 bg-white/30 dark:bg-neutral-900/20"
                : active
                  ? "border-emerald-400/30 text-emerald-800 dark:text-emerald-200 bg-emerald-500/10"
                  : "border-neutral-300/50 dark:border-neutral-700/50 text-neutral-600 dark:text-neutral-300 bg-white/30 dark:bg-neutral-900/20",
            ].join(" ")}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: Switch */}
      <div className="relative mt-4 flex items-center justify-between">
        <div className="text-[12px] text-neutral-500 dark:text-neutral-400">
          {disabled
            ? "Este canal estará disponible pronto."
            : active
              ? "Canal seleccionado."
              : "Click para activar."}
        </div>

        <div
          className={[
            "relative h-6 w-11 rounded-full border transition-colors",
            disabled
              ? "border-neutral-400/40 bg-transparent"
              : active
                ? "border-emerald-400/50 bg-emerald-500/30"
                : "border-neutral-400/50 bg-neutral-900/5 dark:bg-white/5 group-hover:border-emerald-400/50",
          ].join(" ")}
          aria-hidden="true"
        >
          <div
            className={[
              "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full transition-all",
              disabled
                ? "left-0.5 bg-neutral-300/60 dark:bg-neutral-700/60"
                : active
                  ? "left-[22px] bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                  : "left-0.5 bg-white dark:bg-neutral-900 shadow-sm",
            ].join(" ")}
          />
        </div>
      </div>
    </motion.button>
  );
};
