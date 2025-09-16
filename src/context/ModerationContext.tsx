import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// ==========================
// Types & Option Constants
// ==========================
export type AgeGroup = "kids" | "youth" | "adults";
export const AGE_GROUPS: AgeGroup[] = ["kids", "youth", "adults"];

export type Gender = "male" | "female" | "other";
export const GENDERS: Gender[] = ["male", "female", "other"];

export type SocioEconomic = "high" | "middle" | "low";
export const SOCIOECONOMIC: SocioEconomic[] = ["high", "middle", "low"];

export type ToneOption =
  | "formal"
  | "informal"
  | "inspirational"
  | "persuasive"
  | "educational"
  | "humorous"
  | "other";
export const TONES: ToneOption[] = [
  "formal",
  "informal",
  "inspirational",
  "persuasive",
  "educational",
  "humorous",
  "other",
];

export type Channel = "instagram" | "facebook" | "whatsapp" | "email" | "x";
export const CHANNELS: Channel[] = ["instagram", "facebook", "whatsapp", "email", "x"];

export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export const DAYS_ORDER: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const DAY_LABELS_ES: Record<DayOfWeek, string> = {
  sun: "Domingo",
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
};

// ==========================
// Core Data Shapes
// ==========================
export interface GeoSeg {
  country?: string;
  region?: string;
  countryId?: string;
  stateId?: string;
  countryCode?: string;
  regionCode?: string;
  city?: string;
  postalCode?: string;
}

export interface DemoSeg {
  ageGroups: AgeGroup[];
  gender: Gender;
  socioeconomic: SocioEconomic[];
}

export interface Audience {
  geo: GeoSeg;
  demographic: DemoSeg;
  cultural?: string;
}

export interface QA {
  id: string;
  question: string;
  answer: string;
}

export interface AssistantConfig {
  name: string;
  greeting: string;
  conversationLogic: string;
  voiceFile?: File | null;
  voiceUrl?: string | null;
}

export interface CampaignDates {
  start?: string;
  end?: string;
}

export interface TimeRange {
  /** Formato HH:MM (24h), e.g. "13:00" */
  start: string;
  /** Formato HH:MM (24h), e.g. "14:00" */
  end: string;
}

export type DaySlotsMap = Record<DayOfWeek, TimeRange[]>;

export interface Calendar {
  id: string;
  name: string;         // "Nombre del calendario"
  assignee: string;     // "Nombre de la persona que atiende"
  activeDays: DayOfWeek[];
  slots: DaySlotsMap;   // rangos por día
}

export interface ModerationCampaign {

  campaignId?: string;

  name: string;
  goal: string;
  summary: string;
  leadDefinition: string;
  audience: Audience;
  tone: ToneOption;
  customTone?: string;
  channels: Channel[];

  assistant: AssistantConfig;
  knowHow: QA[];
  allowedTopics: string[];
  escalationItems: string[];
  escalationPhone?: string;

  calendarsEnabled: boolean;
  calendars: Calendar[];

  __version: number;
}

// ==========================
// Defaults
// ==========================

const EMPTY_SLOTS: DaySlotsMap = DAYS_ORDER.reduce((acc, d) => {
  acc[d] = [];
  return acc;
}, {} as DaySlotsMap);

export const DEFAULT_CAMPAIGN: ModerationCampaign = {
  campaignId: undefined,
  name: "",
  goal: "",
  summary: "",
  leadDefinition: "",
  audience: {
    geo: { country: "", region: "", city: "", postalCode: "" },
    demographic: { ageGroups: [], gender: "other", socioeconomic: [] },
    cultural: "",
  },
  tone: "informal",
  customTone: "",
  channels: [],
  assistant: {
    name: "",
    greeting: "",
    conversationLogic: "",
    voiceFile: null,
    voiceUrl: null,
  },
  knowHow: [],
  allowedTopics: [],
  escalationItems: [],
  escalationPhone: "",
  calendarsEnabled: false,
  calendars: [],
  __version: 1,
};

// ==========================
// Utilities
// ==========================
const STORAGE_KEY_FALLBACK = "moderationCampaignCtx";

function toISO(input?: string | Date): string | undefined {
  if (!input) return undefined;
  if (typeof input === "string") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  return input.toISOString();
}

