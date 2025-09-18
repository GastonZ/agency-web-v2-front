import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard, SectionTitle, Label, TextInput, TextArea, Chip } from "../../ModerationCampaign/components/Primitives";
import LocationSelection from "../../../components/features/LocationSelection";
import { useMarketing } from "../../../context/MarketingContext";
import {
  type Channel,
  type BusinessType,
  type CampaignType,
  CampaignTypes,
} from "../../../services/types/marketing-types";
import { createMarketingCampaignFromStepOne } from "../../../services/marketingCampaigns";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const channelOptions: Channel[] = ["instagram", "facebook", "whatsapp", "email", "x"];
const typeOptions: { label: string; value: CampaignType }[] = [
  { label: "Venta", value: CampaignTypes.VENTA },
  { label: "Difusión", value: CampaignTypes.DIFUSION },
  { label: "Encuesta", value: CampaignTypes.ENCUESTA },
  { label: "Capacitación", value: CampaignTypes.CAPACITACION },
];
const businessOptions: BusinessType[] = ["B2C", "B2B"];

const StepOne: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { data, setBasics, setGeo, setAudience, setTone, setChannels, setCampaignId, resetAll } = useMarketing();

  const [busy, setBusy] = useState(false);

  const toggleChannel = (ch: Channel) => {
    const set = new Set(data.channels || []);
    set.has(ch) ? set.delete(ch) : set.add(ch);
    setChannels(Array.from(set) as Channel[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { basics, audience, tone, customTone, channels } = data;

    if (!basics.name || !basics.campaignType || !basics.businessType) {
      toast.error("Completá nombre, tipo y tipo de negocio.");
      return;
    }

    const payload = {
      name: basics.name,
      campaignType: basics.campaignType,
      businessType: basics.businessType,
      objective: basics.objective,
      mainMessage: basics.mainMessage,
      description: basics.description,
      leadDefinition: basics.leadDefinition,
      audience: {
        geo: [
          {
            countryId: audience.geo.countryId || "",
            stateId: audience.geo.stateId || "",
            city: audience.geo.city || "",
          },
        ],
        culturalInterests: data.audience.cultural || "",
      },
      communicationTone: tone,
      communicationToneOther: tone === "other" ? (customTone || "") : "",
      channels: channels || [],
    };

    try {
      setBusy(true);
      const { id } = await createMarketingCampaignFromStepOne(payload as any);
      setCampaignId(id);
      toast.success("Campaña de marketing creada");
      navigate(`/campaign_marketing_creation?id=${id}`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear la campaña");
    } finally {
      setBusy(false);
    }
  };

  const geo0 = data.audience?.geo || {};

  return (
    <form onSubmit={handleSubmit}>

      <GlassCard>
        <SectionTitle title="Datos de la campaña" subtitle="Define lo básico para iniciar tu campaña" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre</Label>
            <TextInput
              value={data.basics.name}
              onChange={(e) => setBasics({ name: e.target.value })}
              placeholder="Marketing - Marca X Q4"
            />
          </div>

          <div>
            <Label>Tipo de campaña</Label>
            <select
              className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
              value={data.basics.campaignType}
              onChange={(e) => setBasics({ campaignType: e.target.value as CampaignType })}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Tipo de negocio</Label>
            <select
              className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
              value={data.basics.businessType}
              onChange={(e) => setBasics({ businessType: e.target.value as BusinessType })}
            >
              {businessOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Objetivo general</Label>
            <TextInput
              value={data.basics.objective}
              onChange={(e) => setBasics({ objective: e.target.value })}
              placeholder="Aumentar ventas en redes sociales"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Mensaje principal</Label>
            <TextInput
              value={data.basics.mainMessage}
              onChange={(e) => setBasics({ mainMessage: e.target.value })}
              placeholder="Descubrí la nueva colección de productos"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Descripción</Label>
            <TextArea
              rows={3}
              value={data.basics.description}
              onChange={(e) => setBasics({ description: e.target.value })}
              placeholder="Campaña de marketing digital para promocionar productos"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Definición de lead</Label>
            <TextInput
              value={data.basics.leadDefinition}
              onChange={(e) => setBasics({ leadDefinition: e.target.value })}
              placeholder="Cliente potencial interesado…"
            />
          </div>
        </div>
      </GlassCard>

      <div className="mt-4">
        <GlassCard>
          <SectionTitle title="Segmentación geográfica" subtitle="País, provincia y ciudad" />

          <LocationSelection
            value={{
              countryId: geo0.countryId,
              stateId: geo0.stateId,
              city: geo0.city,
            }}
            onChange={(patch) => setGeo(patch)}
            languageOverride={i18n.language as any}
          />

          <div className="mt-6">
            <Label>Intereses culturales</Label>
            <TextInput
              value={data.audience.cultural || ""}
              onChange={(e) => setAudience({ cultural: e.target.value })}
              placeholder="Fútbol, música urbana, tecnología"
            />
          </div>
        </GlassCard>
      </div>

      <div className="mt-4">
        <GlassCard>
          <SectionTitle title="Tono y canales" subtitle="Definí la voz y los medios de difusión" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tono</Label>
              <select
                className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                value={data.tone}
                onChange={(e) => setTone(e.target.value as any, data.customTone)}
              >
                <option value="formal">Formal</option>
                <option value="informal">Informal</option>
                <option value="inspirational">Inspirador</option>
                <option value="persuasive">Persuasivo</option>
                <option value="educational">Educativo</option>
                <option value="humorous">Humorístico</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <Label>Tono personalizado</Label>
              <TextInput
                value={data.customTone || ""}
                onChange={(e) => setTone("other", e.target.value)}
                placeholder="Tono de la marca"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Canales</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {channelOptions.map((ch) => {
                  const active = data.channels.includes(ch);
                  return (
                    <Chip
                      key={ch}
                      active={active}
                      onClick={() => toggleChannel(ch)}
                      ariaLabel={`Canal ${ch}`}
                    >
                      {ch}
                    </Chip>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </form>
  );
};

export default StepOne;
