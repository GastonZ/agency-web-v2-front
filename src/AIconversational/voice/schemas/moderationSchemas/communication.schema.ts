import type { ToolSpec } from "../../types";

export const communicationSchema: ToolSpec[] = [
    // TEMAS PERMITIDOS
    {
        type: "function",
        name: "addModerationAllowedTopics",
        description:
            "Agrega uno o varios temas permitidos. Ej: 'ventas, canciones, instrumentos' → agrega 3 por separado.",
        parameters: {
            type: "object",
            properties: {
                items: {
                    anyOf: [
                        { type: "string", description: "Cadena separada por comas" },
                        { type: "array", items: { type: "string" }, description: "Array de temas" }
                    ],
                },
            },
            required: ["items"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "removeModerationAllowedTopics",
        description: "Quita uno o varios temas permitidos por nombre exacto o parecido.",
        parameters: {
            type: "object",
            properties: {
                items: {
                    anyOf: [
                        { type: "string" },
                        { type: "array", items: { type: "string" } }
                    ],
                },
            },
            required: ["items"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "listModerationAllowedTopics",
        description: "Lista los temas permitidos actuales.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
    },

    // ESCALAMIENTO HUMANO
    {
        type: "function",
        name: "addModerationEscalationCases",
        description:
            "Agrega uno o varios casos de escalamiento humano. Ej: 'quejas, devoluciones' → agrega 2.",
        parameters: {
            type: "object",
            properties: {
                items: {
                    anyOf: [
                        { type: "string" },
                        { type: "array", items: { type: "string" } }
                    ],
                },
            },
            required: ["items"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "removeModerationEscalationCases",
        description: "Quita casos de escalamiento por nombre exacto o parecido.",
        parameters: {
            type: "object",
            properties: {
                items: {
                    anyOf: [
                        { type: "string" },
                        { type: "array", items: { type: "string" } }
                    ],
                },
            },
            required: ["items"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "listModerationEscalationCases",
        description: "Lista los casos de escalamiento humano actuales.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
    },

    // CONTACTO
    {
        type: "function",
        name: "setModerationContactNumber",
        description:
            "Define el número de contacto normalizándolo a formato +NN NNNNNNNNN. Se puede pasar countryCode para ayudar.",
        parameters: {
            type: "object",
            properties: {
                phone: { type: "string", description: "Número crudo ingresado por el usuario" },
                countryCode: {
                    type: "string",
                    description: "Código de país numérico sin '+', ej: '54' para Argentina. Opcional."
                },
            },
            required: ["phone"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "getModerationContactNumber",
        description: "Devuelve el número de contacto guardado, si existe.",
        parameters: { type: "object", properties: {}, additionalProperties: false },
    },
];
