import * as React from "react";
import { ExternalLink, MessageSquare, Instagram, Facebook } from "lucide-react";
import type { Lead } from "../../../../services/types/moderation-types";
import { useTranslation } from "react-i18next";

function scoreClasses(score: number) {
    if (score >= 9) return "bg-emerald-500/15 text-emerald-400 ring-emerald-400/30";
    if (score >= 7) return "bg-green-500/10 text-green-400 ring-green-400/30";
    if (score >= 4) return "bg-amber-500/10 text-amber-400 ring-amber-400/30";
    return "bg-rose-500/10 text-rose-400 ring-rose-400/30";
}

function prettifyWhatsNumber(raw?: string | null) {
    if (!raw) return null;
    return String(raw).replace(/@.+$/, ""); // quita "@lid"
}

function ChannelIcon({ channel }: { channel?: Lead["channel"] }) {
    switch (channel) {
        case "whatsapp":
            return <MessageSquare className="h-4 w-4" />;
        case "instagram":
            return <Instagram className="h-4 w-4" />;
        case "facebook":
            return <Facebook className="h-4 w-4" />;
        case "email":
            return <ExternalLink className="h-4 w-4" />;
        default:
            return <ExternalLink className="h-4 w-4" />;
    }
}

interface LeadsTableProps {
    leads: Lead[];
    onOpenLead: (lead: Lead) => void;
}

function ContactCell({ lead }: { lead: any }) {
    const channel = lead.channel;

    // INSTAGRAM
    if (channel === "instagram") {
        const primary = lead.username ? `@${lead.username}` : (lead.name || "Instagram");
        const secondary = lead.username && lead.name ? lead.name : null;

        return (
            <div className="flex items-center gap-3 min-w-[220px]">
                {lead.profilePic ? (
                    <img
                        src={lead.profilePic}
                        alt={primary}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-emerald-400/20"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-neutral-300/60 dark:bg-neutral-700/60 ring-1 ring-emerald-400/20" />
                )}

                <div className="leading-tight">
                    <div className="font-medium">{primary}</div>
                    {secondary ? (
                        <div className="text-xs opacity-70">{secondary}</div>
                    ) : null}
                </div>
            </div>
        );
    }

    // WHATSAPP
    if (channel === "whatsapp") {
        const number = prettifyWhatsNumber(lead.contactNumber);
        const primary = lead.name || "WhatsApp";
        return (
            <div className="leading-tight min-w-[220px]">
                <div className="font-medium">{primary}</div>
                {number ? <div className="text-xs opacity-70 font-mono">{number}</div> : null}
            </div>
        );
    }

    // FACEBOOK (por ahora solo nombre)
    if (channel === "facebook") {
        const primary = lead.name || "Facebook";
        return (
            <div className="leading-tight min-w-[220px]">
                <div className="font-medium">{primary}</div>
            </div>
        );
    }

    // fallback
    return <div className="font-medium">{lead.name}</div>;
}

export function LeadsTable({ leads, onOpenLead }: LeadsTableProps) {
    const { t } = useTranslation("translations");

    console.log('my leads', leads);

    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-400/10">
                <h3 className="text-sm font-semibold">Leads</h3>
            </div>


            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left">
                        <tr className="border-b border-emerald-400/10">
                            <th className="px-4 py-2">{t("stats_name")}</th>
                            <th className="px-4 py-2">{t("stats_summary")}</th>
                            <th className="px-4 py-2">{t("stats_score")}</th>
                            <th className="px-4 py-2">{t("stats_conversation")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((l) => (
                            <tr
                                key={l.id}
                                className="group border-b border-emerald-400/10 hover:bg-emerald-500/5 cursor-pointer"
                                onClick={() => onOpenLead(l)}
                                title="Ver detalles"
                            >
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <ContactCell lead={l} />
                                </td>
                                <td className="px-4 py-2 max-w-[420px]">
                                    <p className="line-clamp-2 opacity-80">
                                        {l.summary}
                                    </p>
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] ring-1 " +
                                            scoreClasses(l.score)
                                        }
                                    >
                                        {l.score}/10
                                    </span>
                                </td>
                                <td
                                    className="px-4 py-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {l.channelLink ? (
                                        <a
                                            href={l.channelLink}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="inline-flex items-center gap-2 rounded-lg ring-1 ring-emerald-400/20 px-2.5 py-1.5 text-[12px] hover:bg-emerald-500/10"
                                            title="Abrir conversación"
                                        >
                                            <ChannelIcon channel={l.channel} />
                                            <span className="hidden sm:inline">{t("open")}</span>
                                        </a>
                                    ) : (
                                        <span className="text-xs opacity-60">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}