export type InfluencerItem = {
  id: string;                    // viene como id o _id
  agentId?: string | null;
  instagramId?: string | null;
  username: string;
  displayName: string;
  bio?: string | null;
  profilePictureUrl: string;
  followersCount: number;
  category?: string | null;
  tags?: string[];
  notes?: string | null;         // usamos esto para influencerSelectionNotes
  status?: string;
};
