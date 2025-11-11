export type InstagramAuthOpts = {
  clientId: string;
  redirectUri: string; // ej: "http://localhost:5173/instagram/callback"
  forceReauth?: boolean;
  state?: string;      // usa algo aleatorio/CSRF token
  campaignId?: string;
};

const IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
] as const;

export function buildInstagramAuthUrl(opts: InstagramAuthOpts) {
  const { clientId, redirectUri, forceReauth = true, state = crypto.randomUUID() } = opts;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: IG_SCOPES.join(","),
    state,
  });

  if (forceReauth) params.set("force_reauth", "true");

  // Nota: el endpoint de autorización correcto:
  // https://www.instagram.com/oauth/authorize
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}