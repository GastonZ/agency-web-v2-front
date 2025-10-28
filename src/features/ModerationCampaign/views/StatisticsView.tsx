import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getModerationCampaignById } from "../../../services/campaigns";
import { getLastLaunchedModeration, clearLastLaunchedModeration } from "../../../utils/helper";
import OnlineLayout from "../../../layout/OnlineLayout";
import { MessageSquare, ClipboardList, CalendarRange } from "lucide-react";
import WhatsappQrPanel from "../../../components/features/WhatsappQrPannel";
import InstagramConnectPanel from "../../../components/features/InstagramConnectButton";
import { getUserId } from "../../../utils/helper";
import InstagramConnectButton from "../../../components/features/InstagramConnectButton";

export default function StatisticsView() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [campaign, setCampaign] = React.useState<any>(null);
    const [channelsToConfigure, setChannelsToConfigure] = React.useState<string[]>([]);
    const userId = getUserId() || "";
    const [openWhatsAppSetup, setOpenWhatsAppSetup] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const data = await getModerationCampaignById(id!);
                if (!mounted) return;
                setCampaign(data);

                const last = getLastLaunchedModeration();
                if (last?.id === id && last?.channels?.length) {
                    setChannelsToConfigure(last.channels);
                    clearLastLaunchedModeration();
                } else {
                    setChannelsToConfigure(data?.channels ?? []);
                }
            } catch (e: any) {
                setError(e?.message || "Error al cargar la campaña");
            } finally {
                setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const hasWhatsApp = React.useMemo(() => {
        const arr = (channelsToConfigure?.length ? channelsToConfigure : campaign?.channels) ?? [];
        return arr.some((c: string) => (c || "").toLowerCase().includes("whats"));
    }, [channelsToConfigure, campaign]);

    const hasInstagram = React.useMemo(() => {
        const arr = (channelsToConfigure?.length ? channelsToConfigure : campaign?.channels) ?? [];
        return arr.some((c: string) => (c || "").toLowerCase().includes("instagram"));
    }, [channelsToConfigure, campaign]);


    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950">
            <div className="text-center space-y-3">
                <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 dark:text-gray-300 text-sm">Cargando campañas</p>
            </div>
        </div>
    )
    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950">
            <div className="text-center space-y-3">
                <p className="text-red-600 text-sm">{error}</p>
            </div>
        </div>
    );
    if (!campaign) return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950">
            <div className="text-center space-y-3">
                <p className="text-red-600 text-sm">No se encontro la campaña</p>
            </div>
        </div>
    )

    return (
        <OnlineLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">{campaign.name}</h2>
                        {/* <p className="text-sm opacity-70">ID: {campaign.id}</p> */}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ring-1 ${(() => {
                        const v = (campaign.status || "").toLowerCase();
                        if (v === "active") return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-emerald-400/30";
                        if (v === "paused") return "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-amber-400/30";
                        return "text-neutral-700 dark:text-neutral-300 bg-neutral-500/10 ring-neutral-400/30";
                    })()}`}>
                        {campaign.status || "—"}
                    </span>
                </div>

                {/* Banner post-lanzamiento */}
                <div className="rounded-xl p-4 md:p-6 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ring-1 ring-emerald-400/20">
                    <div className="flex items-start gap-3">
                        <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[15px] font-semibold leading-tight">Configuración de cuentas pendiente</h3>
                            <p className="text-sm opacity-80 mt-1">
                                Configurá las cuentas de estos canales para activar la moderación:
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {(channelsToConfigure?.length ? channelsToConfigure : ["—"]).map((c) => (
                                    <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg ring-1 ring-emerald-400/30 bg-emerald-500/10">
                                        <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                                        {c}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                {hasWhatsApp ? (
                                    <button
                                        className="rounded-xl px-5 h-11 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
                                        onClick={() => setOpenWhatsAppSetup(true)}
                                    >
                                        Configurar WhatsApp
                                    </button>
                                ) : (
                                    <button
                                        className="rounded-xl px-5 h-11 ring-1 ring-neutral-400/30 bg-neutral-500/10 text-[15px]"
                                        disabled
                                        title="No hay WhatsApp entre los canales"
                                    >
                                        Configurar cuentas
                                    </button>
                                )}
                            </div>
                            {hasInstagram && (
                                <InstagramConnectButton
                                    clientId={import.meta.env.VITE_IG_APP_ID!}
                                    redirectUri={"https://4188b2a0a116.ngrok-free.app/instagram/callback"}
                                />
                            )}

                        </div>
                    </div>
                </div>

                {/* Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                                <ClipboardList className="h-4 w-4" />
                            </div>
                            <h4 className="text-[15px] font-semibold leading-tight">Resumen</h4>
                        </div>
                        <dl className="grid md:grid-cols-2 gap-3 text-[15px] leading-6">
                            <div><dt className="opacity-70">Objetivo</dt><dd>{campaign.objective || "—"}</dd></div>
                            <div><dt className="opacity-70">Lead</dt><dd>{campaign.leadDefinition || "—"}</dd></div>
                            <div><dt className="opacity-70">Canales</dt><dd>{(campaign.channels || []).join(", ") || "—"}</dd></div>
                        </dl>
                    </div>

                    <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                                <CalendarRange className="h-4 w-4" />
                            </div>
                            <h4 className="text-[15px] font-semibold leading-tight">Actividad & Métricas</h4>
                        </div>
                        <div className="text-sm opacity-70">
                            Próximamente: métricas, actividad, tickets escalados, etc.
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <Link to="/my_campaigns" className="text-emerald-600 hover:underline">← Volver a mis campañas</Link>
                </div>
            </div>

            {/* Configurar WhatsApp (solo si el canal está habilitado y el usuario lo abrió) */}
            {hasWhatsApp && openWhatsAppSetup && (
                <div className="rounded-xl p-4 md:p-6 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ring-1 ring-emerald-400/20">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[15px] font-semibold leading-tight">Configurar WhatsApp</h3>
                                <button
                                    className="text-xs px-3 py-1 rounded bg-neutral-200/70 dark:bg-neutral-800/70"
                                    onClick={() => setOpenWhatsAppSetup(false)}
                                >
                                    Cerrar
                                </button>
                            </div>

                            {!userId ? (
                                <div className="mt-3 text-sm text-amber-600">
                                    No se encontró <code>aiaUserId</code>. Iniciá sesión para continuar.
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <WhatsappQrPanel
                                        userId={userId}
                                        campaignId={id!}
                                        socketUrl={import.meta.env.VITE_API_URL}
                                        campaignStatus={campaign.status}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </OnlineLayout>
    );
}
