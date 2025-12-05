import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
    getModerationAccounts,
    getModerationCampaignById,
    executeModerationAnalysis,
    getModerationAnalysisSummary,
    getModerationAnalysisMetrics,
    getModerationHotLeads,
    updateWebchatConfig,
} from "../../../services/campaigns";
import { getLastLaunchedModeration, clearLastLaunchedModeration } from "../../../utils/helper";
import OnlineLayout from "../../../layout/OnlineLayout";
import { MessageSquare, ClipboardList, CalendarRange, CheckCircle2, Users, Zap, Star } from "lucide-react";
import WhatsappQrPanel from "../../../components/features/WhatsappQrPannel";
import InstagramConnectPanel from "../../../components/features/InstagramConnectButton";
import { getUserId } from "../../../utils/helper";
import InstagramConnectButton from "../../../components/features/InstagramConnectButton";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import { useTranslation } from "react-i18next";
import ConnectedAccountsPanel from "../../../components/features/statisticsComponents/ConnectedAccountsPanel";
import { LeadsTable } from "../../../components/features/statisticsComponents/leads/LeadsTable";
import { LeadDetailsModal } from "../../../components/features/statisticsComponents/leads/LeadDetailsModal";
import type { Lead } from "../../../services/types/moderation-types";
import { deriveChannelCounts, deriveScoreBins } from "../../../components/features/statisticsComponents/leads/mockMetrics";
import { KpiCards } from "../../../components/features/statisticsComponents/leads/metrics/KpiCards";
import { LeadsByChannelDonut } from "../../../components/features/statisticsComponents/leads/metrics/LeadsByChannelDonut";
import { LeadQualityBars } from "../../../components/features/statisticsComponents/leads/metrics/LeadQualityBars";
import { LeadsOverTimeArea } from "../../../components/features/statisticsComponents/leads/metrics/LeadsOverTimeArea";
import { ConversionFunnel } from "../../../components/features/statisticsComponents/leads/metrics/ConversionFunnel";
import FacebookConnectPanel from "../../../components/features/FacebookConnectPanel";
import { toast } from "react-toastify";

