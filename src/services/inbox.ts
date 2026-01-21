import api from "./api/api";

export type InboxChannel = "whatsapp";

export type ThreadMetadata = {
  takeoverMode: "BOT" | "HUMAN";
  lockedByUserId: string | null;
  lockedAt: string | null;
  unreadCount: number;
  lastMessagePreview?: string;
  lastMessageDirection?: "in" | "out";
};

export type InboxThread = {
  agentId: string;
  channel: InboxChannel;
  contactId: string;
  name?: string | null;
  lastMessageDate: string;
  metadata: ThreadMetadata;
};

export type InboxMessageProfile = {
  source?: "human" | "bot";
  authorUserId?: string;
  media?: {
    type: "image" | "audio" | "video" | "document";
    mimeType?: string;
  };
} | null;

export type InboxMessage = {
  agentId: string;
  userId?: string;
  role: "user" | "assistant";
  content: string;
  time: number;
  name?: string | null;
  channel: InboxChannel;
  profile?: InboxMessageProfile;
};

export type ThreadMessagesResponse = {
  thread: InboxThread;
  messages: InboxMessage[];
};

export async function listThreads(agentId: string, opts?: { limit?: number; channel?: InboxChannel }) {
  const channel = opts?.channel ?? "whatsapp";
  const limit = opts?.limit ?? 100;

  const safeAgentId = encodeURIComponent(agentId);
  const { data } = await api.get<InboxThread[]>(`inbox/${safeAgentId}/threads`, {
    params: { channel, limit },
  });
  return data;
}

export async function getThreadMessages(
  agentId: string,
  contactId: string,
  opts?: { limit?: number; before?: number; channel?: InboxChannel }
) {
  const channel = opts?.channel ?? "whatsapp";
  const limit = opts?.limit ?? 50;
  const safeAgentId = encodeURIComponent(agentId);
  const safeContactId = encodeURIComponent(contactId);

  const params: any = { channel, limit };
  if (opts?.before) params.before = opts.before;

  const { data } = await api.get<ThreadMessagesResponse>(
    `inbox/${safeAgentId}/threads/${safeContactId}/messages`,
    { params }
  );
  return data;
}

export async function takeoverThread(
  agentId: string,
  contactId: string,
  body: { mode: "HUMAN" | "BOT"; force?: boolean },
  opts?: { channel?: InboxChannel }
) {
  const channel = opts?.channel ?? "whatsapp";
  const safeAgentId = encodeURIComponent(agentId);
  const safeContactId = encodeURIComponent(contactId);

  const { data } = await api.post<{ ok: boolean; mode: "HUMAN" | "BOT"; thread: InboxThread }>(
    `inbox/${safeAgentId}/threads/${safeContactId}/takeover`,
    body,
    { params: { channel } }
  );
  return data;
}

export async function markThreadRead(
  agentId: string,
  contactId: string,
  body?: { expectedUnread?: number },
  opts?: { channel?: InboxChannel }
) {
  const channel = opts?.channel ?? "whatsapp";
  const safeAgentId = encodeURIComponent(agentId);
  const safeContactId = encodeURIComponent(contactId);

  const { data } = await api.post<{ ok: boolean; unreadCount: number }>(
    `inbox/${safeAgentId}/threads/${safeContactId}/mark-read`,
    body ?? {},
    { params: { channel } }
  );
  return data;
}

type SendTextBody = { type: "text"; text: string };
type SendAudioBody = { type: "audio"; base64: string; mimeType: string };
type SendImageBody = { type: "image"; text?: string; base64: string; mimeType: string };
type SendVideoBody = { type: "video"; text?: string; base64: string; mimeType: string };
type SendDocumentBody = {
  type: "document";
  text?: string;
  base64: string;
  mimeType: string;
  fileName?: string;
};

export type SendMessageBody = SendTextBody | SendAudioBody | SendImageBody | SendVideoBody | SendDocumentBody;

export async function sendMessage(
  agentId: string,
  contactId: string,
  body: SendMessageBody,
  opts?: { channel?: InboxChannel }
) {
  const channel = opts?.channel ?? "whatsapp";
  const safeAgentId = encodeURIComponent(agentId);
  const safeContactId = encodeURIComponent(contactId);

  const { data } = await api.post<{ ok: boolean }>(
    `inbox/${safeAgentId}/threads/${safeContactId}/send`,
    body,
    { params: { channel } }
  );
  return data;
}
