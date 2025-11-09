import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

export function useModerationBasicsTools() {
    const { setBasics } = useModeration();
    const { i18n } = useTranslation();
    const lang = i18n.language.startsWith("en") ? "en" : "es";

    
    function getModerationOverview() {
        if (lang === "en") {
            return {
                success: true,
                overview:
                    "A moderation campaign monitors and responds to incoming messages, filters positive/negative/spam content, and generates leads from relevant interactions.",
            };
        }

        return {
            success: true,
            overview:
                "Una campaña de moderación monitorea y responde mensajes entrantes, filtra contenido (positivo/negativo/spam) y genera leads a partir de interacciones relevantes.",
        };
    }

    function explainModerationField({ field }: { field: "name" | "goal" | "summary" | "leadDefinition" }) {
        const mapEs: Record<string, string> = {
            name: "Nombre corto para identificar la campaña.",
            goal: "Objetivo principal (qué querés lograr).",
            summary: "Descripción breve de alcance y enfoque.",
            leadDefinition:
                "Criterios para decidir cuándo una conversación califica como posible cliente o contacto.",
        };

        const mapEn: Record<string, string> = {
            name: "Short name to identify the campaign.",
            goal: "Main goal (what you want to achieve).",
            summary: "Short description of scope and focus.",
            leadDefinition:
                "Criteria to decide when a conversation qualifies as a potential customer or lead.",
        };

        return {
            success: true,
            field,
            help: lang === "en" ? mapEn[field] ?? "Unknown field." : mapEs[field] ?? "Campo desconocido.",
        };
    }

    function updateModerationBasics(args: {
        name?: string;
        goal?: string;
        summary?: string;
        leadDefinition?: string;
    }) {
        const patch: any = {};
        if (args.name) patch.name = args.name;
        if (args.goal) patch.goal = args.goal;
        if (args.summary) patch.summary = args.summary;
        if (args.leadDefinition) patch.leadDefinition = args.leadDefinition;

        if (!Object.keys(patch).length) {
            return {
                success: false,
                message: lang === "en" ? "No changes." : "Sin cambios.",
            };
        }
        setBasics(patch);
        return { success: true, updated: Object.keys(patch) };
    }

    return {
        getModerationOverview,
        explainModerationField,
        updateModerationBasics,
    };
}
