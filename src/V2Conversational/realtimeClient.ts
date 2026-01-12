import { apiClientSecret } from "./realtimeApi";

export async function getRealtimeClientSecret(ttlSeconds = 600): Promise<string> {
  return apiClientSecret(ttlSeconds);
}
