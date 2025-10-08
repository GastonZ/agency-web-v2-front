import api from "./api/api";
import type { AxiosResponse } from "axios";
import { prune } from "../utils/helper";
import { getUserId } from "../utils/helper";
import type { SearchParams } from "./types/moderation-types";
import type {
    ListeningCampaignCreateRequest,
    ListeningCampaignCreateResponse,
    ListeningCampaignItem,
    ListeningCampaignSearchResponse,
    ListeningConfigPayload,
    ProfilingConfigPayload,
    ListeningStepOneCtx,
} from "./types/listening-types";
import { buildListeningCreatePayload } from "./types/listening-types";


function extractId(raw: any): string {
    // backend puede devolver { id }, { _id }, { campaignId }, o un objeto completo con cualquiera de ellos
    const id = raw?.id || raw?._id || raw?.campaignId || raw?.data?.id || raw?.data?._id || raw?.item?.id || raw?.item?._id;
    if (!id) throw new Error("No se pudo extraer el id de la campaña de la respuesta del backend");
    return String(id);
}

// ---- Step 1 ----
export async function createListeningCampaign(
    payload: ListeningCampaignCreateRequest
): Promise<ListeningCampaignCreateResponse> {
    const res: AxiosResponse<any> = await api.post(
        "social-listening-campaigns",
        prune(payload)
    );
    const id = extractId(res.data);
    return { id };
}


export async function createListeningCampaignFromStepOne(
    ctx: ListeningStepOneCtx
): Promise<ListeningCampaignCreateResponse> {
    const payload = buildListeningCreatePayload(ctx, { includeUserId: true });
    return createListeningCampaign(payload);
}


export async function updateListeningCampaignStepOne(
    id: string,
    payload: Partial<ListeningCampaignCreateRequest> & { campaignId?: string }
): Promise<void> {
    const body = { campaignId: id, ...payload };
    await api.put(`social-listening-campaigns/${id}`, prune(body));
}


// ---- Step 2 ----
export async function updateListeningCampaignListeningConfig(id: string, payload: ListeningConfigPayload): Promise<void> {
    await api.put(`social-listening-campaigns/${id}/listening-config`, prune(payload));
}


// ---- Step 3 ----
export async function updateListeningCampaignProfilingConfig(id: string, payload: ProfilingConfigPayload): Promise<void> {
    await api.put(`social-listening-campaigns/${id}/profiling-config`, prune(payload));
}


// ---- Status ----
export async function updateListeningCampaignStatus(
    id: string,
    status: "draft" | "active" | "inactive" | "archived"
): Promise<void> {
    await api.put(`social-listening-campaigns/${id}/status`, { status });
}


// ---- Read/Search helpers (paridad con otros servicios) ----
export async function searchListeningCampaigns(
    overrides?: Omit<SearchParams, "userId">
): Promise<ListeningCampaignSearchResponse> {
    const userId = getUserId();
    if (!userId) throw new Error("No userId available to list campaigns.");


    const { data } = await api.get(`social-listening-campaigns/search`, {
        params: { userId, ...(overrides || {}) },
    });
    return data as ListeningCampaignSearchResponse;
}


export async function getListeningCampaignById(id: string): Promise<ListeningCampaignItem> {
    const { data } = await api.get(`social-listening-campaigns/${id}`);
    return data as ListeningCampaignItem;
}

export async function saveStepOne(
    ctx: ListeningStepOneCtx & { id?: string }
): Promise<string> {
    if (ctx.id) {
        await updateListeningCampaignStepOne(ctx.id, buildListeningCreatePayload(ctx, { includeUserId: true }));
        return ctx.id;
    }
    const res = await createListeningCampaignFromStepOne(ctx);

    console.log('res step one', res);

    return res.id;
}