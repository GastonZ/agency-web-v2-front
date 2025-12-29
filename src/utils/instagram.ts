export type InstagramAuthOpts = {
  clientId: string;
  redirectUri: string;
  forceReauth?: boolean;
  state?: string;
};

const IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
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

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}