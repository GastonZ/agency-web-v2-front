import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OnlineLayout from "../../../layout/OnlineLayout";
import { getMarketingCampaignById } from "../../../services/marketingCampaigns";
import { ClipboardList, CalendarRange, UserCircle2, Images, Share2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9000";

function statusTone(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "active") return "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-emerald-400/30";
  if (v === "paused") return "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-amber-400/30";
  return "text-neutral-700 dark:text-neutral-300 bg-neutral-500/10 ring-neutral-400/30";
}

const DAY_LABELS: Record<string, string> = {
  sun: "Dom", mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb",
};

export default function MarketingStatisticsView() {
  const { t } = useTranslation("translations");
  const tr = React.useCallback(
    (key: string, fallback: string) => t(key, { defaultValue: fallback }),
    [t],
  );
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [campaign, setCampaign] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getMarketingCampaignById(id!);
        if (!mounted) return;
        setCampaign(data);
      } catch (e: any) {
        setError(e?.message || tr("marketing.stats.error_loading_campaign", "Error al cargar la campaña"));
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-950">
      <div className="text-center space-y-3">
        <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 dark:text-gray-300 text-sm">{tr("loading", "Cargando…")}</p>
      </div>
    </div>
  );

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
        <p className="text-red-600 text-sm">{tr("not_found", "No se encontró la campaña")}</p>
      </div>
    </div>
  );

  const {
    name,
    status,
    objective,
    leadDefinition,
    channels = [],
    businessType,
    campaignType,
    influencerSelectionType,
    selectedInfluencerId,
    influencerSelectionNotes,
    topics = [],
    contentTypes = [],
    publishingSchedule = {},
    referenceImages = [],
    advertisingBudget,
    scrappingConfig,
    connectedSocialAccounts = [],
    referenceDocuments = [],
    mainMessage,
    description,
  } = campaign || {};

  const activeDays: string[] = publishingSchedule?.activeDays || [];
  const timeSlots: Record<string, Array<{ start: string; end: string }>> =
    publishingSchedule?.timeSlots || { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };

  const persistedImages: string[] = Array.isArray(referenceImages) ? referenceImages : [];

  return (
    <OnlineLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{name || "—"}</h2>
            <p className="text-sm opacity-70">ID: {campaign.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ring-1 ${statusTone(status)}`}>
              {status || "—"}
            </span>
            <button
              className="rounded-xl px-4 h-10 ring-1 ring-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-[14px]"
              onClick={() => navigate(`/campaign_marketing_creation?fromId=${campaign.id}`)}
            >
              {tr("edit_campaign", "Editar campaña")}
            </button>
          </div>
        </div>

        {/* Resumen básico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                <ClipboardList className="h-4 w-4" />
              </div>
              <h4 className="text-[15px] font-semibold leading-tight">{tr("summary", "Resumen")}</h4>
            </div>
            <dl className="grid md:grid-cols-2 gap-3 text-[15px] leading-6">
              <div><dt className="opacity-70">{tr("type", "Tipo")}</dt><dd>{campaignType || "—"}</dd></div>
              <div><dt className="opacity-70">{tr("business", "Negocio")}</dt><dd>{businessType || "—"}</dd></div>
              <div><dt className="opacity-70">{tr("objective", "Objetivo")}</dt><dd>{objective || "—"}</dd></div>
              <div><dt className="opacity-70">{tr("lead", "Lead")}</dt><dd>{leadDefinition || "—"}</dd></div>
              <div className="md:col-span-2"><dt className="opacity-70">{tr("main_message", "Mensaje principal")}</dt><dd>{mainMessage || "—"}</dd></div>
              <div className="md:col-span-2"><dt className="opacity-70">{tr("description", "Descripción")}</dt><dd className="opacity-90">{description || "—"}</dd></div>
              <div className="md:col-span-2"><dt className="opacity-70">{tr("channels", "Canales")}</dt><dd>{(channels || []).join(", ") || "—"}</dd></div>
            </dl>
          </div>

          {/* Influencer */}
          <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                <UserCircle2 className="h-4 w-4" />
              </div>
              <h4 className="text-[15px] font-semibold leading-tight">{tr("influencer", "Influencer")}</h4>
            </div>
            <dl className="grid md:grid-cols-2 gap-3 text-[15px] leading-6">
              <div><dt className="opacity-70">{tr("selection", "Selección")}</dt><dd>{influencerSelectionType || "—"}</dd></div>
              <div><dt className="opacity-70">{tr("influencer_category", "Influencer (cat.)")}</dt><dd>{selectedInfluencerId || "—"}</dd></div>
              <div className="md:col-span-2"><dt className="opacity-70">{tr("notes", "Notas")}</dt><dd>{influencerSelectionNotes || "—"}</dd></div>
            </dl>
          </div>
        </div>

        {/* Contenido & calendario */}
        <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
              <CalendarRange className="h-4 w-4" />
            </div>
            <h4 className="text-[15px] font-semibold leading-tight">{tr("content_calendar", "Contenido & Calendario")}</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-semibold mb-1">{tr("topics", "Tópicos")}</h5>
              <div className="flex flex-wrap gap-2">
                {(topics.length ? topics : ["—"]).map((t: string, i: number) => (
                  <span key={`${t}-${i}`} className="text-xs px-2 py-1 rounded-full ring-1 ring-emerald-400/30 bg-emerald-500/10">
                    {t}
                  </span>
                ))}
              </div>

              <h5 className="text-sm font-semibold mt-4 mb-1">{tr("types", "Tipos")}</h5>
              <div className="flex flex-wrap gap-2">
                {(contentTypes.length ? contentTypes : ["—"]).map((t: string, i: number) => (
                  <span key={`${t}-${i}`} className="text-xs px-2 py-1 rounded-full ring-1 ring-emerald-400/30 bg-emerald-500/10">
                    {t}
                  </span>
                ))}
              </div>

              {persistedImages.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mt-5 mb-2">
                    <Images className="h-4 w-4 opacity-70" />
                    <h5 className="text-sm font-semibold">{tr("uploaded_images", "Imágenes cargadas")}</h5>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {persistedImages.map((p: string, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60">
                        <img
                          src={`${API_BASE}${p.startsWith("/") ? p : `/${p}`}`}
                          alt={`img-${i}`}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <h5 className="text-sm font-semibold mb-2">{tr("days_times", "Días & horarios")}</h5>
              <div className="space-y-2">
                <div className="text-sm opacity-80">
                  <span className="font-medium">{tr("active_days", "Activos")}:</span>{" "}
                  {activeDays.length
                    ? activeDays.map((d: string) => DAY_LABELS[d] || d).join(", ")
                    : "—"}
                </div>
                <div className="rounded-lg border border-neutral-200/50 dark:border-neutral-800/50 p-2">
                  {Object.keys(timeSlots).map((d) => {
                    const list = timeSlots[d] || [];
                    if (!list.length) return null;
                    return (
                      <div key={d} className="flex items-start gap-2 text-sm py-1">
                        <span className="w-10 opacity-70">{DAY_LABELS[d] || d}</span>
                        <div className="flex flex-wrap gap-1">
                          {list.map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md ring-1 ring-emerald-400/30 bg-emerald-500/10"
                            >
                              {r.start}–{r.end}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(timeSlots).every((arr) => (arr || []).length === 0) && (
                    <div className="text-sm opacity-70">—</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canales & contactos */}
        <div className="rounded-xl p-4 md:p-6 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl ring-1 ring-emerald-400/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
              <Share2 className="h-4 w-4" />
            </div>
            <h4 className="text-[15px] font-semibold leading-tight">{tr("channels_contacts", "Canales & Contactos")}</h4>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-sm">
                <span className="opacity-70">{tr("ad_budget", "Presupuesto de pauta")}:</span>{" "}
                <span className="font-semibold">
                  {typeof advertisingBudget === "number"
                    ? advertisingBudget.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
                    : "—"}
                </span>
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">{tr("scrap_platforms", "Plataformas a scrapear")}</div>
                <div className="flex flex-wrap gap-2">
                  {(scrappingConfig?.platforms?.length ? scrappingConfig.platforms : ["—"]).map((p: string, i: number) => (
                    <span key={`${p}-${i}`} className="text-xs px-2 py-1 rounded-full ring-1 ring-emerald-400/30 bg-emerald-500/10">
                      {p}
                    </span>
                  ))}
                </div>
                {typeof scrappingConfig?.filters?.minFollowers === "number" && (
                  <div className="text-xs opacity-80 mt-2">
                    {tr("min_followers", "Min. seguidores")}: <span className="font-medium">{scrappingConfig.filters.minFollowers}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold mb-1">{tr("connected_accounts", "Cuentas conectadas")}</div>
                <div className="flex flex-wrap gap-2">
                  {(connectedSocialAccounts.length ? connectedSocialAccounts : ["—"]).map((acc: string, i: number) => (
                    <span key={`${acc}-${i}`} className="text-xs px-2 py-1 rounded-full ring-1 ring-emerald-400/30 bg-emerald-500/10">
                      {acc}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">{tr("reference_documents", "Documentos de referencia")}</div>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {(referenceDocuments.length ? referenceDocuments : ["—"]).map((fn: string, i: number) => (
                    <li key={`${fn}-${i}`} className="opacity-90">{fn}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link to="/my_campaigns" className="text-emerald-600 hover:underline">{tr("back_to_my_campaigns", "← Volver a mis campañas")}</Link>
          <button
            className="rounded-xl px-4 h-10 ring-1 ring-emerald-400/30 bg-white/70 dark:bg-neutral-900/70 hover:bg-white transition text-[14px]"
            onClick={() => navigate(`/campaign_marketing_creation?fromId=${campaign.id}`)}
          >
            {tr("edit", "Editar")}
          </button>
        </div>
      </div>
    </OnlineLayout>
  );
}
