import type { ToolSpec } from "../../../../components/features/AgencyChatbot";

export const resetModerationSchema: ToolSpec[] = [
  {
    type: "function",
    name: "resetModerationCampaignDraft",
    description:
      "Limpia todos los campos de la campaña en edición y vuelve al Paso 1 (inicio). Útil cuando el usuario pide 'empezar de cero', 'crear nueva campaña', 'limpiar formulario', 'resetear todos los datos' .",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "startNewModerationCampaign",
    description:
      "Alias de reset: comienza una nueva campaña de moderación, reseteando la actual y regresando al Paso 1.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "clearModerationDraft",
    description:
      "Alias de reset: limpia el borrador actual de la campaña y vuelve al Paso 1.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
];
