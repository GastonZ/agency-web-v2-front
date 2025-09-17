import api from "./api/api";
import type { InfluencerItem } from "./types/influencer-types";

export async function fetchInfluencers(): Promise<InfluencerItem[]> {
  const { data } = await api.get("influencers");
  return (Array.isArray(data) ? data : []).map((x: any) => ({
    id: x.id || x._id,
    agentId: x.agentId ?? null,
    instagramId: x.instagramId ?? null,
    username: x.username,
    displayName: x.displayName,
    bio: x.bio ?? x.description ?? null,
    profilePictureUrl: x.profilePictureUrl,
    followersCount: Number(x.followersCount || 0),
    category: x.category ?? null,
    tags: Array.isArray(x.tags) ? x.tags : [],
    notes: x.notes ?? null,
    status: x.status,
  }));
}
