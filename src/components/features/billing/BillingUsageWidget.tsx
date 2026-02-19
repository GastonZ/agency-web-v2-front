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

function UsageBar({ label, used, limit, remaining, icon: Icon }: CounterView) {
  const pct = clampProgress(used, limit);
  const risk = pct >= 90 ? "high" : pct >= 70 ? "mid" : "low";

  const tone =
    risk === "high"
      ? "from-rose-500 via-orange-400 to-yellow-300"
      : risk === "mid"
        ? "from-amber-400 via-emerald-300 to-cyan-200"
        : "from-emerald-300 via-cyan-300 to-blue-300";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#101723] px-4 py-4 shadow-[0_16px_38px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full bg-cyan-300/12 blur-2xl transition group-hover:scale-110" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {limit ? `${formatCount(used)} / ${formatCount(limit)}` : `${formatCount(used)} usados`}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-cyan-200">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone} shadow-[0_0_26px_rgba(45,212,191,0.45)] transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-white/55">Uso del ciclo actual</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 font-medium text-white/80">
          {remaining === null || remaining === undefined
            ? "Sin limite"
            : `${formatCount(remaining)} restantes`}
        </span>
      </div>
    </article>
  );
}

export default function BillingUsageWidget({ summary }: { summary: BillingSummary }) {
  const messagesLimit = summary.plan.unlimitedMessages ? null : summary.plan.quotaMessages;
  const audiosLimit = summary.plan.unlimitedAudios ? null : summary.plan.quotaAudios;
  const messagesUsed = summary.usage.messagesUsed ?? 0;
  const audiosUsed = summary.usage.audiosUsed ?? 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#1d2938] bg-[#0b111b] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_42%)]" />

      <header className="relative mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Control de consumo</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Capacidad del ciclo actual</h3>
        <p className="text-sm text-white/60">Visualiza en tiempo real cuanto te queda antes del siguiente periodo.</p>
      </header>

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
        <UsageBar
          label="Mensajes"
          used={messagesUsed}
          limit={messagesLimit}
          remaining={summary.remaining.messages}
          icon={MessageSquareText}
        />
        <UsageBar
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
