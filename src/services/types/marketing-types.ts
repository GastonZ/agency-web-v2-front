// src/services/marketingCampaign.ts
import { getUserId, prune, mapGender, mapAgeGroups, mapNSE } from "../../utils/helper";

/** ===== Tipos ===== */

export const CampaignTypes = {
  VENTA: "venta",
  DIFUSION: "difusion",
  ENCUESTA: "encuesta",
  CAPACITACION: "capacitacion",
} as const;

export type CampaignType = typeof CampaignTypes[keyof typeof CampaignTypes];

// Si no lo tenés ya:
export type BusinessType = "B2C" | "B2B";
export type Channel = "instagram" | "facebook" | "whatsapp" | "email" | "x";


export type AudienceGeo = {
  countryId?: string;
  stateId?: string;
  city?: string;
  postalCode?: string;
};

export type AudienceDemographics = {
  age?: string[];     // tus helpers ya manejan groups si hace falta
  gender?: string;    // "M" | "F" | "todos" / "all" (usaremos mapGender para normalizar)
  nse?: string[];
};

export type MarketingCampaignCreateRequest = {
  userId: string;
  name: string;
  campaignType: CampaignType;
  objective?: string;
  businessType: BusinessType;
  specificObjectives?: string[];
  mainMessage?: string;
  description?: string;
  leadDefinition?: string;
  audience?: {
    geo?: AudienceGeo[];
    demographics?: AudienceDemographics;
    culturalInterests?: string;
  };
  communicationTone?: string;        // mismo set que Moderation (formal, informal, etc.)
  communicationToneOther?: string;
  channels?: Channel[];
};

export type MarketingCampaignCreateResponse = { id: string };

/** ===== Context mínimo del Step 1 (UI) ===== */
export type MarketingStepOneCtx = {
  name?: string;
  campaignType?: CampaignType;
  objective?: string;
  businessType?: BusinessType;
  specificObjectives?: string[];
  mainMessage?: string;
  description?: string;
  leadDefinition?: string;
  audience?: {
    geo?: AudienceGeo[]; // al menos 1 si lo tenés
    demographics?: {
      ageGroups?: string[];
      gender?: string;          // "M" | "F" | "todos"/"all"/"other"
      socioeconomic?: string[];
    };
    cultural?: string;          // alias de culturalInterests
  };
  tone?: string;                // communicationTone
  customTone?: string;          // communicationToneOther
  channels?: Channel[];
};

/** ===== Builder: mapea UI -> API ===== */
export function buildMarketingCreatePayload(
  ctx: MarketingStepOneCtx,
  opts?: { includeUserId?: boolean }
): MarketingCampaignCreateRequest {
  const userId = getUserId();
  return prune({
    ...(opts?.includeUserId ? { userId } : {}),
    name: ctx.name || "",
    campaignType: (ctx.campaignType as CampaignType) || "venta",
    objective: ctx.objective || "",
    businessType: (ctx.businessType as BusinessType) || "B2C",
    specificObjectives: ctx.specificObjectives || [],
    mainMessage: ctx.mainMessage || "",
    description: ctx.description || "",
    leadDefinition: ctx.leadDefinition || "",
    audience: prune({
      geo: ctx.audience?.geo || [],
      demographics: prune({
        age: ctx.audience?.demographics?.ageGroups
          ? mapAgeGroups(ctx.audience.demographics.ageGroups)
          : undefined,
        gender: ctx.audience?.demographics?.gender
          ? mapGender(ctx.audience.demographics.gender)
          : undefined,
        nse: ctx.audience?.demographics?.socioeconomic
          ? mapNSE(ctx.audience.demographics.socioeconomic)
          : undefined,
      }),
      culturalInterests: ctx.audience?.cultural,
    }),
    communicationTone: ctx.tone || "informal",
    communicationToneOther: ctx.customTone || "",
    channels: ctx.channels || [],
  }) as MarketingCampaignCreateRequest;
}

export type DocUploadResult = {
  fileName: string;
  originalName?: string;
  documentUrl?: string;
  size?: number;
  status: "success" | "error";
  error?: string | null;
};

export type DocUploadResponse = {
  totalFiles: number;
  successCount: number;
  errorCount: number;
  overallStatus: "success" | "partial_success" | "error";
  message?: string;
  results: DocUploadResult[];
};