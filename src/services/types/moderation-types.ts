import type { Calendar } from "../../context/ModerationContext";

export type ModerationCampaignCreateResponse = { id: string };
export type ModerationCampaignUpdateResponse = { id: string };

export type ModerationCampaignItem = {
  id: string;
  user: { id: string; email: string };
  name: string;
  objective?: string;
  description?: string;
  leadDefinition?: string;
  audience?: {
    geo?: Array<{
      countryId?: string;
      stateId?: string;
      city?: string;
      postalCode?: string;
    }>;
    demographics?: {
      age?: string[];
      gender?: string;   // 'M' | 'F' | 'all' (backend returns 'M'|'F' in sample)
      nse?: string[];
    };
    culturalInterests?: string;
  };
  communicationTone?: string;        // e.g. "other"
  communicationToneOther?: string;   // e.g. "Tonito"
  startAt?: string;                  // ISO
  endAt?: string;                    // ISO
  channels?: Array<"instagram" | "facebook" | "whatsapp" | "email" | "x">;
  status?: string;                   // e.g. "draft"
  assistantName?: string;
  greeting?: string;
  conversationLogic?: string;
  knowHow?: Array<{ question: string; answer: string }>;
  respondOnlyRelatedTo?: string;     // joined string
  humanEscalation?: string[];
  escalationContactNumber?: string;
  createdAt: string;
  updatedAt: string;
  whatsappStatus?: {
    qrScanned: boolean,
    qrScannedAt: string | null;
    qrScannedBy: string | null;
    qrScannedByPhone: string | null;
  },
};

export type ModerationCampaignSearchResponse = {
  page: number;
  pageSize: number;
  sortField: string;
  sortOrder: "ASC" | "DESC";
  total: number;
  items: ModerationCampaignItem[];
};

export type StepOneCtx = {
  name?: string;
  goal?: string;
  summary?: string;
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
};

export type AssistantSettingsPayload = {
  assistantName?: string;
  greeting?: string;
  conversationLogic?: string;
  voiceConfig?: string;
  knowHow?: Array<{ question: string; answer: string }>;
  respondOnlyRelatedTo?: string;
  humanEscalation?: string[];
  escalationContactNumber?: string;

  calendars?: Calendar[]
};

export type SearchParams = {
  userId: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
};

export type ExtractQAResponse = { question: string; answer: string }[];

export type CampaignStatus = "draft" | "active" | "inactive" | "archived";

export type ExtractedQA = { question: string; answer: string };

export type ActivateWhatsappBotResponse = {
  success: boolean;
  message: string;
  campaignId: string;
  agentId: string;
  agentName: string;
  userId: string;
  campaignName: string;
  channels: string[];
  qrGenerated: boolean;
};