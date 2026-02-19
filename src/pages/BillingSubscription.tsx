import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowUpRight, CalendarClock, RefreshCw, ShieldCheck } from "lucide-react";
import OnlineLayout from "../layout/OnlineLayout";
import BillingUsageWidget from "../components/features/billing/BillingUsageWidget";
import { getMyBillingSummary } from "../services/billing";
import type { BillingStatus, BillingSummary } from "../services/types/billing-types";

function asDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status?: BillingStatus) {
  const map: Record<string, string> = {
    active: "Activo",
    pending: "Pendiente",
    trialing: "Prueba",
    grace_period: "Periodo de gracia",
    paused: "Pausado",
    cancelled: "Cancelado",
  };
  return map[String(status)] ?? status ?? "-";
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#121a28] p-4 shadow-[0_12px_35px_rgba(0,0,0,0.28)]">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </article>
  );
}

export default function BillingSubscription() {
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<BillingSummary | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyBillingSummary();
      setSummary(data);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "No se pudo cargar tu suscripcion");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <OnlineLayout>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[30px] border border-[#1f2a3b] bg-[#0b121d] p-5 text-white shadow-[0_26px_90px_rgba(0,0,0,0.42)] md:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_42%),radial-gradient(circle_at_15%_110%,rgba(56,189,248,0.16),transparent_38%)]" />
          <div className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full border border-cyan-200/20" />

          <div className="relative">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">Billing control room</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mi suscripcion</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Estado, capacidad y fechas clave del ciclo actual en una vista unica.
                </p>
              </div>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/15 disabled:opacity-70"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Recargar
              </button>
            </header>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Cargando suscripcion...
              </div>
            ) : summary ? (
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoTile
                  label="Plan"
                  value={summary.plan.displayName || String(summary.subscription.planName).toUpperCase()}
                />
                <InfoTile label="Estado" value={statusLabel(summary.subscription.status)} />
                <InfoTile label="Inicio de ciclo" value={asDateLabel(summary.subscription.currentPeriodStart)} />
                <InfoTile label="Fin de ciclo" value={asDateLabel(summary.subscription.currentPeriodEnd)} />
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-2xl border border-emerald-300/30 bg-gradient-to-br from-emerald-400/20 via-emerald-300/8 to-cyan-300/15 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-white/20 bg-white/10 p-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-100" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100/75">Capacidad</p>
                    <p className="mt-1 text-sm text-emerald-50">
                      {summary?.remaining?.messages === 0 && summary?.upgradeMessage
                        ? summary.upgradeMessage
                        : "Si necesitas mas capacidad, puedes cambiar de plan en cualquier momento."}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/billing/plans"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/18"
              >
                Ver planes disponibles
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {summary?.subscription?.currentPeriodEnd ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                <CalendarClock className="h-3.5 w-3.5" />
                Proximo cierre: {asDateLabel(summary.subscription.currentPeriodEnd)}
              </div>
            ) : null}
          </div>
        </section>

        {summary ? <BillingUsageWidget summary={summary} /> : null}
      </div>
    </OnlineLayout>
  );
}
