import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { getModerationCampaignById } from "../../../services/campaigns";
import { getLastLaunchedModeration, clearLastLaunchedModeration } from "../../../utils/helper";
import OnlineLayout from "../../../layout/OnlineLayout";
import { MessageSquare, ClipboardList, CalendarRange, CheckCircle2 } from "lucide-react";
import WhatsappQrPanel from "../../../components/features/WhatsappQrPannel";
import InstagramConnectPanel from "../../../components/features/InstagramConnectButton";
import { getUserId } from "../../../utils/helper";
import InstagramConnectButton from "../../../components/features/InstagramConnectButton";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import { useTranslation } from "react-i18next";

export default function StatisticsView() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [campaign, setCampaign] = React.useState<any>(null);
    const [channelsToConfigure, setChannelsToConfigure] = React.useState<string[]>([]);
    const userId = getUserId() || "";
    const [openWhatsAppSetup, setOpenWhatsAppSetup] = React.useState(false);
    const { i18n } = useTranslation();
    const { t } = useTranslation('translations');
    const uiLang = i18n.language.startsWith("en") ? "en" : "es";

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
                            <div className="mt-4 flex gap-2">
                                {hasWhatsApp ? (
                                    <button
                                        className="rounded-xl px-5 h-11 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[15px]"
                                        onClick={() => setOpenWhatsAppSetup(true)}
                                    >
                                        {t("setup_whatsapp")}
                                    </button>
                                ) : (
                                    <button
                                        className="rounded-xl px-5 h-11 ring-1 ring-neutral-400/30 bg-neutral-500/10 text-[15px]"
                                        disabled
                                        title="No hay WhatsApp entre los canales"
                                    >
                                        {t("setup_accounts")}
                                    </button>
                                )}
                            </div>
                            {hasInstagram && (
                                <InstagramConnectButton
                                    clientId={import.meta.env.VITE_IG_APP_ID!}
                                    redirectUri={import.meta.env.VITE_FRONT_URL + "instagram/callback"}
                                    campaignId={campaign.id}
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
                            <h4 className="text-[15px] font-semibold leading-tight">{t("summary")}</h4>
                        </div>
                        <dl className="grid md:grid-cols-2 gap-3 text-[15px] leading-6">
                            <div><dt className="opacity-70">{t("objective")}</dt><dd>{campaign.objective || "—"}</dd></div>
                            <div><dt className="opacity-70">{t("lead")}</dt><dd>{campaign.leadDefinition || "—"}</dd></div>
                            <div><dt className="opacity-70">{t("channels")}</dt><dd>{(campaign.channels || []).join(", ") || "—"}</dd></div>
                        </dl>
                    </div>

                    <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                                <CalendarRange className="h-4 w-4" />
                            </div>
                            <h4 className="text-[15px] font-semibold leading-tight">{t("activity_metrics")}</h4>
                        </div>
                        <div className="text-sm opacity-70">
                            {t("coming_soon_metrics")}
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <Link to="/my_campaigns" className="text-emerald-600 hover:underline">{t("back_to_campaigns")}</Link>
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
                                    {uiLang === "en"
                                        ? "WhatsApp connected successfully"
                                        : "WhatsApp vinculado correctamente"}
                                </h3>
                                <p className="mt-1 text-sm opacity-80">
                                    {uiLang === "en"
                                        ? "From now on, this campaign will be able to receive and send messages through this WhatsApp number."
                                        : "A partir de ahora esta campaña va a poder recibir y enviar mensajes a través de este número de WhatsApp."}
                                </p>

                                {whatsappLinkedInfo?.phoneNumber && (
                                    <p className="mt-3 text-sm">
                                        <span className="opacity-70">
                                            {uiLang === "en" ? "Phone:" : "Teléfono:"}
                                        </span>{" "}
                                        <span className="font-mono">
                                            {whatsappLinkedInfo.phoneNumber}
                                        </span>
                                    </p>
                                )}

                                {whatsappLinkedInfo?.scannedAt && (
                                    <p className="mt-1 text-xs opacity-70">
                                        {uiLang === "en" ? "Linked at: " : "Vinculado el: "}
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
                                        {uiLang === "en" ? "Got it" : "Perfecto"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </OnlineLayout >
    );
}
