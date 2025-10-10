import type { ToolSpec } from "../../types";

export const basicsSchema: ToolSpec[] = [
  {
    type: "function",
    name: "getModerationOverview",
    description: "Describe brevemente qué es una campaña de moderación.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "explainModerationField",
    description: "Explica un campo básico de la campaña.",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: ["name", "goal", "summary", "leadDefinition"],
        },
      },
      required: ["field"],
    },
  },
  {
    type: "function",
    name: "updateModerationBasics",
    description: "Actualiza campos básicos (name, goal, summary, leadDefinition).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        goal: { type: "string" },
        summary: { type: "string" },
        leadDefinition: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];
