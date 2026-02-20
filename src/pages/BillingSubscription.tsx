import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowUpRight, CalendarClock, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-900/5 px-4 py-3 ring-1 ring-neutral-200/70 dark:bg-white/5 dark:ring-neutral-800/70">
      <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1.5 text-base font-semibold text-neutral-900 dark:text-neutral-50">{value}</p>
    </div>
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
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/55 via-neutral-50 to-emerald-50/35 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950" />
          <div className="absolute -top-24 right-[-10%] h-[360px] w-[460px] rounded-full bg-emerald-400/16 blur-[100px]" />
          <div className="absolute -bottom-24 left-[-10%] h-[360px] w-[520px] rounded-full bg-emerald-300/14 blur-[110px]" />
        </div>

        <div className="mx-auto w-full max-w-6xl space-y-6 px-1 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-500/15 dark:text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Billing control room
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Mi suscripcion</h1>
              <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
                Estado, capacidad y fechas clave del ciclo actual.
              </p>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-white/75 px-4 py-2 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200 transition hover:bg-emerald-800 dark:bg-neutral-900/70 dark:text-neutral-100 dark:ring-neutral-800 disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Recargar
            </button>
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 md:p-5">
            {loading ? (
              <div className="rounded-xl bg-neutral-900/5 px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/70 dark:bg-white/5 dark:text-neutral-300 dark:ring-neutral-800/70">
                Cargando suscripcion...
              </div>
            ) : summary ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryItem
                  label="Plan"
                  value={summary.plan.displayName || String(summary.subscription.planName).toUpperCase()}
                />
                <SummaryItem label="Estado" value={statusLabel(summary.subscription.status)} />
                <SummaryItem label="Inicio de ciclo" value={asDateLabel(summary.subscription.currentPeriodStart)} />
                <SummaryItem label="Fin de ciclo" value={asDateLabel(summary.subscription.currentPeriodEnd)} />
              </div>
            ) : (
              <div className="rounded-xl bg-neutral-900/5 px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/70 dark:bg-white/5 dark:text-neutral-300 dark:ring-neutral-800/70">
                No hay datos de suscripcion disponibles.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3 rounded-xl bg-emerald-500/8 px-4 py-3 ring-1 ring-emerald-500/20">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Capacidad</p>
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                    {summary?.remaining?.messages === 0 && summary?.upgradeMessage
                      ? summary.upgradeMessage
                      : "Si necesitas mas capacidad, puedes cambiar de plan en cualquier momento."}
                  </p>
                </div>
              </div>

              <Link
                to="/billing/plans"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500/12 px-5 py-2.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/18 dark:text-emerald-200"
              >
                Ver planes disponibles
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {summary?.subscription?.currentPeriodEnd ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-900/5 px-3 py-1.5 text-xs text-neutral-600 ring-1 ring-neutral-200/70 dark:bg-white/5 dark:text-neutral-300 dark:ring-neutral-800/70">
                <CalendarClock className="h-3.5 w-3.5" />
                Proximo cierre: {asDateLabel(summary.subscription.currentPeriodEnd)}
              </div>
            ) : null}
          </section>

          {summary ? <BillingUsageWidget summary={summary} /> : null}
        </div>
      </div>
    </OnlineLayout>
  );
}
