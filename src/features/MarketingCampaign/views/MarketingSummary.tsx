// src/features/MarketingCampaign/views/MarketingSummary.tsx
import * as React from "react";
import { GlassCard, SectionTitle, Chip } from "../../ModerationCampaign/components/Primitives";
import { useMarketing } from "../../../context/MarketingContext";

const DAY_LABEL: Record<string, string> = {
  mon: "Lun", tue: "Mar", wed: "Mié", thu: "Jue", fri: "Vie", sat: "Sáb", sun: "Dom",
};

const ORDERED: Array<keyof typeof DAY_LABEL> = ["mon","tue","wed","thu","fri","sat","sun"];

const nfARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

const MarketingSummary: React.FC = () => {
  const { data } = useMarketing();

  const scheduleRows = ORDERED
    .map((d) => ({ day: d, slots: data.content.publishingSchedule.timeSlots[d] || [] }))
    .filter((row) => (row.slots?.length || 0) > 0);

  return (
    <div className="space-y-4">
      <GlassCard>
        <SectionTitle title="Resumen de campaña" subtitle="Verificá lo configurado antes de lanzar" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-70">Nombre</div>
            <div className="font-medium">{data.basics.name || "—"}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Tipo / Negocio</div>
            <div className="font-medium">
              {data.basics.campaignType || "—"} · {data.basics.businessType || "—"}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs opacity-70">Objetivo</div>
            <div className="font-medium">{data.basics.objective || "—"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs opacity-70">Mensaje principal</div>
            <div className="font-medium">{data.basics.mainMessage || "—"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs opacity-70">Descripción</div>
            <div className="font-medium">{data.basics.description || "—"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs opacity-70">Definición de lead</div>
            <div className="font-medium">{data.basics.leadDefinition || "—"}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Segmentación, tono y canales" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-70">Geo</div>
            <div className="font-medium">
              {data.audience.geo.countryId || "—"} / {data.audience.geo.stateId || "—"} / {data.audience.geo.city || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Intereses culturales</div>
            <div className="font-medium">{data.audience.cultural || "—"}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Tono</div>
            <div className="font-medium">
              {data.tone || "—"} {data.tone === "other" && data.customTone ? `· ${data.customTone}` : ""}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Canales</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(data.channels || []).length
                ? data.channels.map((c) => <Chip key={c} active>{c}</Chip>)
                : <span className="opacity-70">—</span>}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Contenido" subtitle="Formatos, referencias y calendario" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-70">Tópicos</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(data.content.topics || []).length
                ? data.content.topics.map((t) => <Chip key={t} active>{t}</Chip>)
                : <span className="opacity-70">—</span>}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Tipos de contenido</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(data.content.contentTypes || []).length
                ? data.content.contentTypes.map((t) => <Chip key={t} active>{t}</Chip>)
                : <span className="opacity-70">—</span>}
            </div>
          </div>
        </div>

        {!!(data.content.persistedImages?.length) && (
          <div className="mt-4">
            <div className="text-xs opacity-70 mb-2">Imágenes</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {data.content.persistedImages.map((p) => (
                <img key={p} src={import.meta.env.VITE_API_URL + '/'+ p} alt={p} className="w-full h-28 object-cover rounded-xl ring-1 ring-emerald-400/15" />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-xs opacity-70 mb-1">
            Calendario ({data.content.publishingSchedule.timezone || "—"})
          </div>
          {scheduleRows.length ? (
            <ul className="text-sm space-y-1">
              {scheduleRows.map(({ day, slots }) => (
                <li key={day}>
                  <span className="font-medium">{DAY_LABEL[day]}:</span>{" "}
                  {slots.map((s: any) => `${s.start}–${s.end}`).join(", ")}
                </li>
              ))}
            </ul>
          ) : (
            <div className="opacity-70">—</div>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Influencer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-70">Tipo</div>
            <div className="font-medium">{data.influencerType || "—"}</div>
          </div>
          {data.influencerType === "catalog" && (
            <>
              <div>
                <div className="text-xs opacity-70">Influencer (ID)</div>
                <div className="font-medium">{data.selectedInfluencerId || "—"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs opacity-70">Notas</div>
                <div className="font-medium">{data.influencerSelectionNotes || "—"}</div>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Contactos & Pauta" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs opacity-70">Plataformas a explorar</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(data.channelsContacts.platforms || []).length
                ? data.channelsContacts.platforms.map((p) => <Chip key={p} active>{p}</Chip>)
                : <span className="opacity-70">—</span>}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Cuentas conectadas</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {(data.channelsContacts.connectedSocialAccounts || []).length
                ? data.channelsContacts.connectedSocialAccounts.map((a) => <Chip key={a} active>{a}</Chip>)
                : <span className="opacity-70">—</span>}
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Seguidores mínimos</div>
            <div className="font-medium">{data.channelsContacts.minFollowers ?? 0}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Presupuesto</div>
            <div className="font-medium">{nfARS.format(data.channelsContacts.advertisingBudget || 0)}</div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs opacity-70">Documentos de referencia</div>
            {(data.channelsContacts.referenceDocuments || []).length ? (
              <ul className="text-sm list-disc pl-5 mt-1">
                {data.channelsContacts.referenceDocuments.map((f) => <li key={f}>{f}</li>)}
              </ul>
            ) : (
              <div className="opacity-70">—</div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default MarketingSummary;
