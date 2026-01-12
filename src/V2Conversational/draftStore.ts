export type CampaignDraftV1 = {
  version: 1;
  campaign_type: "moderation" | "marketing" | "social_listening";
  name?: string;
  goal?: string;
  summary?: string;
  leadDefinition?: string;
  country?: { code?: string; name?: string };
  missing?: string[];
  updatedAt: number;
};

const KEY = "v2conversational:draft:v1";

export function readDraft(): CampaignDraftV1 | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as CampaignDraftV1;
  } catch {
    return null;
  }
}

export function mergeDraft(patch: Partial<Omit<CampaignDraftV1, "version" | "updatedAt">>) {
  const prev = readDraft();
  const next: CampaignDraftV1 = {
    version: 1,
    campaign_type: (patch.campaign_type as any) || prev?.campaign_type || "moderation",
    name: patch.name ?? prev?.name,
    goal: patch.goal ?? prev?.goal,
    summary: patch.summary ?? prev?.summary,
    leadDefinition: patch.leadDefinition ?? prev?.leadDefinition,
    country: patch.country ?? prev?.country,
    missing: patch.missing ?? prev?.missing,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
