import * as React from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  Check,
  Loader2,
  Mail,
  Mic,
  Pencil,
  Paperclip,
  Send,
  ShieldAlert,
  Square,
  Trash2,
  X,
  Video,
} from "lucide-react";
import OnlineLayout from "../layout/OnlineLayout";
import { initSocket, getSocket } from "../services/socket/socket";
import { getToken, getUserId } from "../utils/helper";
import { useTranslation } from "react-i18next";
import {
  searchMyModerationCampaigns,
  updateModerationCampaignLeadStatus,
  updateModerationCampaignLeadArea,
  appendModerationCampaignLeadNextAction,
  getModerationCampaignLead,
  lookupModerationCampaignLeads,
  getModerationAccounts,
} from "../services/campaigns";
import { getMyAreas } from "../services/subaccounts";
import type { LeadStatus, ModerationCampaignItem } from "../services/types/moderation-types";
import {
  listThreads,
  getThreadMessages,
  markThreadRead,
  markThreadUnread,
  editThreadMessage,
  deleteThreadMessage,
  sendMessage,
  takeoverThread,
  startThread,
  type InboxThread,
  type InboxMessage,
  type InboxChannel,
  type ThreadMessagesResponse,
  type SendMessageBody,
  type StartThreadBody,
} from "../services/inbox";

const INBOX_CHANNELS: InboxChannel[] = ["whatsapp", "instagram", "facebook"];
const LEGACY_LAST_AGENT_STORAGE_KEY = "inbox:lastAgentId";
const WHATSAPP_MESSAGE_ACTION_WINDOW_MS = 10 * 60 * 1000;
const OPTIMISTIC_REQUEST_ID_PREFIX = "temp-";

