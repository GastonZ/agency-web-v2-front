import { useModeration, CHANNELS, type Channel } from "../../../../context/ModerationContext";
import { CHANNEL_STATUS, isChannelAvailable } from "./channelAvailability";

const normalize = (s: string) => (s || "").toLowerCase().trim();

const ALIASES: Record<string, Channel> = {
    ig: "instagram",
    insta: "instagram",
    wa: "whatsapp",
    wsp: "whatsapp",
    tw: "x",
    twitter: "x",
};

const DESCRIPTIONS: Record<Channel, string> = {
    instagram:
        "Responder DMs y comentarios; filtrar buenos/malos mensajes; crear leads a partir de interacciones.",
    whatsapp:
        "Atención directa por chat; filtra mensajes; genera leads a partir de conversaciones.",
    facebook:
        "Mensajes de página y comentarios; filtrado y leads (no disponible por ahora).",
    email:
        "Respuestas y seguimiento; clasificación básica y generación de leads (no disponible por ahora).",
    x:
        "Respuestas públicas y DMs; filtrado y leads (no disponible por ahora).",
};

function toCanonical(input: string): Channel | null {
    const n = normalize(input);
    const alias = ALIASES[n];
    if (alias) return alias;
    if ((CHANNELS as readonly string[]).includes(n)) return n as Channel;
    return null;
}

export function useModerationChannelsTools() {
    const { data, setChannels } = useModeration();

    function setModerationChannels(args: { channels: string[] }) {
        const wanted = (args.channels || []).map(toCanonical).filter(Boolean) as Channel[];
        const unique = Array.from(new Set(wanted));

        const accepted = unique.filter(isChannelAvailable);
        const unavailable = unique.filter((c) => !isChannelAvailable(c));
        setChannels(accepted);

        return {
            success: true,
            applied: accepted,
            unavailable,
            message:
                unavailable.length
                    ? `Canales no disponibles ignorados: ${unavailable.join(", ")}.`
                    : "Canales actualizados.",
        };
    }

    function addModerationChannel(args: { channel: string }) {
        const c = toCanonical(args.channel);
        if (!c) return { success: false, message: "Canal desconocido." };
        if (!isChannelAvailable(c)) {
            return { success: false, message: `El canal ${c} no está disponible aún.` };
        }
        const next = new Set([...(data.channels || []), c]);
        setChannels(Array.from(next) as Channel[]);
        return { success: true, added: c, current: Array.from(next) };
    }

    function removeModerationChannel(args: { channel: string }) {
        const c = toCanonical(args.channel);
        if (!c) return { success: false, message: "Canal desconocido." };
        const next = (data.channels || []).filter((x) => x !== c);
        setChannels(next as Channel[]);
        return { success: true, removed: c, current: next };
    }

    function describeModerationChannels(args?: { channel?: string }) {
        if (args?.channel) {
            const c = toCanonical(args.channel);
            if (!c) return { success: false, message: "Canal desconocido." };
            return {
                success: true,
                channel: c,
                available: isChannelAvailable(c),
                description: DESCRIPTIONS[c],
            };
        }

        const list = (CHANNELS as Channel[]).map((c) => ({
            channel: c,
            available: isChannelAvailable(c),
            description: DESCRIPTIONS[c],
        }));
        return { success: true, items: list };
    }

    return {
        setModerationChannels,
        addModerationChannel,
        removeModerationChannel,
        describeModerationChannels,
    };
}
