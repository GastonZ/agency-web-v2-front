import type { Tool } from "../useWebRTCAudio";

export const internalSummaryTool: Tool = {
  type: "function",
  name: "__setRollingSummary",
  description: "Guardar un resumen del dialogo.",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["summary"],
    properties: {
      summary: { type: "string", description: "Resumen conciso de lo más importante mencionado en la conversacion." },
    },
  },
};