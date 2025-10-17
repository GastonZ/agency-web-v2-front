import type { ToolSpec } from "../types";

export const botControlTools: ToolSpec[] = [
  {
    type: "function",
    name: "deactivateAgent",
    description:
      "Detiene la sesión de voz inmediatamente. Usar cuando el usuario pida 'apagate', 'desactiváte', 'callate', 'silencio', 'stop', 'pausa', 'detener escucha'.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Motivo opcional" },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "activateAgent",
    description:
      "Inicia (o reinicia) la sesión de voz para volver a escuchar. Usar cuando el usuario pida 'prendete', 'activáte', 'escuchar', 'encender' o 'reanudar'.",
    parameters: {
      type: "object",
      properties: {
        hint: { type: "string", description: "Contexto breve opcional" },
      },
      required: [],
      additionalProperties: false,
    },
  },
];

export function useBotControlTools(api: {
  startSession: () => Promise<void> | void;
  stopSession: () => void;
}) {
  async function deactivateAgent(args?: { reason?: string }) {
    try {
      api.stopSession();
      return {
        success: true,
        state: "stopped",
        reason: (args?.reason || "").trim() || undefined,
        message: "Sesión detenida. El bot quedó inactivo.",
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }

  async function activateAgent(args?: { hint?: string }) {
    try {
      await api.startSession();
      return {
        success: true,
        state: "active",
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e) };
    }
  }

  return { deactivateAgent, activateAgent };
}