import { useModeration } from "../../../context/ModerationContext";

export const moderationTools = [
    {
        type: "function",
        name: "getModerationOverview",
        description:
            "Devuelve una explicación breve de qué es una campaña de moderación y para qué sirve.",
        parameters: { type: "object", properties: {} },
    },
    {
        type: "function",
        name: "explainModerationField",
        description:
            "Explica qué va en un campo del Paso 1: name, goal, summary o leadDefinition.",
        parameters: {
            type: "object",
            properties: {
                field: { type: "string", enum: ["name", "goal", "summary", "leadDefinition"] },
            },
            required: ["field"],
        },
    },
    {
        type: "function",
        name: "updateModerationBasics",
        description:
            "Escribe por el usuario los campos básicos del Paso 1 (name, goal, summary, leadDefinition).",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string" },
                goal: { type: "string" },
                summary: { type: "string" },
                leadDefinition: { type: "string" },
            },
            additionalProperties: false,
        },
    },
] as const;

export function useModerationTools() {
    const { setBasics } = useModeration();

    function getModerationOverview() {
        return {
            success: true,
            text:
                "Una campaña de moderación define reglas y guías para filtrar, responder y escalar mensajes. " +
                "En el Paso 1 se completan: nombre (identificación), objetivo (qué querés lograr), " +
                "resumen (alcance/tono) y definición de lead (cuándo un contacto cuenta como lead).",
        };
    }

    function explainModerationField({ field }: { field: "name" | "goal" | "summary" | "leadDefinition" }) {
        const map: Record<string, string> = {
            name: "Nombre corto y claro para identificar la campaña (ej: 'Moderación Q4 – Marca X').",
            goal: "Objetivo principal: reducir spam, derivar soporte, clasificar intenciones, etc.",
            summary: "Alcance y tono: qué cubre, qué no; estilo de respuestas esperado.",
            leadDefinition:
                "Criterios para considerar un lead: señales de intención (palabras clave), datos mínimos requeridos, etc.",
        };
        return { success: true, field, text: map[field] ?? "Campo no reconocido." };
    }

    function updateModerationBasics(args: {
        name?: string;
        goal?: string;
        summary?: string;
        leadDefinition?: string;
    }) {
        const payload: any = {};
        if (typeof args.name === "string") payload.name = args.name;
        if (typeof args.goal === "string") payload.goal = args.goal;
        if (typeof args.summary === "string") payload.summary = args.summary;
        if (typeof args.leadDefinition === "string") payload.leadDefinition = args.leadDefinition;

        if (!Object.keys(payload).length) {
            return { success: false, message: "No se pasaron campos para actualizar." };
        }
        // aplica en el contexto (se persiste según tu provider)
        setBasics(payload); // <- actualiza los básicos del Paso 1 en el store de la campaña :contentReference[oaicite:2]{index=2}
        return { success: true, updated: Object.keys(payload) };
    }

    return { getModerationOverview, explainModerationField, updateModerationBasics };
}