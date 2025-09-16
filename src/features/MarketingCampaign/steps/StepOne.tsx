import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard, SectionTitle, Label, TextInput, TextArea, Chip } from "../../ModerationCampaign/components/Primitives";
import LocationSelection from "../../../components/features/LocationSelection";

import {
    type MarketingStepOneCtx,
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

    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState<MarketingStepOneCtx>({
        campaignType: CampaignTypes.VENTA,
        businessType: "B2C",
        channels: [],
        status: "draft",
        audience: {
            geo: [{ countryId: "AR", stateId: "AR-C", city: "" }],
            demographics: { ageGroups: [], gender: "todos", socioeconomic: [] },
            cultural: "",
        },
        tone: "informal",
        customTone: "",
        specificObjectives: [],
    });

    const toggleChannel = (ch: Channel) =>
        setForm((p) => {
            const set = new Set(p.channels || []);
            set.has(ch) ? set.delete(ch) : set.add(ch);
            return { ...p, channels: Array.from(set) as Channel[] };
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.campaignType || !form.businessType) {
            toast.error("Completá nombre, tipo y tipo de negocio.");
            return;
        }

        try {
            setBusy(true);
            const { id } = await createMarketingCampaignFromStepOne(form);
            toast.success("Campaña de marketing creada");
            navigate(`/campaign_marketing_creation?id=${id}`);
        } catch (err: any) {
            toast.error(err?.message || "No se pudo crear la campaña");
        } finally {
            setBusy(false);
        }
    };

    const geo0 = form.audience?.geo?.[0] || {};

    return (
        <form onSubmit={handleSubmit}>
            <GlassCard>
                <SectionTitle title="Datos de la campaña" subtitle="Define lo básico para iniciar tu campaña" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Nombre</Label>
                        <TextInput
                            value={form.name || ""}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Marketing - Marca X Q4"
                        />
                    </div>

                    <div>
                        <Label>Tipo de campaña</Label>
                        <select
                            className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
                            value={form.campaignType}
                            onChange={(e) => setForm((p) => ({ ...p, campaignType: e.target.value as CampaignType }))}
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
                            value={form.businessType}
                            onChange={(e) => setForm((p) => ({ ...p, businessType: e.target.value as BusinessType }))}
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
                            value={form.objective || ""}
                            onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))}
                            placeholder="Aumentar ventas en redes sociales"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Label>Mensaje principal</Label>
                        <TextInput
                            value={form.mainMessage || ""}
                            onChange={(e) => setForm((p) => ({ ...p, mainMessage: e.target.value }))}
                            placeholder="Descubrí la nueva colección de productos"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Label>Descripción</Label>
                        <TextArea
                            rows={3}
                            value={form.description || ""}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Campaña de marketing digital para promocionar productos"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Label>Definición de lead</Label>
                        <TextInput
                            value={form.leadDefinition || ""}
                            onChange={(e) => setForm((p) => ({ ...p, leadDefinition: e.target.value }))}
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
                        onChange={(patch) =>
                            setForm((p) => {
                                const curr = p.audience?.geo?.[0] ?? {};
                                const next = { ...curr, ...patch };
                                return {
                                    ...p,
                                    audience: {
                                        ...(p.audience || {}),
                                        geo: [next],
                                    },
                                };
                            })
                        }
                        languageOverride={i18n.language as any}
                    />

                    <div className="mt-6">
                        <Label>Intereses culturales</Label>
                        <TextInput
                            value={form.audience?.cultural || ""}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    audience: { ...(p.audience || {}), cultural: e.target.value },
                                }))
                            }
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
                                value={form.tone}
                                onChange={(e) => setForm((p) => ({ ...p, tone: e.target.value }))}
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
                                value={form.customTone || ""}
                                onChange={(e) => setForm((p) => ({ ...p, customTone: e.target.value }))}
                                placeholder="Tono de la marca"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Label>Canales</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {channelOptions.map((ch) => {
                                    const active = form.channels?.includes(ch);
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

            <div className="mt-6 flex gap-3">
                <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
                >
                    {busy ? "Creando..." : "Crear campaña"}
                </button>
            </div>
        </form>
    );
};

export default StepOne;
