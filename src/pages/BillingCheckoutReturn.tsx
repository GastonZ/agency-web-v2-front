import React from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import OnlineLayout from "../layout/OnlineLayout";
import { getMyBillingSummary } from "../services/billing";

export default function BillingCheckoutReturn() {
  const [loading, setLoading] = React.useState(false);
  const [lastStatus, setLastStatus] = React.useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      const summary = await getMyBillingSummary();
      setLastStatus(summary.subscription.status);
      toast.success(`Estado actualizado: ${summary.subscription.status}`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "No se pudo consultar la suscripción");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnlineLayout>
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Estamos validando tu suscripción
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Si recién terminaste el checkout, el estado puede demorar unos segundos en actualizarse.
        </p>

        {lastStatus ? (
          <p className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800">
            Estado actual: <strong>{lastStatus}</strong>
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Consultando..." : "Recargar suscripción"}
          </button>
          <Link
            to="/billing/subscription"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600"
          >
            Ir a Mi Suscripción
          </Link>
        </div>
      </section>
    </OnlineLayout>
  );
}