export default function StatisticsView() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [campaign, setCampaign] = React.useState<any>(null);
    const [accountsData, setAccountsData] = React.useState<any>(null);
    const [channelsToConfigure, setChannelsToConfigure] = React.useState<string[]>([]);
    const userId = getUserId() || "";
    const [openWhatsAppSetup, setOpenWhatsAppSetup] = React.useState(false);
    const { i18n } = useTranslation();
    const { t } = useTranslation('translations');
    const uiLang = i18n.language.startsWith("en") ? "en" : "es";

    const [analysisLoading, setAnalysisLoading] = React.useState(false);

    const callAnalysisEndpoint = React.useCallback(
        async (label: string, fn: () => Promise<any>) => {
            if (!id) return;
            try {
                setAnalysisLoading(true);
                console.log(`[ModerationAnalysis] Calling ${label} for campaign`, id);
                const res = await fn();
                console.log(`[ModerationAnalysis] Result from ${label}`, res);
            } catch (err) {
                console.error(`[ModerationAnalysis] Error in ${label}`, err);
            } finally {
                setAnalysisLoading(false);
            }
        },
        [id]
    );

    const handleExecuteAnalysisPreview = React.useCallback(
        () =>
            callAnalysisEndpoint("POST /analysis/execute (dryRun)", () =>
                executeModerationAnalysis(id!, { dryRun: true })
            ),
        [callAnalysisEndpoint, id]
    );

    const handleExecuteAnalysisReal = React.useCallback(
        () =>
            callAnalysisEndpoint("POST /analysis/execute", () =>
                executeModerationAnalysis(id!, { dryRun: false })
            ),
        [callAnalysisEndpoint, id]
    );

    const handleFetchAnalysisSummary = React.useCallback(
        () =>
            callAnalysisEndpoint("GET /analysis/summary", () =>
                getModerationAnalysisSummary(id!)
            ),
        [callAnalysisEndpoint, id]
    );

    const handleFetchAnalysisMetrics = React.useCallback(
        () =>
            callAnalysisEndpoint("GET /analysis/metrics", () =>
                getModerationAnalysisMetrics(id!)
            ),
        [callAnalysisEndpoint, id]
    );

    const handleFetchHotLeads = React.useCallback(
        () =>
            callAnalysisEndpoint("GET /analysis/hot-leads", () =>
                getModerationHotLeads(id!)
            ),
        [callAnalysisEndpoint, id]
    );

    const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
    const [openModal, setOpenModal] = React.useState(false);

    const [leads, setLeads] = React.useState<Lead[]>([]);
    const [analysisMetrics, setAnalysisMetrics] = React.useState<any | null>(null);
    const [analysisSummary, setAnalysisSummary] = React.useState<any | null>(null);

    const handleOpenLead = (lead: Lead) => {
        setSelectedLead(lead);
        setOpenModal(true);
    };

    const handleClose = () => setOpenModal(false);

    const kpis = React.useMemo(() => {
        if (!leads.length) {
            return {
                total: 0,
                avgScore: 0,
                responseRate: 0,
                topChannel: "—",
            };
        }

        const m = analysisMetrics?.metrics;

        const totalLeads = leads.length;

        const hotFromMetrics = m?.hotLeads ?? totalLeads;
        const totalAnalyses = m?.totalAnalyses ?? totalLeads;
        const responseRate = totalAnalyses
            ? Math.round((hotFromMetrics / totalAnalyses) * 100)
            : 0;

        const byChannel = deriveChannelCounts(leads);
        const topChannel =
            byChannel.sort((a, b) => b.value - a.value)[0]?.name || "—";

        const avgScore =
            leads.reduce((acc, l) => acc + (l.score || 0), 0) / totalLeads;

        return {
            total: totalLeads,
            avgScore: Number(avgScore.toFixed(1)),
            responseRate,
            topChannel,
        };
    }, [analysisMetrics, leads]);

    const channelData = React.useMemo(
        () => deriveChannelCounts(leads),
        [leads],
    );
    const scoreBins = React.useMemo(
        () => deriveScoreBins(leads),
        [leads],
    )

    const timeSeries = React.useMemo(() => [] as any[], [leads]);

    const funnelData = React.useMemo(() => {
        const m = analysisMetrics?.metrics;
        if (!m) return [];

        const hot = m.hotLeads ?? 0;
        const warm = m.warmLeads ?? 0;
        const cold = m.coldAnalyses ?? 0;
        const totalAnalyses = m.totalAnalyses ?? hot + warm + cold;
        const totalLeads = hot + warm + cold;

        if (!totalAnalyses && !totalLeads) return [];

        return [
            { name: "Conversaciones analizadas", value: totalAnalyses || totalLeads },
            { name: "Leads detectados", value: totalLeads },
            { name: "Leads calientes", value: hot },
        ];
    }, [analysisMetrics]);

    React.useEffect(() => {
        if (!id) return;
        let cancelled = false;

        (async () => {
            try {
                const [metricsRes, hotLeadsRes, summaryRes] = await Promise.all([
                    getModerationAnalysisMetrics(id),
                    getModerationHotLeads(id),
                    getModerationAnalysisSummary(id),
                ]);

                if (cancelled) return;

                if (metricsRes) setAnalysisMetrics(metricsRes);
                if (summaryRes) setAnalysisSummary(summaryRes);

                const apiLeads = Array.isArray((hotLeadsRes as any)?.leads)
                    ? (hotLeadsRes as any).leads
                    : [];

                if (apiLeads.length) {
                    const mapped: Lead[] = apiLeads.map((l: any) => ({
                        id:
                            l.conversationId ||
                            l.id ||
                            `${l.contactNumber || "lead"}-${l.analyzedAt || ""
                            }`,
                        name:
                            (l.extractedData && l.extractedData.name) ||
                            l.contactName ||
                            l.contactNumber ||
                            "Lead sin nombre",
                        summary: l.summary,
                        score:
                            typeof l.finalScore === "number"
                                ? l.finalScore
                                : 0,
                        channel: (l.channel || "unknown") as Lead["channel"],
                        channelLink: undefined,
                    }));

                    setLeads(mapped);
                } else {
                    setLeads([]);
                }
            } catch (err) {
                console.error(
                    "[StatisticsView] Error loading analysis data",
                    err,
                );
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const [whatsappLinkedInfo, setWhatsappLinkedInfo] = React.useState<{
        phoneNumber?: string;
        scannedAt?: string;
    } | null>(null);

    const [showWhatsappSuccess, setShowWhatsappSuccess] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const data = await getModerationCampaignById(id!);

                const socialAccs = await getModerationAccounts(id!)

                console.log(socialAccs);


                if (!mounted) return;
                setCampaign(data);
                setAccountsData(socialAccs)

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

    const hasFacebook = React.useMemo(() => {
        const arr =
            (channelsToConfigure?.length ? channelsToConfigure : campaign?.channels) ??
            [];
        return arr.some((c: string) => (c || "").toLowerCase().includes("facebook"));
    }, [channelsToConfigure, campaign]);

    const facebookCredentials =
        (campaign as any)?.facebookCredentials ??
        [];

    const isWhatsAppConnected = React.useMemo(() => {
        return Boolean(campaign?.whatsappStatus?.qrScanned);
    }, [campaign]);

    const isInstagramConnected = React.useMemo(() => {
        return Boolean(campaign?.instagramCredentials?.username);
    }, [campaign]);

    const isFacebookConnected = React.useMemo(() => {
        return Boolean(accountsData?.facebookCredentials?.pages?.length);
    }, [accountsData]);

    const hasAnyConnected = isWhatsAppConnected || isInstagramConnected || isFacebookConnected

    const isWhatsConnected = Boolean(campaign?.whatsappStatus?.qrScanned);
    const isIgConnected = Boolean(accountsData?.instagram);
    const isFbConnected = Boolean(accountsData?.facebook);

    const needsWhatsSetup = hasWhatsApp && !isWhatsConnected;
    const needsInstagramSetup = hasInstagram && !isIgConnected;
    const needsFacebookSetup = hasFacebook && !isFbConnected;

    const showPendingPanel = needsWhatsSetup || needsInstagramSetup || needsFacebookSetup;
    const twoCols = showPendingPanel && hasAnyConnected;

    // --- WEBCHAT CONFIG ---
    const [webchatDomain, setWebchatDomain] = React.useState("");
    const [editingWebchatDomain, setEditingWebchatDomain] = React.useState(false);
    const [savingWebchat, setSavingWebchat] = React.useState(false);
    const [showWebchatModal, setShowWebchatModal] = React.useState(false);

    React.useEffect(() => {
        if (campaign?.webchatCredentials?.domain) {
            setWebchatDomain(campaign.webchatCredentials.domain);
        }
    }, [campaign]);

    const handleSaveWebchatDomain = async () => {
        if (!id) return;
        try {
            setSavingWebchat(true);
            await updateWebchatConfig(id, { domain: webchatDomain.trim() });

            setCampaign((prev: any) => ({
                ...prev,
                webchatCredentials: {
                    ...(prev?.webchatCredentials || {}),
                    domain: webchatDomain.trim(),
                }
            }));

            setEditingWebchatDomain(false);
        } catch (e: any) {
            console.error("Error saving webchat domain", e);
            alert("No se pudo guardar el dominio.");
        } finally {
            setSavingWebchat(false);
        }
    };

    const frontBase = (import.meta.env.VITE_FRONT_URL || "").replace(/\/+$/, "/");

    const sdkScript = [
        '<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>',
        `<script src="${frontBase}datacivis.js?campaignId=${id}&serverUrl=${import.meta.env.VITE_API_URL}/webchat&audio=true&v=2"></script>`
    ].join("\n");

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950">
            <div className="text-center space-y-3">
                <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 dark:text-gray-300 text-sm">{t("loading_campaigns")}</p>
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
                <p className="text-red-600 text-sm">{t("campaign_not_found")}</p>
            </div>
        </div>
    )

    return (
        <OnlineLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">{campaign.name}</h2>
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

                <div className={`grid grid-cols-1 ${twoCols ? "md:grid-cols-2 gap-4" : ""}`}>
                    {showPendingPanel && (
                        <div className="rounded-xl p-4 md:p-6 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ring-1 ring-emerald-400/20">
                            <div className="flex items-start gap-3">
                                <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[15px] font-semibold leading-tight">
                                        {t("pending_account_setup")}
                                    </h3>
                                    <p className="text-sm opacity-80 mt-1">
                                        {t("setup_channel_accounts")}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {(channelsToConfigure?.length ? channelsToConfigure : ["—"]).map((c) => (
                                            <span
                                                key={c}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg ring-1 ring-emerald-400/30 bg-emerald-500/10"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                                                {c}
                                            </span>
                                        ))}
                                    </div>

                                    {needsWhatsSetup && (
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                className="rounded-xl px-5 h-11 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
                                                onClick={() => setOpenWhatsAppSetup(true)}
                                            >
                                                {t("setup_whatsapp")}
                                            </button>
                                        </div>
                                    )}

                                    {needsInstagramSetup && (
                                        <div className="mt-3">
                                            <InstagramConnectButton
                                                clientId={import.meta.env.VITE_IG_APP_ID!}
                                                redirectUri={import.meta.env.VITE_FRONT_URL + "instagram/callback"}
                                                campaignId={campaign.id}
                                            />
                                        </div>
                                    )}

                                    {needsFacebookSetup && (
                                        <div className="mt-3">
                                            <FacebookConnectPanel state={campaign.id} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PANEL DE CUENTAS YA VINCULADAS */}
                    {hasAnyConnected && (
                        <ConnectedAccountsPanel
                            campaignId={campaign.id}
                            socialAccsData={{
                                instagram: accountsData?.instagram
                                    ? {
                                        username: accountsData.instagram.username,
                                        profilePicture: accountsData.instagram.profilePicture,
                                        name: campaign.instagramCredentials?.name ?? accountsData.instagram.username,
                                        paused: campaign.instagramCredentials?.paused,
                                    }
                                    : undefined,
                                facebook: accountsData?.facebook
                                    ? {
                                        id: accountsData.facebook.id,
                                        name: accountsData.facebook.name,
                                        profilePicture: accountsData.facebook.profilePicture,
                                        paused: campaign.facebookCredentials?.paused,
                                    }
                                    : undefined,
                            }}
                            whatsappStatus={{
                                qrScanned: campaign.whatsappStatus?.qrScanned,
                                qrScannedAt: campaign.whatsappStatus?.qrScannedAt,
                                qrScannedBy: campaign.whatsappStatus?.qrScannedBy,
                                qrScannedByPhone: campaign.whatsappStatus?.qrScannedByPhone,
                                paused: campaign.whatsappStatus?.paused,
                            }}
                            onReconnectWhatsapp={
                                isWhatsConnected && hasWhatsApp
                                    ? () => setOpenWhatsAppSetup(true)
                                    : undefined
                            }
                            instagramReconnectButton={
                                isIgConnected && hasInstagram ? (
                                    <InstagramConnectButton
                                        clientId={import.meta.env.VITE_IG_APP_ID!}
                                        redirectUri={import.meta.env.VITE_FRONT_URL + "instagram/callback"}
                                        campaignId={campaign.id}
                                        variant="reconnect"
                                    />
                                ) : undefined
                            }
                            facebookReconnectButton={
                                isFbConnected && hasFacebook ? (
                                    <FacebookConnectPanel
                                        state={campaign.id}
                                        variant="reconnect"
                                    />
                                ) : undefined
                            }
                        />
                    )}
                </div>
                {hasWhatsApp && openWhatsAppSetup && (
                    <div className="rounded-xl p-4 md:p-6 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ring-1 ring-emerald-400/20 mt-6">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[15px] font-semibold leading-tight">{t("setup_whatsapp")}</h3>
                                    <button
                                        className="text-xs px-3 py-1 rounded bg-neutral-200/70 dark:bg-neutral-800/70"
                                        onClick={() => setOpenWhatsAppSetup(false)}
                                    >
                                        {t("close")}
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
                                            whatsappStatus={campaign.whatsappStatus}
                                            onQrScanned={(payload: any) => {
                                                const record = payload.qrScanRecord || {};

                                                const rawPhone =
                                                    record.scannedByPhone ||
                                                    record.scannedBy ||
                                                    payload.phoneNumber ||
                                                    null;

                                                const scannedAt =
                                                    record.scannedAt ||
                                                    payload.scannedAt ||
                                                    payload.timestamp ||
                                                    null;

                                                const prettyPhone = rawPhone
                                                    ? String(rawPhone).replace(/@.+$/, "")
                                                    : null;

                                                setWhatsappLinkedInfo({
                                                    phoneNumber: (prettyPhone || rawPhone || undefined) as string | undefined,
                                                    scannedAt: (scannedAt || undefined) as string | undefined,
                                                });

                                                setCampaign((prev: any) => {
                                                    if (!prev) return prev;

                                                    return {
                                                        ...prev,
                                                        whatsappStatus: {
                                                            qrScanned: true,
                                                            qrScannedAt: scannedAt,
                                                            qrScannedBy: record.scannedBy || payload.agentId || null,
                                                            qrScannedByPhone: prettyPhone,
                                                        },
                                                    };
                                                });

                                                setShowWhatsappSuccess(true);
                                                setOpenWhatsAppSetup(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <section className="mt-4">
                    <KpiCards
                        items={[
                            { title: t("stats_total_leads"), value: kpis.total, icon: <Users className="h-5 w-5" /> },
                            { title: t("stats_response_rate"), value: `${kpis.responseRate}%`, icon: <Zap className="h-5 w-5" /> },
                            { title: t("stats_average_score"), value: kpis.avgScore, icon: <Star className="h-5 w-5" /> },
                            { title: t("stats_most_active_channel"), value: kpis.topChannel, icon: <MessageSquare className="h-5 w-5" /> },
                        ]}
                    />
                </section>
                <section className="mt-2">
                    <LeadsTable leads={leads} onOpenLead={handleOpenLead} />
                </section>


                {leads.length > 0 && (
                    <>
                        {(channelData.length > 0 || scoreBins.length > 0) && (
                            <section className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {channelData.length > 0 && <LeadsByChannelDonut data={channelData} />}
                                {scoreBins.length > 0 && <LeadQualityBars data={scoreBins} />}
                            </section>
                        )}

                        {timeSeries.length > 0 && (
                            <section className="grid grid-cols-1 gap-4">
                                <LeadsOverTimeArea data={timeSeries} />
                            </section>
                        )}
                    </>
                )}

                {leads.length === 0 && (
                    <div className="mt-4 rounded-2xl ring-1 ring-dashed ring-emerald-400/30 bg-emerald-50/40 dark:bg-neutral-900/60 p-4 text-sm">
                        {t("stats_no_leads_yet") ||
                            "Todavía no hay leads analizados. Cuando la campaña genere leads vas a ver las métricas acá."}
                    </div>
                )}

                <div className="pt-2">
                    <Link to="/my_campaigns" className="text-emerald-600 hover:underline">{t("back_to_campaigns")}</Link>
                </div>
                {/* Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                                <ClipboardList className="h-4 w-4" />
                            </div>
                            <h4 className="text-[15px] font-semibold leading-tight">{t("summary")}</h4>
                        </div>
                        <dl className="grid md:grid-cols-2 gap-3 text-[15px] leading-6">
                            <div><dt className="opacity-70">{t("objective")}</dt><dd>{campaign.objective || "—"}</dd></div>
                            <div><dt className="opacity-70">{t("lead")}</dt><dd>{campaign.leadDefinition || "—"}</dd></div>
                            <div><dt className="opacity-70">{t("channels")}</dt><dd>{(campaign.channels || []).join(", ") || "—"}</dd></div>
                        </dl>
                    </div>

                </div>


            </div>

            {campaign?.webchatCredentials && (
                <section className="rounded-xl mt-6 p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">

                    <div className="flex items-center justify-between">
                        <h3 className="text-[15px] font-semibold leading-tight">
                            Configuración de Webchat
                        </h3>
                        <button
                            onClick={() => setShowWebchatModal(true)}
                            className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                            Ver instrucciones
                        </button>
                    </div>

                    <p className="text-sm opacity-80 mt-1">
                        Tu campaña tiene habilitado el Webchat para insertar un chatbot en tu sitio web.
                    </p>

                    {/* Domain */}
                    <div className="mt-4">
                        <label className="text-sm opacity-70">Dominio configurado</label>

                        {!editingWebchatDomain ? (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1.5 rounded-lg ring-1 ring-neutral-400/30 bg-neutral-100 dark:bg-neutral-800">
                                    {webchatDomain || "—"}
                                </span>
                                <button
                                    onClick={() => setEditingWebchatDomain(true)}
                                    className="text-xs px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300"
                                >
                                    Editar
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    className="px-3 py-1.5 rounded-lg ring-1 ring-neutral-400/40 bg-white/80 dark:bg-neutral-950/60 text-sm"
                                    value={webchatDomain}
                                    onChange={(e) => setWebchatDomain(e.target.value)}
                                    placeholder="tudominio.com"
                                />
                                <button
                                    disabled={savingWebchat}
                                    onClick={handleSaveWebchatDomain}
                                    className="text-xs px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
                                >
                                    {savingWebchat ? "Guardando…" : "Guardar"}
                                </button>
                                <button
                                    disabled={savingWebchat}
                                    onClick={() => setEditingWebchatDomain(false)}
                                    className="text-xs px-3 py-1 rounded bg-neutral-300 dark:bg-neutral-700"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SDK */}
                    <div className="mt-6">
                        <h4 className="text-sm font-semibold">Código para insertar el Webchat</h4>
                        <p className="text-xs opacity-60 mt-1">
                            Pegá este script en tu sitio web (antes del cierre de &lt;/body&gt;)
                        </p>

                        <div className="mt-2 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg ring-1 ring-neutral-400/20">
                            <code className="text-[13px] whitespace-pre break-all">{sdkScript}</code>
                        </div>

                        <button
                            className="mt-2 px-3 py-1.5 rounded-lg text-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300"
                            onClick={() => { navigator.clipboard.writeText(sdkScript), toast.success(t("script_copied_to_clipboard")) }}
                        >
                            Copiar script
                        </button>
                    </div>
                </section>
            )}

            <AgencyChatbot
                mode="floating"
                persistNamespace={`moderation_stats_${campaign.id || "unknown"}`}
                userId={userId}
                autoStart={false}
                bootSummaryOverride={(() => {
                    const canales = (campaign.channels || []).join(", ") || (uiLang === "en" ? "none" : "ninguno");
                    const status = campaign.status || (uiLang === "en" ? "unknown" : "desconocido");
                    return uiLang === "en"
                        ? `Moderation campaign “${campaign.name}” (status: ${status}). Channels: ${canales}.`
                        : `Campaña de moderación “${campaign.name}” (estado: ${status}). Canales: ${canales}.`;
                })()}
                getBusinessSnapshot={() => ({
                    __summary:
                        uiLang === "en"
                            ? `Moderation campaign “${campaign.name}” is active and shown in the Statistics view.`
                            : `Campaña de moderación “${campaign.name}” activa, mostrada en la vista de estadísticas.`,
                    campaignId: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    objective: campaign.objective,
                    leadDefinition: campaign.leadDefinition,
                    channels: campaign.channels || [],
                    uiLanguage: uiLang,
                })}
                bootExtraInstructions={
                    uiLang === "en"
                        ? `Always answer in English.

You are LISA, the post-launch assistant of a moderation campaign.

Context:
- The campaign “${campaign.name}” is already active and the user is on the Statistics screen.
- Your role is to help the user with the next steps: especially linking WhatsApp and Instagram, and understanding how the assistant will start moderating.
- Use a clear, step-by-step and practical tone.

If the user asks how to link or connect **WhatsApp**, explain these steps:
1) Ask them to look for the "Configure WhatsApp" button on this screen and click it.
2) Tell them that a new panel will open, and at the bottom they must click “Request QR”.
3) When the QR code appears, they must open WhatsApp on their phone, go to “Linked devices” and choose “Link a device”.
4) They scan the QR with their phone. Once the code is scanned and the device is linked, WhatsApp will be connected to this campaign.

If the user asks how to link or connect **Instagram**, explain these steps:
1) First, they must make sure that their Instagram account is a business account.
2) Then, they should look here for the "Connect Instagram" button and click it.
3) That will open the Instagram/Facebook login. They must log in with the account they want to connect.
4) They must accept the requested permissions/terms on the screen.
5) Once they accept and the process completes, they will be redirected back to this site and the Instagram connection will be finished.

Only explain these steps in detail when the user asks for help with WhatsApp or Instagram. Otherwise, focus on guiding them through what they can do now that the campaign is active (connecting channels, understanding leads, and how the assistant will behave).`
                        : `Respondé siempre en español.

Sos LISA, la asistente post-lanzamiento de una campaña de moderación.

Contexto:
- La campaña “${campaign.name}” ya está activa y el usuario se encuentra en la pantalla de estadísticas.
- Tu función es ayudar al usuario con los próximos pasos: especialmente vincular WhatsApp e Instagram, y entender cómo va a empezar a moderar el asistente.
- Usá un tono claro, práctico y en pasos.

Si el usuario pregunta cómo vincular o conectar **WhatsApp**, explicá estos pasos:
1) Indicale que busque en esta pantalla el botón de "Configurar WhatsApp" y que lo apriete.
2) Contale que se va a abrir un panel nuevo, y que en la parte de abajo debe hacer clic en “Solicitar QR”.
3) Cuando vea el código QR, debe abrir WhatsApp en su teléfono, ir a la sección “Dispositivos vinculados” y elegir “Vincular nuevo dispositivo”.
4) Debe escanear el código QR con el teléfono. Una vez escaneado y vinculado el dispositivo, WhatsApp quedará conectado a esta campaña.

Si el usuario pregunta cómo vincular o conectar **Instagram**, explicá estos pasos:
1) Primero, debe asegurarse de que su cuenta de Instagram sea de tipo empresa.
2) Luego, tiene que buscar aquí el botón de "Conectar Instagram" y hacer clic.
3) Eso lo llevará a una pantalla para loguearse con la cuenta de Instagram/Facebook que quiere vincular.
4) Debe aceptar los permisos y términos que se le muestran.
5) Una vez que acepte y termine el proceso, será enviado de vuelta a este sitio y la vinculación de Instagram quedará completa.

Solo explicá estos pasos en detalle cuando el usuario pida ayuda con WhatsApp o Instagram. En el resto de los casos, enfocate en guiarlo sobre qué puede hacer ahora que la campaña está activa (conectar canales, entender los leads y cómo va a responder el asistente).`
                }
                autoKickoff
                kickoffMessage={
                    uiLang === "en"
                        ? `Done, the campaign is active and ready to use. Next, I’ll ask you to scan the WhatsApp QR code you want to link, and provide the social media credentials for the accounts you’d like the assistant to start moderating.`
                        : `Listo, la campaña está activa y lista para usarse. A continuación, te voy a pedir que escanees el código QR de WhatsApp que quieras vincular y que proporciones las credenciales de las cuentas de redes sociales que el asistente deberá comenzar a moderar.`
                }
            />
            {showWhatsappSuccess && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-xl w-full max-w-md p-6 ring-1 ring-emerald-400/40">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/40 p-2">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[15px] font-semibold leading-tight">
                                    {t("whatsapp_linked")}
                                </h3>
                                <p className="mt-1 text-sm opacity-80">
                                    {t("now_on")}
                                </p>
                                {whatsappLinkedInfo?.phoneNumber && (
                                    <p className="mt-3 text-sm">
                                        <span className="opacity-70">
                                            {t("telephone")}
                                        </span>{" "}
                                        <span className="font-mono">
                                            {whatsappLinkedInfo.phoneNumber}
                                        </span>
                                    </p>
                                )}

                                {whatsappLinkedInfo?.scannedAt && (
                                    <p className="mt-1 text-xs opacity-70">
                                        {t("linked_at")}
                                        {(() => {
                                            const d = new Date(whatsappLinkedInfo.scannedAt!);
                                            return isNaN(d.getTime())
                                                ? whatsappLinkedInfo.scannedAt
                                                : d.toLocaleString();
                                        })()}
                                    </p>
                                )}

                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        className="text-sm px-3 py-1.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70"
                                        onClick={() => setShowWhatsappSuccess(false)}
                                    >
                                        {t("close")}
                                    </button>
                                    <button
                                        className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
                                        onClick={() => setShowWhatsappSuccess(false)}
                                    >
                                        {t("got_it")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showWebchatModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-xl w-full max-w-2xl p-6 ring-1 ring-emerald-400/40">

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Cómo integrar el Webchat</h3>
                            <button
                                className="text-xs px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800"
                                onClick={() => setShowWebchatModal(false)}
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="text-sm leading-relaxed space-y-3">
                            <p>
                                El Webchat te permite mostrar un asistente automatizado directamente en tu sitio web.
                                Para integrarlo, seguí estos pasos:
                            </p>

                            <ol className="list-decimal ml-5 space-y-2">
                                <li>Verificá que el dominio <strong>{webchatDomain}</strong> coincida con tu sitio real.</li>
                                <li>Copiá el script de integración (lo ves en la sección anterior).</li>
                                <li>Pegalo justo antes del cierre de <code>&lt;/body&gt;</code> en tu web.</li>
                                <li>Actualizá tu sitio y verificá que el widget aparezca abajo a la derecha.</li>
                            </ol>

                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                                onClick={() => setShowWebchatModal(false)}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </OnlineLayout >
    );
}
