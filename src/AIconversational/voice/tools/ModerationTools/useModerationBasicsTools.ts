import { useModeration } from "../../../../context/ModerationContext";

export function useModerationBasicsTools() {
    const { setBasics } = useModeration();

    function getModerationOverview() {
        return {
            success: true,
            overview:
                "Una campaña de moderación monitorea y responde mensajes entrantes, filtra contenido (positivo/negativo/spam) y genera leads a partir de interacciones relevantes.",
        };
    }

    function explainModerationField({ field }: { field: "name" | "goal" | "summary" | "leadDefinition" }) {
        const map: Record<string, string> = {
            name: "Nombre corto para identificar la campaña.",
            goal: "Objetivo principal (qué querés lograr).",
            summary: "Descripción breve de alcance y enfoque.",
            leadDefinition: "Criterios para decidir cuándo una conversación califica como lead.",
        };
        return { success: true, field, help: map[field] ?? "Campo desconocido." };
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

        if (!Object.keys(patch).length) return { success: false, message: "Sin cambios." };
        setBasics(patch);
        return { success: true, updated: Object.keys(patch) };
    }

    return {
        getModerationOverview,
        explainModerationField,
        updateModerationBasics,
    };
}
