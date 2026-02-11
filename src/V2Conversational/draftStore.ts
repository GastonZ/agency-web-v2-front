export type CampaignDraftV1 = {
  version: 1;
  campaign_type: "moderation" | "marketing" | "social_listening";
  name?: string;
  goal?: string;
  summary?: string;
  leadDefinition?: string;
  country?: { code?: string; name?: string };

  // Step 2 — Assistant
  assistant?: { name?: string; greeting?: string; conversationLogic?: string };

  // Step 2 — KnowHow (Q&A)
  knowHow?: Array<{ id?: string; question: string; answer: string }>;

  // Step 3 — Channels
  channels?: Array<"instagram" | "facebook" | "whatsapp" | "webchat">;
  webchatDomain?: string;

  // Escalation
  escalationItems?: string[];
  escalationPhone?: string;

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

    assistant: patch.assistant ?? prev?.assistant,
    knowHow: patch.knowHow ?? prev?.knowHow,
    channels: patch.channels ?? prev?.channels,
    webchatDomain: patch.webchatDomain ?? prev?.webchatDomain,
    escalationItems: patch.escalationItems ?? prev?.escalationItems,
    escalationPhone: patch.escalationPhone ?? prev?.escalationPhone,

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
