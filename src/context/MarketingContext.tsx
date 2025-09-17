import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { InfluencerType } from "../features/MarketingCampaign/steps/StepThree";

/** ==========================
 * Tipos & constantes
 * ========================== */

export type Channel = "instagram" | "facebook" | "whatsapp" | "email" | "x";
export const CHANNELS: Channel[] = ["instagram", "facebook", "whatsapp", "email", "x"];

export const CampaignTypes = {
  VENTA: "venta",
  DIFUSION: "difusion",
  ENCUESTA: "encuesta",
  CAPACITACION: "capacitacion",
} as const;
export type CampaignType = typeof CampaignTypes[keyof typeof CampaignTypes];

export type BusinessType = "B2C" | "B2B";

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

/** Días para Publishing Schedule (formato corto, igual que tu ejemplo de payload) */
export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export const DAYS_ORDER: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export interface TimeRange {
  /** "HH:MM" 24h */
  start: string;
  /** "HH:MM" 24h */
  end: string;
}

/** Paso 1 */
export interface MarketingAudience {
  /** Solo ids + city (como acordamos) */
  geo: {
    countryId?: string;
    stateId?: string;
    city?: string;
  };
  /** Lo guardamos como `cultural` y después mapeamos a `culturalInterests` en el payload */
  cultural?: string;
}

export interface MarketingBasics {
  name: string;
  campaignType: CampaignType;
  businessType: BusinessType;
  objective: string;
  mainMessage: string;
  description: string;
  leadDefinition: string;
}

/** Paso 2 */
export type ContentType = "imagenes" | "videos" | "podcasts" | "carruseles";

export interface PublishingSchedule {
  /** Días activos (ej: ["mon","wed","fri"]) */
  activeDays: DayOfWeek[];
  /** Slots por día (ej: { mon: [{start:"09:00",end:"10:00"}], ... }) */
  timeSlots: Record<DayOfWeek, TimeRange[]>;
  /** (Opcional para la UI) */
  timezone?: string;
}

export interface MarketingContent {
  topics: string[];
  contentTypes: ContentType[];
  /** URLs (el backend te las provee; acá solo las guardamos) */
  referenceImages: string[];
  persistedImages: string[];
  publishingSchedule: PublishingSchedule;
}

/** Estructura principal del Context (pasos 1 y 2) */
export interface MarketingCampaign {
  campaignId?: string;

  influencerType: "own_account" | "catalog" | "virtual_ai";
  selectedInfluencerId: string | null;
  influencerSelectionNotes: string;

  // Paso 1
  basics: MarketingBasics;
  audience: MarketingAudience;
  tone: ToneOption;
  customTone?: string;
  channels: Channel[];

  // Paso 2
  content: MarketingContent;

  channelsContacts: {
    platforms: Channel[];               // ["instagram","facebook","whatsapp","email","x"]
    connectedSocialAccounts: string[];  // ["@mi_empresa_instagram", ...]
    minFollowers: number;               // 1000
    advertisingBudget: number;          // 2000..20000
    referenceDocuments: string[];       // fileName[] ya subidos
  };

  __version: number;
}

/** ==========================
 * Defaults
 * ========================== */

const EMPTY_SLOTS: Record<DayOfWeek, TimeRange[]> = DAYS_ORDER.reduce((acc, d) => {
  acc[d] = [];
  return acc;
}, {} as Record<DayOfWeek, TimeRange[]>);

export const DEFAULT_CAMPAIGN: MarketingCampaign = {
  campaignId: undefined,
  influencerType: "own_account",
  selectedInfluencerId: null,
  influencerSelectionNotes: "",
  basics: {
    name: "",
    campaignType: CampaignTypes.VENTA,
    businessType: "B2C",
    objective: "",
    mainMessage: "",
    description: "",
    leadDefinition: "",
  },
  audience: {
    geo: { countryId: "", stateId: "", city: "" },
    cultural: "",
  },
  tone: "informal",
  customTone: "",
  channels: [],
  content: {
    topics: [],
    contentTypes: [],
    referenceImages: [],
    persistedImages: [],
    publishingSchedule: {
      activeDays: [],
      timeSlots: JSON.parse(JSON.stringify(EMPTY_SLOTS)),
      timezone:
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "America/Argentina/Buenos_Aires",
    },
  },
  channelsContacts: {
    platforms: [],
    connectedSocialAccounts: [],
    minFollowers: 0,
    advertisingBudget: 2000,
    referenceDocuments: [],
  },
  __version: 1,
};

