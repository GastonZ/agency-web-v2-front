import type { ToolSpec } from "../../types";

export const toneSchema: ToolSpec[] = [
  {
    type: "function",
    name: "updateModerationToneChoice",
    description:
      "Elige un tono de la lista; si no hay match, usa 'other' con customTone.",
    parameters: {
      type: "object",
      properties: {
        tone: { type: "string" },
      },
      required: ["tone"],
      additionalProperties: false,
    },
  },
];
