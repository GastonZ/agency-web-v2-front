import api from "./api/api";
import type { AxiosResponse } from "axios";

/** ===== Types you can expand later ===== */
export type ModerationCampaignCreateResponse = { id: string };
export type ModerationCampaignUpdateResponse = { id: string };

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

/** ===== Mappers from context data → API shape ===== */

function mapAgeGroups(ageGroups: string[] | undefined) {
  if (!ageGroups || ageGroups.length === 0) return undefined;
  return ageGroups.map((a) =>
    a === "kids" ? "niños" : a === "youth" ? "jóvenes" : "adultos"
  );
}

function mapGender(g?: string) {
  if (!g) return undefined;
  return g === "male" ? "M" : g === "F" ? "female" : "todos";
}

function mapNSE(nse?: string[]) {
  if (!nse || nse.length === 0) return undefined;
  return nse.map((v) => (v === "high" ? "alta" : v === "middle" ? "media" : "baja"));
}

function mapTone(tone?: string, customTone?: string) {
  if (!tone) return undefined;
  if (tone === "other") return customTone?.trim() || undefined;

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

/* dto for create and edit moderation step 1 */

type StepOneCtx = {
  name?: string;
  goal?: string;          // → objective
  summary?: string;       // → description
  leadDefinition?: string;
  audience: {
    geo: {
      country?: string;
      countryCode?: string;
      region?: string;
      regionCode?: string;
      city?: string;
      postalCode?: string;
    };
    demographic: {
      ageGroups: string[];
      gender?: string;
      socioeconomic: string[];
    };
    cultural?: string;
  };
  tone?: string;
  customTone?: string;
  dates: { start?: string; end?: string };
};

// ---- shared
function buildStepOnePayload(ctxData: StepOneCtx, opts?: { includeUserId?: boolean }) {
  const userId = getUserId();
  return prune({
    ...(opts?.includeUserId ? { userId } : {}),
    name: ctxData.name,
    objective: ctxData.goal,
    description: ctxData.summary,
    leadDefinition: ctxData.leadDefinition,
    audience: {
      geo: [
        {
          countryId: ctxData.audience.geo.countryCode,
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
  });
}

/** ====== PUBLIC API ====== */

export async function createModerationCampaignFromStepOne(ctxData: StepOneCtx) {
  const payload = buildStepOnePayload(ctxData, { includeUserId: true });
  const res: AxiosResponse<ModerationCampaignCreateResponse> = await api.post(
    "moderation-campaigns",
    payload
  );
  return res.data;
}

// ---- update (PUT) — same schema as POST
export async function updateModerationCampaignFromStepOne(campaignId: string, ctxData: StepOneCtx) {
  const payload = buildStepOnePayload(ctxData, { includeUserId: false });
  const res: AxiosResponse<ModerationCampaignUpdateResponse> = await api.put(
    `moderation-campaigns/${campaignId}`,
    payload
  );
  return res.data;
}

/* =========================================================
 * STEP 2: Channels → PUT moderation-campaigns/{id}/channels
 * ======================================================= */
export async function updateCampaignChannels(
  campaignId: string,
  channels: Array<"instagram" | "facebook" | "whatsapp" | "email" | "x">
) {
  const payload = prune({ channels });
  const res: AxiosResponse<{ id: string }> = await api.put(
    `moderation-campaigns/${campaignId}/channels`,
    payload
  );
  return res.data; // { id }
}

/* =========================================================
 * STEP 3: Assistant settings → PUT moderation-campaigns/{id}/assistant-settings
 * ======================================================= */

export type AssistantSettingsPayload = {
  assistantName?: string;
  greeting?: string;
  conversationLogic?: string;
  voiceConfig?: string; // e.g., "{\"voice\":\"es-AR-Standard-A\"}"
  knowHow?: Array<{ question: string; answer: string }>;
  respondOnlyRelatedTo?: string; // API expects a single string
  humanEscalation?: string[];    // array of items
  escalationContactNumber?: string; // "+NN NNNNNNNNN"
};

/** From your context → API payload mapper for Step 3 */
export function mapAssistantSettingsFromContext(data: {
  assistant: {
    name?: string;
    greeting?: string;
    conversationLogic?: string;
    voiceUrl?: string | null; // if you want to encode it into voiceConfig
  };
  knowHow: Array<{ question: string; answer: string }>;
  allowedTopics: string[];   // we will join to a single string
  escalationItems: string[];
  escalationPhone?: string;
}): AssistantSettingsPayload {
  // You mentioned voiceConfig is a JSON string. Use voiceUrl as an example source.
  const voiceConfig =
    data.assistant?.voiceUrl
      ? JSON.stringify({ voiceUrl: data.assistant.voiceUrl })
      : undefined;

  return prune({
    assistantName: data.assistant?.name || undefined,
    greeting: data.assistant?.greeting || undefined,
    conversationLogic: data.assistant?.conversationLogic || undefined,
    voiceConfig,
    knowHow: (data.knowHow || []).map(({ question, answer }) => ({ question, answer })),
    respondOnlyRelatedTo:
      (data.allowedTopics || []).length ? data.allowedTopics.join(", ") : undefined,
    humanEscalation: (data.escalationItems || []).length ? data.escalationItems : undefined,
    escalationContactNumber: data.escalationPhone || undefined,
  });
}

export async function updateAssistantSettings(
  campaignId: string,
  payload: AssistantSettingsPayload
) {
  const res: AxiosResponse<{ id: string }> = await api.put(
    `moderation-campaigns/${campaignId}/assistant-settings`,
    prune(payload)
  );
  return res.data; // { id }
}