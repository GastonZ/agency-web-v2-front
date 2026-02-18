import React from "react";
import { Link } from "react-router-dom";
import type { BillingStatus } from "../../../services/types/billing-types";

function contentByStatus(status: BillingStatus) {
  switch (status) {
    case "grace_period":
      return {
        tone: "amber",
        title: "Tu suscripción está en período de gracia",
        message: "Actualizá tu plan para evitar interrupciones del servicio.",
      };
    case "paused":
      return {
        tone: "orange",
        title: "Tu suscripción está pausada",
        message: "Reactivá tu suscripción para recuperar capacidad completa.",
      };
    case "cancelled":
      return {
        tone: "red",
        title: "Tu suscripción está cancelada",
        message: "Elegí un plan para reactivar facturación y límites.",
      };
    default:
      return null;
  }
}

export default function BillingStatusBanner({ status }: { status?: BillingStatus }) {
  if (!status) return null;
  const info = contentByStatus(status);
  if (!info) return null;

  const tones: Record<string, string> = {
    amber:
      "border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100",
    orange:
      "border-orange-300/80 bg-orange-50 text-orange-900 dark:border-orange-700/60 dark:bg-orange-900/20 dark:text-orange-100",
    red: "border-red-300/80 bg-red-50 text-red-900 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-100",
  };

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 ${tones[info.tone]}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">{info.title}</p>
          <p className="text-sm opacity-90">{info.message}</p>
        </div>
        <Link
          to="/billing/plans"
          className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Ver planes
        </Link>
      </div>
    </div>
  );
}