/** ==========================
 * Helpers
 * ========================== */

const STORAGE_KEY_FALLBACK = "marketingCampaignCtx";

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

function reviveFromPersist(raw: any): MarketingCampaign {
  const base = { ...DEFAULT_CAMPAIGN };
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    // sanea schedule
    const schedRaw = parsed?.content?.publishingSchedule ?? {};
    const timeSlotsRaw = schedRaw?.timeSlots ?? {};
    const timeSlots: Record<DayOfWeek, TimeRange[]> = DAYS_ORDER.reduce((acc, d) => {
      const list = Array.isArray(timeSlotsRaw[d]) ? timeSlotsRaw[d] : [];
      acc[d] = list
        .filter((r: any) => r && typeof r.start === "string" && typeof r.end === "string" && isValidRange(r))
        .sort((a: TimeRange, b: TimeRange) => (parseHHMM(a.start)! - parseHHMM(b.start)!));
      return acc;
    }, {} as Record<DayOfWeek, TimeRange[]>);

    const activeDays: DayOfWeek[] = Array.isArray(schedRaw?.activeDays)
      ? schedRaw.activeDays.filter((d: any): d is DayOfWeek => DAYS_ORDER.includes(d))
      : [];

    const merged: MarketingCampaign = {
      ...base,
      ...parsed,
      basics: { ...base.basics, ...(parsed?.basics ?? {}) },
      audience: {
        ...base.audience,
        ...(parsed?.audience ?? {}),
        geo: { ...base.audience.geo, ...(parsed?.audience?.geo ?? {}) },
      },
      channels: Array.isArray(parsed?.channels)
        ? parsed.channels.filter((x: any): x is Channel => CHANNELS.includes(x))
        : base.channels,
      content: {
        topics: Array.isArray(parsed?.content?.topics) ? parsed.content.topics : base.content.topics,
        contentTypes: Array.isArray(parsed?.content?.contentTypes)
          ? parsed.content.contentTypes
          : base.content.contentTypes,
        referenceImages: Array.isArray(parsed?.content?.referenceImages)
          ? parsed.content.referenceImages
          : base.content.referenceImages,
        publishingSchedule: {
          activeDays,
          timeSlots,
          timezone: typeof schedRaw?.timezone === "string" && schedRaw.timezone ? schedRaw.timezone : base.content.publishingSchedule.timezone,
        },
      },
      tone: (parsed?.tone as ToneOption) || base.tone,
      customTone: typeof parsed?.customTone === "string" ? parsed.customTone : base.customTone,
    };

    return merged;
  } catch {
    return base;
  }
}

/** ==========================
 * Context
 * ========================== */

interface MarketingContextValue {
  data: MarketingCampaign;

  // id
  setCampaignId: (id: string) => void;

  // Paso 1
  setBasics: (p: Partial<MarketingBasics>) => void;
  setAudience: (p: Partial<MarketingAudience>) => void;
  setGeo: (p: Partial<MarketingAudience["geo"]>) => void;
  setTone: (tone: ToneOption, customTone?: string) => void;
  addChannel: (c: Channel) => void;
  removeChannel: (c: Channel) => void;
  setChannels: (c: Channel[]) => void;

  // Paso 2
  setTopics: (topics: string[]) => void;
  addTopic: (t: string) => void;
  removeTopic: (t: string) => void;

  setContentTypes: (types: ContentType[]) => void;
  toggleContentType: (t: ContentType) => void;

