import React from "react";
import { toast } from "react-toastify";
import OnlineLayout from "../layout/OnlineLayout";
import { createSubscriptionCheckout, getBillingPlans, getMyBillingSummary } from "../services/billing";
import type { BillingCycle, BillingPlan, BillingPlanName } from "../services/types/billing-types";

function planPrice(plan: BillingPlan, cycle: BillingCycle) {
  return cycle === "yearly" ? plan.priceYearly ?? plan.priceMonthly : plan.priceMonthly;
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  custom: 3,
};

function getPlanRank(planName?: BillingPlanName) {
  const key = String(planName || "").toLowerCase();
  return PLAN_RANK[key] ?? -1;
}

export default function BillingPlans() {
  const [loading, setLoading] = React.useState(true);
  const [submittingPlan, setSubmittingPlan] = React.useState<string | null>(null);
  const [cycle, setCycle] = React.useState<BillingCycle>("monthly");
  const [plans, setPlans] = React.useState<BillingPlan[]>([]);
  const [currentPlan, setCurrentPlan] = React.useState<BillingPlanName | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [plansData, summary] = await Promise.all([getBillingPlans(), getMyBillingSummary()]);
        if (mounted) {
          setPlans(plansData || []);
          setCurrentPlan(summary?.subscription?.planName || null);
        }
      } catch (error: any) {
        try {
          const fallbackPlans = await getBillingPlans();
          if (mounted) setPlans(fallbackPlans || []);
        } catch {}
        toast.error(error?.data?.message || error?.message || "No se pudieron cargar los datos de billing");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currentPlanRank = getPlanRank(currentPlan || undefined);
  const sortedPlans = React.useMemo(() => {
    const copy = [...plans];
    copy.sort((a, b) => getPlanRank(a.name) - getPlanRank(b.name));
    return copy;
  }, [plans]);
  const upgradePlans = React.useMemo(
    () => sortedPlans.filter((plan) => getPlanRank(plan.name) > currentPlanRank),
    [sortedPlans, currentPlanRank],
  );

  async function onSubscribe(planName: string) {
    try {
      if (getPlanRank(planName) <= currentPlanRank) {
        toast.info("Ese plan ya lo tenés o es inferior al actual.");
        return;
      }

      setSubmittingPlan(planName);
      const returnUrl = `https://datacivis.com.ar/billing/checkout/return`;
      const checkout = await createSubscriptionCheckout({
        planName,
        billingCycle: cycle,
        returnUrl,
      });

      const target = checkout.initPoint || checkout.sandboxInitPoint;
      if (!target) {
        throw new Error("No se recibió URL de checkout");
      }
      window.location.assign(target);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "No se pudo iniciar checkout");
    } finally {
      setSubmittingPlan(null);
    }
  }

  return (
    <OnlineLayout>
      <div className="space-y-5">
        <header className="rounded-2xl border border-neutral-200 bg-white/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Planes</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Elegí un plan y completá tu suscripción.
          </p>
          <div className="mt-4 inline-flex rounded-lg border border-neutral-300 p-1 dark:border-neutral-700">
            <button
              className={`rounded-md px-3 py-1.5 text-sm ${cycle === "monthly" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : ""}`}
              onClick={() => setCycle("monthly")}
            >
              Mensual
            </button>
            <button
              className={`rounded-md px-3 py-1.5 text-sm ${cycle === "yearly" ? "bg-neutral-900 text-white dark:bg-white dark:text-black" : ""}`}
              onClick={() => setCycle("yearly")}
            >
              Anual
            </button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            Cargando planes...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {upgradePlans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
              >
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {plan.displayName || String(plan.name).toUpperCase()}
                </h2>
                <p className="mt-2 min-h-10 text-sm text-neutral-600 dark:text-neutral-300">
                  {plan.unlimitedCampaigns
                    ? "Campañas ilimitadas"
                    : `Hasta ${plan.maxActiveCampaigns} campañas activas`}
                </p>
                <p className="mt-4 text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                  {planPrice(plan, cycle) ?? 0}
                  <span className="ml-1 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    $ARS / {cycle === "monthly" ? "mes" : "año"}
                  </span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
                  <li>
                    • Mensajes:{" "}
                    {plan.unlimitedMessages ? "Ilimitados" : `${plan.quotaMessages.toLocaleString()}`}
                  </li>
                  <li>
                    • Audios: {plan.unlimitedAudios ? "Ilimitados" : `${plan.quotaAudios.toLocaleString()}`}
                  </li>
                  <li>• Marketing: {plan.allowMarketing ? "Sí" : "No"}</li>
                  <li>• Social Listening: {plan.allowSocialListening ? "Sí" : "No"}</li>
                </ul>
                <button
                  type="button"
                  onClick={() => onSubscribe(plan.name)}
                  disabled={submittingPlan === plan.name}
                  className="mt-6 w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submittingPlan === plan.name ? "Iniciando..." : "Suscribirme"}
                </button>
              </article>
            ))}
          </div>
        )}

        {!loading && currentPlan && upgradePlans.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            Tu plan actual es <strong>{String(currentPlan).toUpperCase()}</strong>. No hay planes superiores disponibles.
          </div>
        ) : null}
      </div>
    </OnlineLayout>
  );
}
