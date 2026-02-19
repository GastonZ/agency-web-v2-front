import React from "react";
import { AudioLines, MessageSquareText } from "lucide-react";
import type { BillingSummary } from "../../../services/types/billing-types";

type CounterView = {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  icon: React.ComponentType<{ className?: string }>;
};

function clampProgress(used = 0, limit?: number | null) {
  if (!limit || limit <= 0) return 18;
  return Math.max(4, Math.min(100, (used / limit) * 100));
}

function formatCount(value: number) {
  return value.toLocaleString("es-AR");
}

function UsageLane({ label, used, limit, remaining, icon: Icon }: CounterView) {
  const pct = clampProgress(used, limit);
  const risk = pct >= 90 ? "high" : pct >= 70 ? "mid" : "low";

  const tone =
    risk === "high"
      ? "from-rose-500 via-orange-400 to-amber-300"
      : risk === "mid"
        ? "from-amber-300 via-emerald-400 to-emerald-300"
        : "from-emerald-400 via-emerald-500 to-teal-400";

  return (
    <div className="rounded-xl bg-neutral-900/5 p-4 ring-1 ring-neutral-200/70 dark:bg-white/5 dark:ring-neutral-800/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="mt-1.5 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            {limit ? `${formatCount(used)} / ${formatCount(limit)}` : `${formatCount(used)} usados`}
          </p>
        </div>
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <Icon className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
        </div>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-neutral-300/50 dark:bg-neutral-700/50">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-neutral-500 dark:text-neutral-400">Uso del ciclo actual</span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300">
          {remaining === null || remaining === undefined
            ? "Sin limite"
            : `${formatCount(remaining)} restantes`}
        </span>
      </div>
    </div>
  );
}

export default function BillingUsageWidget({ summary }: { summary: BillingSummary }) {
  const messagesLimit = summary.plan.unlimitedMessages ? null : summary.plan.quotaMessages;
  const audiosLimit = summary.plan.unlimitedAudios ? null : summary.plan.quotaAudios;
  const messagesUsed = summary.usage.messagesUsed ?? 0;
  const audiosUsed = summary.usage.audiosUsed ?? 0;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 md:p-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Control de consumo</p>
        <h3 className="mt-1.5 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Capacidad del ciclo actual</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Visualiza cuanto te queda antes del siguiente periodo.</p>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <UsageLane
          label="Mensajes"
          used={messagesUsed}
          limit={messagesLimit}
          remaining={summary.remaining.messages}
          icon={MessageSquareText}
        />
        <UsageLane
          label="Audios"
          used={audiosUsed}
          limit={audiosLimit}
          remaining={summary.remaining.audios}
          icon={AudioLines}
        />
      </div>
    </section>
  );
}
