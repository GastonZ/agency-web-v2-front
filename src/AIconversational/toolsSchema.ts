import type { Tool } from "./voice/useWebRTCAudio";

/** Lista de tools que “ve” el modelo (Requiere `type: "function"`) */
export const tools: Tool[] = [
  {
    type: "function",
    name: "goToCampaignSelection",
    description:
      "Navega a /campaign_selection. Usá esta tool si el usuario pide crear una campaña o ir a la selección de campañas.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "goToMyCampaigns",
    description:
      "Navega a /my_campaigns. Usá esta tool si el usuario pide ver o listar sus campañas.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "changeTheme",
    description:
      "Cambia el tema del sitio. Palabras clave: 'modo oscuro', 'modo claro', 'seguir al sistema'.",
    parameters: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["light", "dark", "system"],
          description: "Tema a aplicar",
        },
      },
      required: ["mode"],
    },
  },
  {
    type: "function",
    name: "launchWebsite",
    description:
      "Abre una URL en una nueva pestaña. Útil si el usuario dice: 'abrí {sitio}', 'ir a {url}'.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL a abrir (se normaliza a https si falta)" },
      },
      required: ["url"],
    },
  },
  {
    type: "function",
    name: "copyToClipboard",
    description: "Copia texto al portapapeles.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Texto a copiar" },
      },
      required: ["text"],
    },
  },
];
