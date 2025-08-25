import api from "./api/api";
import type { AxiosResponse } from "axios";

/** ===== Types you can expand later ===== */
export type ModerationCampaignCreateResponse = {
  id: string;
  // ...add anything your API returns
};

export type ModerationCampaignUpdateResponse = {
  id: string;
  // ...add anything your API returns
};

/** ===== Helpers ===== */

// Try localStorage first; if missing, decode JWT for userId/sub
function getUserId(): string | undefined {
  const fromLs = (typeof window !== "undefined" && localStorage.getItem("aiaUserId")) || undefined;
  if (fromLs) return fromLs;

  try {
    const token = (typeof window !== "undefined" && localStorage.getItem("aiaToken")) || undefined;
    if (!token) return undefined;
    const [, payloadB64] = token.split(".");
    const json = JSON.parse(atob(payloadB64));
    // Common claims: userId | uid | sub
    return json.userId || json.uid || json.sub;
  } catch {
    return undefined;
  }
}

// Remove undefined/empty values recursively, so we don’t send noise
function prune<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    const arr = obj.map(prune).filter((v) =>
      v === 0 || v === false ? true : Boolean(v && (typeof v !== "object" || Object.keys(v as any).length > 0))
    );
    return arr as unknown as T;
  }
  if (typeof obj === "object") {
    const out: Record<string, any> = {};
    Object.entries(obj as any).forEach(([k, v]) => {
      const pv = prune(v as any);
      if (
        pv === 0 ||
        pv === false ||
        (pv !== undefined &&
          !(typeof pv === "string" && pv.trim() === "") &&
          !(typeof pv === "object" && pv !== null && Object.keys(pv).length === 0))
      ) {
        out[k] = pv;
      }
    });
    return out as T;
  }
  return obj;
}

/** ===== Mappers from your context data → API shape ===== */

// Your AGE_GROUPS are 'kids' | 'youth' | 'adults' (displayed Niños/Jóvenes/Adultos)
// API expects strings like: "jóvenes", "adultos" (lowercase, with accent)
function mapAgeGroups(ageGroups: string[] | undefined) {
  if (!ageGroups || ageGroups.length === 0) return undefined;
  return ageGroups.map((a) =>
    a === "kids" ? "niños" : a === "youth" ? "jóvenes" : "adultos"
  );
}

// Your genders: 'M' | 'F' | 'A' (Todos). API wants "masculino" | "femenino" | "todos"
function mapGender(g?: string) {
  if (!g) return undefined;
  return g === "M" ? "masculino" : g === "F" ? "femenino" : "todos";
}

// NSE: 'high' | 'middle' | 'low' → "alta" | "media" | "baja"
function mapNSE(nse?: string[]) {
  if (!nse || nse.length === 0) return undefined;
  return nse.map((v) => (v === "high" ? "alta" : v === "middle" ? "media" : "baja"));
}

// Tone: use preset or custom when 'other'
function mapTone(tone?: string, customTone?: string) {
  if (!tone) return undefined;
  if (tone === "other") return customTone?.trim() || undefined;
  // already in Spanish set (formal, informal, inspiracional/persuasivo/educativo/humorístico)
  // If your constants are English, normalize here:
  const map: Record<string, string> = {
    formal: "formal",
    informal: "informal",
    inspirational: "inspiracional",
    persuasive: "persuasivo",
    educational: "educativo",
    humorous: "humorístico",
  };
  return map[tone] || tone;
}

/** ====== PUBLIC API ====== */

/**
 * Build payload from Step One context and create the campaign.
 * It’s OK if some fields are missing; they’ll be filled in later steps with update().
 */
export async function createModerationCampaignFromStepOne(ctxData: {
  // minimal shape based on your ModerationContext
  name?: string;
  goal?: string;         // → objective
  summary?: string;      // → description
  leadDefinition?: string;
  audience: {
    geo: {
      country?: string;       // name; you might add a code later
      countryCode?: string;   // e.g., 'AR' (preferred for API)
      region?: string;
      regionCode?: string;    // 'AR-C'
      city?: string;
      postalCode?: string;
    };
    demographic: {
      ageGroups: string[];
      gender?: string;        // 'M' | 'F' | 'A'
      socioeconomic: string[]; // 'high' | 'middle' | 'low'
    };
    cultural?: string;        // → culturalInterests
  };
  tone?: string;
  customTone?: string;
  dates: { start?: string; end?: string }; // ISO strings are fine
}) {
  const userId = getUserId();

  const payload = prune({
    userId,
    name: ctxData.name,
    objective: ctxData.goal,
    description: ctxData.summary,
    leadDefinition: ctxData.leadDefinition,
    audience: {
      geo: [
        {
          countryId: ctxData.audience.geo.countryCode, // if you only have names for now, leave undefined
          stateId: ctxData.audience.geo.regionCode,
          city: ctxData.audience.geo.city,
          postalCode: ctxData.audience.geo.postalCode,
        },
      ],
      demographics: {
        age: mapAgeGroups(ctxData.audience.demographic.ageGroups),
        gender: mapGender(ctxData.audience.demographic.gender),
        nse: mapNSE(ctxData.audience.demographic.socioeconomic),
      },
      culturalInterests: ctxData.audience.cultural,
    },
    communicationTone: mapTone(ctxData.tone, ctxData.customTone),
    startAt: ctxData.dates.start || undefined,
    endAt: ctxData.dates.end || undefined,
    // These are not in Step One yet; send empty or omit (we omit).
    // channels: [],
    // assistantName: undefined,
    // greeting: undefined,
    // conversationLogic: undefined,
    // voiceConfig: undefined,
    // knowHow: undefined,
    // respondOnlyRelatedTo: undefined,
    // humanEscalation: undefined,
    // escalationContactNumber: undefined,
  });

  const res: AxiosResponse<ModerationCampaignCreateResponse> = await api.post(
    "/api/moderation-campaigns",
    payload
  );
  return res.data; // expect { id, ... }
}

/** Generic update for later steps */
export async function updateModerationCampaign(
  campaignId: string,
  patch: Record<string, any>
) {
  const body = prune(patch);
  const res: AxiosResponse<ModerationCampaignUpdateResponse> = await api.put(
    `/api/moderation-campaigns/${campaignId}`,
    body
  );
  return res.data;
}
