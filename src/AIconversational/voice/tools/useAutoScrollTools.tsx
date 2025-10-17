import * as React from "react";
import type { ToolSpec } from "../types";

type KnownField =
  // Paso 1 (básicos que ya estaban)
  | "name" | "goal" | "summary" | "leadDefinition"
  // Paso 1 (Público objetivo)
  | "audience.geo.country" | "audience.geo.province" | "audience.geo.city"
  | "audience.culture"     // segmentación cultural
  | "tone"                 // tono de comunicación
  // Paso 2
  | "channels"             // canales de comunicación
  // Paso 3 (Asistente)
  | "assistant.name" | "assistant.greeting" | "assistant.logic"
  | "knowHow"              // base de conocimiento: Q&A
  | "allowedTopics"        // temas permitidos
  | "escalation"           // escalamiento humano (lista)
  | "escalation.phone"     // teléfono de escalamiento
  | "calendars";           // turnos y citas

const FIELD_SELECTORS: Record<KnownField, string[]> = {
  // — Paso 1 (ya estaban)
  name: ['#campaignName','[name="name"]','[data-field="name"]','[data-testid="campaign-name"]'],
  goal: ['#campaignGoal','[name="goal"]','[data-field="goal"]','[data-testid="campaign-goal"]'],
  summary: ['#campaignSummary','[name="summary"]','[data-field="summary"]','[data-testid="campaign-summary"]'],
  leadDefinition: ['#leadDefinition','[name="leadDefinition"]','[data-field="leadDefinition"]','[data-testid="lead-definition"]'],

  // — Paso 1: Público objetivo
  "audience.geo.country":  ['#geoCountry','[name="audience.geo.country"]','[data-field="audience.geo.country"]','[data-testid="geo-country"]'],
  "audience.geo.province": ['#geoProvince','[name="audience.geo.province"]','[data-field="audience.geo.province"]','[data-testid="geo-province"]'],
  "audience.geo.city":     ['#geoCity','[name="audience.geo.city"]','[data-field="audience.geo.city"]','[data-testid="geo-city"]'],
  "audience.culture":      ['#audienceCulture','[name="audience.culture"]','[data-field="audience.culture"]','[data-testid="audience-culture"]'],
  "tone":                  ['#tone','[name="tone"]','[data-field="tone"]','[data-testid="tone"]'],

  // — Paso 2
  "channels": ['#channels','[data-field="channels"]','[data-testid="channels"]'],

  // — Paso 3: Asistente
  "assistant.name":     ['#assistantName','[name="assistant.name"]','[data-field="assistant.name"]','[data-testid="assistant-name"]'],
  "assistant.greeting": ['#assistantGreeting','[name="assistant.greeting"]','[data-field="assistant.greeting"]','[data-testid="assistant-greeting"]'],
  "assistant.logic":    ['#assistantLogic','[name="assistant.logic"]','[data-field="assistant.logic"]','[data-testid="assistant-logic"]'],
  "knowHow":            ['#knowHow','[data-field="knowHow"]','[data-testid="know-how"]'],
  "allowedTopics":      ['#allowedTopics','[data-field="allowedTopics"]','[data-testid="allowed-topics"]'],
  "escalation":         ['#escalation','[data-field="escalation"]','[data-testid="escalation"]'],
  "escalation.phone":   ['#escalationPhone','[name="escalationPhone"]','[data-field="escalationPhone"]','[data-testid="escalation-phone"]'],
  "calendars":          ['#calendars','[data-field="calendars"]','[data-testid="calendars"]'],
};

function findElementBySelectors(selectors: string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}

function gentlyScrollIntoView(el: HTMLElement) {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function focusElement(el: HTMLElement) {
  if ("focus" in el) (el as HTMLElement).focus({ preventScroll: true } as any);
}

function highlightElement(el: HTMLElement) {
  const prevBoxShadow = (el as HTMLElement).style.boxShadow;
  (el as HTMLElement).style.transition = "box-shadow 240ms ease";
  (el as HTMLElement).style.boxShadow = "0 0 0 4px rgba(16,185,129,0.35), 0 0 0 2px rgba(16,185,129,0.75) inset";

  window.setTimeout(() => {
    (el as HTMLElement).style.boxShadow = prevBoxShadow || "";
  }, 1400);
}

function isFilled(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  const str = String(value).trim();
  return str.length > 0;
}

export function useAutoScrollTools() {
  const tools: ToolSpec[] = React.useMemo(
    () => [
      {
        type: "function",
        name: "scrollToModerationField",
        description:
          "Desplaza la vista suavemente hasta el input de un campo (ej: name, goal, leadDefinition), focus y highlight.",
        parameters: {
          type: "object",
          properties: {
            field: {
              type: "string",
              description:
                'Clave del campo. Ejemplos: "name", "goal", "summary", "leadDefinition", "assistant.name", "escalationPhone", "channels".',
            },
          },
          required: ["field"],
          additionalProperties: false,
        },
      },
      {
        type: "function",
        name: "scrollToFieldIfFilled",
        description:
          "Si el campo indicado ya tiene un valor no vacío en el payload provisto, hace scroll + focus + highlight al input correspondiente.",
        parameters: {
          type: "object",
          properties: {
            field: { type: "string" },
            payload: {
              type: "object",
              description:
                "Objeto con la forma de tu contexto (o un subconjunto) que contenga el valor del campo para validar si está lleno.",
            },
          },
          required: ["field", "payload"],
          additionalProperties: true,
        },
      },
    ],
    []
  );

  function scrollToModerationField({ field }: { field: KnownField }) {
    const selectors = FIELD_SELECTORS[field] || [`[name="${field}"]`, `[data-field="${field}"]`];
    const el = findElementBySelectors(selectors);
    if (!el) {
      return { success: false, message: `No se encontró el input para "${field}".` };
    }
    gentlyScrollIntoView(el);
    focusElement(el);
    highlightElement(el);
    return { success: true, field };
  }

  function scrollToFieldIfFilled({ field, payload }: { field: KnownField; payload: any }) {
    const value = field.split(".").reduce((acc: any, k) => (acc ? acc[k] : undefined), payload);
    if (!isFilled(value)) {
      return { success: false, field, reason: "not_filled" };
    }
    return scrollToModerationField({ field });
  }

  return {
    autoScrollTools: tools,
    scrollToModerationField,
    scrollToFieldIfFilled,
  };
}
