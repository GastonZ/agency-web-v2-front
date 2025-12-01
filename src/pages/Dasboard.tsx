// Dashboard.tsx
import React from "react";
import OnlineLayout from "../layout/OnlineLayout";
import AgencyChatbot from "../components/features/AgencyChatbot";
import { DASHBOARD_PLAYBOOK, getUserId, DASHBOARD_PLAYBOOK_ES } from "../utils/helper";
import WipeMemoryBtn from "../components/features/WipeMemoryBtn";
import HeroConversationalAgency from "../components/features/HeroConversationalAgency";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { searchMyModerationCampaigns } from "../services/campaigns"; // <- ajusta ruta si es otra

type GlassCardProps = {
    title?: React.ReactNode;
    rightLabel?: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    children?: React.ReactNode;
};

const baseCardCls =
    "rounded-2xl border shadow-sm bg-white/80 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-neutral-200 dark:border-neutral-800";

function GlassCard({
    title,
    rightLabel,
    className = "",
    bodyClassName = "",
    children,
}: GlassCardProps) {
    return (
        <section
            className={`${baseCardCls} p-4 md:p-6 flex flex-col ${className}`}
        >
            {(title || rightLabel) && (
                <header className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {title}
                    </h3>
                    {rightLabel ? (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {rightLabel}
                        </span>
                    ) : null}
                </header>
            )}

            <div
                className={[
                    "flex-1 rounded-xl ring-1 ring-white/5 dark:ring-black/20",
                    "bg-gradient-to-b from-white/5 to-transparent",
                    bodyClassName,
                ].join(" ")}
            >
                {children}
            </div>
        </section>
    );
}

function Placeholder({ className = "" }: { className?: string }) {
    return (
        <div
            className={[
                "w-full h-full rounded-xl",
                "bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0)_40%)]",
                className,
            ].join(" ")}
        />
    );
}

const Dashboard: React.FC = () => {
    const userId = getUserId?.() || "anon";

    const { i18n } = useTranslation();
    const uiLang = i18n.language.startsWith("en") ? "en" : "es";

    const navigate = useNavigate();

    const [campaigns, setCampaigns] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                setLoading(true);
                setError(null);
                const res = await searchMyModerationCampaigns();

                // Intentamos soportar varias formas de respuesta:
                let list: any[] = [];
                if (Array.isArray(res)) {
                    list = res;
                } else if (Array.isArray((res as any).items)) {
                    list = (res as any).items;
                } else if (Array.isArray((res as any).data)) {
                    list = (res as any).data;
                }

                if (!mounted) return;
                setCampaigns(list);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || "Error al cargar campañas.");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        // Solo tiene sentido cargar si hay userId real
        if (userId && userId !== "anon") {
            load();
        }

        return () => {
            mounted = false;
        };
    }, [userId]);

    const labels =
        uiLang === "en"
            ? {
                  title: "My moderation campaigns",
                  rightLabel: campaigns.length
                      ? `${campaigns.length} campaign(s)`
                      : undefined,
                  loading: "Loading campaigns...",
                  error: "There was an error loading your campaigns.",
                  empty: "You don't have moderation campaigns yet.",
                  goBtn: "Open campaign",
                  statusLabel: "Status",
                  goalLabel: "Goal",
                  channelsLabel: "Channels",
              }
            : {
                  title: "Mis campañas de moderación",
                  rightLabel: campaigns.length
                      ? `${campaigns.length} campaña(s)`
                      : undefined,
                  loading: "Cargando campañas...",
                  error: "Hubo un error al cargar tus campañas.",
                  empty: "Todavía no tenés campañas de moderación.",
                  goBtn: "Ir a la campaña",
                  statusLabel: "Estado",
                  goalLabel: "Objetivo",
                  channelsLabel: "Canales",
              };

    return (
        <OnlineLayout>
            <div className="w-full px-2 md:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
                    {/* Columna principal: campañas */}
                    <div className="lg:col-span-8">
                        <GlassCard
                            title={labels.title}
                            rightLabel={labels.rightLabel}
                            bodyClassName="p-3 md:p-4"
                        >
                            <div className="flex flex-col gap-3 md:gap-4">
                                {loading && (
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {labels.loading}
                                    </div>
                                )}

                                {error && !loading && (
                                    <div className="text-sm text-red-500">
                                        {labels.error}
                                    </div>
                                )}

                                {!loading && !error && campaigns.length === 0 && (
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {labels.empty}
                                    </div>
                                )}

                                {!loading && !error && campaigns.length > 0 && (
                                    <ul className="space-y-3">
                                        {campaigns.map((c: any) => (
                                            <li
                                                key={c.id}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/60 px-3 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                                                        {c.name || c.title || `#${c.id}`}
                                                    </div>
                                                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                        {c.goal ||
                                                            c.summary ||
                                                            c.description ||
                                                            ""}
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                                                        {c.status && (
                                                            <span className="px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                                                                {labels.statusLabel}: {c.status}
                                                            </span>
                                                        )}
                                                        {typeof c.channels?.length === "number" && (
                                                            <span className="px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                                                                {labels.channelsLabel}:{" "}
                                                                {c.channels.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/my_moderation_campaign/${c.id}/statistics`
                                                        )
                                                    }
                                                    className="shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                                                >
                                                    {labels.goBtn}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Columna lateral: algo de contexto / héroe / chatbot (placeholder) */}
                </div>
            </div>
        </OnlineLayout>
    );
};

export default Dashboard;
