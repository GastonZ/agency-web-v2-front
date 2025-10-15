import type { ToolSpec } from "../../types";

export const audienceSchema: ToolSpec[] = [
  {
    type: "function",
    name: "updateModerationAudienceCultural",
    description: "Setea la segmentación cultural/intereses (texto libre).",
    parameters: {
      type: "object",
      properties: {
        cultural: { type: "string" },
      },
      required: ["cultural"],
      additionalProperties: false,
    },
  },
];
