import React from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, ArrowUpRight } from "lucide-react";

type LimitEventDetail = {
  status?: number;
  code?: string;
  message?: string;
};

export default function BillingLimitModal() {
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<LimitEventDetail | null>(null);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<LimitEventDetail>;
      setDetail(custom.detail || null);
      setOpen(true);
    };

    window.addEventListener("billing:limit-reached", handler as EventListener);
    return () => window.removeEventListener("billing:limit-reached", handler as EventListener);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#30415c] bg-[#0b1320] p-6 text-white shadow-[0_35px_90px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,113,133,0.2),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.18),transparent_42%)]" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/35 bg-rose-300/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-rose-100">
            <AlertOctagon className="h-3.5 w-3.5" />
            Limite alcanzado
          </div>

          <h3 className="mt-4 text-xl font-semibold tracking-tight">Tu plan necesita una actualizacion</h3>
          <p className="mt-2 text-sm text-white/75">
            {detail?.message || "Para continuar, necesitas actualizar tu plan activo."}
          </p>

          {(detail?.code || detail?.status) && (
            <p className="mt-3 text-xs text-white/50">
              Codigo: {detail?.code || "-"} | Status: {detail?.status || "-"}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              Cerrar
            </button>
            <Link
              to="/billing/plans"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-100/35 bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200"
            >
              Ver planes
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
