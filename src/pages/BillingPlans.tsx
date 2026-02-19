import React from "react";
import { ArrowUpRight, Check, Sparkles, Zap } from "lucide-react";
import { toast } from "react-toastify";
import OnlineLayout from "../layout/OnlineLayout";
import { createSubscriptionCheckout, getBillingPlans, getMyBillingSummary } from "../services/billing";
import type {
  BillingCycle,
  BillingPlan,
  BillingPlanName,
  SelfServeCheckoutPlanName,
} from "../services/types/billing-types";

function planPrice(plan: BillingPlan, cycle: BillingCycle) {
  return cycle === "yearly" ? plan.priceYearly ?? plan.priceMonthly : plan.priceMonthly;
}

function formatArs(amount?: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
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

function isSelfServeCheckoutPlan(planName?: BillingPlanName): planName is SelfServeCheckoutPlanName {
  const key = String(planName || "").toLowerCase();
  return key === "basic" || key === "premium";
}

const CUSTOM_PLAN_CONTACT_URL =
  import.meta.env.VITE_CUSTOM_PLAN_CONTACT_URL ||
  "mailto:hola@datacivis.com?subject=Plan%20Custom%20Datacivis";

function cycleButtonClass(active: boolean) {
  return active
    ? "bg-emerald-500/12 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/20"
    : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-900/5 dark:hover:bg-white/5";
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
        } catch {
          // no-op
        }
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

  async function onSubscribe(planName: BillingPlanName) {
    try {
      if (getPlanRank(planName) <= currentPlanRank) {
        toast.info("Ese plan ya lo tienes o es inferior al actual.");
        return;
      }

      if (!isSelfServeCheckoutPlan(planName)) {
        window.open(CUSTOM_PLAN_CONTACT_URL, "_blank", "noopener,noreferrer");
        return;
      }

      setSubmittingPlan(planName);
      const returnUrl = "https://datacivis.com.ar/billing/checkout/return";
      const checkout = await createSubscriptionCheckout({
        planName,
        billingCycle: cycle,
        returnUrl,
      });

      const target = checkout.initPoint || checkout.sandboxInitPoint;
      if (!target) {
        throw new Error("No se recibio URL de checkout");
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
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/55 via-neutral-50 to-emerald-50/35 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950" />
          <div className="absolute -top-24 right-[-10%] h-[360px] w-[460px] rounded-full bg-emerald-400/16 blur-[100px]" />
          <div className="absolute -bottom-24 left-[-10%] h-[360px] w-[520px] rounded-full bg-emerald-300/14 blur-[110px]" />
        </div>

        <div className="mx-auto w-full max-w-6xl space-y-6 px-1 py-4">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-500/15 dark:text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade engine
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Planes y suscripcion</h1>
              <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">
                Elige un plan superior para ampliar cupos y funciones.
              </p>
            </div>

            <div className="inline-flex rounded-full bg-white/70 p-1 ring-1 ring-neutral-200 backdrop-blur dark:bg-neutral-900/60 dark:ring-neutral-800">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${cycleButtonClass(cycle === "monthly")}`}
                onClick={() => setCycle("monthly")}
              >
                Mensual
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${cycleButtonClass(cycle === "yearly")}`}
                onClick={() => setCycle("yearly")}
              >
                Anual
              </button>
            </div>
          </header>

          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 md:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-200">
              Plan actual: <strong>{String(currentPlan || "free").toUpperCase()}</strong>
            </div>

            {loading ? (
              <div className="mt-4 rounded-xl bg-neutral-900/5 px-4 py-3 text-sm text-neutral-600 ring-1 ring-neutral-200/70 dark:bg-white/5 dark:text-neutral-300 dark:ring-neutral-800/70">
                Cargando planes...
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap justify-center gap-5">
                {upgradePlans.map((plan) => {
                  const rank = getPlanRank(plan.name);
                  const isFeatured = rank >= 2;

                  return (
                    <article
                      key={plan.name}
                      className={[
                        "flex w-full max-w-[360px] flex-col rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5",
                        "bg-white/85 ring-1 ring-neutral-200/70 dark:bg-neutral-900/75 dark:ring-neutral-800/70",
                        isFeatured ? "border-emerald-300/60 dark:border-emerald-500/35" : "border-neutral-200 dark:border-neutral-800",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {plan.displayName || String(plan.name).toUpperCase()}
                          </h2>
                          <p className="mt-1.5 min-h-10 text-sm text-neutral-600 dark:text-neutral-300">
                            {plan.unlimitedCampaigns
                              ? "Campañas ilimitadas"
                              : `Hasta ${plan.maxActiveCampaigns} campañas activas`}
                          </p>
                        </div>

                        {isFeatured ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-200">
                            Recomendado
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <p className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                          {formatArs(planPrice(plan, cycle))}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">por {cycle === "monthly" ? "mes" : "año"}</p>
                      </div>

                      <ul className="mt-5 space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
                        <li className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                          Mensajes: {plan.unlimitedMessages ? "Ilimitados" : plan.quotaMessages.toLocaleString("es-AR")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                          Audios: {plan.unlimitedAudios ? "Ilimitados" : plan.quotaAudios.toLocaleString("es-AR")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className={`h-3.5 w-3.5 ${plan.allowMarketing ? "text-emerald-600 dark:text-emerald-300" : "text-neutral-500 dark:text-neutral-400"}`} />
                          Marketing {plan.allowMarketing ? "incluido" : "no incluido"}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className={`h-3.5 w-3.5 ${plan.allowSocialListening ? "text-emerald-600 dark:text-emerald-300" : "text-neutral-500 dark:text-neutral-400"}`} />
                          Social listening {plan.allowSocialListening ? "incluido" : "no incluido"}
                        </li>
                      </ul>

                      <button
                        type="button"
                        onClick={() => onSubscribe(plan.name)}
                        disabled={isSelfServeCheckoutPlan(plan.name) && submittingPlan === plan.name}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500/12 px-4 py-2.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/18 dark:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSelfServeCheckoutPlan(plan.name)
                          ? (submittingPlan === plan.name ? "Iniciando..." : "Suscribirme")
                          : "Contactanos"}
                        {isSelfServeCheckoutPlan(plan.name) && submittingPlan === plan.name ? null : <ArrowUpRight className="h-4 w-4" />}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {!loading && currentPlan && upgradePlans.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 text-center text-sm text-neutral-700 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
              Tu plan actual es <strong>{String(currentPlan).toUpperCase()}</strong>. No hay planes superiores disponibles.
            </div>
          ) : null}
        </div>
      </div>
    </OnlineLayout>
  );
}
