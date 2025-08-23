import React, { useMemo, useState } from "react";
import { useModeration } from "../../../context/ModerationContext"; // ajusta la ruta si usas alias
import OnlineLayout from "../../../layout/OnlineLayout";
import AgencyChatbot from "../../../components/features/AgencyChatbot";
import { AGE_GROUPS, GENDERS, SOCIOECONOMIC, TONES } from "../../../context/ModerationContext";
import type { ToneOption, Channel } from "../../../context/ModerationContext";
import { Plus, X } from "lucide-react";

const GlassCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children, ...props }) => (
    <div
        className={[
            "relative w-full rounded-2xl p-5 md:p-6",
            "bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl",
            "border-neutral-200 dark:border-neutral-800",
            "ring-1 ring-inset ring-emerald-400/20",
            className,
        ].join(" ")}
        {...props}
    >
        <div className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(80%_80%_at_50%_0%,#000_30%,transparent)]" />
        {children}
    </div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-300">
            {title}
        </h3>
        {subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300/80 mt-1">{subtitle}</p>}
    </div>
);

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = "", children, ...props }) => (
    <label className={["text-xs font-medium uppercase tracking-wide text-neutral-700 dark:text-neutral-300", className].join(" ")} {...props}>
        {children}
    </label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
    <input
        className={[
            "w-full h-11 rounded-xl px-3 md:px-4",
            "bg-white/60 dark:bg-neutral-950/40",
            "border-[0.1] border-neutral-300/60 dark:border-neutral-700/60",
            "focus:outline-none focus:ring-1 focus:ring-emerald-400/60 focus:border-emerald-400/60",
            "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
            className,
        ].join(" ")}
        {...props}
    />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = "", rows = 4, ...props }) => (
    <textarea
        rows={rows}
        className={[
            "w-full rounded-xl px-3 md:px-4 py-2",
            "bg-white/60 dark:bg-neutral-950/40",
            "border-[0.2] border-neutral-300/60 dark:border-neutral-700/60",
            "focus:outline-none focus:ring-1 focus:ring-emerald-400/60 focus:border-emerald-400/60",
            "placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all",
            className,
        ].join(" ")}
        {...props}
    />
);

const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }>
    = ({ active, onClick, children, className = "" }) => (
        <button
            type="button"
            onClick={onClick}
            className={[
                "px-3 h-9 rounded-full text-sm",
                "border transition-all",
                active
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400/50 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                    : "bg-white/40 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 border-neutral-300/40 dark:border-neutral-700/40 hover:border-emerald-400/40 hover:text-emerald-500",
                className,
            ].join(" ")}
        >
            {children}
        </button>
    );

