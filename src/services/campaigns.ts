import api from "./api/api";
import type { AxiosResponse } from "axios";
import { getUserId, mapAgeGroups, mapGender, mapNSE, prune, countWords } from '../utils/helper'
import type { ExtractedQA, ModerationCampaignCreateResponse, CampaignStatus, ModerationCampaignUpdateResponse, StepOneCtx, AssistantSettingsPayload, SearchParams, ModerationCampaignSearchResponse, ActivateWhatsappBotResponse, LeadStatus, UpdateModerationCampaignLeadStatusArgs } from './types/moderation-types'
import type { Calendar } from "../context/ModerationContext";

function buildStepOnePayload(ctxData: StepOneCtx, opts?: { includeUserId?: boolean }) {
  const userId = getUserId();

  const geo = ctxData.audience.geo || ({} as any);

  const rawCountryIds = (geo as any).countryIds;
  const countryIds: string[] =
    Array.isArray(rawCountryIds) && rawCountryIds.length
      ? rawCountryIds
      : geo.countryCode
        ? [geo.countryCode]
        : [];

  const primaryCountryId = countryIds[0] || null;

  const allowRegionAndCity = countryIds.length === 1;

  const geoEntry = prune({
    countryId: primaryCountryId,
    countryIds,
    stateId: allowRegionAndCity ? geo.regionCode : undefined,
    city: allowRegionAndCity ? geo.city : undefined,
    postalCode: geo.postalCode,
  });

  return prune({
    ...(opts?.includeUserId ? { userId } : {}),
    name: ctxData.name,
    objective: ctxData.goal,
    description: ctxData.summary,
    leadDefinition: ctxData.leadDefinition,
    audience: {
      geo: [geoEntry],
      demographics: {
        age: mapAgeGroups(ctxData.audience.demographic.ageGroups),
        gender: mapGender(ctxData.audience.demographic.gender),
        nse: mapNSE(ctxData.audience.demographic.socioeconomic),
      },
      culturalInterests: ctxData.audience.cultural,
    },
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
  channels: Array<"instagram" | "facebook" | "whatsapp" | "webchat">
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

  calendars?: Calendar[]

  tone?: string;
  customTone?: string;
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
    communicationTone: data.customTone ? '' : data.tone,
    communicationToneOther: data.customTone,
    calendars: (data.calendars?.length ?? 0) > 0 ? data.calendars : undefined
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

export async function getModerationCampaignById(id: string) {
  const res: AxiosResponse<import("./types/moderation-types").ModerationCampaignItem> =
    await api.get(`moderation-campaigns/${id}`);
  return res.data;
}

export async function updateModerationCampaignStatus(
  id: string,
  status: CampaignStatus
) {
  const res: AxiosResponse<{ id: string; status: string }> = await api.put(
    `moderation-campaigns/${id}/status`,
    { status }
  );
  return res.data;
}
/* Extract Q&A FROM FILE  */

export async function extractQAFromFile(file: File): Promise<ExtractedQA[]> {
  const form = new FormData();
  form.append("file", file);

  const res: AxiosResponse<ExtractedQA[]> = await api.put(
    "moderation-campaigns/upload/file/extract-qa",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  const data = Array.isArray(res.data) ? res.data : [];
  return data
    .filter((row: any) => row && typeof row.question === "string" && typeof row.answer === "string")
    .map((row: any) => ({ question: row.question, answer: row.answer }));
}


export async function activateWhatsappBot(
  id: string
): Promise<ActivateWhatsappBotResponse> {
  const res: AxiosResponse<ActivateWhatsappBotResponse> = await api.put(
    `moderation-campaigns/${id}/activate-whatsapp-bot`
  );
  return res.data;
}

type InstagramCredentialsPayload = {
  instagramId: string;
  accessToken: string;
};

export async function updateModerationInstagramCredentials(
  campaignId: string,
  creds: InstagramCredentialsPayload
) {
  if (!campaignId) throw new Error("campaignId es requerido");
  if (!creds?.instagramId || !creds?.accessToken) {
    throw new Error("instagramId y accessToken son requeridos");
  }

  const payload = {
    instagramId: creds.instagramId,
    accessToken: creds.accessToken,
  };

  const res: AxiosResponse<any> = await api.put(
    `moderation-campaigns/${campaignId}/instagram-credentials`,
    payload
  );

  return res.data;
}

export async function setModerationInstagramCode(campaignId: string, code: string) {
  const { data } = await api.put(
    `moderation-campaigns/${campaignId}/instagram-credentials`,
    { code }
  );
  return data;
}

export async function setModerationFacebookCode(campaignId: string, code: string) {
  const { data } = await api.put(
    `moderation-campaigns/${campaignId}/facebook-credentials`,
    { code }
  );
  return data;
}

export async function getModerationAccounts(campaignId: string) {
  const { data } = await api.get(
    `moderation-campaigns/${campaignId}/social-accounts`
  );
  return data;
}

export type ModerationChannel = "whatsapp" | "instagram" | "facebook" | "webchat";

export async function pauseModerationChannel(
  campaignId: string,
  channel: ModerationChannel
) {
  const { data } = await api.post(
    `moderation-campaigns/${campaignId}/pause-channel`,
    { channel }
  );
  return data;
}

export async function unpauseModerationChannel(
  campaignId: string,
  channel: ModerationChannel
) {
  const { data } = await api.post(
    `moderation-campaigns/${campaignId}/unpause-channel`,
    { channel }
  );
  return data;
}

export type ModerationAnalysisExecuteOptions = {
  dryRun?: boolean;
  limit?: number;
  batchSize?: number;
};

export async function executeModerationAnalysis(
  campaignId: string,
  options?: ModerationAnalysisExecuteOptions
) {
  const { data } = await api.post(
    `moderation-campaigns/${campaignId}/analysis/execute`,
    {},
    {
      params: prune(options || {}),
    }
  );
  return data;
}

export type ModerationAnalysisSummarySortBy =
  | "finalScore"
  | "analyzedAt"
  | "createdAt"
  | "updatedAt"
  | "classification"
  | "priority"
  | "status";

export type ModerationAnalysisSummarySortOrder = "asc" | "desc";

export type ModerationAnalysisSummaryFilters = {
  channels?: Array<"instagram" | "whatsapp" | "facebook">;
  finalScoreMin?: number;
  finalScoreMax?: number;
  area?: string;
  priorities?: Array<"high" | "medium" | "low" | "urgent">;
  classifications?: Array<"hot" | "warm" | "cold">;
  statuses?: LeadStatus[];
  sortBy?: ModerationAnalysisSummarySortBy;
  sortOrder?: ModerationAnalysisSummarySortOrder;
  page?: number;
  limit?: number;
};

function arrToCsv(v?: string[] | null) {
  if (!v || !Array.isArray(v) || v.length === 0) return undefined;
  const cleaned = v.map((s) => String(s).trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(",") : undefined;
}

export async function getModerationAnalysisSummary(
  campaignId: string,
  filters?: ModerationAnalysisSummaryFilters,
) {
  const params = prune({
    channels: arrToCsv(filters?.channels as any),
    priorities: arrToCsv(filters?.priorities as any),
    classifications: arrToCsv(filters?.classifications as any),
    statuses: arrToCsv(filters?.statuses as any),
    area: (filters?.area || "").trim() || undefined,
    finalScoreMin:
      typeof filters?.finalScoreMin === "number" ? filters.finalScoreMin : undefined,
    finalScoreMax:
      typeof filters?.finalScoreMax === "number" ? filters.finalScoreMax : undefined,
    sortBy: filters?.sortBy,
    sortOrder: filters?.sortOrder,
    page: filters?.page,
    limit: filters?.limit,
  });

  const { data } = await api.get(
    `moderation-campaigns/${campaignId}/analysis/summary`,
    {
      params,
    },
  );
  return data;
}

export type AppendModerationCampaignLeadNextActionArgs = {
  campaignId: string;
  conversationId: string;
  text: string;
};

export async function appendModerationCampaignLeadNextAction(
  args: AppendModerationCampaignLeadNextActionArgs,
) {
  const payload = { text: (args.text || "").trim() };
  if (!payload.text) throw new Error("text is required");

  const res: AxiosResponse<unknown> = await api.put(
    `moderation-campaigns/${args.campaignId}/leads/${args.conversationId}/next-action`,
    payload,
  );

  return res.data;
}

export async function getModerationAnalysisMetrics(campaignId: string) {
  const { data } = await api.get(
    `moderation-campaigns/${campaignId}/analysis/metrics`
  );
  return data;
}

export async function getModerationHotLeads(campaignId: string) {
  const { data } = await api.get(
    `moderation-campaigns/${campaignId}/analysis/hot-leads`
  );
  return data;
}

export async function updateWebchatConfig(
  campaignId: string,
  payload: { domain: string }
) {
  const { data } = await api.put(
    `moderation-campaigns/${campaignId}/webchat-config`,
    payload
  );
  return data;
}

type InstagramReviewSendPayload = {
  agentId: string;
  recipientId: string;
  message: string;
};

export async function sendInstagramReviewMessage(message: string) {
  const agentId = "6953078cf62c1da0e64fcddb";
  const recipientId = "26195445306710296";

  const payload: InstagramReviewSendPayload = {
    agentId,
    recipientId,
    message,
  };

  const { data } = await api.post("instagram/messages/send", payload);
  return data;
}


export async function updateModerationCampaignLeadStatus(
  args: UpdateModerationCampaignLeadStatusArgs
) {
  const payload =
    args.status === "custom"
      ? { status: "custom", customStatusLabel: args.customStatusLabel || "" }
      : { status: args.status };

  if (payload.status === "custom") {
    const label = (payload.customStatusLabel || "").trim();
    if (!label) throw new Error("customStatusLabel is required");
    if (countWords(label) > 2) throw new Error("customStatusLabel: max 2 words");
  }

  const res: AxiosResponse<unknown> = await api.put(
    `moderation-campaigns/${args.campaignId}/leads/${args.conversationId}/status`,
    payload
  );

  return res.data;
}

export type UpdateModerationCampaignLeadAreaArgs = {
  campaignId: string;
  conversationId: string;
  area: string;
};

export async function updateModerationCampaignLeadArea(
  args: UpdateModerationCampaignLeadAreaArgs,
) {
  const payload = { area: args.area };

  const res: AxiosResponse<unknown> = await api.put(
    `moderation-campaigns/${args.campaignId}/leads/${args.conversationId}/area`,
    payload,
  );

  return res.data;
}


type MessengerSendPayload = {
  agentId: string;
  recipientId: string;
  message: string;
};

export async function sendFacebookMessengerMessage(payload: MessengerSendPayload) {
  const agentId = (payload?.agentId || "").trim();
  const recipientId = (payload?.recipientId || "").trim();
  const message = (payload?.message || "").trim();

  if (!agentId) throw new Error("agentId is required");
  if (!recipientId) throw new Error("recipientId is required");
  if (!message) throw new Error("message is required");

  const { data } = await api.post("messenger/send-message", {
    agentId,
    recipientId,
    message,
  });

  return data;
}

export async function sendFacebookReviewMessage(message: string) {
  const agentId = "69553b77b1bbeb18d2a5673a";
  const recipientId = "33303037325976978";

  return sendFacebookMessengerMessage({
    agentId,
    recipientId,
    message,
  });
}

export async function getModerationCampaignLead(args: {
  campaignId: string;
  conversationId: string;
}) {
  const res = await api.get(
    `moderation-campaigns/${args.campaignId}/leads/${encodeURIComponent(args.conversationId)}`,
  );
  return res.data;
}

export async function lookupModerationCampaignLeads(args: {
  campaignId: string;
  conversationIds: string[];
}) {
  const res = await api.post(
    `moderation-campaigns/${args.campaignId}/leads/lookup`,
    { conversationIds: args.conversationIds },
  );
  return res.data;
}

export async function uploadModerationCampaignVoice(campaignId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  const res: AxiosResponse<ExtractedQA[]> = await api.put(
    `moderation-campaigns/${campaignId}/upload/audio/voice`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
}

export type ModerationCampaignVoiceStatus = {
  hasVoice: boolean;
  voiceId?: string | null;
};

export async function getModerationCampaignVoiceStatus(campaignId: string) {
  const res = await api.get<ModerationCampaignVoiceStatus>(
    `moderation-campaigns/${campaignId}/voice`
  );
  return res.data;
}

export async function deleteModerationCampaignVoice(campaignId: string) {
  const res = await api.delete<{ deleted: boolean }>(
    `moderation-campaigns/${campaignId}/voice`
  );
  return res.data;
}