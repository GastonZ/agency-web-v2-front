import type { ToolSpec } from "../../types";

export const assistantSchema: ToolSpec[] = [
    {
        type: "function",
        name: "setModerationAssistantConfig",
        description:
            "Configura el asistente de la campaña (nombre, saludo inicial y lógica conversacional). No decide la voz.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "Nombre público del asistente" },
                greeting: { type: "string", description: "Saludo inicial que mostrará al usuario" },
                conversationLogic: {
                    type: "string",
                    description:
                        "Breve guía de cómo debe conversar el asistente (orden sugerido, preguntas, flujo).",
                },
            },
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "explainAssistantVoiceFormat",
        description:
            "Explica al usuario cómo subir/usar la voz del asistente. Sólo describe el formato (mp3) y que puede ser archivo o URL, no la establece.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        type: "function",
        name: "explainKnowledgeBaseUpload",
        description:
            "Explica cómo funciona la base de conocimiento: tipos de archivo aceptados (csv, txt, word/docx, pdf) y que el sistema extrae Q&A.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        type: "function",
        name: "addModerationQAPair",
        description:
            "Agrega una Q&A. Si falta la respuesta o la pregunta, avisa qué falta para poder continuar.",
        parameters: {
            type: "object",
            properties: {
                question: { type: "string", description: "Pregunta" },
                answer: { type: "string", description: "Respuesta" },
            },
            required: ["question"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "updateModerationQA",
        description: "Actualiza una Q&A existente por id.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "ID de la Q&A a actualizar" },
                question: { type: "string" },
                answer: { type: "string" },
            },
            required: ["id"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "removeModerationQA",
        description: "Elimina una Q&A existente por id.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "ID de la Q&A a eliminar" },
            },
            required: ["id"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "updateModerationQAMatch",
        description:
            "Actualiza una Q&A buscando por similitud de texto si no se provee ID. Usa questionHint/answerHint para identificar y newQuestion/newAnswer para actualizar.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "Opcional; si se pasa, se usa directo." },
                questionHint: { type: "string", description: "Pista de pregunta para localizar la Q&A." },
                answerHint: { type: "string", description: "Pista de respuesta para localizar la Q&A." },
                newQuestion: { type: "string", description: "Nueva pregunta (si se desea cambiar)." },
                newAnswer: { type: "string", description: "Nueva respuesta (si se desea cambiar)." },
            },
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "removeModerationQAMatch",
        description:
            "Elimina una Q&A buscando por similitud de texto si no se provee ID. Usa questionHint/answerHint para identificar.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "Opcional; si se pasa, se usa directo." },
                questionHint: { type: "string", description: "Pista de pregunta para localizar la Q&A." },
                answerHint: { type: "string", description: "Pista de respuesta para localizar la Q&A." },
            },
            additionalProperties: false,
        },
    },
];
