// src/voice/toolsSchema.ts
export const tools = [
    {
        type: "function",
        name: "goToCampaignSelection",
        description:
            "Navega a /campaign_selection. Usá esta tool si el usuario dice: 'crear campaña', 'nueva campaña', 'ir a selección de campañas'.",
        parameters: {
            type: "object",
            properties: {}
        }
    },
    {
        type: "function",
        name: "goToMyCampaigns",
        description:
            "Navega a /my_campaigns. Usá esta tool si el usuario dice: 'ver mis campañas', 'lista de campañas', 'mostrar campañas'.",
        parameters: {
            type: "object",
            properties: {}
        }
    },
    {
        type: "function",
        name: "goToMarketingCreation",
        description: "Ir a crear campaña de marketing (/campaign_marketing_creation).",
        parameters: { type: "object", properties: {} }
    },
    {
        type: "function",
        name: "goToModerationCreation",
        description: "Ir a crear campaña de moderación (/campaign_moderation_creation).",
        parameters: { type: "object", properties: {} }
    },
    {
        type: "function",
        name: "goToListeningCreation",
        description: "Ir a crear campaña de social listening (/campaign_listening_creation).",
        parameters: { type: "object", properties: {} }
    },
    {
        type: "function",
        name: "changeTheme",
        description:
            "Cambia el tema del sitio. Usá esta tool si el usuario dice: 'modo oscuro', 'modo claro', 'tema del sistema', 'poner dark mode', 'volvé a claro'.",
        parameters: {
            type: "object",
            properties: {
                mode: {
                    type: "string",
                    description: "El tema a aplicar.",
                    enum: ["light", "dark", "system"],
                },
            },
            required: ["mode"],
        },
    },
    {
        type: "function",
        name: "launchWebsite",
        description:
            "Abre una URL en una nueva pestaña. Usá esta tool si el usuario dice: 'abrí {sitio}', 'abrir {url}', 'ir a {dominio}'.",
        parameters: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description:
                        "URL a abrir. Puede venir sin protocolo (se normaliza a https)."
                }
            },
            required: ["url"]
        }
    }
] as const;
