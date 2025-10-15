import * as React from "react";
import { motion } from "framer-motion";
import { CHANNELS } from "../../../../context/ModerationContext";
import { CHANNEL_META } from "./ChannelMeta";
import { Lock } from "lucide-react";

const base =
  "group relative w-full rounded-2xl p-4 text-left transition-all border backdrop-blur";

export const ChannelCard: React.FC<{
  channel: (typeof CHANNELS)[number];
  active: boolean;
  available?: boolean; 
  onToggle: () => void;
}> = ({ channel, active, available = true, onToggle }) => {
  const { title, subtitle, Icon } = CHANNEL_META[channel];

  const disabled = !available;
  const classes = [
    base,
    disabled
      ? "cursor-not-allowed opacity-60 bg-white/40 dark:bg-neutral-900/30 border-neutral-300/40 dark:border-neutral-700/40"
      : active
        ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-800 dark:text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
        : "bg-white/60 dark:bg-neutral-900/40 border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/50",
  ].join(" ");

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onToggle()}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={classes}
      disabled={disabled}
      title={disabled ? "Próximamente" : undefined}
    >
      {/* badge “no disponible” */}
      {disabled && (
        <div className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-neutral-700/70 text-white">
          <Lock className="h-3 w-3" />
          Próximamente
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className={[
            "h-10 w-10 grid place-items-center rounded-xl border transition-colors",
            disabled
              ? "border-neutral-300/40 dark:border-neutral-700/40 bg-white/50 dark:bg-neutral-900/30"
              : active
                ? "border-emerald-400/60 bg-emerald-500/20"
                : "border-neutral-300/60 dark:border-neutral-700/60 bg-white/60 dark:bg-neutral-900/40",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            {subtitle}
            {!available && " — No disponible todavía"}
          </div>
        </div>

        <div
          className={[
            "h-5 w-5 rounded-full border transition-colors",
            disabled
              ? "border-neutral-400/50 bg-transparent"
              : active
                ? "border-emerald-400/60 bg-emerald-400/60"
                : "border-neutral-400/60 bg-transparent group-hover:border-emerald-400/60",
          ].join(" ")}
          aria-checked={active}
          role="checkbox"
        />
      </div>
    </motion.button>
  );
};