  setReferenceImages: (urls: string[]) => void;
  addReferenceImage: (url: string) => void;
  removeReferenceImage: (url: string) => void;

  setPersistedImages: (paths: string[]) => void;
  clearPendingReferenceImages: () => void;

  setInfluencerType: (t: InfluencerType) => void;
  setCatalogInfluencer: (id: string, notes: string) => void;
  
  // Paso 4

  setPlatforms: (platform: Channel[]) => void;
  addConnectedAccount: (acc: string) => void;
  removeConnectedAccount: (acc: string) => void;
  setMinFollowers: (min: number) => void;
  setAdvertisingBudget: (budget: number) => void;
  setReferenceDocuments: (docs: string[]) => void;

  setPublishingSchedule: (s: PublishingSchedule) => void;
  setTimezone: (tz: string) => void;
  toggleActiveDay: (d: DayOfWeek) => void;
  addTimeSlot: (day: DayOfWeek, range: TimeRange) => { ok: true } | { ok: false; reason: string };
  removeTimeSlot: (day: DayOfWeek, index: number) => void;
  clearDaySlots: (day: DayOfWeek) => void;

  // Persistencia
  resetAll: () => void;
  importFromJSON: (json: string) => void;
  exportToJSON: () => string;
}

const MarketingContext = createContext<MarketingContextValue | undefined>(undefined);

