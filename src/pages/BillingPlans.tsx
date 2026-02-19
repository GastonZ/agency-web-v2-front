import React from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { toast } from "react-toastify";
import OnlineLayout from "../layout/OnlineLayout";
import { createSubscriptionCheckout, getBillingPlans, getMyBillingSummary } from "../services/billing";
import type { BillingCycle, BillingPlan, BillingPlanName } from "../services/types/billing-types";

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

const featureTone = (enabled: boolean) =>
  enabled ? "text-emerald-100 border-emerald-200/30 bg-emerald-400/12" : "text-white/60 border-white/15 bg-white/5";

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

  async function onSubscribe(planName: string) {
    try {
      if (getPlanRank(planName) <= currentPlanRank) {
        toast.info("Ese plan ya lo tienes o es inferior al actual.");
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
      <div className="space-y-5">
        <header className="relative overflow-hidden rounded-[30px] border border-[#1f2a3b] bg-[#0a111b] p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.18),transparent_35%)]" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">Upgrade engine</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Planes y suscripcion</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/65">
                Elige un plan superior para ampliar cupos y funciones en minutos.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                Plan actual: <strong className="font-semibold text-white">{String(currentPlan || "free").toUpperCase()}</strong>
              </div>
            </div>

            <div className="inline-flex rounded-full border border-white/20 bg-black/20 p-1">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  cycle === "monthly" ? "bg-white text-black shadow-lg" : "text-white/70 hover:text-white"
                }`}
                onClick={() => setCycle("monthly")}
              >
                Mensual
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  cycle === "yearly" ? "bg-white text-black shadow-lg" : "text-white/70 hover:text-white"
                }`}
                onClick={() => setCycle("yearly")}
              >
                Anual
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-[#233146] bg-[#0d1522] p-4 text-sm text-white/70 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            Cargando planes...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {upgradePlans.map((plan) => {
              const rank = getPlanRank(plan.name);
              const isFeatured = rank >= 2;

              return (
                <article
                  key={plan.name}
                  className={`group relative overflow-hidden rounded-[26px] border p-5 text-white shadow-[0_22px_60px_rgba(0,0,0,0.4)] transition hover:-translate-y-1 ${
                    isFeatured
                      ? "border-emerald-200/35 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_42%),#0f1927]"
                      : "border-[#273449] bg-[#111a2a]"
                  }`}
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-300/12 blur-3xl transition group-hover:scale-110" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {plan.displayName || String(plan.name).toUpperCase()}
                        </h2>
                        <p className="mt-2 min-h-10 text-sm text-white/65">
                          {plan.unlimitedCampaigns
                            ? "Campanas ilimitadas"
                            : `Hasta ${plan.maxActiveCampaigns} campanas activas`}
                        </p>
                      </div>

                      {isFeatured ? (
                        <span className="rounded-full border border-emerald-200/40 bg-emerald-300/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-100">
                          Recomendado
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5">
                      <p className="text-4xl font-semibold tracking-tight">{formatArs(planPrice(plan, cycle))}</p>
                      <p className="text-sm text-white/65">por {cycle === "monthly" ? "mes" : "ano"}</p>
                    </div>

                    <ul className="mt-5 space-y-2 text-sm">
                      <li className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium border-white/15 bg-white/5 text-white/80">
                        <Zap className="h-3.5 w-3.5 text-cyan-200" />
                        Mensajes: {plan.unlimitedMessages ? "Ilimitados" : plan.quotaMessages.toLocaleString("es-AR")}
                      </li>
                      <li className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium border-white/15 bg-white/5 text-white/80">
                        <Zap className="h-3.5 w-3.5 text-cyan-200" />
                        Audios: {plan.unlimitedAudios ? "Ilimitados" : plan.quotaAudios.toLocaleString("es-AR")}
                      </li>
                      <li className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${featureTone(plan.allowMarketing)}`}>
                        <Check className="h-3.5 w-3.5" />
                        Marketing {plan.allowMarketing ? "incluido" : "no incluido"}
                      </li>
                      <li className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${featureTone(plan.allowSocialListening)}`}>
                        <Check className="h-3.5 w-3.5" />
                        Social listening {plan.allowSocialListening ? "incluido" : "no incluido"}
                      </li>
                    </ul>

                    <button
                      type="button"
                      onClick={() => onSubscribe(plan.name)}
                      disabled={submittingPlan === plan.name}
                      className="mt-6 w-full rounded-full border border-emerald-100/35 bg-emerald-400/90 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submittingPlan === plan.name ? "Iniciando..." : "Suscribirme"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && currentPlan && upgradePlans.length === 0 ? (
          <div className="rounded-2xl border border-[#2a364b] bg-[#101827] p-4 text-sm text-white/80 shadow-[0_16px_44px_rgba(0,0,0,0.35)]">
            Tu plan actual es <strong>{String(currentPlan).toUpperCase()}</strong>. No hay planes superiores disponibles.
          </div>
        ) : null}
      </div>
    </OnlineLayout>
  );
}
