import api from "./api/api";
import type { AxiosResponse } from "axios";
import { getUserId, mapAgeGroups, mapGender, mapNSE, prune } from '../utils/helper'
import type { ModerationCampaignCreateResponse, ModerationCampaignUpdateResponse, StepOneCtx, AssistantSettingsPayload, SearchParams, ModerationCampaignSearchResponse } from './types/moderation-types'

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
    communicationTone: ctxData.customTone ? 'other' : ctxData.tone,
    communicationToneOther: ctxData.customTone,
    startAt: ctxData.dates.start || undefined,
    endAt: ctxData.dates.end || undefined,
  });
}

/** ====== PUBLIC API ====== */

export async function createModerationCampaignFromStepOne(ctxData: StepOneCtx) {
  const payload = buildStepOnePayload(ctxData, { includeUserId: true });
  console.log('my payload', payload);

  const res: AxiosResponse<ModerationCampaignCreateResponse> = await api.post(
    "moderation-campaigns",
    payload
  );
  return res.data;
}

// ---- update (PUT) — same schema as POST
export async function updateModerationCampaignFromStepOne(campaignId: string, ctxData: StepOneCtx) {
  const payload = buildStepOnePayload(ctxData, { includeUserId: false });
  console.log('my payload edit', payload);
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
  return res.data;
}

export async function searchModerationCampaigns(
  params: SearchParams
): Promise<ModerationCampaignSearchResponse> {
  const res: AxiosResponse<ModerationCampaignSearchResponse> = await api.get(
    "moderation-campaigns/search",
    { params: prune(params) }
  );
  return res.data;
}

export async function searchMyModerationCampaigns(
  overrides?: Omit<SearchParams, "userId">
): Promise<ModerationCampaignSearchResponse> {
  const userId = getUserId();
  if (!userId) throw new Error("No userId available to list campaigns.");
  return searchModerationCampaigns({ userId, ...overrides });
}