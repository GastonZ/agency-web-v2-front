import React from "react";
import { toast } from "react-toastify";
import OnlineLayout from "../layout/OnlineLayout";
import { getMercadoPagoSubscriptionDiagnostics } from "../services/billing";
import type { MercadoPagoSubscriptionDiagnostics } from "../services/types/billing-types";

export default function BillingDiagnostics() {
  const [subscriptionId, setSubscriptionId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<MercadoPagoSubscriptionDiagnostics | null>(null);

  async function runLookup() {
    const id = subscriptionId.trim();
    if (!id) {
      toast.warning("Ingresá un subscriptionId");
      return;
    }
    try {
      setLoading(true);
      const data = await getMercadoPagoSubscriptionDiagnostics(id);
      setResult(data);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "No se pudo consultar diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnlineLayout>
      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Diagnóstico Mercado Pago</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Vista interna para consultar una suscripción remota/local por ID.
        </p>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            placeholder="subscriptionId"
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-600 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={runLookup}
            disabled={loading}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>

        {result ? (
          <pre className="overflow-auto rounded-xl bg-neutral-950 p-4 text-xs text-neutral-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </section>
    </OnlineLayout>
  );
}
