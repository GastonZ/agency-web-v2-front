import * as React from "react";
import { ExternalLink, MessageSquare, Instagram, Facebook } from "lucide-react";
import type { Lead } from "../../../../services/types/moderation-types";


function scoreClasses(score: number) {
    if (score >= 9) return "bg-emerald-500/15 text-emerald-400 ring-emerald-400/30";
    if (score >= 7) return "bg-green-500/10 text-green-400 ring-green-400/30";
    if (score >= 4) return "bg-amber-500/10 text-amber-400 ring-amber-400/30";
    return "bg-rose-500/10 text-rose-400 ring-rose-400/30";
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

export function LeadsTable({ leads, onOpenLead }: LeadsTableProps) {
    return (
        <div className="rounded-2xl ring-1 ring-emerald-400/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-400/10">
                <h3 className="text-sm font-semibold">Leads</h3>
                <p className="text-xs opacity-70">Datos de muestra (mock)</p>
            </div>


            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left">
                        <tr className="border-b border-emerald-400/10">
                            <th className="px-4 py-2">Nombre</th>
                            <th className="px-4 py-2">Resumen</th>
                            <th className="px-4 py-2">Puntaje</th>
                            <th className="px-4 py-2">Conversación</th>
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
                                <td className="px-4 py-2 whitespace-nowrap font-medium">{l.name}</td>
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
                                            <span className="hidden sm:inline">Abrir</span>
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