import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, OctagonAlert, PauseCircle } from "lucide-react";
import type { BillingStatus } from "../../../services/types/billing-types";

type BannerInfo = {
  tone: "amber" | "orange" | "red";
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
};

function contentByStatus(status: BillingStatus): BannerInfo | null {
  switch (status) {
    case "grace_period":
      return {
        tone: "amber",
        title: "Tu suscripcion esta en periodo de gracia",
        message: "Actualiza tu plan para evitar interrupciones del servicio.",
        icon: AlertTriangle,
      };
    case "paused":
      return {
        tone: "orange",
        title: "Tu suscripcion esta pausada",
        message: "Reactiva tu suscripcion para recuperar capacidad completa.",
        icon: PauseCircle,
      };
    case "cancelled":
      return {
        tone: "red",
        title: "Tu suscripcion esta cancelada",
        message: "Elige un plan para reactivar facturacion y limites.",
        icon: OctagonAlert,
      };
    default:
      return null;
  }
}

export default function BillingStatusBanner({ status }: { status?: BillingStatus }) {
  if (!status) return null;
  const info = contentByStatus(status);
  if (!info) return null;

  const tones: Record<BannerInfo["tone"], string> = {
    amber:
      "border-amber-300/40 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_55%),#17120a] text-amber-50",
    orange:
      "border-orange-300/40 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.2),transparent_58%),#1a120a] text-orange-50",
    red: "border-rose-400/35 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.2),transparent_58%),#1a0c12] text-rose-50",
  };

  const Icon = info.icon;

  return (
    <div
      className={`mb-5 overflow-hidden rounded-2xl border px-4 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.25)] ${tones[info.tone]}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-white/20 bg-white/10 p-2">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">Billing alert</p>
            <p className="mt-1 text-sm font-semibold">{info.title}</p>
            <p className="text-sm opacity-90">{info.message}</p>
          </div>
        </div>
        <Link
          to="/billing/plans"
          className="inline-flex items-center justify-center rounded-full border border-white/25 bg-black/45 px-4 py-2 text-sm font-medium text-white transition hover:bg-black/60"
        >
          Ver planes
        </Link>
      </div>
    </div>
  );
}
