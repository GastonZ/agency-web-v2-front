import React from "react";
import { Search } from "lucide-react";
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
      toast.warning("Ingresa un subscriptionId");
      return;
    }

    try {
      setLoading(true);
      const data = await getMercadoPagoSubscriptionDiagnostics(id);
      setResult(data);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "No se pudo consultar diagnostico");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnlineLayout>
      <section className="space-y-4 overflow-hidden rounded-[30px] border border-[#27344a] bg-[#0d1523] p-5 text-white shadow-[0_25px_70px_rgba(0,0,0,0.42)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">Internal diagnostics</p>
        <h1 className="text-3xl font-semibold tracking-tight">Diagnostico Mercado Pago</h1>
        <p className="text-sm text-white/65">Consulta una suscripcion remota/local por ID para soporte tecnico.</p>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            placeholder="subscriptionId"
            className="h-11 w-full rounded-full border border-white/20 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-200/55"
          />
          <button
            type="button"
            onClick={runLookup}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-100/35 bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Search className="h-4 w-4" />
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>

        {result ? (
          <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-emerald-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </section>
    </OnlineLayout>
  );
}
