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
            "Explica cómo funciona la base de conocimiento: tipos de archivo aceptados (csv, txt, word/docx, pdf) y que el sistema extrae preguntas y respuestas.",
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
            "No modifica la base de conocimiento de forma automática. Devuelve instrucciones para que el usuario edite manualmente una Q&A en la UI (Reglas → Base de conocimiento).",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "Ignorado. La edición es manual en la UI." },
                questionHint: { type: "string", description: "Ignorado. La edición es manual en la UI." },
                answerHint: { type: "string", description: "Ignorado. La edición es manual en la UI." },
                newQuestion: { type: "string", description: "Ignorado. La edición es manual en la UI." },
                newAnswer: { type: "string", description: "Ignorado. La edición es manual en la UI." },
            },
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "removeModerationQAMatch",
        description:
            "No elimina Q&A automáticamente. Devuelve instrucciones para que el usuario elimine manualmente una Q&A en la UI (Reglas → Base de conocimiento).",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "Ignorado. La eliminación es manual en la UI." },
                questionHint: { type: "string", description: "Ignorado. La eliminación es manual en la UI." },
                answerHint: { type: "string", description: "Ignorado. La eliminación es manual en la UI." },
            },
            additionalProperties: false,
        },
    }
];
