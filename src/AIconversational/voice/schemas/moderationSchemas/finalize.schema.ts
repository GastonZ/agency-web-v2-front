import type { ToolSpec } from "../../../../components/features/AgencyChatbot";

const base: ToolSpec = {
  type: "function",
  name: "finalizeModerationCampaign",
  description:
    "Finaliza la campaña de moderación si todos los pasos están completos; activa la campaña y abre la vista de estadísticas. Si falta algo, devuelve qué falta y en qué paso completarlo. También se puede invocar cuando el usuario dice 'finalizar campaña'.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
};

const launch: ToolSpec = {
  type: "function",
  name: "launchModerationCampaign",
  description:
    "Lanzar/activar la campaña de moderación ('lanzar la campaña', 'activar campaña', 'publicar', 'empezar'). Valida pasos, cambia estado a active y navega a estadísticas; si falta algo, responde qué falta.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
};

const createNow: ToolSpec = {
  type: "function",
  name: "createModerationCampaignNow",
  description:
    "Crear/activar ahora la campaña de moderación ('crear la campaña', 'crear campaña ya', 'listo, crear'). Si no existe id, intenta crearlo con los datos del Paso 1; valida mínimos y activa.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
};

export const finalizeModerationSchema: ToolSpec[] = [base, launch, createNow];
