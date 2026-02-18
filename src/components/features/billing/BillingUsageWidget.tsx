import React from "react";
import type { BillingSummary } from "../../../services/types/billing-types";

type CounterView = {
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
};

function clampProgress(used = 0, limit?: number | null) {
  if (!limit || limit <= 0) return 0;
  return Math.max(0, Math.min(100, (used / limit) * 100));
}

function UsageBar({ label, used, limit, remaining }: CounterView) {
  const pct = clampProgress(used, limit);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-700 dark:text-neutral-200">{label}</span>
        <span className="font-medium text-neutral-900 dark:text-neutral-50">
          {limit ? `${used} / ${limit}` : `${used} usados`}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-300">
        {remaining === null || remaining === undefined
          ? "Sin límite definido"
          : `${remaining} restantes`}
      </p>
    </div>
  );
}

export default function BillingUsageWidget({ summary }: { summary: BillingSummary }) {
  const messagesLimit = summary.plan.unlimitedMessages ? null : summary.plan.quotaMessages;
  const audiosLimit = summary.plan.unlimitedAudios ? null : summary.plan.quotaAudios;
  const messagesUsed = summary.usage.messagesUsed ?? 0;
  const audiosUsed = summary.usage.audiosUsed ?? 0;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
      <header className="mb-4">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Consumo del ciclo</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Seguimiento de mensajes y audios del período actual.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UsageBar
          label="Mensajes"
          used={messagesUsed}
          limit={messagesLimit}
          remaining={summary.remaining.messages}
        />
        <UsageBar
          label="Audios"
          used={audiosUsed}
          limit={audiosLimit}
          remaining={summary.remaining.audios}
        />
      </div>
    </section>
  );
}
