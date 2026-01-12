import { getToken } from "../utils/helper";

type AnyJson = Record<string, any>;

function getApiBase(): string {
  const base =
    (import.meta as any).env?.VITE_API_CONVERSATION ||
    (import.meta as any).env?.VITE_API_BASE_URL;

  const normalized = typeof base === "string" ? base.replace(/\/+$/, "") : "";
  if (!normalized) {
    throw new Error(
      "Missing VITE_API_CONVERSATION (or VITE_API_BASE_URL) in your .env (should include /api)",
    );
  }
  return normalized;
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson(url: string, init: RequestInit): Promise<AnyJson> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: AnyJson = {};
  try {
    json = text ? (JSON.parse(text) as AnyJson) : {};
  } catch {
    // ignore
  }

  if (!res.ok) {
    const err = new Error(
      `${init.method || "GET"} ${url} -> ${res.status} ${res.statusText}`,
    ) as Error & { status?: number; body?: AnyJson };
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function pickText(data: any): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  const candidates = [data.text, data.prompt, data.value, data.data?.text];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }
  return "";
}

function pickClientSecretValue(data: any): string {
  if (!data) return "";
  if (typeof data === "string") return data;

  // OpenAI style: { client_secret: { value: "ek_..." } }
  const v1 = data?.client_secret?.value;
  if (typeof v1 === "string" && v1.trim()) return v1.trim();

  // Demo style: { value: "ek_..." }
  const v2 = data?.value;
  if (typeof v2 === "string" && v2.trim()) return v2.trim();

  // Fallbacks
  const v3 = data?.client_secret;
  if (typeof v3 === "string" && v3.trim()) return v3.trim();

  const v4 = data?.secret;
  if (typeof v4 === "string" && v4.trim()) return v4.trim();

  return "";
}

export async function apiPromptReset(profile: string): Promise<string> {
  const base = getApiBase();
  const url = `${base}/realtime/prompt-reset?profile=${encodeURIComponent(profile)}`;
  const data = await fetchJson(url, { method: "GET", headers: buildHeaders() });
  const text = pickText(data);
  if (!text) throw new Error("prompt-reset returned empty prompt");
  return text;
}

export async function apiSavePrompt(profile: string, text: string): Promise<void> {
  const base = getApiBase();
  const url = `${base}/realtime/save-prompt`;
  await fetchJson(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ profile, text }),
  });
}

export type SessionLogItem = {
  role: string;
  text: string;
  ts: string;
};

export async function apiSaveSession(
  profile: string,
  log: SessionLogItem[],
): Promise<void> {
  const base = getApiBase();
  const url = `${base}/realtime/save-session`;
  await fetchJson(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ profile, log }),
  });
}

export async function apiClientSecret(ttlSeconds = 600): Promise<string> {
  const base = getApiBase();
  const url = `${base}/realtime/client-secret?ttlSeconds=${encodeURIComponent(
    String(ttlSeconds),
  )}`;
  const data = await fetchJson(url, { method: "GET", headers: buildHeaders() });
  const secret = pickClientSecretValue(data);
  if (!secret) throw new Error("client-secret returned empty value");
  return secret;
}
