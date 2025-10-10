import type { ToolSpec } from "../../types";

export const geoSchema: ToolSpec[] = [
  {
    type: "function",
    name: "updateModerationGeoByName",
    description:
      "Actualiza ubicación con NOMBRES (convierte a IDs válidos). Acepta country, state y city.",
    parameters: {
      type: "object",
      properties: {
        country:  { type: "string" },
        state:    { type: "string" },
        city:     { type: "string" },
        language: { type: "string", default: "es" },
      },
      additionalProperties: false,
    },
  },
];
