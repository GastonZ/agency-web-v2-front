import api from "./api/api";
import type { AxiosResponse } from "axios";
import { prune } from "../utils/helper";
import type { MarketingCampaignCreateRequest, MarketingStepOneCtx, MarketingCampaignCreateResponse, DocUploadResponse } from "./types/marketing-types";
import { buildMarketingCreatePayload } from "./types/marketing-types";
import type { Channel } from "../context/MarketingContext";


export async function createMarketingCampaign(
  payload: MarketingCampaignCreateRequest
): Promise<MarketingCampaignCreateResponse> {
  const res: AxiosResponse<MarketingCampaignCreateResponse> = await api.post(
    "marketing-campaigns",
    prune(payload)
  );
  return res.data;
}

export async function createMarketingCampaignFromStepOne(
  ctx: MarketingStepOneCtx
): Promise<MarketingCampaignCreateResponse> {
  const payload = buildMarketingCreatePayload(ctx, { includeUserId: true });
  return createMarketingCampaign(payload);
}

export async function updateMarketingCampaignStepOne(id: string, payload: any): Promise<void> {
  await api.put(`marketing-campaigns/${id}`, payload);
}

export async function updateMarketingCampaignContent(id: string, payload: any): Promise<{ referenceImages?: string[] }> {
  const { data } = await api.put(`marketing-campaigns/${id}/content-config`, payload);
  return data;
}


export type UploadResult = {
  imagePath: string;
  imageUrl?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  status: "success" | "error";
  error?: string | null;
};
export type UploadResponse = {
  totalFiles: number;
  successCount: number;
  errorCount: number;
  overallStatus: "success" | "partial_success" | "error";
  results: UploadResult[];
  message?: string;
};

export async function uploadMarketingImages(id: string, files: File[]): Promise<UploadResponse> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const { data } = await api.post(`marketing-campaigns/${id}/upload-images`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as UploadResponse;
}

export async function updateMarketingCampaignInfluencerSelection(
  id: string,
  payload: {
    influencerSelectionType: "catalog" | "own_account" | "virtual_ai";
    selectedInfluencerId?: string;
    influencerSelectionNotes?: string;
    virtualAgentConfig?: any;
  }
): Promise<any> {
  const { data } = await api.put(`marketing-campaigns/${id}/influencer-selection`, payload);
  return data;
}

export async function uploadMarketingDocuments(id: string, files: File[]): Promise<DocUploadResponse> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const { data } = await api.post(`marketing-campaigns/${id}/upload-documents`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as DocUploadResponse;
}

export async function updateMarketingCampaignChannelsContacts(
  id: string,
  payload: {
    referenceDocuments: string[];
    advertisingBudget: number;
    connectedSocialAccounts: string[];
    scrappingConfig: {
      platforms: Channel[];
      filters: { minFollowers: number };
    };
  }
) {
  const { data } = await api.put(`marketing-campaigns/${id}/channels-contacts`, payload);
  return data;
}

export async function updateMarketingCampaignStatus(
  id: string,
  status: "active" | "draft" | "inactive"
) {
  const { data } = await api.put(`marketing-campaigns/${id}/status`, { status });
  return data;
}