function genId(prefix = "qa"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
}

function genCalId() {
  return `cal_${Math.random().toString(36).slice(2, 7)}_${Date.now().toString(36)}`;
}


function hasOverlap(ranges: TimeRange[], candidate: TimeRange): boolean {
  return ranges.some((r) => rangesOverlap(r, candidate));
}

function reviveCalendars(parsed: any): Calendar[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.map((c: any) => {
    const id = typeof c?.id === "string" ? c.id : genCalId();
    const name = typeof c?.name === "string" ? c.name : "";
    const assignee = typeof c?.assignee === "string" ? c.assignee : "";
    const activeDays: DayOfWeek[] = Array.isArray(c?.activeDays)
      ? c.activeDays.filter((d: any): d is DayOfWeek => DAYS_ORDER.includes(d))
      : [];

    const slotsRaw = c?.slots ?? {};
    const slots: DaySlotsMap = DAYS_ORDER.reduce((acc, d) => {
      const dayArr: TimeRange[] = Array.isArray(slotsRaw?.[d]) ? slotsRaw[d] : [];
      // validar formato y descartar inválidos
      acc[d] = dayArr.filter((r) => isValidRange(r)).sort((a, b) => (parseHHMM(a.start)! - parseHHMM(b.start)!));
      return acc;
    }, {} as DaySlotsMap);

    return { id, name, assignee, activeDays, slots };
  });
}


function sanitizeForPersist(data: ModerationCampaign): Omit<ModerationCampaign, "assistant"> & { assistant: Omit<AssistantConfig, "voiceFile"> } {
  const { assistant, ...rest } = data;
  return {
    ...rest,
    assistant: {
      ...assistant,
      voiceFile: undefined,
    } as unknown as Omit<AssistantConfig, "voiceFile">,
  };
}

function reviveFromPersist(raw: any): ModerationCampaign {
  const base = { ...DEFAULT_CAMPAIGN };
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const merged: ModerationCampaign = {
      ...base,
      ...parsed,
      audience: {
        ...base.audience,
        ...(parsed?.audience ?? {}),
        geo: { ...base.audience.geo, ...(parsed?.audience?.geo ?? {}) },
        demographic: {
          ...base.audience.demographic,
          ...(parsed?.audience?.demographic ?? {}),
        },
      },
      assistant: {
        ...base.assistant,
        ...(parsed?.assistant ?? {}),
        voiceFile: null,
      },
      knowHow: Array.isArray(parsed?.knowHow) ? parsed.knowHow : base.knowHow,
      channels: Array.isArray(parsed?.channels) ? parsed.channels : base.channels,
      allowedTopics: Array.isArray(parsed?.allowedTopics) ? parsed.allowedTopics : base.allowedTopics,
      escalationItems: Array.isArray(parsed?.escalationItems) ? parsed.escalationItems : base.escalationItems,
      calendarsEnabled: Boolean(parsed?.calendarsEnabled),
      calendars: reviveCalendars(parsed?.calendars)
    };
    return merged;
  } catch {
    return base;
  }
}

function parseHHMM(v: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(v)) return null;
  const [h, m] = v.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function isValidRange(r: TimeRange): boolean {
  const s = parseHHMM(r.start);
  const e = parseHHMM(r.end);
  return s !== null && e !== null && s < e;
}

function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const as = parseHHMM(a.start)!;
  const ae = parseHHMM(a.end)!;
  const bs = parseHHMM(b.start)!;
  const be = parseHHMM(b.end)!;

  return as < be && bs < ae;
}

// ==========================
// Context
// ==========================
interface ModerationContextValue {
  data: ModerationCampaign;

  setCampaignId: (id: string) => void;

  // Basics
  setBasics: (p: Partial<Pick<ModerationCampaign, "name" | "goal" | "summary" | "leadDefinition">>) => void;

  // Audience
  setAudience: (p: Partial<Audience>) => void;
  setGeo: (p: Partial<GeoSeg>) => void;
  setDemographic: (p: Partial<DemoSeg>) => void;

