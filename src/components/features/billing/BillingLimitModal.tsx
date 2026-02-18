import React from "react";
import { Link } from "react-router-dom";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Límite del plan alcanzado</h3>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
          {detail?.message || "Para continuar, necesitás actualizar tu plan."}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600"
          >
            Cerrar
          </button>
          <Link
            to="/billing/plans"
            onClick={() => setOpen(false)}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Ver planes
          </Link>
        </div>
      </div>
    </div>
  );
}
