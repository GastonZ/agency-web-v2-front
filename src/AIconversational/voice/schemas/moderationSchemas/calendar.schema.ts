import type { ToolSpec } from "../../types";

/**
 * Schemas de “Turnos y Citas” (calendarios por profesional).
 * - Explicar de qué se trata y activarlo
 * - Crear calendario, cambiar nombre/persona
 * - Activar días, agregar/quitar horarios
 * - Agregar horarios múltiples (rangos con duración)
 * - Eliminar calendario por id o por nombre
 */
export const calendarSchema: ToolSpec[] = [
  {
    type: "function",
    name: "explainAndEnableCalendars",
    description:
      "Explica qué es Turnos y Citas y, si el usuario quiere, activa la opción de usar agendas (setCalendarsEnabled=true).",
    parameters: {
      type: "object",
      properties: {
        enable: { type: "boolean", description: "Si es true, activa las agendas" },
      },
      additionalProperties: false,
    },
  },

  // Calendarios
  {
    type: "function",
    name: "createModerationCalendar",
    description:
      "Crea un nuevo calendario. name es el nombre de la agenda (ej. Consultorio 1), assignee la persona (ej. Dra. Gómez).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        assignee: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "updateModerationCalendarMeta",
    description:
      "Actualiza nombre y/o persona que atiende. Se puede identificar por id exacto o por nombre (fuzzy).",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Opcional. Si no se pasa, se buscará por nombre." },
        nameHint: { type: "string", description: "Pista de nombre para localizar calendario." },
        newName: { type: "string" },
        newAssignee: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "removeModerationCalendar",
    description:
      "Elimina un calendario por id o por nombre (fuzzy). Preguntar confirmación si hay ambigüedad.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        nameHint: { type: "string" },
      },
      additionalProperties: false,
    },
  },

  // Días
  {
    type: "function",
    name: "toggleModerationCalendarDay",
    description:
      "Activa o desactiva un día en un calendario. day puede ser 'domingo...sábado' o 'sun..sat'.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        nameHint: { type: "string" },
        day: { type: "string", description: "Domingo/Lunes/... o sun/mon/..." },
      },
      required: ["day"],
      additionalProperties: false,
    },
  },

  // Horarios
  {
    type: "function",
    name: "addModerationTimeSlot",
    description:
      "Agrega un horario simple a un día (ej: start=09:00, end=10:00).",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        nameHint: { type: "string" },
        day: { type: "string" },
        start: { type: "string", description: "HH:MM (24h)" },
        end: { type: "string", description: "HH:MM (24h)" },
      },
      required: ["day", "start", "end"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "addModerationTimeSlotsBulk",
    description:
      "Agrega horarios múltiples (ej: 09:00–11:00 con step=30 → 09:00–09:30, 09:30–10:00, 10:00–10:30, 10:30–11:00). Puede aceptar varios días.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        nameHint: { type: "string" },
        days: {
          anyOf: [
            { type: "string", description: "Día único" },
            { type: "array", items: { type: "string" }, description: "Lista de días" }
          ],
        },
        start: { type: "string", description: "HH:MM" },
        end: { type: "string", description: "HH:MM" },
        step: { type: "number", description: "Minutos por turno (p.ej. 15/30)" },
      },
      required: ["days", "start", "end", "step"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "removeModerationTimeSlot",
    description:
      "Elimina un horario por índice en un día (tal como se muestra en la UI).",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        nameHint: { type: "string" },
        day: { type: "string" },
        index: { type: "number", description: "Índice del slot a borrar (0-based)" },
      },
      required: ["day", "index"],
      additionalProperties: false,
    },
  },
];