export const MarketingProvider: React.FC<{
  children: React.ReactNode;
  storageKey?: string;
  autoPersist?: boolean;
}> = ({ children, storageKey = STORAGE_KEY_FALLBACK, autoPersist = true }) => {
  const [data, setData] = useState<MarketingCampaign>(() => {
    if (typeof window === "undefined") return DEFAULT_CAMPAIGN;
    const raw = window.localStorage.getItem(storageKey);
    return raw ? reviveFromPersist(raw) : DEFAULT_CAMPAIGN;
  });

  useEffect(() => {
    if (!autoPersist || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      console.error("Failed to persist MarketingContext data", data);
    }
  }, [data, autoPersist, storageKey]);

  /** ---------- id */
  const setCampaignId = useCallback<MarketingContextValue["setCampaignId"]>((id) => {
    setData((prev) => ({ ...prev, campaignId: id }));
  }, []);

  /** ---------- Paso 1: basics/audience/tono/canales */
  const setBasics = useCallback<MarketingContextValue["setBasics"]>((p) => {
    setData((prev) => ({ ...prev, basics: { ...prev.basics, ...p } }));
  }, []);

  const setAudience = useCallback<MarketingContextValue["setAudience"]>((p) => {
    setData((prev) => ({ ...prev, audience: { ...prev.audience, ...p } }));
  }, []);

  const setGeo = useCallback<MarketingContextValue["setGeo"]>((p) => {
    setData((prev) => ({ ...prev, audience: { ...prev.audience, geo: { ...prev.audience.geo, ...p } } }));
  }, []);

  const setTone = useCallback<MarketingContextValue["setTone"]>((tone, customTone) => {
    setData((prev) => ({ ...prev, tone, customTone: tone === "other" ? (customTone ?? prev.customTone ?? "") : "" }));
  }, []);

  const addChannel = useCallback<MarketingContextValue["addChannel"]>((c) => {
    setData((prev) => (prev.channels.includes(c) ? prev : { ...prev, channels: [...prev.channels, c] }));
  }, []);

  const removeChannel = useCallback<MarketingContextValue["removeChannel"]>((c) => {
    setData((prev) => ({ ...prev, channels: prev.channels.filter((x) => x !== c) }));
  }, []);

  const setChannels = useCallback<MarketingContextValue["setChannels"]>((c) => {
    const sanitized = Array.from(new Set(c.filter((x): x is Channel => CHANNELS.includes(x as Channel))));
    setData((prev) => ({ ...prev, channels: sanitized }));
  }, []);

  /** ---------- Paso 2: contenido */
  const setTopics = useCallback<MarketingContextValue["setTopics"]>((topics) => {
    setData((prev) => ({ ...prev, content: { ...prev.content, topics: topics.filter(Boolean).map((t) => t.trim()) } }));
  }, []);

  const addTopic = useCallback<MarketingContextValue["addTopic"]>((t) => {
    const v = (t || "").trim();
    if (!v) return;
    setData((prev) => (prev.content.topics.includes(v) ? prev : { ...prev, content: { ...prev.content, topics: [...prev.content.topics, v] } }));
  }, []);

  const removeTopic = useCallback<MarketingContextValue["removeTopic"]>((t) => {
    setData((prev) => ({ ...prev, content: { ...prev.content, topics: prev.content.topics.filter((x) => x !== t) } }));
  }, []);

  const setContentTypes = useCallback<MarketingContextValue["setContentTypes"]>((types) => {
    const allowed: ContentType[] = ["imagenes", "videos", "podcasts", "carruseles"];
    const sanitized = Array.from(new Set(types.filter((x): x is ContentType => allowed.includes(x as ContentType))));
    setData((prev) => ({ ...prev, content: { ...prev.content, contentTypes: sanitized } }));
  }, []);

  const toggleContentType = useCallback<MarketingContextValue["toggleContentType"]>((t) => {
    setData((prev) => {
      const set = new Set(prev.content.contentTypes);
      set.has(t) ? set.delete(t) : set.add(t);
      return { ...prev, content: { ...prev.content, contentTypes: Array.from(set) as ContentType[] } };
    });
  }, []);

  const setReferenceImages = useCallback<MarketingContextValue["setReferenceImages"]>((urls) => {
    setData((prev) => ({ ...prev, content: { ...prev.content, referenceImages: urls.filter(Boolean) } }));
  }, []);

  const addReferenceImage = useCallback<MarketingContextValue["addReferenceImage"]>((url) => {
    const u = (url || "").trim();
    if (!u) return;
    setData((prev) => (prev.content.referenceImages.includes(u) ? prev : { ...prev, content: { ...prev.content, referenceImages: [...prev.content.referenceImages, u] } }));
  }, []);

  const removeReferenceImage = useCallback<MarketingContextValue["removeReferenceImage"]>((url) => {
    setData((prev) => ({ ...prev, content: { ...prev.content, referenceImages: prev.content.referenceImages.filter((x) => x !== url) } }));
  }, []);

  const setPersistedImages = useCallback<MarketingContextValue["setPersistedImages"]>((paths) => {
    setData((prev) => ({ ...prev, content: { ...prev.content, persistedImages: paths || [] } }));
  }, []);

  const setInfluencerType = useCallback((t: MarketingCampaign["influencerType"]) => {
    setData(prev => ({
      ...prev,
      influencerType: t,
      // si se cambia el tipo, des-selecciono por si venía de catálogo
      ...(t !== "catalog" ? { selectedInfluencerId: null, influencerSelectionNotes: "" } : {}),
    }));
  }, []);

  const setCatalogInfluencer = useCallback((id: string | null, notes: string = "") => {
    setData(prev => ({ ...prev, selectedInfluencerId: id, influencerSelectionNotes: notes || "" }));
  }, []);

  const clearPendingReferenceImages = useCallback<MarketingContextValue["clearPendingReferenceImages"]>(() => {
    setData((prev) => ({ ...prev, content: { ...prev.content, referenceImages: [] } }));
  }, []);

  const setPublishingSchedule = useCallback<MarketingContextValue["setPublishingSchedule"]>((s) => {
    // sanear estructura
    const activeDays = Array.isArray(s?.activeDays)
      ? s.activeDays.filter((d): d is DayOfWeek => DAYS_ORDER.includes(d as DayOfWeek))
      : [];
    const timeSlots: Record<DayOfWeek, TimeRange[]> = DAYS_ORDER.reduce((acc, d) => {
      const list = Array.isArray(s?.timeSlots?.[d]) ? s.timeSlots[d] : [];
      acc[d] = list.filter(isValidRange).sort((a, b) => (parseHHMM(a.start)! - parseHHMM(b.start)!));
      return acc;
    }, {} as Record<DayOfWeek, TimeRange[]>);
    setData((prev) => ({
      ...prev,
      content: { ...prev.content, publishingSchedule: { activeDays, timeSlots, timezone: s.timezone || prev.content.publishingSchedule.timezone } },
    }));
  }, []);

  const setTimezone = useCallback<MarketingContextValue["setTimezone"]>((tz) => {
    setData((prev) => ({
      ...prev,
      content: { ...prev.content, publishingSchedule: { ...prev.content.publishingSchedule, timezone: tz } },
    }));
  }, []);

  const toggleActiveDay = useCallback<MarketingContextValue["toggleActiveDay"]>((d) => {
    setData((prev) => {
      const active = prev.content.publishingSchedule.activeDays;
      const next = active.includes(d) ? active.filter((x) => x !== d) : [...active, d];
      return { ...prev, content: { ...prev.content, publishingSchedule: { ...prev.content.publishingSchedule, activeDays: next } } };
    });
  }, []);

  const addTimeSlot = useCallback<MarketingContextValue["addTimeSlot"]>((day, range) => {
    if (!isValidRange(range)) {
      return { ok: false as const, reason: "Rango inválido. Usa HH:MM y asegurate que inicio < fin." };
    }
    setData((prev) => {
      const ps = prev.content.publishingSchedule;
      const base = Array.isArray(ps.timeSlots[day]) ? [...ps.timeSlots[day]] : [];
      // no solapar
      if (base.some((r) => rangesOverlap(r, range))) return prev;
      const next = [...base, range].sort((a, b) => (parseHHMM(a.start)! - parseHHMM(b.start)!));
      return {
        ...prev,
        content: { ...prev.content, publishingSchedule: { ...ps, timeSlots: { ...ps.timeSlots, [day]: next } } },
      };
    });
    return { ok: true as const };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeTimeSlot = useCallback<MarketingContextValue["removeTimeSlot"]>((day, index) => {
    setData((prev) => {
      const ps = prev.content.publishingSchedule;
      const next = (ps.timeSlots[day] ?? []).filter((_, i) => i !== index);
      return { ...prev, content: { ...prev.content, publishingSchedule: { ...ps, timeSlots: { ...ps.timeSlots, [day]: next } } } };
    });
  }, []);

  const clearDaySlots = useCallback<MarketingContextValue["clearDaySlots"]>((day) => {
    setData((prev) => {
      const ps = prev.content.publishingSchedule;
      return { ...prev, content: { ...prev.content, publishingSchedule: { ...ps, timeSlots: { ...ps.timeSlots, [day]: [] } } } };
    });
  }, []);

  /* Paso 4 */

  const setPlatforms = React.useCallback((arr: Channel[]) => {
    setData(prev => ({ ...prev, channelsContacts: { ...prev.channelsContacts, platforms: arr || [] } }));
  }, []);

  // Connected accounts
  const addConnectedAccount = React.useCallback((acc: string) => {
    const norm = (acc || "").trim();
    if (!norm) return;
    const normalized = norm.startsWith("@") ? norm : `@${norm}`;
    setData(prev => {
      if (prev.channelsContacts.connectedSocialAccounts.includes(normalized)) return prev;
      return {
        ...prev,
        channelsContacts: {
          ...prev.channelsContacts,
          connectedSocialAccounts: [...prev.channelsContacts.connectedSocialAccounts, normalized],
        },
      };
    });
  }, []);

  const removeConnectedAccount = React.useCallback((acc: string) => {
    setData(prev => ({
      ...prev,
      channelsContacts: {
        ...prev.channelsContacts,
        connectedSocialAccounts: prev.channelsContacts.connectedSocialAccounts.filter(a => a !== acc),
      },
    }));
  }, []);

  // Min followers
  const setMinFollowers = React.useCallback((n: number) => {
    const safe = Math.max(0, Math.floor(n || 0));
    setData(prev => ({ ...prev, channelsContacts: { ...prev.channelsContacts, minFollowers: safe } }));
  }, []);

  // Budget
  const setAdvertisingBudget = React.useCallback((n: number) => {
    setData(prev => ({ ...prev, channelsContacts: { ...prev.channelsContacts, advertisingBudget: n } }));
  }, []);

  // Reference docs (fileName[])
  const setReferenceDocuments = React.useCallback((names: string[]) => {
    setData(prev => ({
      ...prev,
      channelsContacts: { ...prev.channelsContacts, referenceDocuments: Array.from(new Set(names)).filter(Boolean) },
    }));
  }, []);

  const addReferenceDocuments = React.useCallback((names: string[]) => {
    setData(prev => ({
      ...prev,
      channelsContacts: {
        ...prev.channelsContacts,
        referenceDocuments: Array.from(new Set([...(prev.channelsContacts.referenceDocuments || []), ...(names || [])])),
      },
    }));
  }, []);

  /** ---------- Persistencia */
  const resetAll = useCallback<MarketingContextValue["resetAll"]>(() => {
    setData(DEFAULT_CAMPAIGN);
  }, []);

  const importFromJSON = useCallback<MarketingContextValue["importFromJSON"]>((json) => {
    const revived = reviveFromPersist(json);
    setData(revived);
  }, []);

  const exportToJSON = useCallback<MarketingContextValue["exportToJSON"]>(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const value = useMemo<MarketingContextValue>(() => ({
    data,

    setCampaignId,

    // Paso 1
    setBasics,
    setAudience,
    setGeo,
    setTone,
    addChannel,
    removeChannel,
    setChannels,

    // Paso 2
    setTopics,
    addTopic,
    removeTopic,

    setContentTypes,
    toggleContentType,

    setReferenceImages,
    addReferenceImage,
    removeReferenceImage,

    setPersistedImages,
    clearPendingReferenceImages,

    setPublishingSchedule,
    setTimezone,
    toggleActiveDay,
    addTimeSlot,
    removeTimeSlot,
    clearDaySlots,

    // Paso 3 
    setInfluencerType,
    setCatalogInfluencer,

    // Paso 4

    setPlatforms,
    addConnectedAccount,
    removeConnectedAccount,
    setMinFollowers,
    setAdvertisingBudget,
    setReferenceDocuments,
    addReferenceDocuments,

    // persist
    resetAll,
    importFromJSON,
    exportToJSON,
  }), [
    data,
    setCampaignId,
    setBasics,
    setAudience,
    setGeo,
    setTone,
    addChannel,
    removeChannel,
    setChannels,
    setTopics,
    addTopic,
    removeTopic,
    setContentTypes,
    toggleContentType,
    setReferenceImages,
    addReferenceImage,
    removeReferenceImage,
    setPersistedImages,
    setInfluencerType,
    setCatalogInfluencer,
    clearPendingReferenceImages,
    setPlatforms,
    addConnectedAccount,
    removeConnectedAccount,
    setMinFollowers,
    setAdvertisingBudget,
    setReferenceDocuments,
    addReferenceDocuments,
    setPublishingSchedule,
    setTimezone,
    toggleActiveDay,
    addTimeSlot,
    removeTimeSlot,
    clearDaySlots,
    resetAll,
    importFromJSON,
    exportToJSON
  ]);

  return <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>;
};

/** ==========================
 * Hook
 * ========================== */
export function useMarketing(): MarketingContextValue {
  const ctx = useContext(MarketingContext);
  if (!ctx) throw new Error("useMarketing must be used within a MarketingProvider");
  return ctx;
}

/** ==========================
 * Selectores de conveniencia
 * ========================== */
export const selectors = {
  isToneOther: (data: MarketingCampaign) => data.tone === "other",
  hasChannels: (data: MarketingCampaign) => data.channels.length > 0,
  hasTopics: (data: MarketingCampaign) => data.content.topics.length > 0,
};
