import * as React from "react";
import { motion } from "framer-motion";
import {
    ClipboardList,
    Megaphone,
    Users,
    CalendarRange,
    MessageSquare,
    Sparkles,
} from "lucide-react";
import { useModeration } from "../../../context/ModerationContext";
import OnlineLayout from "../../../layout/OnlineLayout";

const Section: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }> = ({ icon, title, subtitle, children }) => (
    <div className="rounded-xl p-4 md:p-6 bg-white/65 dark:bg-neutral-900/65 backdrop-blur-xl ring-1 ring-emerald-400/20">
        <div className="flex items-center gap-3 mb-3">
            <div className="inline-flex items-center justify-center rounded-lg h-9 w-9 ring-1 ring-emerald-400/20 bg-emerald-500/10">
                {icon}
            </div>
            <div>
                <h4 className="text-[15px] font-semibold leading-tight">{title}</h4>
                {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
            </div>
        </div>
        {children}
    </div>
);

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
    <li className="flex items-start justify-between gap-3">
        <span className="opacity-70">{label}</span>
        <span className="text-right">{value ?? "—"}</span>
    </li>
);

export default function StepReview() {
    const { data } = useModeration();
    const channels = data.channels ?? [];
    const dates = data.dates ?? {};
    const audience = data?.audience ?? {};

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        >
            <motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <Section
                    icon={<ClipboardList className="h-4 w-4" />}
                    title="Datos básicos"
                    subtitle="Revisá el resumen principal"
                >
                    <ul className="grid gap-2 text-[15px] leading-6">
                        <Row label="Nombre" value={data?.name} />
                        <Row label="Objetivo" value={data?.goal} />
                        <Row label="Lead" value={data?.leadDefinition} />
                    </ul>
                </Section>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <Section
                    icon={<Users className="h-4 w-4" />}
                    title="Audiencia & Tono"
                    subtitle="A quién le hablamos y cómo"
                >
                    <ul className="grid gap-2 text-[15px] leading-6">
                        <Row label="Geo" value={
                            audience?.geo
                                ? `${audience.geo.country || audience.geo?.countryCode || "—"} ${audience.geo.city ? `· ${audience.geo.city}` : ""}`
                                : "—"
                        } />
                        <Row label="Demografía" value={
                            audience?.demographic
                                ? [
                                    audience.demographic.gender && `Género: ${audience.demographic.gender}`,
                                    (audience.demographic.ageGroups?.length ? `Edades: ${audience.demographic.ageGroups.join(", ")}` : null),
                                    (audience.demographic.socioeconomic?.length ? `NSE: ${audience.demographic.socioeconomic.join(", ")}` : null),
                                ].filter(Boolean).join(" · ")
                                : "—"
                        } />
                        <Row label="Tono" value={data?.customTone ? `Otro (${data.customTone})` : (data?.tone || "—")} />
                    </ul>
                </Section>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <Section
                    icon={<CalendarRange className="h-4 w-4" />}
                    title="Rango temporal"
                    subtitle="Inicio y fin de la campaña"
                >
                    <ul className="grid gap-2 text-[15px] leading-6">
                        <Row label="Inicio" value={dates?.start || "—"} />
                        <Row label="Fin" value={dates?.end || "—"} />
                    </ul>
                </Section>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <Section
                    icon={<Megaphone className="h-4 w-4" />}
                    title="Canales"
                    subtitle="Dónde moderaremos"
                >
                    {channels?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {channels.map((c: string) => (
                                <span
                                    key={c}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] rounded-lg ring-1 ring-emerald-400/30 bg-emerald-500/10"
                                >
                                    <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                                    {c}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[15px] opacity-70">No hay canales seleccionados.</p>
                    )}

                    {/* <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                        <Sparkles className="h-4 w-4" />
                        Revisá que coincidan con tus cuentas reales.
                    </div> */}
                </Section>
            </motion.div>
        </motion.div>
    );
}