function normalizeBotId(input: string): string {
  if (!input) return "";

  // Remove diacritics, trim, lower, replace non-alnum with underscores.
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function normalizeInboxChannel(input: any): InboxChannel {
  const ch = String(input || "").trim().toLowerCase();
  if (ch === "instagram" || ch === "facebook") return ch;
  return "whatsapp";
}

function channelBadgeMeta(channel: any): { label: string; short: string; className: string } {
  const ch = normalizeInboxChannel(channel);
  if (ch === "instagram") {
    return {
      label: "Instagram",
      short: "IG",
      className:
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500/30",
    };
  }
  if (ch === "facebook") {
    return {
      label: "Facebook",
      short: "FB",
      className:
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-blue-500/30",
    };
  }
  return {
    label: "WhatsApp",
    short: "WA",
    className:
      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  };
}

function hasLinkedInstagramAccount(data: any): boolean {
  return Boolean(
    data?.instagram &&
    (
      data.instagram.username ||
      data.instagram.name ||
      data.instagram.profilePicture ||
      data.instagram.id
    ),
  );
}

function hasLinkedFacebookAccount(data: any): boolean {
  return Boolean(
    data?.facebook &&
    (
      data.facebook.id ||
      data.facebook.name ||
      data.facebook.profilePicture
    ),
  );
}

function hasLinkedWhatsappAccount(data: any): boolean {
  return Boolean(
    data?.whatsapp?.qrScanned === true ||
    data?.whatsapp?.connected === true ||
    data?.whatsapp?.phoneNumber ||
    data?.whatsapp?.qrScannedByPhone,
  );
}

function buildModernAgentId(campaignId: string | undefined | null): string {
  const id = String(campaignId || "").trim();
  return id ? `mod_${id}` : "";
}

function getCampaignAgentCandidates(campaign: ModerationCampaignItem): string[] {
  const candidates = [
    String((campaign as any)?.agentId || ""),
    String((campaign as any)?.botId || ""),
    String((campaign as any)?._id || ""),
    String((campaign as any)?.agentConfigId || ""),
    String((campaign as any)?.agent?._id || ""),
    String((campaign as any)?.agent?.id || ""),
    buildModernAgentId(campaign?.id),
    String(campaign?.name || ""),
    String((campaign as any)?.assistantName || ""),
  ]
    .map((v) => normalizeBotId(v))
    .filter(Boolean);

  return Array.from(new Set(candidates));
}

function resolveCampaignAgentKey(campaign: ModerationCampaignItem | null | undefined): string {
  if (!campaign) return "";
  return getCampaignAgentCandidates(campaign)[0] || "";
}

function isValidContactId(v: any): v is string {
  const s = String(v ?? "").trim();
  if (!s) return false;
  const l = s.toLowerCase();
  if (l === "undefined" || l === "null") return false;
  return true;
}

function normalizeContactId(raw: any, channel: any = "whatsapp"): string {
  const ch = normalizeInboxChannel(channel);
  const rawStr = String(raw ?? "").trim();
  const s = rawStr.toLowerCase();
  if (!rawStr || s === "undefined" || s === "null") return "";

  if (ch !== "whatsapp") return rawStr;

  // WhatsApp: normalize domain and strip non-digits from user part.
  if (s.includes("@")) {
    const [user, domainRaw] = s.split("@");
    const domain = String(domainRaw || "").trim().toLowerCase();
    const digits = String(user || "").replace(/\D/g, "");
    if (digits) {
      if (domain === "c.us" || domain === "s.whatsapp.net") return `${digits}@s.whatsapp.net`;
      return `${digits}@${domain}`;
    }
    return rawStr;
  }

  const digits = s.replace(/\D/g, "");
  return digits ? `${digits}@s.whatsapp.net` : rawStr;
}

function threadKey(channel: any, contactId: any): string {
  const ch = normalizeInboxChannel(channel);
  return `${ch}|${normalizeContactId(contactId, ch)}`;
}

function mergeThread(prev: InboxThread, next: InboxThread): InboxThread {
  const nextNameOk = isViableName(next.name);
  const prevNameOk = isViableName(prev.name);

  // IMPORTANT: never allow an empty/undefined contactId from backend updates to overwrite a valid one.
  const prevChannel = normalizeInboxChannel((prev as any).channel);
  const nextChannel = normalizeInboxChannel((next as any).channel ?? prevChannel);
  const prevCid = normalizeContactId((prev as any).contactId, prevChannel);
  const nextCid = normalizeContactId((next as any).contactId, nextChannel);
  const cid = isValidContactId(nextCid) ? nextCid : prevCid;

  const merged: InboxThread = {
    ...prev,
    ...next,
    channel: nextChannel as any,
    contactId: cid,
    name: nextNameOk ? next.name : prevNameOk ? prev.name : next.name ?? prev.name,
    metadata: { ...(prev.metadata || {}), ...(next.metadata || {}) },
    lastMessageDate:
      new Date(
        Math.max(
          new Date(prev.lastMessageDate || 0).getTime(),
          new Date(next.lastMessageDate || 0).getTime(),
        ),
      ).toISOString(),
  };

  return merged;
}

function dedupeThreads(list: InboxThread[]): InboxThread[] {
  const map = new Map<string, InboxThread>();
  for (const t of list || []) {
    const channel = normalizeInboxChannel((t as any).channel);
    const contactId = normalizeContactId((t as any).contactId, channel);
    const key = threadKey(channel, contactId);
    if (!key.endsWith("|")) {
      const prev = map.get(key);
      map.set(
        key,
        prev
          ? mergeThread(prev, { ...t, channel, contactId })
          : ({ ...t, channel, contactId } as InboxThread),
      );
    }
  }
  return Array.from(map.values());
}

function isViableName(name?: string | null): boolean {
  const n = (name ?? "").trim();
  if (!n) return false;
  const lower = n.toLowerCase();
  // Backend sometimes sets the contact name as a channel label; treat that as non-meaningful.
  if (
    lower === "whatsapp" ||
    lower === "whats app" ||
    lower === "wa" ||
    lower === "instagram" ||
    lower === "facebook" ||
    lower === "messenger"
  ) {
    return false;
  }
  return true;
}

function extractPayloadAgentAliases(payload: any): string[] {
  return [
    payload?.agentId,
    payload?.agentName,
    payload?.agentAlias,
    payload?.thread?.agentId,
    payload?.thread?.agentName,
    payload?.thread?.agentAlias,
    payload?.message?.agentId,
    payload?.message?.agentName,
    payload?.message?.agentAlias,
  ]
    .map((v) => normalizeBotId(String(v || "")))
    .filter(Boolean);
}

function formatContactId(contactId: string, channel: any = "whatsapp"): string {
  if (!contactId) return "â€”";
  const ch = normalizeInboxChannel(channel);
  if (ch !== "whatsapp") return contactId;
  const base = contactId.split("@")[0] || contactId;
  const digits = (base.match(/\d+/g) || []).join("");

  if (!digits) return base;

  // Heuristic formatting (good enough for UX):
  // Argentina mobiles often come as 549 + 10 digits => +54 9 xxx xxx xxxx
  if (digits.startsWith("549") && digits.length === 13) {
    const rest = digits.slice(3); // 10 digits
    const a = rest.slice(0, 3);
    const b = rest.slice(3, 6);
    const c = rest.slice(6, 10);
    return `+54 9 ${a} ${b} ${c}`;
  }

  // US/CA common: 1 + 10 digits
  if (digits.startsWith("1") && digits.length === 11) {
    const rest = digits.slice(1);
    return `+1 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
  }

  // Fallback: just show +digits
  return `+${digits}`;
}

function threadDisplayName(t: InboxThread): string {
  return isViableName(t.name) ? (t.name as string) : formatContactId(t.contactId, t.channel);
}

function isOptimisticRequestId(requestId?: string): boolean {
  const rid = String(requestId || "").trim();
  return Boolean(rid && rid.startsWith(OPTIMISTIC_REQUEST_ID_PREFIX));
}

function messageMediaSignature(m: InboxMessage): string {
  return m.profile?.media ? `${m.profile.media.type}:${m.profile.media.mimeType || ""}` : "";
}

function msgKey(m: InboxMessage): string {
  if (m.requestId) return `rid:${m.requestId}`;
  const media = messageMediaSignature(m);
  return `${m.time}:${m.role}:${m.content || ""}:${media}`;
}

function mergeMessageItem(prev: InboxMessage, next: InboxMessage): InboxMessage {
  return {
    ...prev,
    ...next,
    profile: {
      ...(prev.profile || {}),
      ...(next.profile || {}),
    } as any,
  };
}

function mergeUniqueMessages(prev: InboxMessage[], next: InboxMessage[]): InboxMessage[] {
  if (!next.length) return prev;
  const merged = [...prev];

  for (const m of next) {
    const incomingRid = String(m.requestId || "").trim();
    const incomingHasStableRid = Boolean(incomingRid && !isOptimisticRequestId(incomingRid));

    if (m.requestId) {
      const idx = merged.findIndex((x) => x.requestId && x.requestId === m.requestId);
      if (idx >= 0) {
        merged[idx] = mergeMessageItem(merged[idx], m);
        continue;
      }
    }

    // Replace optimistic human outgoing message with the definitive server message.
    if (incomingHasStableRid && m.role === "assistant") {
      const incomingContent = String(m.content || "").trim();
      const incomingMedia = messageMediaSignature(m);
      const idxOptimistic = merged.findIndex((x) => {
        const rid = String(x.requestId || "").trim();
        const isOptimistic = !rid || isOptimisticRequestId(rid);
        if (!isOptimistic) return false;
        if (x.role !== "assistant") return false;
        if (String(x.content || "").trim() !== incomingContent) return false;
        if (messageMediaSignature(x) !== incomingMedia) return false;
        return Math.abs(Number(x.time || 0) - Number(m.time || 0)) <= 2 * 60 * 1000;
      });
      if (idxOptimistic >= 0) {
        merged[idxOptimistic] = mergeMessageItem(merged[idxOptimistic], m);
        continue;
      }
    }

    const k = msgKey(m);
    const idxByKey = merged.findIndex((x) => msgKey(x) === k);
    if (idxByKey >= 0) {
      merged[idxByKey] = mergeMessageItem(merged[idxByKey], m);
      continue;
    }

    merged.push(m);
  }

  merged.sort((a, b) => a.time - b.time);
  return merged;
}

function isImageMime(m?: string) {
  return Boolean(m && m.startsWith("image/"));
}

function isAudioMime(m?: string) {
  return Boolean(m && m.startsWith("audio/"));
}

function isVideoMime(m?: string) {
  return Boolean(m && m.startsWith("video/"));
}

function isAllowedImageMime(m?: string) {
  return m === "image/png" || m === "image/jpeg";
}

async function blobToPureBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const res = String(reader.result || "");
      const idx = res.indexOf(",");
      resolve(idx >= 0 ? res.slice(idx + 1) : res);
    };
    reader.readAsDataURL(blob);
  });
}

type PendingAttachment =
  | {
    kind: "image";
    mimeType: string;
    base64: string;
    previewUrl: string;
    fileName?: string;
  }
  | {
    kind: "video";
    mimeType: string;
    base64: string;
    previewUrl: string;
    fileName?: string;
  }
  | {
    kind: "audio";
    mimeType: string;
    base64: string;
    previewUrl: string;
    fileName?: string;
  }
  | {
    kind: "document";
    mimeType: string;
    base64: string;
    fileName: string;
  };

type UserArea = {
  _id?: string;
  name: string;
  description?: string;
};

const BACKEND_LEAD_STATUSES: LeadStatus[] = [
  "new",
  "needs_human",
  "on_following",
  "contacted",
  "negotiating",
  "closed_won",
  "closed_lost",
  "custom",
];
const BACKEND_LEAD_STATUS_SET = new Set<string>(BACKEND_LEAD_STATUSES);
const STATUS_OPTIONS: LeadStatus[] = BACKEND_LEAD_STATUSES;

function normalizeLeadStatus(raw: any): LeadStatus | null {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return null;

  const canonical = value.startsWith("lead_status.")
    ? value.slice("lead_status.".length)
    : value;

  return BACKEND_LEAD_STATUS_SET.has(canonical) ? (canonical as LeadStatus) : null;
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function InboxDialogModal({
  open,
  mode,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  mode: "info" | "confirm";
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 ring-1 ring-emerald-400/30 shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-neutral-200/70 dark:border-neutral-800/70">
          <div className="text-sm font-semibold">{title}</div>
        </div>
        <div className="px-4 py-4 text-sm whitespace-pre-wrap">{message}</div>
        <div className="px-4 py-3 border-t border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-end gap-2">
          {mode === "confirm" && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-200/80 dark:bg-neutral-800/80 hover:bg-neutral-300 dark:hover:bg-neutral-700"
            >
              {cancelText || "Cancelar"}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "px-3 py-1.5 rounded-lg text-xs text-white",
              mode === "confirm"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-emerald-600 hover:bg-emerald-500",
            ].join(" ")}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function LeadActionsModal({
  open,
  onClose,
  title,
  campaignId,
  conversationId,
  areas,
  areasLoading,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  campaignId: string | null;
  conversationId: string | null;
  areas: UserArea[];
  areasLoading: boolean;
}) {
  const { t } = useTranslation("translations");
  const tr = React.useCallback(
    (key: string, fallback: string) => t(key, { defaultValue: fallback }),
    [t],
  );

  const [statusLoading, setStatusLoading] = React.useState<LeadStatus | null>(null);
  const [areaLoading, setAreaLoading] = React.useState<string | null>(null);
  const [nextActionLoading, setNextActionLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [copied, setCopied] = React.useState(false);

  const [customModalOpen, setCustomModalOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  const [selectedArea, setSelectedArea] = React.useState("all");
  const [nextActionText, setNextActionText] = React.useState("");
  const [nextActions, setNextActions] = React.useState<any[]>([]);

  const [loadingLead, setLoadingLead] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<LeadStatus | null>(null);
  const [currentCustomLabel, setCurrentCustomLabel] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setErr(null);
    setCopied(false);
    setStatusLoading(null);
    setAreaLoading(null);
    setNextActionLoading(false);
    setSelectedArea("all");
    setNextActionText("");
    setNextActions([]);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setCustomModalOpen(false);
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open || !campaignId || !conversationId) return;
    let cancelled = false;

    (async () => {
      setLoadingLead(true);
      setErr(null);
      try {
        const lead: any = await getModerationCampaignLead({ campaignId, conversationId });
        if (cancelled) return;

        setCurrentStatus(normalizeLeadStatus(lead?.status));
        setCurrentCustomLabel(String(lead?.customStatusLabel || ""));
        setSelectedArea(String(lead?.area || "all"));
        setNextActions(Array.isArray(lead?.nextAction) ? lead.nextAction : []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "No se pudo cargar el lead");
      } finally {
        if (!cancelled) setLoadingLead(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, campaignId, conversationId]);

  const disabled = !campaignId || !conversationId;

  const doUpdateStatus = React.useCallback(
    async (status: LeadStatus, customStatusLabel?: string) => {
      if (!campaignId || !conversationId) return;
      setErr(null);
      setStatusLoading(status);
      try {
        const updated: any = await updateModerationCampaignLeadStatus({
          campaignId,
          conversationId,
          status,
          customStatusLabel,
        } as any);
        setCurrentStatus(normalizeLeadStatus(updated?.status) || status);
        setCurrentCustomLabel(String(updated?.customStatusLabel || ""));
      } catch (e: any) {
        setErr(e?.message || "Error");
      } finally {
        setStatusLoading(null);
      }
    },
    [campaignId, conversationId],
  );

  const doUpdateArea = React.useCallback(async () => {
    if (!campaignId || !conversationId) return;
    setErr(null);
    setAreaLoading(selectedArea);
    try {
      const updated: any = await updateModerationCampaignLeadArea({
        campaignId,
        conversationId,
        area: selectedArea,
      });
      setSelectedArea(String(updated?.area || selectedArea));
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setAreaLoading(null);

    }
  }, [campaignId, conversationId, selectedArea]);

  const doAppendNextAction = React.useCallback(async () => {
    const trimmed = (nextActionText || "").trim();
    if (!trimmed || !campaignId || !conversationId) return;
    setErr(null);
    setNextActionLoading(true);
    try {
      const updated: any = await appendModerationCampaignLeadNextAction({
        campaignId,
        conversationId,
        text: trimmed,
      });

      if (Array.isArray(updated?.nextAction)) {
        setNextActions(updated.nextAction);
      } else {
        setNextActions((prev) => [
          { text: trimmed, createdAt: new Date().toISOString() },
          ...prev,
        ]);
      }
      setNextActionText("");
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setNextActionLoading(false);
    }
  }, [nextActionText, campaignId, conversationId]);

  const areaOptions = React.useMemo(() => {
    const names = Array.from(new Set(["all", ...areas.map((a) => a.name).filter(Boolean)]));
    return names;
  }, [areas]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 ring-1 ring-emerald-400/30 shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-950/35 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Acciones del lead</div>
            <div className="mt-1 text-xs opacity-70 truncate">{title}</div>
          </div>

          <button
            type="button"
            className="text-xs px-3 py-1 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>
        <div className="rounded-xl ring-1 ring-neutral-200/60 dark:ring-neutral-800/70 bg-white/60 dark:bg-neutral-950/25 p-4 mx-2 mt-2">
          {loadingLead ? (
            <div className="mt-2 text-xs opacity-70">Cargando estado actualâ€¦</div>
          ) : currentStatus ? (
            <div className="mt-2 text-xs opacity-70">
              Estado: <span className="font-semibold">
                {currentStatus === "custom" ? (currentCustomLabel || "custom") : t("lead_status" + '.' + currentStatus)}
              </span>{" "}
              Â· Ãrea: <span className="font-semibold">{t(selectedArea)}</span>
            </div>
          ) : null}
        </div>
        <div className="p-5 grid grid-cols-1 gap-4">
          {disabled ? (
            <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-400/25 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              Para editar un lead necesitÃ¡s tener seleccionada una campaÃ±a y una conversaciÃ³n.
            </div>
          ) : null}

          {/* STATUS */}
          <div className="rounded-xl ring-1 ring-neutral-200/60 dark:ring-neutral-800/70 bg-white/60 dark:bg-neutral-950/25 p-4">
            <div className="text-xs uppercase tracking-wide opacity-70 mb-3">
              {t("stats_status")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_OPTIONS.filter((s) => s !== "custom").map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled || !!statusLoading}
                  className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-500/10 dark:hover:bg-white/5 disabled:opacity-50 ring-1 ring-transparent"
                  onClick={() => doUpdateStatus(s)}
                >
                  <span className="truncate">{t(`lead_status.${s}`)}</span>
                  {statusLoading === s ? <Loader2 className="h-4 w-4 animate-spin opacity-70" /> : null}
                </button>
              ))}

              <button
                type="button"
                disabled={disabled || !!statusLoading}
                className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-500/10 dark:hover:bg-white/5 disabled:opacity-50 ring-1 ring-transparent"
                onClick={() => {
                  setCustomValue("");
                  setCustomModalOpen(true);
                }}
              >
                <span className="truncate">{t("lead_status.custom")}</span>
                <ChevronHint />
              </button>
            </div>
          </div>

          {/* AREA */}
          <div className="rounded-xl ring-1 ring-neutral-200/60 dark:ring-neutral-800/70 bg-white/60 dark:bg-neutral-950/25 p-4">
            <div className="text-xs uppercase tracking-wide opacity-70 mb-3">
              {t("stats_area")}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                disabled={disabled || areasLoading || !!areaLoading}
                className="flex-1 rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60"
              >
                {areaOptions.map((name) => (
                  <option key={name} value={name}>
                    {name === "all" ? t("all") : name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={disabled || areasLoading || !!areaLoading}
                className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                onClick={doUpdateArea}
              >
                {areaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar
              </button>
            </div>

            {areasLoading ? (
              <div className="mt-2 text-xs opacity-70">Cargando Ã¡reasâ€¦</div>
            ) : null}
          </div>

          {/* NEXT ACTION */}
          <div className="rounded-xl ring-1 ring-neutral-200/60 dark:ring-neutral-800/70 bg-white/60 dark:bg-neutral-950/25 p-4">
            <div className="text-xs uppercase tracking-wide opacity-70 mb-3">
              {t("stats_next_action")}
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                value={nextActionText}
                onChange={(e) => setNextActionText(e.target.value)}
                disabled={disabled || nextActionLoading}
                rows={3}
                className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 resize-none"
                placeholder="Agregar prÃ³xima acciÃ³nâ€¦"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={disabled || nextActionLoading || !nextActionText.trim()}
                  className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 inline-flex items-center gap-2"
                  onClick={doAppendNextAction}
                >
                  {nextActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Agregar
                </button>
              </div>

              {nextActions.length ? (
                <div className="mt-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 ring-1 ring-neutral-200/60 dark:ring-neutral-800/70 p-3">
                  <div className="text-xs opacity-70 mb-2">Ãšltimas acciones</div>
                  <ul className="space-y-2">
                    {nextActions
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b?.createdAt || 0).getTime() -
                          new Date(a?.createdAt || 0).getTime(),
                      )
                      .slice(0, 5)
                      .map((na, idx) => (
                        <li key={String(na?._id || idx)} className="text-sm">
                          <div className="whitespace-pre-wrap break-words">{String(na?.text || na?.content || "")}</div>
                          {na?.createdAt ? (
                            <div className="text-[11px] opacity-60 mt-0.5">
                              {new Date(na.createdAt).toLocaleString()}
                            </div>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {err ? (
            <div className="rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20 px-4 py-3 text-sm text-rose-500">
              {err}
            </div>
          ) : null}
        </div>
      </div>

      {customModalOpen ? (
        <div
          className="fixed inset-0 z-[12001] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCustomModalOpen(false);
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCustomModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 ring-1 ring-emerald-400/30 shadow-xl p-5"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-[15px] font-semibold">{t("lead_status.custom")}</h4>
                <p className="text-xs opacity-70 mt-1">{t("lead_status.custom_hint")}</p>
              </div>
              <button
                type="button"
                className="text-xs px-3 py-1 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70"
                onClick={() => setCustomModalOpen(false)}
              >
                {t("close")}
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm opacity-80">{t("lead_status.custom_label")}</label>
              <input
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={t("lead_status.custom_placeholder")}
                className="mt-1 w-full rounded-xl bg-white/80 dark:bg-neutral-950/40 px-3 py-2.5 text-sm ring-1 ring-neutral-200/70 dark:ring-neutral-800/70 outline-none focus:ring-emerald-400/30"
              />
              {countWords(customValue) > 2 ? (
                <div className="mt-2 text-[12px] text-rose-500">{t("lead_status.custom_too_long")}</div>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70"
                onClick={() => setCustomModalOpen(false)}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={disabled || !!statusLoading || !customValue.trim() || countWords(customValue) > 2}
                className="text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                onClick={async () => {
                  await doUpdateStatus("custom", customValue.trim());
                  setCustomModalOpen(false);
                }}
              >
                {statusLoading === "custom" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("saving")}
                  </span>
                ) : (
                  t("save")
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

function StartThreadModal({
  open,
  onClose,
  agentId,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  agentId: string;
  onStarted: (thread: InboxThread, contactId: string) => void;
}) {
  const { t } = useTranslation("translations");
  const tr = React.useCallback(
    (key: string, fallback: string) => t(key, { defaultValue: fallback }),
    [t],
  );
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [force, setForce] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [conflict, setConflict] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 220;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, []);

  React.useEffect(() => {
    if (!open) return;

    setErr(null);
    setConflict(false);
    setLoading(false);
    setPhoneNumber("");
    setName("");
    setText("");
    setForce(false);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    resizeTextarea();
  }, [open, text, resizeTextarea]);

  const doSubmit = React.useCallback(
    async (overrideForce?: boolean) => {
      if (!agentId) {
        setErr(tr("inbox.start_thread.select_campaign_first", "SeleccionÃ¡ una campaÃ±a primero."));
        return;
      }

      const pn = (phoneNumber || "").trim();
      const msg = (text || "").trim();
      const nm = (name || "").trim();

      if (!pn) {
        setErr(tr("inbox.start_thread.enter_phone", "IngresÃ¡ un nÃºmero de telÃ©fono."));
        return;
      }
      if (!msg) {
        setErr(tr("inbox.start_thread.enter_message", "EscribÃ­ el primer mensaje."));
        return;
      }

      setErr(null);
      setConflict(false);
      setLoading(true);

      const body: StartThreadBody = {
        phoneNumber: pn,
        text: msg,
        ...(nm ? { name: nm } : {}),
        force: overrideForce ?? force,
      };

      try {
        const res: any = await startThread(agentId, body);

        const rawThread: any = res?.thread ?? res;
        const rawChannel = normalizeInboxChannel(rawThread?.channel || "whatsapp");
        const normalizedContactId = normalizeContactId(
          rawThread?.contactId ?? res?.contactId ?? res?.jid ?? "",
          rawChannel,
        );

        const thread: InboxThread = rawThread?.agentId
          ? ({
            ...rawThread,
            agentId: rawThread.agentId || agentId,
            channel: rawChannel,
            contactId: normalizeContactId(rawThread.contactId ?? normalizedContactId, rawChannel),
            metadata: rawThread.metadata || {
              takeoverMode: "HUMAN",
              lockedByUserId: null,
              lockedAt: null,
              unreadCount: 0,
              lastMessagePreview: msg,
              lastMessageDirection: "out",
            },
            lastMessageDate: rawThread.lastMessageDate || new Date().toISOString(),
          } as InboxThread)
          : ({
            agentId,
            channel: rawChannel,
            contactId: normalizedContactId,
            name: nm || null,
            lastMessageDate: new Date().toISOString(),
            metadata: {
              takeoverMode: "HUMAN",
              lockedByUserId: null,
              lockedAt: null,
              unreadCount: 0,
              lastMessagePreview: msg,
              lastMessageDirection: "out",
            },
          } as InboxThread);

        if (!isValidContactId(thread.contactId)) {
          throw new Error(tr("inbox.start_thread.no_contact_id", "No se pudo obtener el contactId del thread"));
        }

        onStarted(thread, thread.contactId);
        onClose();
        setText("");
      } catch (e: any) {
        const status = e?.status;
        const message =
          e?.data?.message ||
          e?.data?.error ||
          e?.message ||
          tr("inbox.start_thread.cannot_start", "No se pudo iniciar la conversaciÃ³n");
        setErr(message);
        setConflict(status === 409);
      } finally {
        setLoading(false);
      }
    },
    [agentId, force, name, onClose, onStarted, phoneNumber, text, tr],
  );

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 ring-1 ring-emerald-400/30 shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-950/35 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{tr("inbox.start_thread.title", "Nuevo mensaje")}</div>
            <div className="mt-1 text-xs opacity-70">
              {tr(
                "inbox.start_thread.description",
                "EnviÃ¡ el primer mensaje y se crearÃ¡ la conversaciÃ³n en Inbox (modo humano).",
              )}
            </div>
          </div>

          <button
            type="button"
            className="text-xs px-3 py-1 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70"
            onClick={onClose}
            disabled={loading}
          >
            {t("close")}
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 gap-4">
          {err && (
            <div className="rounded-xl bg-red-500/10 ring-1 ring-red-400/25 px-4 py-3 text-sm text-red-700 dark:text-red-200">
              {err}
              {conflict ? (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => doSubmit(true)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    {tr("inbox.start_thread.force_send", "Forzar takeover y enviar")}
                  </button>
                  <span className="text-xs opacity-80">
                    {tr("inbox.start_thread.force_hint", "(solo si necesitÃ¡s tomar control)")}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <div className="rounded-xl ring-1 ring-neutral-200/60 dark:ring-neutral-800/70 bg-white/60 dark:bg-neutral-950/25 p-4 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs opacity-70">{tr("inbox.start_thread.phone", "TelÃ©fono *")}</span>
                <input
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs opacity-70">{tr("inbox.start_thread.name", "Nombre (opcional)")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-xs opacity-70">{tr("inbox.start_thread.message", "Mensaje *")}</span>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Hola! Te escribo porâ€¦"
                className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 resize-none"
              />
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="mt-1"
              />
              <span>
                {tr(
                  "inbox.start_thread.force_label",
                  "Forzar takeover si la conversaciÃ³n estÃ¡ tomada por otro usuario.",
                )}
                <span className="block text-xs opacity-70">
                  {tr("inbox.start_thread.force_409", "Si no, el backend puede responder 409.")}
                </span>
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-60"
            >
              {tr("cancel", "Cancelar")}
            </button>
            <button
              type="button"
              onClick={() => doSubmit()}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {tr("send", "Enviar")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ChevronHint() {
  return <span className="text-[11px] opacity-70">â€¦</span>;
}

export default function Inbox() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const { t } = useTranslation("translations");
  const tr = React.useCallback(
    (key: string, fallback: string) => t(key, { defaultValue: fallback }),
    [t],
  );
  const executingUserId = getUserId() || "";
  const token = getToken() || "";
  const lastAgentStorageKey = React.useMemo(() => {
    const userKey = normalizeBotId(executingUserId) || "anon";
    return `inbox:lastAgentId:${userKey}`;
  }, [executingUserId]);

  const routeAgentRaw = params.agentId;
  const routeAgentId = React.useMemo(() => {
    if (!routeAgentRaw) return "";
    try {
      return decodeURIComponent(routeAgentRaw);
    } catch {
      return routeAgentRaw;
    }
  }, [routeAgentRaw]);

  const routeAgentKey = React.useMemo(() => normalizeBotId(routeAgentId), [routeAgentId]);

  const [campaigns, setCampaigns] = React.useState<ModerationCampaignItem[]>([]);
  const [agentId, setAgentId] = React.useState<string>(routeAgentKey || "");

  const agentKey = React.useMemo(() => normalizeBotId(agentId ?? ""), [agentId]);
  const selectedCampaign = React.useMemo(() => {
    const a = agentKey;
    if (!a) return null;

    return campaigns.find((c) => getCampaignAgentCandidates(c).includes(a)) || null;
  }, [agentKey, campaigns]);
  const selectedCampaignWhatsappLinked = React.useMemo(
    () => Boolean((selectedCampaign as any)?.whatsappStatus?.qrScanned),
    [selectedCampaign],
  );

  const queryContactId = React.useMemo(() => {
    const raw = new URLSearchParams(location.search).get("contactId") || "";
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [location.search]);

  const queryChannel = React.useMemo(() => {
    const raw = new URLSearchParams(location.search).get("channel") || "";
    if (!raw) return null;
    return normalizeInboxChannel(raw);
  }, [location.search]);

  const selectedCampaignChannels = React.useMemo<InboxChannel[]>(() => {
    const channels = ((selectedCampaign as any)?.channels || [])
      .map((c: any) => normalizeInboxChannel(c))
      .filter((c: InboxChannel) => INBOX_CHANNELS.includes(c));
    return channels.length ? Array.from(new Set(channels)) : INBOX_CHANNELS;
  }, [selectedCampaign]);

  const activeAgentAliases = React.useMemo(() => {
    return new Set(
      [
        agentKey,
        ...(selectedCampaign ? getCampaignAgentCandidates(selectedCampaign) : []),
      ].filter(Boolean),
    );
  }, [agentKey, selectedCampaign]);

  const autoOpenedRef = React.useRef<string | null>(null);

  const [threads, setThreads] = React.useState<InboxThread[]>([]);
  const [threadsLoading, setThreadsLoading] = React.useState(false);
  const [threadsError, setThreadsError] = React.useState<string | null>(null);

  const [threadQuery, setThreadQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | LeadStatus | "untracked">("all");
  const [threadUnreadFilter, setThreadUnreadFilter] = React.useState<"all" | "unread">("all");

  const [leadMiniMap, setLeadMiniMap] = React.useState<Record<string, any>>({});
  const [leadMiniLoading, setLeadMiniLoading] = React.useState(false);

  const [activeContactId, setActiveContactId] = React.useState<string | null>(null);
  const [activeThread, setActiveThread] = React.useState<InboxThread | null>(null);
  const [connectedByChannel, setConnectedByChannel] = React.useState<Partial<Record<InboxChannel, boolean>>>({});

  const [messages, setMessages] = React.useState<InboxMessage[]>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);
  const [editingMessageRequestId, setEditingMessageRequestId] = React.useState<string | null>(null);
  const [messageActionLoadingId, setMessageActionLoadingId] = React.useState<string | null>(null);
  const confirmResolverRef = React.useRef<((value: boolean) => void) | null>(null);
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    mode: "info" | "confirm";
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
  }>({
    open: false,
    mode: "info",
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
  });

  const runtimeAgentAliases = React.useMemo(() => {
    const dynamic = (threads || [])
      .map((t) => normalizeBotId(String((t as any)?.agentId || "")))
      .filter(Boolean);
    const activeThreadAgent = normalizeBotId(String((activeThread as any)?.agentId || ""));

    return new Set([...activeAgentAliases, ...dynamic, activeThreadAgent].filter(Boolean));
  }, [activeAgentAliases, threads, activeThread]);

  const [draft, setDraft] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [pending, setPending] = React.useState<PendingAttachment | null>(null);
  const activeThreadKeyRef = React.useRef<string>("");

  const closeDialog = React.useCallback((result: boolean) => {
    setDialogState((prev) => ({ ...prev, open: false }));
    const resolver = confirmResolverRef.current;
    if (resolver) {
      confirmResolverRef.current = null;
      resolver(result);
    }
  }, []);

  const showInfo = React.useCallback(
    (message: string, title?: string) => {
      const resolver = confirmResolverRef.current;
      if (resolver) {
        confirmResolverRef.current = null;
        resolver(false);
      }
      setDialogState({
        open: true,
        mode: "info",
        title: title || tr("common.notice", "Aviso"),
        message: String(message || ""),
        confirmText: tr("common.ok", "Aceptar"),
        cancelText: tr("cancel", "Cancelar"),
      });
    },
    [tr],
  );

  const showConfirm = React.useCallback(
    (
      message: string,
      opts?: {
        title?: string;
        confirmText?: string;
        cancelText?: string;
      },
    ) =>
      new Promise<boolean>((resolve) => {
        confirmResolverRef.current = resolve;
        setDialogState({
          open: true,
          mode: "confirm",
          title: opts?.title || tr("common.confirm", "Confirmar"),
          message: String(message || ""),
          confirmText: opts?.confirmText || tr("delete", "Eliminar"),
          cancelText: opts?.cancelText || tr("cancel", "Cancelar"),
        });
      }),
    [tr],
  );

  const closeMobileChat = React.useCallback(() => {
    setActiveThread(null);
    setActiveContactId(null);
    setMessages([]);
    setChatError(null);
    setChatLoading(false);
    setDraft("");
    setPending(null);
    setEditingMessageRequestId(null);
    setMessageActionLoadingId(null);

    const base = agentKey ? `/inbox/${encodeURIComponent(agentKey)}` : "/inbox";
    navigate(base, { replace: true });
  }, [agentKey, navigate]);

  React.useEffect(() => {
    if (!activeThread) {
      activeThreadKeyRef.current = "";
      return;
    }
    const cid = normalizeContactId(activeContactId ?? activeThread.contactId, activeThread.channel);
    activeThreadKeyRef.current = threadKey(activeThread.channel, cid);
  }, [activeThread, activeContactId]);

  React.useEffect(() => {
    return () => {
      const resolver = confirmResolverRef.current;
      if (resolver) {
        confirmResolverRef.current = null;
        resolver(false);
      }
    };
  }, []);

  // Lead actions (status/area/next-action) directly from Inbox.
  const [leadModalOpen, setLeadModalOpen] = React.useState(false);
  const [startThreadModalOpen, setStartThreadModalOpen] = React.useState(false);
  const [areas, setAreas] = React.useState<UserArea[]>([]);
  const [areasLoading, setAreasLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setAreasLoading(true);
      try {
        const res = await getMyAreas();
        if (!cancelled) setAreas((res as any) || []);
      } catch (e) {
        // Non-blocking for Inbox
        console.error(e);
      } finally {
        if (!cancelled) setAreasLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    if (!selectedCampaign?.id) {
      setConnectedByChannel({});
      return () => {
        cancelled = true;
      };
    }

    setConnectedByChannel({ whatsapp: selectedCampaignWhatsappLinked });

    (async () => {
      try {
        const accountsData: any = await getModerationAccounts(selectedCampaign.id);
        if (cancelled) return;

        setConnectedByChannel({
          whatsapp: selectedCampaignWhatsappLinked || hasLinkedWhatsappAccount(accountsData),
          instagram: hasLinkedInstagramAccount(accountsData),
          facebook: hasLinkedFacebookAccount(accountsData),
        });
      } catch {
        if (cancelled) return;
        // Fallback: keep WhatsApp from campaign status and avoid false negatives on IG/FB.
        setConnectedByChannel({ whatsapp: selectedCampaignWhatsappLinked });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCampaign?.id, selectedCampaignWhatsappLinked]);

  React.useEffect(() => {
    if (!selectedCampaign?.id) return;
    if (!threads.length) {
      setLeadMiniMap({});
      return;
    }

    let cancelled = false;

    (async () => {
      setLeadMiniLoading(true);
      try {
        const conversationIds = threads.map((t) => {
          const ch = String(t.channel || "whatsapp").toLowerCase();
          return `${selectedCampaign.id}_${ch}_${t.contactId}`;
        });

        const items: any[] = await lookupModerationCampaignLeads({
          campaignId: selectedCampaign.id,
          conversationIds,
        });

        if (cancelled) return;

        const map: Record<string, any> = {};
        for (const it of items || []) {
          if (it?.conversationId) map[it.conversationId] = it;
        }
        setLeadMiniMap(map);
      } catch (e) {
        // silencioso: inbox debe seguir
        console.error(e);
      } finally {
        if (!cancelled) setLeadMiniLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCampaign?.id, threads]);

  const leadConversationId = React.useMemo(() => {
    if (!selectedCampaign?.id || !activeThread) return null;
    const channel = String(activeThread.channel || "whatsapp").toLowerCase();
    return `${selectedCampaign.id}_${channel}_${activeThread.contactId}`;
  }, [selectedCampaign?.id, activeThread]);

  const leadTitle = React.useMemo(() => {
    if (!activeThread) return "";
    return `${threadDisplayName(activeThread)} Â· ${activeThread.channel}`;
  }, [activeThread]);

  const activeThreadChannelMeta = React.useMemo(
    () => (activeThread ? channelBadgeMeta(activeThread.channel) : null),
    [activeThread],
  );
  const activeThreadChannel = React.useMemo(
    () => (activeThread ? normalizeInboxChannel(activeThread.channel) : null),
    [activeThread],
  );
  const isActiveChannelDisconnected = React.useMemo(() => {
    if (!activeThreadChannel) return false;
    const connected = connectedByChannel[activeThreadChannel];
    return connected === false;
  }, [activeThreadChannel, connectedByChannel]);
  const disconnectedChannelMessage = React.useMemo(() => {
    if (!activeThread || !isActiveChannelDisconnected) return "";
    const label = channelBadgeMeta(activeThread.channel).label;
    return tr(
      "inbox.channel_unlinked_readonly",
      `No puedes enviar mensajes: ${label} no esta vinculado en esta campana.`,
    );
  }, [activeThread, isActiveChannelDisconnected, tr]);

  const filteredThreads = React.useMemo(() => {
    const q = (threadQuery || "").trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    return threads.filter((t) => {
      const name = threadDisplayName(t).toLowerCase();
      const cid = String(t.contactId || "").toLowerCase();
      const cidDigits = cid.replace(/\D/g, "");

      const matchesText = !q
        ? true
        : qDigits
          ? cidDigits.includes(qDigits)
          : name.includes(q) || cid.includes(q);

      if (!matchesText) return false;
      const unreadCount = Number((t as any)?.metadata?.unreadCount || 0);
      if (threadUnreadFilter === "unread" && unreadCount <= 0) return false;

      if (!selectedCampaign?.id) return true;
      const convId = `${selectedCampaign.id}_${String(t.channel || "whatsapp").toLowerCase()}_${t.contactId}`;
      const meta = leadMiniMap[convId];
      const leadStatus = normalizeLeadStatus(meta?.status);

      if (statusFilter === "all") return true;
      if (statusFilter === "untracked") return !leadStatus;

      return leadStatus === statusFilter;
    });
  }, [threads, threadQuery, statusFilter, threadUnreadFilter, selectedCampaign?.id, leadMiniMap]);

  const chatScrollRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const isPrependingRef = React.useRef(false);
  const prevScrollHeightRef = React.useRef(0);
  const prevScrollTopRef = React.useRef(0);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recorderStreamRef = React.useRef<MediaStream | null>(null);
  const recorderChunksRef = React.useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);

  const resizeTextarea = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset and fit content.
    el.style.height = "auto";
    const max = 180; // px
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, []);

  React.useEffect(() => {
    resizeTextarea();
  }, [draft, resizeTextarea]);

  // Ensure we stop recording/streams on unmount.
  React.useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {
        // ignore
      }
      try {
        recorderStreamRef.current?.getTracks()?.forEach((t) => t.stop());
      } catch {
        // ignore
      }
      recorderStreamRef.current = null;
    };
  }, []);

  // Cleanup preview URLs when pending changes/unmounts
  const prevPendingRef = React.useRef<PendingAttachment | null>(null);
  React.useEffect(() => {
    const prev = prevPendingRef.current;
    if (prev && "previewUrl" in prev) {
      try {
        URL.revokeObjectURL(prev.previewUrl);
      } catch {
        // ignore
      }
    }
    prevPendingRef.current = pending;
  }, [pending]);

  // Init socket for inbox routing.
  React.useEffect(() => {
    if (!token || !executingUserId) return;
    initSocket({ url: import.meta.env.VITE_API_URL, token, userId: executingUserId });
  }, [token, executingUserId]);

  // Load campaigns for agent selector.
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await searchMyModerationCampaigns({ status: "active" } as any);
        const items = (res?.items || []).filter((c: any) =>
          ((c?.channels as any[]) || []).some((ch) => INBOX_CHANNELS.includes(normalizeInboxChannel(ch))),
        );
        if (!mounted) return;
        setCampaigns(items);

        // Pick initial agentId:
        // 1) from route
        // 2) from localStorage
        // 3) first campaign (prefer modern mod_<campaignId> when available)
        const availableCampaignAgentKeys = new Set(
          (items || []).flatMap((c) => getCampaignAgentCandidates(c)),
        );
        const scopedLast = normalizeBotId(localStorage.getItem(lastAgentStorageKey) || "");
        const legacyLast = normalizeBotId(localStorage.getItem(LEGACY_LAST_AGENT_STORAGE_KEY) || "");
        const last = availableCampaignAgentKeys.has(scopedLast)
          ? scopedLast
          : availableCampaignAgentKeys.has(legacyLast)
            ? legacyLast
            : "";
        const firstCampaignKey = resolveCampaignAgentKey(items?.[0] || null);
        const initialRaw = (routeAgentId || last || firstCampaignKey || "").trim();
        const initialKey = normalizeBotId(initialRaw);
        if (initialKey) {
          setAgentId(initialKey);
          if (!routeAgentRaw) navigate(`/inbox/${encodeURIComponent(initialKey)}`, { replace: true });
        }
      } catch (e: any) {
        // Ignore; user might still select manually once campaigns load.
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [routeAgentId, navigate, lastAgentStorageKey]);

  // Keep internal agentId in sync with route.
  React.useEffect(() => {
    if (routeAgentKey && routeAgentKey !== agentKey) {
      setAgentId(routeAgentKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeAgentKey]);

  const refreshThreads = React.useCallback(async () => {
    if (!agentKey) return;
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const aliases = Array.from(
        new Set([
          agentKey,
          ...(selectedCampaign ? getCampaignAgentCandidates(selectedCampaign) : []),
        ]),
      ).filter(Boolean);

      let pickedAgent = agentKey;
      let bestThreads: InboxThread[] | null = null;
      let lastError: any = null;

      for (const alias of aliases) {
        const settled = await Promise.allSettled(
          selectedCampaignChannels.map((channel) =>
            listThreads(alias, { limit: 100, channel }),
          ),
        );

        const hasSuccess = settled.some((r) => r.status === "fulfilled");
        if (!hasSuccess) {
          const firstRejected = settled.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
          if (firstRejected?.reason) lastError = firstRejected.reason;
          continue;
        }

        const mergedRaw: InboxThread[] = [];
        settled.forEach((r, idx) => {
          if (r.status !== "fulfilled") return;
          const fallbackChannel = selectedCampaignChannels[idx];
          for (const t of r.value || []) {
            const channel = normalizeInboxChannel((t as any)?.channel || fallbackChannel);
            mergedRaw.push({
              ...(t as any),
              channel,
              contactId: normalizeContactId((t as any)?.contactId, channel),
            } as InboxThread);
          }
        });

        const deduped = dedupeThreads(mergedRaw);
        if (!bestThreads || deduped.length > bestThreads.length) {
          bestThreads = deduped;
          pickedAgent = alias;
        }
        if (deduped.length > 0) break;
      }

      if (!bestThreads) throw lastError || new Error("No se pudo cargar la bandeja");

      const ordered = bestThreads.slice().sort((a, b) => {
        const da = new Date(a.lastMessageDate || 0).getTime();
        const db = new Date(b.lastMessageDate || 0).getTime();
        return db - da;
      });

      setThreads(ordered);
      if (pickedAgent !== agentKey) {
        setAgentId(pickedAgent);
        navigate(`/inbox/${encodeURIComponent(pickedAgent)}${location.search || ""}`, { replace: true });
      }
    } catch (e: any) {
      setThreadsError(e?.data?.message || e?.message || tr("inbox.error_load_threads", "No se pudo cargar la bandeja"));
    } finally {
      setThreadsLoading(false);
    }
  }, [agentKey, location.search, navigate, selectedCampaign, selectedCampaignChannels, tr]);

  // Load threads when agent changes.
  React.useEffect(() => {
    if (!agentKey) return;
    localStorage.setItem(lastAgentStorageKey, agentKey);
    localStorage.removeItem(LEGACY_LAST_AGENT_STORAGE_KEY);
    refreshThreads();
    // Reset chat on agent change
    setActiveContactId(null);
    setActiveThread(null);
    setMessages([]);
    setChatError(null);
    setEditingMessageRequestId(null);
    setMessageActionLoadingId(null);
  }, [agentKey, lastAgentStorageKey, refreshThreads]);


  const openThread = React.useCallback(
    async (t: InboxThread) => {
      if (!agentKey) return;

      const channel = normalizeInboxChannel(t.channel);
      const cid = normalizeContactId(t.contactId, channel);
      if (!isValidContactId(cid)) {
        setChatError(tr("inbox.invalid_thread", "Thread invÃ¡lido (contactId vacÃ­o/undefined)."));
        return;
      }

      const baseThread: InboxThread = { ...t, channel, contactId: cid };

      setActiveContactId(cid);
      setActiveThread(baseThread);
      setMessages([]);
      setChatError(null);
      setPending(null);
      setDraft("");
      setChatLoading(true);
      setEditingMessageRequestId(null);
      setMessageActionLoadingId(null);

      try {
        const res: ThreadMessagesResponse = await getThreadMessages(agentKey, cid, {
          limit: 50,
          channel,
        });

        const fetchedThread = res.thread
          ? (() => {
            const fetchedChannel = normalizeInboxChannel((res.thread as any).channel || channel);
            return {
              ...(res.thread as any),
              channel: fetchedChannel,
              contactId: normalizeContactId((res.thread as any).contactId, fetchedChannel),
            } as InboxThread;
          })()
          : null;

        const mergedThread = fetchedThread ? mergeThread(baseThread, fetchedThread) : baseThread;

        // Keep the list thread merged (avoid losing the name when backend returns empty name).
        setThreads((prev) => {
          const key = threadKey(mergedThread.channel, mergedThread.contactId);
          const existing = prev.find((x) => threadKey(x.channel, x.contactId) === key);
          const merged = existing ? mergeThread(existing, mergedThread) : mergedThread;

          const others = prev.filter((x) => threadKey(x.channel, x.contactId) !== key);
          const next = [merged, ...others];
          next.sort((a, b) => new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime());
          return next;
        });

        setActiveThread(mergedThread);
        setMessages((res.messages || []).slice().sort((a, b) => a.time - b.time));

        // Mark read if needed.
        const unread = mergedThread?.metadata?.unreadCount ?? 0;
        if (unread > 0) {
          const mr = await markThreadRead(
            agentKey,
            cid,
            { expectedUnread: unread },
            { channel },
          );

          setThreads((prev) =>
            prev.map((x) =>
              threadKey(x.channel, x.contactId) === threadKey(mergedThread.channel, cid)
                ? { ...x, metadata: { ...x.metadata, unreadCount: mr.unreadCount } }
                : x,
            ),
          );

          setActiveThread((prev) =>
            prev
              ? { ...prev, metadata: { ...prev.metadata, unreadCount: mr.unreadCount } }
              : prev,
          );
        }
      } catch (e: any) {
        setChatError(e?.data?.message || e?.message || tr("inbox.error_load_chat", "No se pudo cargar el chat"));
      } finally {
        setChatLoading(false);
      }
    },
    [agentKey, tr],
  );

  const onThreadStarted = React.useCallback(
    (thread: InboxThread, contactId: string) => {
      if (!agentKey) return;

      const channel = normalizeInboxChannel(thread.channel);
      const cid = normalizeContactId(contactId, channel);
      if (!isValidContactId(cid)) return;

      const t: InboxThread = {
        ...thread,
        agentId: agentKey,
        channel,
        contactId: cid,
      };

      // Pre-mark auto-open to avoid duplicate open from URL effect.
      autoOpenedRef.current = `${agentKey}|${channel}|${cid}`;

      setThreads((prev) => {
        const key = threadKey(t.channel, t.contactId);
        const existing = prev.find((x) => threadKey(x.channel, x.contactId) === key);
        const merged = existing ? mergeThread(existing, t) : t;

        const others = prev.filter((x) => threadKey(x.channel, x.contactId) !== key);
        const next = [merged, ...others];
        next.sort((a, b) => new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime());
        return next;
      });

      // Persist deep-link for refresh/back.
      navigate(
        `/inbox/${encodeURIComponent(agentKey)}?contactId=${encodeURIComponent(cid)}&channel=${encodeURIComponent(channel)}`,
        { replace: true },
      );

      // Open chat immediately.
      openThread(t);
    },
    [agentKey, navigate, openThread],
  );

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "auto") => {
    // scrollIntoView on a bottom sentinel is more reliable than setting scrollTop.
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ block: "end", behavior });
    });
  }, []);

  // Auto-scroll: initial + on new messages. Preserve scroll when loading older messages.
  React.useEffect(() => {
    const el = chatScrollRef.current;
    if (!el || !activeThread) return;

    if (isPrependingRef.current) {
      const newScrollHeight = el.scrollHeight;
      const delta = newScrollHeight - prevScrollHeightRef.current;
      el.scrollTop = prevScrollTopRef.current + delta;
      isPrependingRef.current = false;
      return;
    }

    // Always keep view at the bottom for the MVP.
    scrollToBottom("auto");
  }, [messages.length, activeContactId, activeThread, scrollToBottom]);

  const displayMessages = messages;


  // Auto-open a contact when navigated from Leads -> Inbox (e.g. /inbox/:agentId?contactId=...)
  React.useEffect(() => {
    if (!agentKey || !isValidContactId(queryContactId)) return;

    const fallbackChannel = queryChannel || "whatsapp";
    const qCid = normalizeContactId(queryContactId, fallbackChannel);
    if (!isValidContactId(qCid)) return;

    const queryThreadKey = threadKey(fallbackChannel, qCid);
    const key = `${agentKey}|${queryThreadKey}`;
    if (autoOpenedRef.current === key) return;

    if (activeThread && threadKey(activeThread.channel, activeContactId) === queryThreadKey) {
      autoOpenedRef.current = key;
      return;
    }

    const existing = threads.find((t) => {
      const sameCid = normalizeContactId(t.contactId, t.channel) === qCid;
      if (!sameCid) return false;
      return queryChannel ? normalizeInboxChannel(t.channel) === queryChannel : true;
    });
    if (existing) {
      autoOpenedRef.current = `${agentKey}|${threadKey(existing.channel, existing.contactId)}`;
      openThread(existing);
      return;
    }

    autoOpenedRef.current = key;

    // If not in list (limit), try direct open with a minimal thread stub.
    openThread({
      agentId: agentKey,
      channel: fallbackChannel,
      contactId: qCid,
      name: "",
      lastMessageDate: new Date(0).toISOString(),
      metadata: {
        takeoverMode: "BOT",
        lockedByUserId: null,
        lockedAt: null,
        unreadCount: 0,
        lastMessagePreview: "",
        lastMessageDirection: "in",
      } as any,
    } as any);
  }, [agentKey, queryChannel, queryContactId, threads, openThread, activeContactId, activeThread]);

  const canSend = React.useMemo(() => {
    if (!activeThread) return false;
    if (isActiveChannelDisconnected) return false;

    const md: any = (activeThread as any).metadata || {};
    const takeover = String(md.takeoverMode || "BOT").toUpperCase();
    const lockedBy =
      md.lockedByUserId ?? md.lockedByUserID ?? md.lockedBy ?? md.locked_by_user_id ?? null;

    if (takeover !== "HUMAN") return false;

    // Align with backend: allow send when HUMAN and either unlocked OR locked by me.
    if (!lockedBy) return true;
    return String(lockedBy) === String(executingUserId);
  }, [activeThread, isActiveChannelDisconnected, executingUserId]);

  const isReadOnlyLock = React.useMemo(() => {
    if (!activeThread) return false;

    const md: any = (activeThread as any).metadata || {};
    const takeover = String(md.takeoverMode || "BOT").toUpperCase();
    const lockedBy =
      md.lockedByUserId ?? md.lockedByUserID ?? md.lockedBy ?? md.locked_by_user_id ?? null;

    return takeover === "HUMAN" && Boolean(lockedBy) && String(lockedBy) !== String(executingUserId);
  }, [activeThread, executingUserId]);
  const activeUnreadCount = Number(activeThread?.metadata?.unreadCount || 0);
  const isComposerEditMode = Boolean(editingMessageRequestId);
  const isComposerSendDisabled =
    !activeThread ||
    !canSend ||
    (isComposerEditMode ? !draft.trim() : !pending && !draft.trim());

  const onToggleTakeover = React.useCallback(async () => {
    if (!activeThread || !agentKey) return;

    const activeChannel = normalizeInboxChannel(activeThread.channel);
    const currentCid = normalizeContactId((activeContactId ?? activeThread.contactId) as any, activeChannel);
    if (!isValidContactId(currentCid)) {
      showInfo(tr("inbox.invalid_thread", "Thread invÃ¡lido (contactId vacÃ­o/undefined)."));
      return;
    }

    const md: any = (activeThread as any).metadata || {};
    const takeover = String(md.takeoverMode || "BOT").toUpperCase();
    const nextMode = takeover === "HUMAN" ? "BOT" : "HUMAN";

    try {
      const res = await takeoverThread(
        agentKey,
        currentCid,
        { mode: nextMode, force: false },
        { channel: activeChannel },
      );

      const resChannel = normalizeInboxChannel((res?.thread as any)?.channel || activeChannel);
      const resCid = res?.thread ? normalizeContactId((res.thread as any).contactId, resChannel) : "";
      const safeCid = isValidContactId(resCid) ? resCid : currentCid;

      const nextThread: InboxThread = res?.thread
        ? ({ ...res.thread, channel: resChannel, contactId: safeCid } as any)
        : ({ ...activeThread, channel: activeChannel, contactId: safeCid } as any);

      setActiveThread((prev) => (prev ? mergeThread(prev, nextThread) : nextThread));

      setThreads((prev) => {
        const key = threadKey(activeThread.channel, safeCid);
        return prev.map((x) => (threadKey(x.channel, x.contactId) === key ? mergeThread(x, nextThread) : x));
      });
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || tr("inbox.error_takeover", "No se pudo cambiar el takeover");
      showInfo(msg);
    }
  }, [activeThread, activeContactId, agentKey, tr, showInfo]);

  const onMarkUnread = React.useCallback(async () => {
    if (!activeThread || !agentKey) return;

    const activeChannel = normalizeInboxChannel(activeThread.channel);
    const currentCid = normalizeContactId((activeContactId ?? activeThread.contactId) as any, activeChannel);
    if (!isValidContactId(currentCid)) {
      showInfo(tr("inbox.invalid_thread", "Thread invalido (contactId vacio/undefined)."));
      return;
    }

    const currentUnread = Number((activeThread as any)?.metadata?.unreadCount || 0);

    try {
      const res = await markThreadUnread(
        agentKey,
        currentCid,
        {
          expectedUnread: currentUnread,
          unreadCount: Math.max(1, currentUnread || 1),
        },
        { channel: activeChannel },
      );

      const key = threadKey(activeChannel, currentCid);

      setThreads((prev) =>
        prev.map((x) =>
          threadKey(x.channel, x.contactId) === key
            ? { ...x, metadata: { ...x.metadata, unreadCount: res.unreadCount } }
            : x,
        ),
      );

      setActiveThread((prev) =>
        prev && threadKey(prev.channel, prev.contactId) === key
          ? { ...prev, metadata: { ...prev.metadata, unreadCount: res.unreadCount } }
          : prev,
      );
    } catch (e: any) {
      showInfo(
        e?.data?.message ||
          e?.message ||
          tr("inbox.error_mark_unread", "No se pudo marcar como no leido"),
      );
    }
  }, [activeThread, activeContactId, agentKey, tr, showInfo]);

  const onStartEditMessage = React.useCallback((m: InboxMessage) => {
    const requestId = String(m.requestId || "").trim();
    if (!requestId) return;
    setEditingMessageRequestId(requestId);
    setPending(null);
    setDraft(String(m.content || ""));
    setTimeout(() => {
      try {
        textareaRef.current?.focus();
      } catch {
        // ignore focus issues
      }
    }, 0);
  }, []);

  const onCancelEditMessage = React.useCallback(() => {
    setEditingMessageRequestId(null);
    setDraft("");
  }, []);

  const onConfirmEditMessage = React.useCallback(async () => {
    if (!agentKey || !activeThread || !activeContactId) return;
    const requestId = String(editingMessageRequestId || "").trim();
    const text = draft.trim();
    if (!requestId || !text || isOptimisticRequestId(requestId)) return;

    const activeChannel = normalizeInboxChannel(activeThread.channel);
    if (activeChannel !== "whatsapp") return;
    const normalizedActiveContactId = normalizeContactId(activeContactId, activeChannel);
    if (!isValidContactId(normalizedActiveContactId)) return;

    const current = messages.find((x) => String(x.requestId || "") === requestId);
    if (!current) {
      showInfo(tr("inbox.error_edit_message_not_synced", "Este mensaje aun no se sincronizo. Intentalo en unos segundos."));
      return;
    }
    const ageMs = Date.now() - Number(current.time || 0);
    if (ageMs < 0 || ageMs > WHATSAPP_MESSAGE_ACTION_WINDOW_MS) {
      showInfo(tr("inbox.error_edit_message_window", "La ventana para editar este mensaje ya vencio."));
      setEditingMessageRequestId(null);
      setDraft("");
      return;
    }

    const loadingKey = `edit:${requestId}`;
    setMessageActionLoadingId(loadingKey);
    try {
      const res = await editThreadMessage(
        agentKey,
        normalizedActiveContactId,
        { requestId, text },
        { channel: activeChannel },
      );
      if (res?.message) {
        setMessages((prev) =>
          mergeUniqueMessages(prev, [{ ...(res.message as any), channel: activeChannel }]),
        );
      }
      setEditingMessageRequestId(null);
      setDraft("");
    } catch (e: any) {
      showInfo(e?.data?.message || e?.message || tr("inbox.error_edit_message", "No se pudo editar el mensaje"));
    } finally {
      setMessageActionLoadingId((prev) => (prev === loadingKey ? null : prev));
    }
  }, [editingMessageRequestId, draft, agentKey, activeThread, activeContactId, tr, messages, showInfo]);

  const onDeleteMessage = React.useCallback(
    async (m: InboxMessage) => {
      if (!agentKey || !activeThread || !activeContactId) return;
      const requestId = String(m.requestId || "").trim();
      if (!requestId || isOptimisticRequestId(requestId)) return;

      const activeChannel = normalizeInboxChannel(activeThread.channel);
      if (activeChannel !== "whatsapp") return;
      const normalizedActiveContactId = normalizeContactId(activeContactId, activeChannel);
      if (!isValidContactId(normalizedActiveContactId)) return;
      const ageMs = Date.now() - Number(m.time || 0);
      if (ageMs < 0 || ageMs > WHATSAPP_MESSAGE_ACTION_WINDOW_MS) {
        showInfo(tr("inbox.error_delete_message_window", "La ventana para eliminar este mensaje ya vencio."));
        return;
      }

      const confirmed = await showConfirm(
        tr("inbox.confirm_delete_message", "Â¿Eliminar este mensaje para todos?"),
      );
      if (!confirmed) return;

      const loadingKey = `delete:${requestId}`;
      setMessageActionLoadingId(loadingKey);
      try {
        const res = await deleteThreadMessage(
          agentKey,
          normalizedActiveContactId,
          { requestId },
          { channel: activeChannel },
        );
        if (res?.message) {
          setMessages((prev) =>
            mergeUniqueMessages(prev, [{ ...(res.message as any), channel: activeChannel }]),
          );
        }
      } catch (e: any) {
        showInfo(
          e?.data?.message ||
            e?.message ||
            tr("inbox.error_delete_message", "No se pudo eliminar el mensaje"),
        );
      } finally {
        setMessageActionLoadingId((prev) => (prev === loadingKey ? null : prev));
      }
    },
    [agentKey, activeThread, activeContactId, tr, showInfo, showConfirm],
  );

  const reconcileOptimisticTextMessage = React.useCallback(
    async (params: {
      threadKeyValue: string;
      channel: InboxChannel;
      contactId: string;
      text: string;
      optimisticTime: number;
    }) => {
      if (!agentKey) return;
      const { threadKeyValue, channel, contactId, text, optimisticTime } = params;
      const delays = [1200, 2400, 4000, 6500];

      for (const delayMs of delays) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        if (activeThreadKeyRef.current !== threadKeyValue) return;

        try {
          const res = await getThreadMessages(agentKey, contactId, {
            channel,
            limit: 50,
          });
          if (activeThreadKeyRef.current !== threadKeyValue) return;

          const normalized = (res.messages || []).map((m) => ({ ...m, channel } as InboxMessage));
          setMessages((prev) => mergeUniqueMessages(prev, normalized));

          const hasStable = normalized.some((m) => {
            if (m.role !== "assistant") return false;
            if (isOptimisticRequestId(m.requestId)) return false;
            if (String(m.content || "").trim() !== String(text || "").trim()) return false;
            return Math.abs(Number(m.time || 0) - optimisticTime) <= 3 * 60 * 1000;
          });
          if (hasStable) return;
        } catch {
          // Non-blocking fallback for missed realtime events
        }
      }
    },
    [agentKey],
  );

  const onSend = React.useCallback(async () => {
    if (!agentKey || !activeThread || !activeContactId) return;
    const activeChannel = normalizeInboxChannel(activeThread.channel);
    const normalizedActiveContactId = normalizeContactId(activeContactId, activeChannel);
    if (!isValidContactId(normalizedActiveContactId)) return;
    if (isActiveChannelDisconnected) {
      showInfo(disconnectedChannelMessage || tr("inbox.channel_unlinked_generic", "Canal no vinculado."));
      return;
    }
    if (!canSend) {
      showInfo(
        tr(
          "inbox.must_be_human",
          "TenÃ©s que estar en modo HUMANO para enviar. Si estÃ¡ bloqueado por otro usuario, primero tomÃ¡ el control.",
        ),
      );
      return;
    }

    if (editingMessageRequestId) {
      await onConfirmEditMessage();
      return;
    }

    // Send attachment (with optional caption) OR plain text.
    if (pending) {
      try {
        let body: SendMessageBody;
        const caption = draft.trim() || undefined;

        if (pending.kind === "image") {
          body = { type: "image", text: caption, base64: pending.base64, mimeType: pending.mimeType };
        } else if (pending.kind === "video") {
          body = { type: "video", text: caption, base64: pending.base64, mimeType: pending.mimeType };
        } else if (pending.kind === "audio") {
          body = { type: "audio", base64: pending.base64, mimeType: pending.mimeType };
        } else {
          body = {
            type: "document",
            text: caption,
            base64: pending.base64,
            mimeType: pending.mimeType,
            fileName: pending.fileName,
          };
        }

        await sendMessage(agentKey, normalizedActiveContactId, body, { channel: activeChannel });
        setPending(null);
        setDraft("");
        scrollToBottom("smooth");
      } catch (e: any) {
        showInfo(e?.data?.message || e?.message || tr("inbox.error_send_file", "No se pudo enviar el archivo"));
      }
      return;
    }

    const text = draft.trim();
    if (!text) return;

    const optimisticTime = Date.now();
    const optimistic: InboxMessage = {
      agentId: agentKey,
      userId: executingUserId,
      requestId: `${OPTIMISTIC_REQUEST_ID_PREFIX}${optimisticTime}`,
      role: "assistant",
      content: text,
      time: optimisticTime,
      name: "Human",
      channel: activeChannel,
      profile: { source: "human", authorUserId: executingUserId },
    };

    setMessages((prev) => mergeUniqueMessages(prev, [optimistic]));
    setDraft("");

    try {
      const body: SendMessageBody = { type: "text", text };
      await sendMessage(agentKey, normalizedActiveContactId, body, { channel: activeChannel });
      const expectedThreadKey = threadKey(activeChannel, normalizedActiveContactId);
      void reconcileOptimisticTextMessage({
        threadKeyValue: expectedThreadKey,
        channel: activeChannel,
        contactId: normalizedActiveContactId,
        text,
        optimisticTime,
      });
      scrollToBottom("smooth");
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || tr("inbox.error_send_message", "No se pudo enviar el mensaje");
      showInfo(msg);
    }
  }, [
    draft,
    activeThread,
    activeContactId,
    canSend,
    agentKey,
    executingUserId,
    pending,
    scrollToBottom,
    isActiveChannelDisconnected,
    disconnectedChannelMessage,
    tr,
    reconcileOptimisticTextMessage,
    showInfo,
    editingMessageRequestId,
    onConfirmEditMessage,
  ]);

  const onPickFile = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !activeThread || !activeContactId) return;
      if (isActiveChannelDisconnected) {
        showInfo(disconnectedChannelMessage || tr("inbox.channel_unlinked_generic", "Canal no vinculado."));
        return;
      }
      if (!canSend) {
        showInfo(
          tr(
            "inbox.must_be_human",
            "TenÃ©s que estar en modo HUMANO para enviar. Si estÃ¡ bloqueado por otro usuario, primero tomÃ¡ el control.",
          ),
        );
        return;
      }

      try {
        const mimeType = file.type || "application/octet-stream";

        // RestricciÃ³n de imÃ¡genes (solo png/jpg/jpeg)
        if (isImageMime(mimeType) && !isAllowedImageMime(mimeType)) {
          showInfo(tr("inbox.allowed_images", "Solo se permiten imÃ¡genes PNG, JPG o JPEG."));
          return;
        }

        const ext = (file.name.split(".").pop() || "").toLowerCase();

        if (mimeType === "application/pdf" || ext === "pdf") {
          showInfo(tr("inbox.pdf_not_allowed", "Por ahora no se permite enviar PDF."));
          return;
        }

        if (isVideoMime(mimeType)) {
          showInfo(tr("inbox.video_not_allowed", "Por ahora no se permite enviar videos."));
          return;
        }

        if (isAudioMime(mimeType)) {
          showInfo(tr("inbox.audio_not_allowed", "Por ahora no se permite enviar audios."));
          return;
        }

        const isAllowedDoc =
          mimeType === "text/plain" ||
          mimeType === "application/msword" ||
          mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          mimeType === "application/vnd.ms-excel" ||
          mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          ["txt", "doc", "docx", "xls", "xlsx"].includes(ext);

        // Si no es imagen, solo dejamos pasar docs soportados
        if (!isImageMime(mimeType) && !isAllowedDoc) {
          showInfo(
            tr(
              "inbox.allowed_documents",
              "Solo se permiten archivos Word (.doc/.docx), Excel (.xls/.xlsx) o TXT (.txt).",
            ),
          );
          return;
        }

        // Reemplazar preview anterior
        if (pending && "previewUrl" in pending) {
          URL.revokeObjectURL(pending.previewUrl);
        }

        const base64 = await blobToPureBase64(file);

        if (isImageMime(mimeType)) {
          setPending({ kind: "image", mimeType, base64, previewUrl: URL.createObjectURL(file), fileName: file.name });
          return;
        }

        if (isVideoMime(mimeType)) {
          setPending({ kind: "video", mimeType, base64, previewUrl: URL.createObjectURL(file), fileName: file.name });
          return;
        }

        if (isAudioMime(mimeType)) {
          setPending({ kind: "audio", mimeType, base64, previewUrl: URL.createObjectURL(file), fileName: file.name });
          return;
        }

        // Default: document
        setPending({ kind: "document", mimeType, base64, fileName: file.name });
      } catch (err: any) {
        showInfo(err?.message || tr("inbox.error_read_file", "No se pudo leer el archivo"));
      }
    },
    [activeThread, activeContactId, canSend, pending, tr, isActiveChannelDisconnected, disconnectedChannelMessage, showInfo]
  );

  const stopRecording = React.useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  const startRecording = React.useCallback(async () => {
    if (!activeThread || !activeContactId) return;
    if (isActiveChannelDisconnected) {
      showInfo(disconnectedChannelMessage || tr("inbox.channel_unlinked_generic", "Canal no vinculado."));
      return;
    }
    if (!canSend) {
      showInfo(
        tr(
          "inbox.must_be_human",
          "TenÃ©s que estar en modo HUMANO para enviar. Si estÃ¡ bloqueado por otro usuario, primero tomÃ¡ el control.",
        ),
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showInfo(tr("inbox.no_audio_recording_support", "Tu navegador no soporta grabaciÃ³n de audio."));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderStreamRef.current = stream;
      recorderChunksRef.current = [];

      const preferredTypes = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm"];
      const mimeType = preferredTypes.find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || undefined;
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recorderChunksRef.current.push(ev.data);
      };

      rec.onstop = async () => {
        setIsRecording(false);

        // Stop tracks
        recorderStreamRef.current?.getTracks()?.forEach((t) => t.stop());
        recorderStreamRef.current = null;

        const blob = new Blob(recorderChunksRef.current, { type: rec.mimeType || "audio/webm" });
        recorderChunksRef.current = [];

        // Replace previous preview
        if (pending && "previewUrl" in pending) URL.revokeObjectURL(pending.previewUrl);

        const base64 = await blobToPureBase64(blob);
        const previewUrl = URL.createObjectURL(blob);
        setPending({ kind: "audio", mimeType: blob.type || rec.mimeType || "audio/webm", base64, previewUrl, fileName: "audio" });
      };

      setIsRecording(true);
      rec.start();
    } catch (e: any) {
      setIsRecording(false);
      showInfo(e?.message || tr("inbox.error_start_recording", "No se pudo iniciar la grabaciÃ³n"));
    }
  }, [activeThread, activeContactId, canSend, pending, tr, isActiveChannelDisconnected, disconnectedChannelMessage, showInfo]);


  // Realtime: inbox-thread-updated + inbox-message
  React.useEffect(() => {
    let socket: any;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    const onThreadUpdated = (payload: any) => {
      if (!payload) return;
      if (!agentKey) return;

      const channel = normalizeInboxChannel(payload.channel || payload?.thread?.channel);
      const cid = normalizeContactId(payload.contactId || payload?.thread?.contactId, channel);
      if (!isValidContactId(cid)) return;

      const payloadAgentAliases = extractPayloadAgentAliases(payload);
      const matchesActiveAgent = payloadAgentAliases.some((k) => runtimeAgentAliases.has(k));
      const allowBootstrap = threads.length === 0 && selectedCampaignChannels.includes(channel);
      if (!matchesActiveAgent && !allowBootstrap) return;

      const incoming: InboxThread = {
        agentId: String(payload.agentId || payload?.thread?.agentId || agentKey),
        channel,
        contactId: cid,
        name: payload.name ?? payload?.thread?.name,
        lastMessageDate: payload.lastMessageDate ?? payload?.thread?.lastMessageDate,
        metadata: payload.metadata ?? payload?.thread?.metadata,
      } as any;

      setThreads((prev) => {
        const key = threadKey(incoming.channel, cid);
        const existing = prev.find((t) => threadKey(t.channel, t.contactId) === key);
        const merged = existing ? mergeThread(existing, incoming) : incoming;

        const others = prev.filter((t) => threadKey(t.channel, t.contactId) !== key);
        const next = [merged, ...others];
        next.sort((a, b) => new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime());
        return next;
      });

      setActiveThread((prev) => {
        if (!prev) return prev;
        return threadKey(prev.channel, prev.contactId) === threadKey(incoming.channel, cid) ? mergeThread(prev, incoming) : prev;
      });
    };

    const onInboxMessage = (payload: any) => {
      if (!payload) return;
      if (!agentKey) return;

      const channel = normalizeInboxChannel(payload.channel || payload?.thread?.channel || payload?.message?.channel);
      const cid = normalizeContactId(payload.contactId || payload?.thread?.contactId || payload?.message?.contactId, channel);
      if (!isValidContactId(cid)) return;

      const payloadAgentAliases = extractPayloadAgentAliases(payload);
      const matchesActiveAgent = payloadAgentAliases.some((k) => runtimeAgentAliases.has(k));
      const allowBootstrap = threads.length === 0 && selectedCampaignChannels.includes(channel);
      if (!matchesActiveAgent && !allowBootstrap) return;

      const msg = payload.message as InboxMessage;
      if (!msg) return;

      const action = String(payload.action || "created").toLowerCase();
      const isMutation = action === "updated" || action === "deleted";
      const ts = typeof msg.time === "number" ? msg.time : Date.now();

      // Update preview / ordering, but never overwrite a meaningful name with an empty one.
      setThreads((prev) => {
        const key = threadKey(channel, cid);
        const existing = prev.find((t) => threadKey(t.channel, t.contactId) === key);

        const updatedThread: InboxThread = existing
          ? {
            ...existing,
            contactId: cid,
            lastMessageDate: isMutation
              ? existing.lastMessageDate || new Date(ts).toISOString()
              : new Date(ts).toISOString(),
            metadata: {
              ...existing.metadata,
              lastMessagePreview: msg.content,
              lastMessageDirection: payload.direction,
            },
            // Keep name as-is unless payload provides a meaningful one.
            name: isViableName(payload.name) ? payload.name : existing.name,
          }
          : {
            agentId: String(payload.agentId || payload?.thread?.agentId || agentKey),
            channel,
            contactId: cid,
            name: payload.name,
            lastMessageDate: new Date(ts).toISOString(),
            metadata: {
              takeoverMode: "BOT",
              lockedByUserId: null,
              lockedAt: null,
              unreadCount: 0,
              lastMessagePreview: msg.content,
              lastMessageDirection: payload.direction,
            },
          };

        const merged = existing ? mergeThread(existing, updatedThread) : updatedThread;

        const others = prev.filter((t) => threadKey(t.channel, t.contactId) !== key);
        const next = [merged, ...others] as InboxThread[];
        if (!isMutation) {
          next.sort((a, b) => new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime());
        }
        return next;
      });

      // If chat open, append (deduped).
      const normalizedMsg: InboxMessage = { ...msg, time: ts, channel } as InboxMessage;
      if (activeThread && threadKey(activeThread.channel, activeContactId) === threadKey(channel, cid)) {
        setMessages((prev) => mergeUniqueMessages(prev, [normalizedMsg]));
      }
      if (isMutation && normalizedMsg.requestId && editingMessageRequestId === normalizedMsg.requestId) {
        setEditingMessageRequestId(null);
        setDraft("");
      }
    };

    socket.on("inbox-thread-updated", onThreadUpdated);
    socket.on("inbox-message", onInboxMessage);

    return () => {
      socket.off("inbox-thread-updated", onThreadUpdated);
      socket.off("inbox-message", onInboxMessage);
    };
  }, [runtimeAgentAliases, agentKey, activeContactId, activeThread, selectedCampaignChannels, threads.length, editingMessageRequestId]);

  const loadOlder = React.useCallback(async () => {
    if (!agentKey || !activeThread || !activeContactId) return;
    const oldest = messages[0];
    if (!oldest) return;

    const el = chatScrollRef.current;
    if (el) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;
    }

    try {
      const channel = normalizeInboxChannel(activeThread.channel);
      const res = await getThreadMessages(agentKey, normalizeContactId(activeContactId, channel), {
        limit: 50,
        before: oldest.time,
        channel,
      });
      setMessages((prev) => mergeUniqueMessages(res.messages || [], prev));
    } catch (e: any) {
      showInfo(
        e?.data?.message ||
        e?.message ||
        tr("inbox.error_load_older", "No se pudieron cargar mensajes anteriores"),
      );
    }
  }, [activeThread, activeContactId, messages, agentKey, tr, showInfo]);

  return (
    <OnlineLayout>
      {/* Ocupa todo el espacio disponible dentro del main del layout */}
      <div className="flex pt-4 flex-col h-full -mx-4 -mt-4 lg:mx-0 lg:-mt-6 lg:h-[calc(100vh-56px-1.5rem)] lg:gap-4">

        {/* â”€â”€ Barra superior (header) â”€â”€ visible en desktop y en mobile SOLO cuando no hay chat abierto */}
        <div
          className={[
            "shrink-0 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow ring-1 ring-emerald-400/20",
            "lg:rounded-2xl lg:p-4 lg:mx-0",
            // En mobile: ocultar si hay un chat abierto para ganar espacio
            activeThread ? "hidden lg:block" : "block",
            "p-3",
          ].join(" ")}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="hidden sm:block">
              <h1 className="text-2xl font-semibold tracking-tight">{tr("inbox.title", "Inbox")}</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {tr("inbox.subtitle", "SeleccionÃ¡ una campaÃ±a para ver la bandeja.")}
              </p>
            </div>

            {/* Mobile: tÃ­tulo compacto + controles en una fila */}
            <div className="sm:hidden flex items-center justify-between gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{tr("inbox.title", "Inbox")}</h1>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (!selectedCampaign?.id) return;
                    navigate(`/my_moderation_campaign/${selectedCampaign.id}/statistics`);
                  }}
                  disabled={!selectedCampaign?.id}
                  className="p-2 rounded-lg text-sm bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-60 inline-flex items-center"
                  title={tr("inbox.back_to_stats", "Volver a estadÃ­sticas")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={refreshThreads}
                  disabled={!agentId || threadsLoading}
                  className="px-2.5 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 text-xs font-medium"
                >
                  {tr("reload", "Recargar")}
                </button>
              </div>
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              <select
                value={agentId}
                onChange={(e) => {
                  const v = e.target.value;
                  setAgentId(v);
                  if (v) navigate(`/inbox/${encodeURIComponent(v)}`);
                }}
                className="min-w-[200px] lg:min-w-[260px] rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                <option value="">{tr("inbox.select_campaign_placeholder", "Seleccionar campaÃ±aâ€¦")}</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={resolveCampaignAgentKey(c)}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  if (!selectedCampaign?.id) return;
                  navigate(`/my_moderation_campaign/${selectedCampaign.id}/statistics`);
                }}
                disabled={!selectedCampaign?.id}
                className="px-3 py-2 rounded-lg text-sm bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-60 inline-flex items-center gap-2"
                title={
                  selectedCampaign?.id
                    ? tr("inbox.back_to_stats", "Volver a estadÃ­sticas")
                    : tr("inbox.select_campaign", "SeleccionÃ¡ una campaÃ±a")
                }
              >
                <ArrowLeft className="h-4 w-4" />
                {tr("inbox.back_to_stats", "Volver a estadÃ­sticas")}
              </button>

              <button
                onClick={refreshThreads}
                disabled={!agentId || threadsLoading}
                className="px-3 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {tr("reload", "Recargar")}
              </button>
            </div>

            {/* Mobile: selector de campaÃ±a debajo */}
            <div className="sm:hidden">
              <select
                value={agentId}
                onChange={(e) => {
                  const v = e.target.value;
                  setAgentId(v);
                  if (v) navigate(`/inbox/${encodeURIComponent(v)}`);
                }}
                className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                <option value="">{tr("inbox.select_campaign_placeholder", "Seleccionar campaÃ±aâ€¦")}</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={resolveCampaignAgentKey(c)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {threadsError && (
            <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
              {threadsError}
            </div>
          )}
        </div>

        {/* â”€â”€ Contenedor principal: lista + chat â”€â”€ */}
        <div className="flex flex-col lg:flex-row lg:gap-4 flex-1 min-h-0 overflow-hidden lg:px-0">
          {/* Threads list */}
          <div
            className={[
              "bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl ring-1 ring-emerald-400/20 flex flex-col overflow-hidden",
              "lg:rounded-2xl lg:w-[380px] lg:shrink-0 lg:flex",
              // Mobile: ocupa toda la altura disponible cuando no hay chat. Se oculta cuando hay chat abierto.
              activeThread ? "hidden lg:flex" : "flex w-full h-full",
            ].join(" ")}
          >
            {/* Cabecera de la lista */}
            <div className="px-3 py-3 border-b border-neutral-200/40 dark:border-neutral-800/60 flex items-center justify-between gap-2 bg-[#075E54] dark:bg-[#1a2a27]">
              <div className="text-sm font-semibold text-white">{tr("inbox.conversations", "Conversaciones")}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStartThreadModalOpen(true)}
                  disabled={!agentKey}
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-white/20 text-white hover:bg-white/30 disabled:opacity-60 inline-flex items-center gap-1.5"
                  title={
                    agentKey
                      ? tr("inbox.new_message_tooltip", "Enviar un mensaje a un nuevo contacto")
                      : tr("inbox.select_campaign", "SeleccionÃ¡ una campaÃ±a")
                  }
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">{tr("inbox.new_message", "Nuevo mensaje")}</span>
                  <span className="sm:hidden">{tr("inbox.new", "Nuevo")}</span>
                </button>
                {threadsLoading && <div className="text-xs text-white/70">{tr("loading", "Cargandoâ€¦")}</div>}
              </div>
            </div>

            {/* BÃºsqueda y filtros */}
            <div className="px-3 py-2 border-b border-neutral-200/40 dark:border-neutral-800/60 space-y-2 bg-neutral-50/80 dark:bg-neutral-900/80">
              {leadMiniLoading ? (
                <div className="text-xs text-neutral-500">{tr("inbox.loading_status", "Cargando statusâ€¦")}</div>
              ) : null}

              <input
                value={threadQuery}
                onChange={(e) => setThreadQuery(e.target.value)}
                placeholder={tr("inbox.search_placeholder", "Buscar por nombre o telÃ©fonoâ€¦")}
                className="w-full rounded-full border border-neutral-300/60 dark:border-neutral-700/60 bg-white/90 dark:bg-neutral-950/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />

              <div className="rounded-full border border-neutral-300/60 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-950/60 p-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setThreadUnreadFilter("all")}
                  className={[
                    "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    threadUnreadFilter === "all"
                      ? "bg-emerald-600 text-white"
                      : "bg-transparent text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80",
                  ].join(" ")}
                >
                  {tr("inbox.filter_all_threads", "Todos")}
                </button>
                <button
                  type="button"
                  onClick={() => setThreadUnreadFilter("unread")}
                  className={[
                    "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    threadUnreadFilter === "unread"
                      ? "bg-emerald-600 text-white"
                      : "bg-transparent text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80",
                  ].join(" ")}
                >
                  {tr("inbox.filter_unread_threads", "No leí­dos")}
                </button>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  const next = String(e.target.value || "").trim();
                  if (next === "all" || next === "untracked") {
                    setStatusFilter(next);
                    return;
                  }
                  setStatusFilter(normalizeLeadStatus(next) || "all");
                }}
                className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                <option value="all">{tr("inbox.all_statuses", "Todos los estados")}</option>
                <option value="untracked">{tr("inbox.untracked", "Sin anÃ¡lisis")}</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {t("lead_status" + '.' + s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de threads */}
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 && !threadsLoading ? (
                <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                  {agentId ? tr("inbox.no_conversations", "No hay conversaciones.") : tr("inbox.select_campaign", "SeleccionÃ¡ una campaÃ±a.")}
                </div>
              ) : (
                <ul className="divide-y divide-neutral-200/40 dark:divide-neutral-800/60">
                  {filteredThreads.map((t) => {
                    const isActive = Boolean(activeThread) && threadKey(activeThread?.channel, activeContactId) === threadKey(t.channel, t.contactId);
                    const unread = t.metadata?.unreadCount || 0;
                    const takeover = t.metadata?.takeoverMode;
                    const lockedBy = t.metadata?.lockedByUserId;
                    const chMeta = channelBadgeMeta(t.channel);

                    const initials = threadDisplayName(t)
                      .split(" ")
                      .slice(0, 2)
                      .map((w: string) => w[0] || "")
                      .join("")
                      .toUpperCase();

                    return (
                      <li key={threadKey(t.channel, t.contactId)}>
                        <button
                          onClick={() => openThread(t)}
                          className={[
                            "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                            "hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50",
                            isActive ? "bg-neutral-100/80 dark:bg-neutral-800/60" : "",
                          ].join(" ")}
                        >
                          {/* Avatar circular */}
                          <div
                            className={[
                              "w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white select-none",
                              takeover === "HUMAN" ? "bg-emerald-600" : "bg-neutral-400 dark:bg-neutral-600",
                            ].join(" ")}
                          >
                            {initials || "?"}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                <div className="font-medium text-[15px] truncate text-neutral-900 dark:text-neutral-100 min-w-0">
                                  {threadDisplayName(t)}
                                </div>
                                <span className={chMeta.className} title={chMeta.label}>
                                  {chMeta.short}
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-500 shrink-0">
                                {t.lastMessageDate
                                  ? new Date(t.lastMessageDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : ""}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 mt-0.5 min-w-0">
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate min-w-0 flex-1">
                                {t.metadata?.lastMessagePreview || "â€”"}
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {takeover === "HUMAN" && (
                                  <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/30 hidden sm:inline-block">
                                    H
                                  </span>
                                )}
                                {takeover === "HUMAN" && lockedBy && lockedBy !== executingUserId && (
                                  <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-red-500/10 text-red-600 dark:text-red-300 ring-1 ring-red-400/30 hidden sm:inline-block">
                                    ðŸ”’
                                  </span>
                                )}
                                {unread > 0 && (
                                  <span className="text-[11px] min-w-[20px] text-center rounded-full px-1.5 py-0.5 bg-emerald-600 text-white font-semibold">
                                    {unread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Chat */}
          <div
            className={[
              "bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl ring-1 ring-emerald-400/20 flex flex-col overflow-hidden",
              "lg:rounded-2xl lg:flex-1 lg:min-w-0",
              // Mobile: pantalla completa cuando hay chat activo
              activeThread ? "flex w-full h-full" : "hidden lg:flex",
            ].join(" ")}
          >
            {/* Header del chat estilo WhatsApp */}
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-neutral-200/40 dark:border-neutral-800/60 bg-[#075E54] dark:bg-[#1a2a27]">
              {/* BotÃ³n volver (solo mobile) */}
              {activeThread ? (
                <button
                  type="button"
                  onClick={closeMobileChat}
                  className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-full text-white hover:bg-white/10 transition-colors"
                  title={tr("back", "Volver")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : null}

              {/* Avatar + nombre */}
              {activeThread ? (
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white shrink-0 select-none">
                    {threadDisplayName(activeThread)
                      .split(" ")
                      .slice(0, 2)
                      .map((w: string) => w[0] || "")
                      .join("")
                      .toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[15px] text-white truncate">
                      {threadDisplayName(activeThread)}
                    </div>
                    <div className="text-[11px] text-white/70 truncate flex items-center gap-1.5">
                      <span className="truncate">{activeThread.contactId}</span>
                      {activeThreadChannelMeta && (
                        <span className={activeThreadChannelMeta.className}>{activeThreadChannelMeta.label}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 font-semibold text-white">{tr("inbox.chat", "Chat")}</div>
              )}

              {/* Acciones del chat */}
              <div className="flex items-center gap-1.5 shrink-0">
                {activeThread && (
                  <button
                    onClick={onMarkUnread}
                    disabled={activeUnreadCount > 0}
                    className="px-2.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors bg-white/20 text-white hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    title={
                      activeUnreadCount > 0
                        ? tr("inbox.already_unread", "Ya esta marcado como no leido")
                        : tr("inbox.mark_unread", "Marcar como no leido")
                    }
                  >
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">{tr("inbox.mark_unread_short", "No leido")}</span>
                    <span className="sm:hidden">{tr("inbox.new", "Nuevo")}</span>
                  </button>
                )}

                {activeThread && (
                  <button
                    onClick={() => setLeadModalOpen(true)}
                    disabled={!selectedCampaign?.id}
                    className="p-2 rounded-full text-white hover:bg-white/10 transition-colors disabled:opacity-60 inline-flex items-center justify-center"
                    title={
                      selectedCampaign?.id
                        ? tr("inbox.edit_lead_tooltip", "Editar lead (status / Ã¡rea / prÃ³xima acciÃ³n)")
                        : tr("inbox.edit_lead_need_campaign", "SeleccionÃ¡ la campaÃ±a para obtener el campaignId")
                    }
                  >
                    <ClipboardList className="h-5 w-5" />
                  </button>
                )}

                {activeThread && (
                  <button
                    onClick={onToggleTakeover}
                    disabled={isReadOnlyLock}
                    className={[
                      "px-2.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors",
                      isReadOnlyLock ? "opacity-60 cursor-not-allowed bg-white/10 text-white" : "",
                      activeThread.metadata?.takeoverMode === "HUMAN"
                        ? "bg-white/20 text-white hover:bg-white/30"
                        : "bg-amber-500 text-white hover:bg-amber-400 animate-pulse",
                    ].join(" ")}
                    title={
                      isReadOnlyLock
                        ? tr("inbox.locked_by_other", "Bloqueado por otro usuario")
                        : tr("inbox.toggle_mode", "Cambiar modo (BOT / HUMANO)")
                    }
                  >
                    <ShieldAlert className="h-4 w-4" />
                    {activeThread.metadata?.takeoverMode === "HUMAN" ? (
                      <>
                        <span className="hidden sm:inline">{tr("inbox.human_mode_active", "Modo humano")}</span>
                        <span className="sm:hidden">{tr("inbox.human", "H")}</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">{tr("inbox.takeover_short", "Tomar")}</span>
                        <span className="sm:hidden">Bot</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {chatError && (
              <div className="m-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
                {chatError}
              </div>
            )}

            {/* Ãrea de mensajes â€” fondo estilo WhatsApp */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 min-h-0"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                backgroundColor: "rgba(229,221,213,0.35)",
              }}
            >
              {chatLoading ? (
                <div className="flex justify-center pt-8">
                  <div className="text-sm text-neutral-500 bg-white/70 dark:bg-neutral-800/70 rounded-full px-4 py-2">
                    {tr("loading", "Cargandoâ€¦")}
                  </div>
                </div>
              ) : !activeThread ? (
                <div className="flex justify-center pt-8">
                  <div className="text-sm text-neutral-500 bg-white/70 dark:bg-neutral-800/70 rounded-full px-4 py-2">
                    {tr("inbox.open_conversation", "AbrÃ­ una conversaciÃ³n.")}
                  </div>
                </div>
              ) : (
                <>
                  {messages.length > 0 && (
                    <div className="flex justify-center mb-2">
                      <button
                        onClick={loadOlder}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 shadow-sm"
                      >
                        {tr("inbox.load_older", "Cargar anteriores")}
                      </button>
                    </div>
                  )}

                  {displayMessages.map((m) => {
                    const mine = m.role === "assistant";
                    const requestId = String(m.requestId || "").trim();
                    const isEditing = Boolean(requestId && editingMessageRequestId === requestId);
                    const isBusyEdit = Boolean(requestId && messageActionLoadingId === `edit:${requestId}`);
                    const isBusyDelete = Boolean(requestId && messageActionLoadingId === `delete:${requestId}`);
                    const activeChannel = normalizeInboxChannel(activeThread?.channel || "whatsapp");
                    const isWhatsappThread = activeChannel === "whatsapp";
                    const isHumanOutbound = (m.profile?.source || "bot") === "human";
                    const isOwnAuthor =
                      !m.profile?.authorUserId ||
                      String(m.profile.authorUserId) === String(executingUserId);
                    const isDeleted = Boolean(m.profile?.isDeleted);
                    const hasMedia = Boolean(m.profile?.media);
                    const hasStableRequestId = Boolean(requestId && !isOptimisticRequestId(requestId));
                    const ageMs = Date.now() - Number(m.time || 0);
                    const isWithinActionWindow = ageMs >= 0 && ageMs <= WHATSAPP_MESSAGE_ACTION_WINDOW_MS;
                    const canModerate = Boolean(
                      isWhatsappThread &&
                      mine &&
                      canSend &&
                      isHumanOutbound &&
                      isOwnAuthor &&
                      hasStableRequestId &&
                      isWithinActionWindow,
                    );
                    const canEditMessage = canModerate && !hasMedia && !isDeleted;
                    const canDeleteMessage = canModerate && !isDeleted;

                    return (
                      <div key={msgKey(m)} className={mine ? "flex justify-end" : "flex justify-start"}>
                        <div
                          className={[
                            "max-w-[85%] sm:max-w-[72%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words shadow-sm",
                            mine
                              ? "bg-[#dcf8c6] dark:bg-[#005c4b] text-neutral-900 dark:text-neutral-50 rounded-tr-sm"
                              : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 rounded-tl-sm",
                            isEditing ? "ring-2 ring-emerald-400/60" : "",
                          ].join(" ")}
                        >
                          <span className={isDeleted ? "italic opacity-80" : ""}>{m.content}</span>
                          <div className={["mt-0.5 text-[10px] text-right", mine ? "text-neutral-600/70 dark:text-neutral-300/70" : "text-neutral-500"].join(" ")}>
                            {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {m.profile?.editedAt ? `· ${tr("inbox.edited", "editado")}` : ""}
                          </div>
                          {(canEditMessage || canDeleteMessage) && (
                            <div className="mt-1 flex items-center justify-end gap-1">
                              {canEditMessage && (
                                <button
                                  type="button"
                                  onClick={() => onStartEditMessage(m)}
                                  disabled={isBusyEdit || isBusyDelete}
                                  className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-60"
                                  title={tr("inbox.edit_message", "Editar mensaje")}
                                >
                                  {isBusyEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              {canDeleteMessage && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteMessage(m)}
                                  disabled={isBusyEdit || isBusyDelete}
                                  className="p-1 rounded-md hover:bg-red-500/15 text-red-600 dark:text-red-300 disabled:opacity-60"
                                  title={tr("inbox.delete_message", "Eliminar mensaje")}
                                >
                                  {isBusyDelete ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Composer */}
            <div className="px-2 py-2 border-t border-neutral-200/40 dark:border-neutral-800/60 bg-neutral-50/90 dark:bg-neutral-900/90">
              {isActiveChannelDisconnected && (
                <div className="mb-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-200">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{disconnectedChannelMessage}</span>
                  </div>
                </div>
              )}
              {!isActiveChannelDisconnected && activeThread?.metadata?.takeoverMode === "BOT" && (
                <div className="mb-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-200">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{tr("inbox.reply_requires_human", "Para responder, activÃ¡ el modo humano.")}</span>
                  </div>
                  <button
                    onClick={onToggleTakeover}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500"
                    title={tr("inbox.activate_human", "Activar modo humano")}
                  >
                    {tr("inbox.takeover_short", "Tomar")}
                  </button>
                </div>
              )}

              {isReadOnlyLock && (
                <div className="mb-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-300 px-1">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  {tr("inbox.read_only_locked", "Bloqueado por otro usuario. Solo lectura.")}
                </div>
              )}

              {isComposerEditMode && (
                <div className="mb-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                      {tr("inbox.edit_mode_active", "Editando mensaje")}
                    </div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-200/80 truncate">
                      {tr("inbox.edit_mode_hint", "Modifica el texto y presiona Guardar.")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelEditMessage}
                    className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-white/70 dark:bg-neutral-900/60 hover:bg-white dark:hover:bg-neutral-800"
                  >
                    {tr("cancel", "Cancelar")}
                  </button>
                </div>
              )}

              {pending && (
                <div className="mb-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/40 p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {pending.kind === "image" && (
                        <img
                          src={pending.previewUrl}
                          alt="preview"
                          className="max-h-[180px] w-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800/60"
                        />
                      )}
                      {pending.kind === "video" && (
                        <video
                          src={pending.previewUrl}
                          controls
                          className="max-h-[180px] w-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800/60"
                        />
                      )}
                      {pending.kind === "audio" && (
                        <audio src={pending.previewUrl} controls className="w-full" />
                      )}
                      {pending.kind === "document" && (
                        <div className="text-sm truncate">
                          <span className="font-medium">Documento:</span> {pending.fileName}
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-neutral-500 truncate">
                        {pending.mimeType}
                      </div>
                    </div>

                    <button
                      onClick={() => setPending(null)}
                      className="p-1.5 rounded-full hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70"
                      title="Quitar adjunto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Barra de escritura estilo WhatsApp */}
              <div className="flex items-end gap-2">
                <button
                  onClick={onPickFile}
                  disabled={!activeThread || !canSend || isComposerEditMode}
                  className="p-2.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 shrink-0"
                  title={
                    isComposerEditMode
                      ? tr("inbox.attach_disabled_while_editing", "Adjuntar deshabilitado durante edicion")
                      : tr("inbox.attach", "Adjuntar")
                  }
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <button
                  onClick={() => {
                    if (pending && (pending.kind === "video" || pending.kind === "image")) {
                      // no-op
                    }
                  }}
                  disabled
                  className="hidden"
                >
                  <Video className="h-5 w-5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  rows={1}
                  disabled={!activeThread || !canSend}
                  placeholder={
                    !activeThread
                      ? tr("inbox.select_conversation", "SeleccionÃ¡ una conversaciÃ³nâ€¦")
                      : isActiveChannelDisconnected
                        ? tr(
                          "inbox.channel_unlinked_placeholder",
                          "No puedes responder: este canal ya no esta vinculado.",
                        )
                        : !canSend
                        ? tr(
                          "inbox.activate_human_to_reply",
                          "ActivÃ¡ modo humano para responder.",
                        )
                        : isComposerEditMode
                        ? tr("inbox.edit_message_placeholder", "Edita el mensaje...")
                        : tr(
                          "inbox.write_message_placeholder",
                          "EscribÃ­ un mensajeâ€¦",
                        )
                  }
                  className="flex-1 rounded-2xl border border-neutral-300/60 dark:border-neutral-700/60 bg-white dark:bg-neutral-950/80 px-4 py-2.5 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 resize-none min-h-[42px]"
                />
                <button
                  onClick={onSend}
                  disabled={isComposerSendDisabled}
                  className="p-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shrink-0"
                  title={isComposerEditMode ? tr("inbox.save_edit", "Guardar edicion") : tr("send", "Enviar")}
                >
                  {isComposerEditMode ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileChange}
                accept="image/png,image/jpeg,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.txt,.doc,.docx,.xls,.xlsx"
              />
            </div>
          </div>
        </div>
      </div>

      <InboxDialogModal
        open={dialogState.open}
        mode={dialogState.mode}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />

      <LeadActionsModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title={leadTitle}
        campaignId={selectedCampaign?.id || null}
        conversationId={leadConversationId}
        areas={areas}
        areasLoading={areasLoading}
      />

      <StartThreadModal
        open={startThreadModalOpen}
        onClose={() => setStartThreadModalOpen(false)}
        agentId={agentKey}
        onStarted={onThreadStarted}
      />
    </OnlineLayout>
  );
}


