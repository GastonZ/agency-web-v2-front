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
] as const;
