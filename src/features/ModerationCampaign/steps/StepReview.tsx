import * as React from "react";
import { motion } from "framer-motion";
import {
    ClipboardList,
    Megaphone,
    Users,
    MessageSquare,
} from "lucide-react";
import { useModeration } from "../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

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
    const audience = data?.audience ?? {};

    const { t } = useTranslation('translations')

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
                    title={t("basic_data")}
                    subtitle={t("review_summary")}
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
                    title={t("audience_and_tone")}
                    subtitle={t("who_and_how")}
                >
                    <ul className="grid gap-2 text-[15px] leading-6">
                        <Row label="Geo" value={
                            audience?.geo
                                ? `${audience.geo.country || audience.geo?.countryCode || "—"} ${audience.geo.city ? `· ${audience.geo.city}` : ""}`
                                : "—"
                        } />
                        <Row label={t("tone")} value={data?.customTone ? `${t("other")} (${data.customTone})` : (data?.tone || "—")} />
                    </ul>
                </Section>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <Section
                    icon={<Megaphone className="h-4 w-4" />}
                    title={t("channels")}
                    subtitle={t("where_moderate")}
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

                </Section>
            </motion.div>
        </motion.div>
    );
}
