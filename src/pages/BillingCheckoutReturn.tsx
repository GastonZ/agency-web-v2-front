import React from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
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
      toast.error(error?.data?.message || error?.message || "No se pudo consultar la suscripcion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnlineLayout>
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-[30px] border border-[#243149] bg-[#0d1523] p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute" />

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">Checkout return</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Validando tu suscripcion</h1>
        <p className="mt-2 text-sm text-white/65">
          Si acabas de completar el checkout, el estado puede tardar unos segundos en reflejarse.
        </p>

        {lastStatus ? (
          <p className="mt-4 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85">
            Estado actual: <strong>{lastStatus}</strong>
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-100/35 bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Consultando..." : "Recargar suscripcion"}
          </button>
          <Link
            to="/billing/subscription"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Ir a Mi Suscripcion
          </Link>
        </div>
      </section>
    </OnlineLayout>
  );
}
