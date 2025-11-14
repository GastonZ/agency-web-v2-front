import type { Lead } from "../../../../services/types/moderation-types";

export type ChannelCount = { name: string; value: number };
export type ScoreBin = { range: string; count: number };
export type TimePoint = { date: string; count: number };
export type FunnelStep = { name: string; value: number };

export function deriveChannelCounts(leads: Lead[]): ChannelCount[] {
    const map = new Map<string, number>();
    for (const l of leads) {
        const key = (l.channel || "unknown");
        map.set(key, (map.get(key) || 0) + 1);
    }
    const order = ["whatsapp", "instagram", "facebook", "email", "unknown"];
    const label: Record<string, string> = {
        whatsapp: "WhatsApp",
        instagram: "Instagram",
        facebook: "Facebook",
        email: "Email",
        unknown: "Otro",
    };
    return order
        .filter((k) => map.get(k))
        .map((k) => ({ name: label[k] || k, value: map.get(k)! }));
}


export function deriveScoreBins(leads: Lead[]): ScoreBin[] {
    const bins = [0, 0, 0, 0];
    for (const l of leads) {
        const s = Math.max(1, Math.min(10, l.score));
        if (s <= 3) bins[0]++;
        else if (s <= 6) bins[1]++;
        else if (s <= 8) bins[2]++;
        else bins[3]++;
    }
    return [
        { range: "1–3", count: bins[0] },
        { range: "4–6", count: bins[1] },
        { range: "7–8", count: bins[2] },
        { range: "9–10", count: bins[3] },
    ];
}


export function mockLeadsOverTime(): TimePoint[] {
    return [
        { date: "Nov 1", count: 3 },
        { date: "Nov 2", count: 4 },
        { date: "Nov 3", count: 2 },
        { date: "Nov 4", count: 5 },
        { date: "Nov 5", count: 6 },
        { date: "Nov 6", count: 4 },
        { date: "Nov 7", count: 7 },
    ];
}


export function mockFunnel(): FunnelStep[] {
    return [
        { name: "Mensajes", value: 120 },
        { name: "Leads", value: 48 },
        { name: "Calificados", value: 20 },
        { name: "Clientes", value: 6 },
    ];
}

export function kpisFromLeads(leads: Lead[]) {
    const total = leads.length;
    const avgScore = total ? (leads.reduce((a, b) => a + b.score, 0) / total) : 0;
    const byChannel = deriveChannelCounts(leads);
    const topChannel = byChannel.sort((a, b) => b.value - a.value)[0]?.name || "—";
    return {
        total,
        avgScore: Number(avgScore.toFixed(1)),
        responseRate: 92,
        topChannel
    }
}