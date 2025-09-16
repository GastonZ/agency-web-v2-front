import api from "./api/api";
import type { AxiosResponse } from "axios";
import { prune  } from "../utils/helper";
import type { MarketingCampaignCreateRequest, MarketingStepOneCtx, MarketingCampaignCreateResponse } from "./types/marketing-types";
import { buildMarketingCreatePayload } from "./types/marketing-types";


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