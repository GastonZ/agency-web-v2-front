import type { ToolSpec } from "../../types";

export const channelsSchema: ToolSpec[] = [
  {
    type: "function",
    name: "setModerationChannels",
    description:
      "Reemplaza la selección de canales. Ignora los no disponibles.",
    parameters: {
      type: "object",
      properties: {
        channels: { type: "array", items: { type: "string" } },
      },
      required: ["channels"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "addModerationChannel",
    description: "Agrega un canal si está disponible.",
    parameters: {
      type: "object",
      properties: {
        channel: { type: "string" },
      },
      required: ["channel"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "removeModerationChannel",
    description: "Quita un canal seleccionado.",
    parameters: {
      type: "object",
      properties: {
        channel: { type: "string" },
      },
      required: ["channel"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "describeModerationChannels",
    description: "Describe cada canal y su disponibilidad.",
    parameters: {
      type: "object",
      properties: {
        channel: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];
