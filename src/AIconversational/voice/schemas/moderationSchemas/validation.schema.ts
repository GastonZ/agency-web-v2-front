import type { ToolSpec } from "../../types";

export const validationSchema: ToolSpec[] = [
  {
    type: "function",
    name: "checkModerationStepStatus",
    description:
      "Devuelve qué campos faltan para completar un paso. Si no se indica 'step', devuelve un resumen de todos.",
    parameters: {
      type: "object",
      properties: {
        step: { type: "number", description: "Paso (0=Datos, 1=Canales, etc.). Opcional." },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "goToNextModerationStep",
    description:
      "Intenta pasar al siguiente paso. Primero valida el paso actual; si falta algo, responde los motivos y no avanza. Si ya está en el último (3), avisa que es el último y sugiere finalizar la campaña.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "goToPrevModerationStep",
    description:
      "Vuelve al paso anterior. Si ya está en el primero (0), avisa que no puede retroceder más.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
];
