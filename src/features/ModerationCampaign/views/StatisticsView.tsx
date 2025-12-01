import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getModerationAccounts, getModerationCampaignById } from "../../../services/campaigns";
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
import { mockLeads } from "../../../components/features/statisticsComponents/leads/mockLeads";
import type { Lead } from "../../../services/types/moderation-types";
import { kpisFromLeads, deriveChannelCounts, deriveScoreBins, mockLeadsOverTime, mockFunnel } from "../../../components/features/statisticsComponents/leads/mockMetrics";
import { KpiCards } from "../../../components/features/statisticsComponents/leads/metrics/KpiCards";
import { LeadsByChannelDonut } from "../../../components/features/statisticsComponents/leads/metrics/LeadsByChannelDonut";
import { LeadQualityBars } from "../../../components/features/statisticsComponents/leads/metrics/LeadQualityBars";
import { LeadsOverTimeArea } from "../../../components/features/statisticsComponents/leads/metrics/LeadsOverTimeArea";
import { ConversionFunnel } from "../../../components/features/statisticsComponents/leads/metrics/ConversionFunnel";
import FacebookConnectPanel from "../../../components/features/FacebookConnectPanel";

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

    // lead
    const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
    const [openModal, setOpenModal] = React.useState(false);

    const handleOpenLead = (lead: Lead) => {
        setSelectedLead(lead);
        setOpenModal(true);
    };

    const handleClose = () => setOpenModal(false);

    // Lead metrics

    const kpis = React.useMemo(() => kpisFromLeads(mockLeads), []);
    const channelData = React.useMemo(() => deriveChannelCounts(mockLeads), []);
    const scoreBins = React.useMemo(() => deriveScoreBins(mockLeads), []);
    const timeSeries = React.useMemo(() => mockLeadsOverTime(), []);
    const funnelData = React.useMemo(() => mockFunnel(), []);

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

    console.log(campaign);


    const hasAnyConnected = isWhatsAppConnected || isInstagramConnected;

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
                {/* Header */}
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

                {/* Banner post-lanzamiento */}
                <div className={`grid grid-cols-1 ${hasAnyConnected ? "md:grid-cols-2 gap-4" : ""}`}>
                    <div className="rounded-xl p-4 md:p-6 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl ring-1 ring-emerald-400/20">
                        <div className="flex items-start gap-3">
                            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[15px] font-semibold leading-tight">{t("pending_account_setup")}</h3>
                                <p className="text-sm opacity-80 mt-1">
                                    {t("setup_channel_accounts")}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {(channelsToConfigure?.length ? channelsToConfigure : ["—"]).map((c) => (
                                        <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-lg ring-1 ring-emerald-400/30 bg-emerald-500/10">
                                            <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                                            {c}
                                        </span>
                                    ))}
                                </div>
                                {hasInstagram && (
                                    <InstagramConnectButton
                                        clientId={import.meta.env.VITE_IG_APP_ID!}
                                        redirectUri={import.meta.env.VITE_FRONT_URL + "instagram/callback"}
                                        campaignId={campaign.id}
                                    />
                                )}

                                {hasFacebook && (
                                    <FacebookConnectPanel
                                        state={campaign.id}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    {hasAnyConnected && (
                        <ConnectedAccountsPanel
                            socialAccsData={accountsData}
                            whatsappStatus={campaign?.whatsappStatus}
                        />
                    )}
                </div>

            </div>

        </OnlineLayout >
    );
}