  // Tone & Dates & Channels
  setTone: (tone: ToneOption, customTone?: string) => void;
  setDates: (start?: string | Date, end?: string | Date) => void;
  addChannel: (c: Channel) => void;
  removeChannel: (c: Channel) => void;
  setChannels: (c: Channel[]) => void;

  // Assistant
  setAssistant: (p: Partial<AssistantConfig>) => void;
  setVoiceFile: (file: File | null) => void;

  // KnowHow
  addQA: (q: Omit<QA, "id"> | { question: string; answer: string }) => void;
  updateQA: (id: string, p: Partial<QA>) => void;
  removeQA: (id: string) => void;
  clearQA: () => void;

  // Scope & Escalation
  setAllowedTopics: (topics: string[]) => void;
  setEscalationItems: (items: string[]) => void;
  setEscalationPhone: (phone?: string) => void;

  // Calendar
  setCalendarsEnabled: (v: boolean) => void;
  setCalendars: (calendars: Calendar[]) => void;
  addTimeSlotsBulk: (
    id: string,
    days: DayOfWeek[],
    range: { start: string; end: string },
    stepMinutes: number
  ) => { ok: true; added: number } | { ok: false; reason: string };

  createCalendar: (p?: { name?: string; assignee?: string; activeDays?: DayOfWeek[] }) => string;
  updateCalendarMeta: (id: string, p: Partial<Pick<Calendar, "name" | "assignee">>) => void;
  toggleCalendarDay: (id: string, day: DayOfWeek, enabled?: boolean) => void;
  removeCalendar: (id: string) => void;

  // Scope range
  addTimeSlot: (id: string, day: DayOfWeek, range: TimeRange) => { ok: true } | { ok: false; reason: string };
  removeTimeSlot: (id: string, day: DayOfWeek, index: number) => void;
  clearDaySlots: (id: string, day: DayOfWeek) => void;

  // Persistence
  resetAll: () => void;
  importFromJSON: (json: string) => void;
  exportToJSON: () => string;
}

const ModerationContext = createContext<ModerationContextValue | undefined>(undefined);

