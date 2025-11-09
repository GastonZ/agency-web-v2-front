import { useModeration, CHANNELS, type Channel } from "../../../../context/ModerationContext";
import { CHANNEL_STATUS, isChannelAvailable } from "./channelAvailability";
import { useTranslation } from "react-i18next";

type Lang = "es" | "en";
const normalizeLang = (raw?: string): Lang =>
    raw && raw.toLowerCase().startsWith("en") ? "en" : "es";

const normalize = (s: string) => (s || "").toLowerCase().trim();

const ALIASES: Record<string, Channel> = {
    ig: "instagram",
    insta: "instagram",
    wa: "whatsapp",
    wsp: "whatsapp",
    tw: "x",
    twitter: "x",
};

const DESCRIPTIONS_ES: Record<Channel, string> = {
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

const DESCRIPTIONS_EN: Record<Channel, string> = {
    instagram:
        "Reply to DMs and comments, filter good/bad messages and create leads from interactions.",
    whatsapp:
        "Direct chat support, filters messages and generates leads from conversations.",
    facebook:
        "Page messages and comments; filtering and leads (not available yet).",
    email:
        "Replies and follow-ups; basic classification and lead generation (not available yet).",
    x:
        "Public replies and DMs; filtering and leads (not available yet).",
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
    const { i18n } = useTranslation();
    const langDefault = (i18n?.language as string) || "es";

    function setModerationChannels(args: { channels: string[]; language?: string }) {
        const lang = normalizeLang(args.language || langDefault);
        const descriptions = lang === "en" ? DESCRIPTIONS_EN : DESCRIPTIONS_ES;

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
                lang === "en"
                    ? (unavailable.length
                        ? `Unavailable channels ignored: ${unavailable.join(", ")}.`
                        : "Channels updated.")
                    : (unavailable.length
                        ? `Canales no disponibles ignorados: ${unavailable.join(", ")}.`
                        : "Canales actualizados."),
        };
    }

    function addModerationChannel(args: { channel: string; language?: string }) {
        const lang = normalizeLang(args.language || langDefault);
        const c = toCanonical(args.channel);
        if (!c) {
            return {
                success: false,
                message: lang === "en" ? "Unknown channel." : "Canal desconocido.",
            };
        }
        if (!isChannelAvailable(c)) {
            return {
                success: false,
                message:
                    lang === "en"
                        ? `Channel ${c} is not available yet.`
                        : `El canal ${c} no está disponible aún.`,
            };
        }
        const next = new Set([...(data.channels || []), c]);
        setChannels(Array.from(next) as Channel[]);
        return { success: true, added: c, current: Array.from(next) };
    }

    function removeModerationChannel(args: { channel: string; language?: string }) {
        const lang = normalizeLang(args.language || langDefault);
        const c = toCanonical(args.channel);
        if (!c) {
            return {
                success: false,
                message: lang === "en" ? "Unknown channel." : "Canal desconocido.",
            };
        }
        const next = (data.channels || []).filter((x) => x !== c);
        setChannels(next as Channel[]);
        return { success: true, removed: c, current: next };
    }

    function describeModerationChannels(args?: { channel?: string; language?: string }) {
        const lang = normalizeLang(args?.language || langDefault);
        const descriptions = lang === "en" ? DESCRIPTIONS_EN : DESCRIPTIONS_ES;

        if (args?.channel) {
            const c = toCanonical(args.channel);
            if (!c) {
                return {
                    success: false,
                    message: lang === "en" ? "Unknown channel." : "Canal desconocido.",
                };
            }
            return {
                success: true,
                channel: c,
                available: isChannelAvailable(c),
                description: descriptions[c],
            };
        }

        const list = (CHANNELS as Channel[]).map((c) => ({
            channel: c,
            available: isChannelAvailable(c),
            description: descriptions[c],
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
