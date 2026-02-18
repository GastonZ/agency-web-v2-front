import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import OnlineLayout from "../layout/OnlineLayout";
import BillingUsageWidget from "../components/features/billing/BillingUsageWidget";
import { getMyBillingSummary } from "../services/billing";
import type { BillingSummary } from "../services/types/billing-types";

function asDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
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
      toast.error(error?.data?.message || error?.message || "No se pudo cargar tu suscripción");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <OnlineLayout>
      <div className="space-y-4">
        <section className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Mi suscripción</h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Estado actual y fechas de tu ciclo de facturación.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
            >
              Recargar
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-200">Cargando suscripción...</p>
          ) : summary ? (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Plan</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {summary.plan.displayName || String(summary.subscription.planName).toUpperCase()}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Estado</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {summary.subscription.status}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Inicio de ciclo</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {asDateLabel(summary.subscription.currentPeriodStart)}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Fin de ciclo</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {asDateLabel(summary.subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-xl border border-emerald-300/50 bg-emerald-50 p-4 dark:border-emerald-700/40 dark:bg-emerald-900/20">
            <p className="text-sm text-emerald-900 dark:text-emerald-100">
              {summary?.remaining?.messages === 0 && summary?.upgradeMessage
                ? summary.upgradeMessage
                : "¿Necesitás más capacidad? Podés cambiar de plan en cualquier momento."}
            </p>
            <Link
              to="/billing/plans"
              className="mt-3 inline-flex rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Ver planes
            </Link>
          </div>
        </section>

        {summary ? <BillingUsageWidget summary={summary} /> : null}
      </div>
    </OnlineLayout>
  );
}
