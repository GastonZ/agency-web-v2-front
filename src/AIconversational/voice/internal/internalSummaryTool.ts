import type { Tool } from "../useWebRTCAudio";

export const internalSummaryTool: Tool = {
  type: "function",
  name: "__setRollingSummary",
  description: "Guardar un resumen ultra breve del diálogo reciente (1-2 frases).",
  parameters: {
    type: "object",
    additionalProperties: false,
    required: ["summary"],
    properties: {
      summary: { type: "string", description: "Resumen conciso en español, 1-2 frases." },
    },
  },
};