export const ModerationProvider: React.FC<{
  children: React.ReactNode;
  storageKey?: string;
  autoPersist?: boolean;
}> = ({ children, storageKey = STORAGE_KEY_FALLBACK, autoPersist = true }) => {
  const [data, setData] = useState<ModerationCampaign>(() => {
    if (typeof window === "undefined") return DEFAULT_CAMPAIGN;
    const raw = window.localStorage.getItem(storageKey);
    return raw ? reviveFromPersist(raw) : DEFAULT_CAMPAIGN;
  });

  useEffect(() => {
    if (!autoPersist || typeof window === "undefined") return;
    try {
      const persistable = sanitizeForPersist(data);
      window.localStorage.setItem(storageKey, JSON.stringify(persistable));
    } catch {
      console.error("Failed to persist ModerationContext data", data);
    }
  }, [data, autoPersist, storageKey]);

  const setCampaignId = useCallback<ModerationContextValue["setCampaignId"]>((id) => {
    setData((prev) => ({ ...prev, campaignId: id }));
  }, []);

  // ---------- Basics
  const setBasics = useCallback<ModerationContextValue["setBasics"]>((p) => {
    setData((prev) => ({ ...prev, ...p }));
  }, []);

  // ---------- Audience
  const setAudience = useCallback<ModerationContextValue["setAudience"]>((p) => {
    setData((prev) => ({ ...prev, audience: { ...prev.audience, ...p } }));
  }, []);

  const setGeo = useCallback<ModerationContextValue["setGeo"]>((p) => {
    setData((prev) => ({
      ...prev,
      audience: { ...prev.audience, geo: { ...prev.audience.geo, ...p } },
    }));
  }, []);

  const setDemographic = useCallback<ModerationContextValue["setDemographic"]>((p) => {
    setData((prev) => ({
      ...prev,
      audience: {
        ...prev.audience,
        demographic: { ...prev.audience.demographic, ...p },
      },
    }));
  }, []);

  // ---------- Tone & Dates & Channels
  const setTone = useCallback<ModerationContextValue["setTone"]>((tone, customTone) => {
    setData((prev) => ({ ...prev, tone, customTone: tone === "other" ? (customTone ?? prev.customTone ?? "") : "" }));
  }, []);

  const setDates = useCallback<ModerationContextValue["setDates"]>((start, end) => {
    const s = toISO(start);
    const e = toISO(end);
    if (s && e) {
      const sd = new Date(s).getTime();
      const ed = new Date(e).getTime();
      if (sd > ed) {
        setData((prev) => ({ ...prev, dates: { start: e, end: s } }));
        return;
      }
    }
    setData((prev) => ({ ...prev, dates: { start: s, end: e } }));
  }, []);

  const addChannel = useCallback<ModerationContextValue["addChannel"]>((c) => {
    setData((prev) => (prev.channels.includes(c) ? prev : { ...prev, channels: [...prev.channels, c] }));
  }, []);

  const removeChannel = useCallback<ModerationContextValue["removeChannel"]>((c) => {
    setData((prev) => ({ ...prev, channels: prev.channels.filter((x) => x !== c) }));
  }, []);

  const setChannels = useCallback<ModerationContextValue["setChannels"]>((c) => {
    const sanitized = Array.from(new Set(c.filter((x): x is Channel => CHANNELS.includes(x as Channel))));
    setData((prev) => ({ ...prev, channels: sanitized }));
  }, []);

  // ---------- Assistant
  const setAssistant = useCallback<ModerationContextValue["setAssistant"]>((p) => {
    setData((prev) => ({ ...prev, assistant: { ...prev.assistant, ...p } }));
  }, []);

  const setVoiceFile = useCallback<ModerationContextValue["setVoiceFile"]>((file) => {
    setData((prev) => ({ ...prev, assistant: { ...prev.assistant, voiceFile: file ?? null } }));
  }, []);

  // ---------- KnowHow (Q&A)
  const addQA = useCallback<ModerationContextValue["addQA"]>((q) => {
    const item: QA = { id: genId(), question: q.question || "", answer: q.answer || "" };
    setData((prev) => ({ ...prev, knowHow: [...prev.knowHow, item] }));
  }, []);

  const updateQA = useCallback<ModerationContextValue["updateQA"]>((id, p) => {
    setData((prev) => ({
      ...prev,
      knowHow: prev.knowHow.map((item) => (item.id === id ? { ...item, ...p, id: item.id } : item)),
    }));
  }, []);

  const removeQA = useCallback<ModerationContextValue["removeQA"]>((id) => {
    setData((prev) => ({ ...prev, knowHow: prev.knowHow.filter((x) => x.id !== id) }));
  }, []);

  const clearQA = useCallback<ModerationContextValue["clearQA"]>(() => {
    setData((prev) => ({ ...prev, knowHow: [] }));
  }, []);

  // ---------- Scope & Escalation
  const setAllowedTopics = useCallback<ModerationContextValue["setAllowedTopics"]>((topics) => {
    setData((prev) => ({ ...prev, allowedTopics: topics.filter(Boolean).map((t) => t.trim()) }));
  }, []);

  const setEscalationItems = useCallback<ModerationContextValue["setEscalationItems"]>((items) => {
    setData((prev) => ({ ...prev, escalationItems: items.filter(Boolean).map((t) => t.trim()) }));
  }, []);

  const setEscalationPhone = useCallback<ModerationContextValue["setEscalationPhone"]>((phone) => {
    setData((prev) => ({ ...prev, escalationPhone: phone ?? "" }));
  }, []);

  // ---------- Calendar

  const setCalendarsEnabled = React.useCallback<ModerationContextValue["setCalendarsEnabled"]>((v) => {
    setData((prev) => ({ ...prev, calendarsEnabled: !!v }));
  }, []);

    const setCalendars = React.useCallback<ModerationContextValue["setCalendars"]>((calendars) => {
    // reutilizamos reviveCalendars para sanear estructura por si el backend no viene 100% alineado
    const sane = reviveCalendars(calendars as any);
    setData((prev) => ({ ...prev, calendars: sane }));
  }, []);

  const addTimeSlotsBulk = React.useCallback<ModerationContextValue["addTimeSlotsBulk"]>((id, days, range, stepMinutes) => {
    // Validaciones básicas
    const s = parseHHMM(range.start);
    const e = parseHHMM(range.end);
    if (s === null || e === null || s >= e) {
      return { ok: false as const, reason: "Rango inválido. Usa HH:MM y asegurate que inicio < fin." };
    }
    if (!Number.isFinite(stepMinutes) || stepMinutes < 5 || stepMinutes > 240) {
      return { ok: false as const, reason: "Duración inválida. Usa entre 5 y 240 minutos." };
    }

    // Preconstruir las franjas base
    const generated: TimeRange[] = [];
    for (let cur = s; cur + stepMinutes <= e; cur += stepMinutes) {
      const ss = cur;
      const ee = cur + stepMinutes;
      const fmt = (mins: number) => {
        const h = Math.floor(mins / 60).toString().padStart(2, "0");
        const m = (mins % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
      };
      generated.push({ start: fmt(ss), end: fmt(ee) });
    }
    if (!generated.length) {
      return { ok: false as const, reason: "El rango es demasiado corto para la duración elegida." };
    }

    let addedCount = 0;
    setData((prev) => {
      const calendars = prev.calendars.map((c) => {
        if (c.id !== id) return c;

        const nextSlots = { ...c.slots };
        days.forEach((d) => {
          const base = Array.isArray(nextSlots[d]) ? [...nextSlots[d]] : [];
          // Agregar solo los que no se solapan
          generated.forEach((cand) => {
            if (!hasOverlap(base, cand)) {
              base.push(cand);
              addedCount++;
            }
          });
          // Ordenar
          base.sort((a, b) => (parseHHMM(a.start)! - parseHHMM(b.start)!));
          nextSlots[d] = base;
        });

        return { ...c, slots: nextSlots };
      });

      return { ...prev, calendars };
    });

    return { ok: true as const, added: addedCount };
  }, []);

  const createCalendar = React.useCallback<ModerationContextValue["createCalendar"]>((p) => {
    const id = genCalId();
    const cal: Calendar = {
      id,
      name: p?.name ?? "",
      assignee: p?.assignee ?? "",
      activeDays: p?.activeDays?.filter((d): d is DayOfWeek => DAYS_ORDER.includes(d as DayOfWeek)) ?? [],
      slots: JSON.parse(JSON.stringify(EMPTY_SLOTS)),
    };
    setData((prev) => ({ ...prev, calendars: [...prev.calendars, cal] }));
    return id;
  }, []);

  const updateCalendarMeta = React.useCallback<ModerationContextValue["updateCalendarMeta"]>((id, p) => {
    setData((prev) => ({
      ...prev,
      calendars: prev.calendars.map((c) => (c.id === id ? { ...c, ...p } : c)),
    }));
  }, []);

  const toggleCalendarDay = React.useCallback<ModerationContextValue["toggleCalendarDay"]>((id, day, enabled) => {
    setData((prev) => ({
      ...prev,
      calendars: prev.calendars.map((c) => {
        if (c.id !== id) return c;
        const isActive = c.activeDays.includes(day);
        const nextActive =
          enabled === undefined
            ? (isActive ? c.activeDays.filter((d) => d !== day) : [...c.activeDays, day])
            : (enabled ? (isActive ? c.activeDays : [...c.activeDays, day]) : c.activeDays.filter((d) => d !== day));

        return { ...c, activeDays: nextActive };
      }),
    }));
  }, []);

  const removeCalendar = React.useCallback<ModerationContextValue["removeCalendar"]>((id) => {
    setData((prev) => ({ ...prev, calendars: prev.calendars.filter((c) => c.id !== id) }));
  }, []);

  // ---------- Time slots
  const addTimeSlot = React.useCallback<ModerationContextValue["addTimeSlot"]>((id, day, range) => {
    if (!isValidRange(range)) {
      return { ok: false as const, reason: "Rango inválido. Usa HH:MM y asegurate que inicio < fin." };
    }
    setData((prev) => {
      const calendars = prev.calendars.map((c) => {
        if (c.id !== id) return c;
        const list = c.slots[day] ?? [];
        if (hasOverlap(list, range)) {
          // no aplicar cambios
          return c;
        }
        const next = [...list, range].sort((a, b) => (parseHHMM(a.start)! - parseHHMM(b.start)!));
        return { ...c, slots: { ...c.slots, [day]: next } };
      });
      return { ...prev, calendars };
    });

    return { ok: true as const };
  }, []);

  const removeTimeSlot = React.useCallback<ModerationContextValue["removeTimeSlot"]>((id, day, index) => {
    setData((prev) => ({
      ...prev,
      calendars: prev.calendars.map((c) => {
        if (c.id !== id) return c;
        const next = (c.slots[day] ?? []).filter((_, i) => i !== index);
        return { ...c, slots: { ...c.slots, [day]: next } };
      }),
    }));
  }, []);

  const clearDaySlots = React.useCallback<ModerationContextValue["clearDaySlots"]>((id, day) => {
    setData((prev) => ({
      ...prev,
      calendars: prev.calendars.map((c) => (c.id === id ? { ...c, slots: { ...c.slots, [day]: [] } } : c)),
    }));
  }, []);

  // ---------- Persistence helpers
  const resetAll = useCallback<ModerationContextValue["resetAll"]>(() => {
    setData(DEFAULT_CAMPAIGN);
  }, []);

  const importFromJSON = useCallback<ModerationContextValue["importFromJSON"]>((json) => {
    const revived = reviveFromPersist(json);
    setData(revived);
  }, []);

  const exportToJSON = useCallback<ModerationContextValue["exportToJSON"]>(() => {
    const persistable = sanitizeForPersist(data);
    return JSON.stringify(persistable, null, 2);
  }, [data]);

  const value = useMemo<ModerationContextValue>(() => ({
    data,
    setBasics,
    setAudience,
    setGeo,
    setDemographic,
    setTone,
    setDates,
    addChannel,
    removeChannel,
    setChannels,
    setAssistant,
    setVoiceFile,
    addQA,
    updateQA,
    removeQA,
    clearQA,
    setAllowedTopics,
    setEscalationItems,
    setEscalationPhone,
    setCalendarsEnabled,
    setCalendars,
    addTimeSlotsBulk,
    createCalendar,
    updateCalendarMeta,
    toggleCalendarDay,
    removeCalendar,
    addTimeSlot,
    removeTimeSlot,
    clearDaySlots,
    resetAll,
    importFromJSON,
    exportToJSON,
    setCampaignId
  }), [
    data,
    setBasics,
    setAudience,
    setGeo,
    setDemographic,
    setTone,
    setDates,
    addChannel,
    removeChannel,
    setChannels,
    setAssistant,
    setVoiceFile,
    addQA,
    updateQA,
    removeQA,
    clearQA,
    setAllowedTopics,
    setEscalationItems,
    setEscalationPhone,
    setCalendarsEnabled,
    setCalendars,
    addTimeSlotsBulk,
    createCalendar,
    updateCalendarMeta,
    toggleCalendarDay,
    removeCalendar,
    addTimeSlot,
    removeTimeSlot,
    clearDaySlots,
    resetAll,
    importFromJSON,
    exportToJSON,
    setCampaignId
  ]);

  return <ModerationContext.Provider value={value}>{children}</ModerationContext.Provider>;
};

// ==========================
// Hook
// ==========================
export function useModeration(): ModerationContextValue {
  const ctx = useContext(ModerationContext);
  if (!ctx) throw new Error("useModeration must be used within a ModerationProvider");
  return ctx;
}

// ==========================
// Convenience Selectors (optional)
// ==========================
export const selectors = {
  isToneOther: (data: ModerationCampaign) => data.tone === "other",
  hasChannels: (data: ModerationCampaign) => data.channels.length > 0,
  hasVoice: (data: ModerationCampaign) => Boolean(data.assistant.voiceFile || data.assistant.voiceUrl),
};

// ==========================
// Example usage (for reference):
//
// <ModerationProvider>
//   <YourWizard />
// </ModerationProvider>
//
// const { data, setBasics, setGeo, addQA, setVoiceFile, exportToJSON } = useModeration();
// setBasics({ name: "Moderation v1", goal: "Reduce spam", summary: "Q3 roll-out" });
// setGeo({ country: "AR", city: "Tucumán" });
// addQA({ question: "What is spam?", answer: "Unwanted content." });
// const json = exportToJSON();
// ==========================
