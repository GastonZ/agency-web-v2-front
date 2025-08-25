import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// ==========================
// Types & Option Constants
// ==========================
export type AgeGroup = "kids" | "youth" | "adults";
export const AGE_GROUPS: AgeGroup[] = ["kids", "youth", "adults"]; // (niños, jóvenes, adultos)

export type Gender = "M" | "F" | "all";
export const GENDERS: Gender[] = ["M", "F", "all"];

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

// ==========================
// Core Data Shapes
// ==========================
export interface GeoSeg {
  country?: string; // País
  region?: string;  // Región/Provincia/Estado
  countryId?: string;
  stateId?: string;
  countryCode?: string;
  regionCode?: string;
  city?: string;    // Ciudad
  postalCode?: string; // Código postal
}

export interface DemoSeg {
  ageGroups: AgeGroup[];          // Demográfico: edad (múltiple)
  gender: Gender;                 // Demográfico: género
  socioeconomic: SocioEconomic[]; // Demográfico: nivel socioeconómico (múltiple)
}

export interface Audience {
  geo: GeoSeg;            // Segmentación geográfica
  demographic: DemoSeg;   // Segmentación demográfica
  cultural?: string;      // Segmentación cultural (texto libre)
}

export interface QA {
  id: string;            // generado en cliente para manejo de listas
  question: string;
  answer: string;
}

export interface AssistantConfig {
  name: string;                 // Nombre del asistente
  greeting: string;             // Saludo inicial
  conversationLogic: string;    // Lógica de conversación
  voiceFile?: File | null;      // Archivo de voz subido/grabado (opcional, no persistente)
  voiceUrl?: string | null;     // URL del archivo de voz ya alojado (opcional, persistente)
}

export interface CampaignDates {
  start?: string; // ISO string
  end?: string;   // ISO string
}

export interface ModerationCampaign {
  // Basics
  name: string;           // "Nombre de la campaña"
  goal: string;           // "Objetivo principal"
  summary: string;        // "Descripción breve"
  leadDefinition: string; // "definición de lead"

  // Audience
  audience: Audience;     // Público objetivo

  // Tone & Channels & Schedule
  tone: ToneOption;       // Tono de comunicación (enum)
  customTone?: string;    // Si tone === "other"
  dates: CampaignDates;   // Fechas de inicio y fin
  channels: Channel[];    // Canales múltiples

  // Assistant
  assistant: AssistantConfig;

  // Knowledge & Scope
  knowHow: QA[];          // Q&A list
  allowedTopics: string[];    // "Responder únicamente consultas relacionadas a" (opcional, múltiples)

  // Escalation
  escalationItems: string[];  // Pasos/ítems para escalamiento humano (opcional)
  escalationPhone?: string;   // +NN NNNNNNNNN formato internacional (opcional)

  // Versioning for persistence/migrations if needed
  __version: number;
}

// ==========================
// Defaults
// ==========================
export const DEFAULT_CAMPAIGN: ModerationCampaign = {
  name: "",
  goal: "",
  summary: "",
  leadDefinition: "",
  audience: {
    geo: { country: "", region: "", city: "", postalCode: "" },
    demographic: { ageGroups: [], gender: "all", socioeconomic: [] },
    cultural: "",
  },
  tone: "informal",
  customTone: "",
  dates: { start: undefined, end: undefined },
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
      dates: { ...base.dates, ...(parsed?.dates ?? {}) },
      assistant: {
        ...base.assistant,
        ...(parsed?.assistant ?? {}),
        voiceFile: null,
      },
      knowHow: Array.isArray(parsed?.knowHow) ? parsed.knowHow : base.knowHow,
      channels: Array.isArray(parsed?.channels) ? parsed.channels : base.channels,
      allowedTopics: Array.isArray(parsed?.allowedTopics) ? parsed.allowedTopics : base.allowedTopics,
      escalationItems: Array.isArray(parsed?.escalationItems) ? parsed.escalationItems : base.escalationItems,
    };
    return merged;
  } catch {
    return base;
  }
}

// ==========================
// Context
// ==========================
interface ModerationContextValue {
  data: ModerationCampaign;
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
    // If both present, ensure start <= end; otherwise keep as-is
    if (s && e) {
      const sd = new Date(s).getTime();
      const ed = new Date(e).getTime();
      if (sd > ed) {
        // swap to be forgiving
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
    // Deduplicate and keep valid only
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
    resetAll,
    importFromJSON,
    exportToJSON,
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
    resetAll,
    importFromJSON,
    exportToJSON,
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
  hasDates: (data: ModerationCampaign) => Boolean(data.dates.start || data.dates.end),
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
