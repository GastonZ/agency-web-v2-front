import * as React from "react";
import { motion } from "framer-motion";
import { CHANNELS } from "../../../../context/ModerationContext";
import { CHANNEL_META } from "./ChannelMeta";

const base =
  "group relative w-full rounded-2xl p-4 text-left transition-all border backdrop-blur";

export const ChannelCard: React.FC<{
  channel: (typeof CHANNELS)[number];
  active: boolean;
  onToggle: () => void;
}> = ({ channel, active, onToggle }) => {
  const { title, subtitle, Icon } = CHANNEL_META[channel];

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={[
        base,
        active
          ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-800 dark:text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
          : "bg-white/60 dark:bg-neutral-900/40 border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/50",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "h-10 w-10 grid place-items-center rounded-xl border transition-colors",
            active
              ? "border-emerald-400/60 bg-emerald-500/20"
              : "border-neutral-300/60 dark:border-neutral-700/60 bg-white/60 dark:bg-neutral-900/40",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">{subtitle}</div>
        </div>

        <div
          className={[
            "h-5 w-5 rounded-full border transition-colors",
            active
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