// ==========================
// Main component
// ==========================
const Moderation: React.FC = () => {
    const { data, setBasics, setGeo, setDemographic, setTone, setDates, setAudience } = useModeration();

    const [mainMessage, setMainMessage] = useState<string>(""); // TODO: agregar al contexto si lo deseas
    const [objectives, setObjectives] = useState<string[]>([]); // máx 5, c/u 200 chars
    const canAddMoreObjectives = objectives.length < 5;

    console.log(data);


    const toggleArrayValue = (list: string[], value: string) =>
        list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

    const handleAgeToggle = (value: (typeof AGE_GROUPS)[number]) => {
        setDemographic({ ageGroups: toggleArrayValue(data.audience.demographic.ageGroups, value) as any });
    };

    const handleSocioToggle = (value: (typeof SOCIOECONOMIC)[number]) => {
        setDemographic({ socioeconomic: toggleArrayValue(data.audience.demographic.socioeconomic, value) as any });
    };

    const toneIsOther = useMemo(() => data.tone === "other", [data.tone]);

    // Date helpers (YYYY-MM-DD)
    const fromISODate = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

    return (
        <OnlineLayout>
            <div className="w-full px-2 md:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch">
                    {/* Chatbot */}
                    <div className="lg:col-span-5 flex">
                        <AgencyChatbot className="w-full h-[420px]" />
                    </div>

                    {/* Definición de campaña */}
                    <div className="lg:col-span-7 flex">
                        <GlassCard className="w-full">
                            <SectionTitle title="Definición de campaña" subtitle="Completa los datos base de tu campaña" />

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label>Nombre de la campaña</Label>
                                    <TextInput
                                        placeholder="Ej. Moderación Q4 LATAM"
                                        value={data.name}
                                        onChange={(e) => setBasics({ name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Descripción breve</Label>
                                    <TextArea
                                        placeholder="Resumen breve de objetivos y alcance"
                                        value={data.summary}
                                        onChange={(e) => setBasics({ summary: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Definición de lead</Label>
                                        <TextArea
                                            rows={3}
                                            placeholder="¿Qué consideras un lead válido?"
                                            value={data.leadDefinition}
                                            onChange={(e) => setBasics({ leadDefinition: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Objetivo principal</Label>
                                        <TextArea
                                            rows={3}
                                            placeholder="Ej. Reducir spam y elevar la calidad de conversaciones"
                                            value={data.goal}
                                            onChange={(e) => setBasics({ goal: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Público objetivo */}
                    <div className="lg:col-span-12 flex">
                        <GlassCard className="w-full">
                            <SectionTitle title="Público objetivo" subtitle="Segmenta geografía y demografía" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Geo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>País</Label>
                                        <TextInput
                                            placeholder="Argentina"
                                            value={data.audience.geo.country || ""}
                                            onChange={(e) => setGeo({ country: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Provincia/Región</Label>
                                        <TextInput
                                            placeholder="Tucumán"
                                            value={data.audience.geo.region || ""}
                                            onChange={(e) => setGeo({ region: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Ciudad</Label>
                                        <TextInput
                                            placeholder="San Miguel de Tucumán"
                                            value={data.audience.geo.city || ""}
                                            onChange={(e) => setGeo({ city: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Código Postal (opcional)</Label>
                                        <TextInput
                                            placeholder="4000"
                                            value={data.audience.geo.postalCode || ""}
                                            onChange={(e) => setGeo({ postalCode: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Demographic */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <Label>Edad (múltiple)</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {AGE_GROUPS.map((a: any) => (
                                                <Chip
                                                    key={a}
                                                    active={data.audience.demographic.ageGroups.includes(a)}
                                                    onClick={() => handleAgeToggle(a)}
                                                >
                                                    {a === "kids" ? "Niños" : a === "youth" ? "Jóvenes" : "Adultos"}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Género</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {GENDERS.map((g) => (
                                                <Chip
                                                    key={g}
                                                    active={data.audience.demographic.gender === g}
                                                    onClick={() => setDemographic({ gender: g })}
                                                >
                                                    {g === "M" ? "Masculino" : g === "F" ? "Femenino" : "Todos"}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Nivel socioeconómico (múltiple)</Label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {SOCIOECONOMIC.map((s) => (
                                                <Chip
                                                    key={s}
                                                    active={data.audience.demographic.socioeconomic.includes(s)}
                                                    onClick={() => handleSocioToggle(s)}
                                                >
                                                    {s === "high" ? "Alta" : s === "middle" ? "Media" : "Baja"}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Label>Segmentación cultural / Intereses</Label>
                                <TextArea
                                    rows={3}
                                    placeholder="Ej. Gamers, tecnología, cultura local…"
                                    value={data.audience.cultural || ""}
                                    onChange={(e) => {
                                        setAudience({ cultural: e.target.value })
                                    }}
                                />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Mensaje, tono, objetivos */}
                    <div className="lg:col-span-12 flex">
                        <GlassCard className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{/*                                 <div className="mt-6">
                                    <Label>Objetivos específicos (máx. 5 · 200 caracteres)</Label>
                                    <div className="mt-2 space-y-2">
                                        {objectives.map((obj, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <TextInput
                                                    value={obj}
                                                    maxLength={200}
                                                    onChange={(e) => {
                                                        const next = [...objectives];
                                                        next[idx] = e.target.value.slice(0, 200);
                                                        setObjectives(next);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="p-2 rounded-lg border border-red-400/40 text-red-500/90 hover:bg-red-500/10"
                                                    onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={!canAddMoreObjectives}
                                        onClick={() => canAddMoreObjectives && setObjectives([...objectives, ""])}
                                        className="mt-3 inline-flex items-center gap-2 px-3 h-10 rounded-lg border border-emerald-400/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                                    >
                                        <Plus size={16} /> Añadir objetivo
                                    </button>
                                </div> */}
                                <div>
                                    <SectionTitle title="Tono de comunicación" subtitle="Elige el estilo de voz" />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {TONES.map((t) => (
                                            <Chip key={t} active={data.tone === t} onClick={() => setTone(t as ToneOption)}>
                                                {t === "formal"
                                                    ? "Formal"
                                                    : t === "informal"
                                                        ? "Informal"
                                                        : t === "inspirational"
                                                            ? "Inspirador"
                                                            : t === "persuasive"
                                                                ? "Persuasivo"
                                                                : t === "educational"
                                                                    ? "Educativo"
                                                                    : t === "humorous"
                                                                        ? "Humorístico"
                                                                        : "Otro"}
                                            </Chip>
                                        ))}
                                    </div>
                                    {toneIsOther && (
                                        <div className="mt-3">
                                            <Label>Especificar tono</Label>
                                            <TextInput
                                                placeholder="Describe el tono"
                                                value={data.customTone || ""}
                                                onChange={(e) => setTone("other", e.target.value)}
                                            />
                                        </div>
                                    )}

                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Fechas */}
                    <div className="lg:col-span-12 flex">
                        <GlassCard className="w-full">
                            <SectionTitle title="Calendario" subtitle="Define la duración de la campaña" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Fecha inicio</Label>
                                    <TextInput
                                        type="date"
                                        value={fromISODate(data.dates.start)}
                                        onChange={(e) => setDates(e.target.value, data.dates.end)}
                                    />
                                </div>
                                <div>
                                    <Label>Fecha fin</Label>
                                    <TextInput
                                        type="date"
                                        value={fromISODate(data.dates.end)}
                                        onChange={(e) => setDates(data.dates.start, e.target.value)}
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </OnlineLayout>
    );
};

export default Moderation;
