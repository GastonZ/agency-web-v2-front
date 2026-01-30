import * as React from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  Check,
  Loader2,
  Mic,
  Paperclip,
  Send,
  ShieldAlert,
  Square,
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
} from "../services/campaigns";
import { getMyAreas } from "../services/subaccounts";
import type { LeadStatus, ModerationCampaignItem } from "../services/types/moderation-types";
import {
  listThreads,
  getThreadMessages,
  markThreadRead,
  sendMessage,
  takeoverThread,
  type InboxThread,
  type InboxMessage,
  type ThreadMessagesResponse,
  type SendMessageBody,
} from "../services/inbox";

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

function isValidContactId(v: any): v is string {
  const s = String(v ?? "").trim();
  if (!s) return false;
  if (s === "undefined" || s === "null") return false;
  return true;
}

function normalizeContactId(raw: any): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s || s === "undefined" || s === "null") return "";

  // WhatsApp: normalize domain and strip non-digits from user part.
  if (s.includes("@")) {
    const [user, domainRaw] = s.split("@");
    const domain = String(domainRaw || "").trim().toLowerCase();
    const digits = String(user || "").replace(/\D/g, "");
    if (digits) {
      if (domain === "c.us" || domain === "s.whatsapp.net") return `${digits}@s.whatsapp.net`;
      return `${digits}@${domain}`;
    }
    return s;
  }

  const digits = s.replace(/\D/g, "");
  return digits ? `${digits}@s.whatsapp.net` : s;
}

function threadKey(channel: any, contactId: any): string {
  return `${String(channel || "").toLowerCase()}|${normalizeContactId(contactId)}`;
}

function mergeThread(prev: InboxThread, next: InboxThread): InboxThread {
  const nextNameOk = isViableName(next.name);
  const prevNameOk = isViableName(prev.name);

  const merged: InboxThread = {
    ...prev,
    ...next,
    channel: (next.channel ?? prev.channel) as any,
    contactId: normalizeContactId(next.contactId ?? prev.contactId),
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
    const key = threadKey(t.channel, t.contactId);
    if (!key.endsWith("|")) {
      const prev = map.get(key);
      map.set(
        key,
        prev ? mergeThread(prev, { ...t, contactId: normalizeContactId(t.contactId) }) : { ...t, contactId: normalizeContactId(t.contactId) },
      );
    }
  }
  return Array.from(map.values());
}

function isViableName(name?: string | null): boolean {
  const n = (name ?? "").trim();
  if (!n) return false;
  const lower = n.toLowerCase();
  // Backend sometimes sets the contact name as "Whatsapp"; treat that as non-meaningful.
  if (lower === "whatsapp" || lower === "whats app" || lower === "wa") return false;
  return true;
}

function formatContactId(contactId: string): string {
  if (!contactId) return "—";
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
  return isViableName(t.name) ? (t.name as string) : formatContactId(t.contactId);
}

function msgKey(m: InboxMessage): string {
  // No explicit id is provided; dedupe based on stable fields.
  const media = m.profile?.media ? `${m.profile.media.type}:${m.profile.media.mimeType || ""}` : "";
  return `${m.time}:${m.role}:${m.content || ""}:${media}`;
}

function mergeUniqueMessages(prev: InboxMessage[], next: InboxMessage[]): InboxMessage[] {
  if (!next.length) return prev;
  const seen = new Set(prev.map(msgKey));
  const merged = [...prev];
  for (const m of next) {
    const k = msgKey(m);
    if (seen.has(k)) continue;
    seen.add(k);
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

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "on_following",
  "contacted",
  "negotiating",
  "closed_won",
  "closed_lost",
  "custom",
];

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

        setCurrentStatus(lead?.status || null);
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
        setCurrentStatus(updated?.status || status);
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
            <div className="mt-2 text-xs opacity-70">Cargando estado actual…</div>
          ) : currentStatus ? (
            <div className="mt-2 text-xs opacity-70">
              Estado: <span className="font-semibold">
                {currentStatus === "custom" ? (currentCustomLabel || "custom") : t("lead_status" + '.' + currentStatus)}
              </span>{" "}
              · Área: <span className="font-semibold">{t(selectedArea)}</span>
            </div>
          ) : null}
        </div>
        <div className="p-5 grid grid-cols-1 gap-4">
          {disabled ? (
            <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-400/25 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              Para editar un lead necesitás tener seleccionada una campaña y una conversación.
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
              <div className="mt-2 text-xs opacity-70">Cargando áreas…</div>
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
                placeholder="Agregar próxima acción…"
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
                  <div className="text-xs opacity-70 mb-2">Últimas acciones</div>
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

function ChevronHint() {
  return <span className="text-[11px] opacity-70">…</span>;
}

export default function Inbox() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const { t } = useTranslation("translations");
  const executingUserId = getUserId() || "";
  const token = getToken() || "";

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

    return (
      campaigns.find((c) => normalizeBotId(String((c as any)?.agentId ?? "")) === a) ||
      campaigns.find((c) => normalizeBotId(String((c as any)?.botId ?? "")) === a) ||
      campaigns.find((c) => normalizeBotId(c.name) === a) ||
      campaigns.find((c) => normalizeBotId(String((c as any)?.assistantName ?? "")) === a) ||
      null
    );
  }, [agentKey, campaigns]);

  const queryContactId = React.useMemo(() => {
    const raw = new URLSearchParams(location.search).get("contactId") || "";
    if (!raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [location.search]);

  const autoOpenedRef = React.useRef<string | null>(null);

  const [threads, setThreads] = React.useState<InboxThread[]>([]);
  const [threadsLoading, setThreadsLoading] = React.useState(false);
  const [threadsError, setThreadsError] = React.useState<string | null>(null);

  const [threadQuery, setThreadQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | LeadStatus | "untracked">("all");

  const [leadMiniMap, setLeadMiniMap] = React.useState<Record<string, any>>({});
  const [leadMiniLoading, setLeadMiniLoading] = React.useState(false);

  const [activeContactId, setActiveContactId] = React.useState<string | null>(null);
  const [activeThread, setActiveThread] = React.useState<InboxThread | null>(null);

  const [messages, setMessages] = React.useState<InboxMessage[]>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);

  const [draft, setDraft] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [pending, setPending] = React.useState<PendingAttachment | null>(null);

  // Lead actions (status/area/next-action) directly from Inbox.
  const [leadModalOpen, setLeadModalOpen] = React.useState(false);
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
    return `${threadDisplayName(activeThread)} · ${activeThread.channel}`;
  }, [activeThread]);

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

      if (!selectedCampaign?.id) return true;
      const convId = `${selectedCampaign.id}_${String(t.channel || "whatsapp").toLowerCase()}_${t.contactId}`;
      const meta = leadMiniMap[convId];

      if (statusFilter === "all") return true;
      if (statusFilter === "untracked") return !meta?.status;

      return meta?.status === statusFilter;
    });
  }, [threads, threadQuery, statusFilter, selectedCampaign?.id, leadMiniMap]);

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
        const items = (res?.items || []).filter((c) => (c.channels || []).includes("whatsapp"));
        if (!mounted) return;
        setCampaigns(items);

        // Pick initial agentId:
        // 1) from route
        // 2) from localStorage
        // 3) first whatsapp campaign
        const last = localStorage.getItem("inbox:lastAgentId") || "";
        const initialRaw = (routeAgentId || last || items?.[0]?.name || "").trim();
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
  }, [routeAgentId, navigate]);

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
      const data = await listThreads(agentKey, { limit: 100, channel: "whatsapp" });

      // Normalize + dedupe by (channel, contactId) to avoid duplicates and "ghost threads".
      const normalized = dedupeThreads(
        (data || []).map((t: any) => ({ ...t, contactId: normalizeContactId(t.contactId) })),
      );

      const ordered = normalized.slice().sort((a, b) => {
        const da = new Date(a.lastMessageDate || 0).getTime();
        const db = new Date(b.lastMessageDate || 0).getTime();
        return db - da;
      });

      setThreads(ordered);
      (ordered);
    } catch (e: any) {
      setThreadsError(e?.data?.message || e?.message || "No se pudo cargar la bandeja");
    } finally {
      setThreadsLoading(false);
    }
  }, [agentKey]);

  // Load threads when agent changes.
  React.useEffect(() => {
    if (!agentKey) return;
    localStorage.setItem("inbox:lastAgentId", agentKey);
    refreshThreads();
    // Reset chat on agent change
    setActiveContactId(null);
    setActiveThread(null);
    setMessages([]);
    setChatError(null);
  }, [agentKey, refreshThreads]);


  const openThread = React.useCallback(
    async (t: InboxThread) => {
      if (!agentKey) return;

      const cid = normalizeContactId(t.contactId);
      if (!isValidContactId(cid)) {
        setChatError("Thread inválido (contactId vacío/undefined).");
        return;
      }

      const baseThread: InboxThread = { ...t, contactId: cid };

      setActiveContactId(cid);
      setActiveThread(baseThread);
      setMessages([]);
      setChatError(null);
      setPending(null);
      setDraft("");
      setChatLoading(true);

      try {
        const res: ThreadMessagesResponse = await getThreadMessages(agentKey, cid, {
          limit: 50,
          channel: "whatsapp",
        });

        const fetchedThread = res.thread
          ? ({ ...res.thread, contactId: normalizeContactId(res.thread.contactId) } as InboxThread)
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
            { channel: "whatsapp" },
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
        setChatError(e?.data?.message || e?.message || "No se pudo cargar el chat");
      } finally {
        setChatLoading(false);
      }
    },
    [agentKey],
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

  // Hot-fix: ocultar duplicados consecutivos (mismo content + role)
  const displayMessages = React.useMemo(() => {
    let prevContent = "";
    let prevRole: string | null = null;

    return messages.filter((m) => {
      const c = (m.content ?? "").trim();
      const r = m.role ?? null;

      if (!c) {
        prevContent = "";
        prevRole = null;
        return true;
      }

      const isDup = c === prevContent && r === prevRole;
      if (isDup) return false;

      prevContent = c;
      prevRole = r;
      return true;
    });
  }, [messages]);


  // Auto-open a contact when navigated from Leads -> Inbox (e.g. /inbox/:agentId?contactId=...)
  React.useEffect(() => {
    if (!agentKey || !isValidContactId(queryContactId)) return;

    const qCid = normalizeContactId(queryContactId);
    if (!isValidContactId(qCid)) return;

    const key = `${agentKey}|${qCid}`;
    if (autoOpenedRef.current === key) return;

    if (activeContactId && normalizeContactId(activeContactId) === qCid) {
      autoOpenedRef.current = key;
      return;
    }

    const existing = threads.find((t) => normalizeContactId(t.contactId) === qCid);
    if (existing) {
      autoOpenedRef.current = key;
      openThread(existing);
      return;
    }

    autoOpenedRef.current = key;

    // If not in list (limit), try direct open with a minimal thread stub.
    openThread({
      agentId: agentKey,
      channel: "whatsapp",
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
  }, [agentKey, queryContactId, threads, openThread, activeContactId]);

  const canSend = React.useMemo(() => {
    if (!activeThread) return false;

    const md: any = (activeThread as any).metadata || {};
    const takeover = String(md.takeoverMode || "BOT").toUpperCase();
    const lockedBy =
      md.lockedByUserId ?? md.lockedByUserID ?? md.lockedBy ?? md.locked_by_user_id ?? null;

    if (takeover !== "HUMAN") return false;

    // Align with backend: allow send when HUMAN and either unlocked OR locked by me.
    if (!lockedBy) return true;
    return String(lockedBy) === String(executingUserId);
  }, [activeThread, executingUserId]);

  const isReadOnlyLock = React.useMemo(() => {
    if (!activeThread) return false;

    const md: any = (activeThread as any).metadata || {};
    const takeover = String(md.takeoverMode || "BOT").toUpperCase();
    const lockedBy =
      md.lockedByUserId ?? md.lockedByUserID ?? md.lockedBy ?? md.locked_by_user_id ?? null;

    return takeover === "HUMAN" && Boolean(lockedBy) && String(lockedBy) !== String(executingUserId);
  }, [activeThread, executingUserId]);

  const onToggleTakeover = React.useCallback(async () => {
    if (!activeThread || !agentKey) return;
    const md = activeThread.metadata;
    const nextMode = md.takeoverMode === "HUMAN" ? "BOT" : "HUMAN";
    try {
      const res = await takeoverThread(
        agentKey,
        normalizeContactId(activeThread.contactId),
        { mode: nextMode, force: false },
        { channel: "whatsapp" },
      );

      const nextThread: InboxThread = res.thread
        ? ({ ...res.thread, contactId: normalizeContactId((res.thread as any).contactId) } as any)
        : (activeThread as any);

      setActiveThread((prev) => (prev ? mergeThread(prev, nextThread) : nextThread));

      setThreads((prev) => {
        const key = threadKey(activeThread.channel, activeThread.contactId);
        return prev.map((x) => (threadKey(x.channel, x.contactId) === key ? mergeThread(x, nextThread) : x));
      });
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "No se pudo cambiar el takeover";
      alert(msg);
    }
  }, [activeThread, agentKey]);

  const onSend = React.useCallback(async () => {
    if (!agentKey || !activeThread || !activeContactId) return;
    if (!canSend) {
      alert("Tenés que estar en modo HUMANO para enviar. Si está bloqueado por otro usuario, primero tomá el control.");
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

        await sendMessage(agentKey, normalizeContactId(activeContactId), body, { channel: "whatsapp" });
        setPending(null);
        setDraft("");
        scrollToBottom("smooth");
      } catch (e: any) {
        alert(e?.data?.message || e?.message || "No se pudo enviar el archivo");
      }
      return;
    }

    const text = draft.trim();
    if (!text) return;

    const optimistic: InboxMessage = {
      agentId: agentKey,
      userId: executingUserId,
      role: "assistant",
      content: text,
      time: Date.now(),
      name: "Human",
      channel: "whatsapp",
      profile: { source: "human", authorUserId: executingUserId },
    };

    setMessages((prev) => mergeUniqueMessages(prev, [optimistic]));
    setDraft("");

    try {
      const body: SendMessageBody = { type: "text", text };
      await sendMessage(agentKey, normalizeContactId(activeContactId), body, { channel: "whatsapp" });
      scrollToBottom("smooth");
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "No se pudo enviar el mensaje";
      alert(msg);
    }
  }, [draft, activeThread, activeContactId, canSend, agentKey, agentId, executingUserId, pending, scrollToBottom]);

  const onPickFile = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !activeThread || !activeContactId) return;
      if (!canSend) {
        alert("Tenés que estar en modo HUMANO para enviar. Si está bloqueado por otro usuario, primero tomá el control.");
        return;
      }

      try {
        const mimeType = file.type || "application/octet-stream";

        // Restricción de imágenes (solo png/jpg/jpeg)
        if (isImageMime(mimeType) && !isAllowedImageMime(mimeType)) {
          alert("Solo se permiten imágenes PNG, JPG o JPEG.");
          return;
        }

        const ext = (file.name.split(".").pop() || "").toLowerCase();

        if (mimeType === "application/pdf" || ext === "pdf") {
          alert("Por ahora no se permite enviar PDF.");
          return;
        }

        if (isVideoMime(mimeType)) {
          alert("Por ahora no se permite enviar videos.");
          return;
        }

        if (isAudioMime(mimeType)) {
          alert("Por ahora no se permite enviar audios.");
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
          alert("Solo se permiten archivos Word (.doc/.docx), Excel (.xls/.xlsx) o TXT (.txt).");
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
        alert(err?.message || "No se pudo leer el archivo");
      }
    },
    [activeThread, activeContactId, canSend, pending]
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
    if (!canSend) {
      alert("Tenés que estar en modo HUMANO para enviar. Si está bloqueado por otro usuario, primero tomá el control.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Tu navegador no soporta grabación de audio.");
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
      alert(e?.message || "No se pudo iniciar la grabación");
    }
  }, [activeThread, activeContactId, canSend, pending]);


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
      if (normalizeBotId(String(payload.agentId || "")) !== agentKey) return;

      const cid = normalizeContactId(payload.contactId);
      if (!isValidContactId(cid)) return;

      const incoming: InboxThread = {
        agentId: agentKey,
        channel: payload.channel || "whatsapp",
        contactId: cid,
        name: payload.name,
        lastMessageDate: payload.lastMessageDate,
        metadata: payload.metadata,
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
      if (normalizeBotId(String(payload.agentId || "")) !== agentKey) return;

      const cid = normalizeContactId(payload.contactId);
      if (!isValidContactId(cid)) return;

      const msg = payload.message as InboxMessage;
      if (!msg) return;

      const ts = typeof msg.time === "number" ? msg.time : Date.now();

      // Update preview / ordering, but never overwrite a meaningful name with an empty one.
      setThreads((prev) => {
        const key = threadKey(payload.channel || "whatsapp", cid);
        const existing = prev.find((t) => threadKey(t.channel, t.contactId) === key);

        const updatedThread: InboxThread = existing
          ? {
            ...existing,
            contactId: cid,
            lastMessageDate: new Date(ts).toISOString(),
            metadata: {
              ...existing.metadata,
              lastMessagePreview: msg.content,
              lastMessageDirection: payload.direction,
            },
            // Keep name as-is unless payload provides a meaningful one.
            name: isViableName(payload.name) ? payload.name : existing.name,
          }
          : {
            agentId: agentKey,
            channel: payload.channel || "whatsapp",
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
        const next = [merged, ...others];
        next.sort((a, b) => new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime());
        return next;
      });

      // If chat open, append (deduped).
      if (activeContactId && normalizeContactId(activeContactId) === cid) {
        setMessages((prev) => mergeUniqueMessages(prev, [msg]));
      }
    };

    socket.on("inbox-thread-updated", onThreadUpdated);
    socket.on("inbox-message", onInboxMessage);

    return () => {
      socket.off("inbox-thread-updated", onThreadUpdated);
      socket.off("inbox-message", onInboxMessage);
    };
  }, [agentKey, activeContactId]);

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
      const res = await getThreadMessages(agentKey, normalizeContactId(activeContactId), {
        limit: 50,
        before: oldest.time,
        channel: "whatsapp",
      });
      setMessages((prev) => mergeUniqueMessages(res.messages || [], prev));
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "No se pudieron cargar mensajes anteriores");
    }
  }, [activeThread, activeContactId, messages, agentKey]);

  return (
    <OnlineLayout>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl ring-1 ring-emerald-400/20 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Seleccioná una campaña para ver la bandeja.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={agentId}
                onChange={(e) => {
                  const v = e.target.value;
                  setAgentId(v);
                  if (v) navigate(`/inbox/${encodeURIComponent(v)}`);
                }}
                className="min-w-[260px] rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                <option value="">Seleccionar campaña…</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={normalizeBotId(c.name)}>
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
                title={selectedCampaign?.id ? "Volver a estadísticas" : "Seleccioná una campaña"}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a estadísticas
              </button>

              <button
                onClick={refreshThreads}
                disabled={!agentId || threadsLoading}
                className="px-3 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                Recargar
              </button>
            </div>
          </div>

          {threadsError && (
            <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
              {threadsError}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100dvh-260px)] min-h-[520px]">
          {/* Threads list */}
          <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl ring-1 ring-emerald-400/20 overflow-hidden flex flex-col h-full min-h-0">
            <div className="p-3 border-b border-neutral-200/40 dark:border-neutral-800/60 flex items-center justify-between">
              <div className="text-sm font-medium">Conversaciones</div>
              {threadsLoading && <div className="text-xs text-neutral-500">Cargando…</div>}
            </div>
            <div className="p-3 border-b border-neutral-200/40 dark:border-neutral-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Conversaciones</div>
                {leadMiniLoading ? <div className="text-xs text-neutral-500">Cargando status…</div> : null}
              </div>

              <input
                value={threadQuery}
                onChange={(e) => setThreadQuery(e.target.value)}
                placeholder="Buscar por nombre o teléfono…"
                className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                <option value="all">Todos los estados</option>
                <option value="untracked">Sin análisis</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {t("lead_status" + '.' + s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 && !threadsLoading ? (
                <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                  {agentId ? "No hay conversaciones." : "Seleccioná una campaña."}
                </div>
              ) : (
                <ul className="divide-y divide-neutral-200/40 dark:divide-neutral-800/60">
                  {filteredThreads.map((t) => {
                    const isActive = Boolean(activeContactId) && normalizeContactId(activeContactId) === normalizeContactId(t.contactId);
                    const unread = t.metadata?.unreadCount || 0;
                    const takeover = t.metadata?.takeoverMode;
                    const lockedBy = t.metadata?.lockedByUserId;

                    return (
                      <li key={threadKey(t.channel, t.contactId)}>
                        <button
                          onClick={() => openThread(t)}
                          className={[
                            "w-full text-left p-3 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50 transition-colors",
                            isActive ? "bg-neutral-100/70 dark:bg-neutral-800/50" : "",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium truncate">{threadDisplayName(t)}</div>
                                {takeover === "HUMAN" && (
                                  <span className="text-[11px] rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/30">
                                    HUMAN
                                  </span>
                                )}
                                {takeover === "HUMAN" && lockedBy && lockedBy !== executingUserId && (
                                  <span className="text-[11px] rounded-full px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-300 ring-1 ring-red-400/30">
                                    Solo lectura
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                                {t.metadata?.lastMessagePreview || "—"}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <div className="text-[11px] text-neutral-500">
                                {t.lastMessageDate ? new Date(t.lastMessageDate).toLocaleString() : ""}
                              </div>
                              {unread > 0 && (
                                <span className="text-[11px] min-w-[20px] text-center rounded-full px-2 py-0.5 bg-emerald-600 text-white">
                                  {unread}
                                </span>
                              )}
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
          <div className="rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl ring-1 ring-emerald-400/20 overflow-hidden flex flex-col h-full min-h-0">
            <div className="p-3 border-b border-neutral-200/40 dark:border-neutral-800/60 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {activeThread ? threadDisplayName(activeThread) : "Chat"}
                </div>
                {activeThread && (
                  <div className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                    {activeThread.contactId}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeThread && (
                  <button
                    onClick={() => setLeadModalOpen(true)}
                    disabled={!selectedCampaign?.id}
                    className={
                      "px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-sm ring-1 transition " +
                      "bg-white/70 dark:bg-neutral-950/40 ring-neutral-200/70 dark:ring-neutral-800/70 " +
                      "hover:bg-neutral-100 dark:hover:bg-neutral-900 disabled:opacity-60"
                    }
                    title={
                      selectedCampaign?.id
                        ? "Editar lead (status / área / próxima acción)"
                        : "Seleccioná la campaña (arriba) para obtener el campaignId"
                    }
                  >
                    <ClipboardList className="h-4 w-4" />
                    Modificar
                  </button>

                )}

                {activeThread && (
                  <button
                    onClick={onToggleTakeover}
                    disabled={isReadOnlyLock}
                    className={[
                      "px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-sm ring-1 transition",
                      isReadOnlyLock ? "opacity-60 cursor-not-allowed" : "hover:shadow",
                      activeThread.metadata?.takeoverMode === "HUMAN"
                        ? "bg-emerald-600 text-white ring-emerald-400/40 hover:bg-emerald-500"
                        : "bg-amber-600 text-white ring-amber-400/40 hover:bg-amber-500 animate-pulse",
                    ].join(" ")}
                    title={isReadOnlyLock ? "Bloqueado por otro usuario" : "Cambiar modo (BOT / HUMANO)"}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    {activeThread.metadata?.takeoverMode === "HUMAN" ? "Modo humano (activo)" : "Tomar control (modo humano)"}
                  </button>
                )}
              </div>
            </div>

            {chatError && (
              <div className="m-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
                {chatError}
              </div>
            )}

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {chatLoading ? (
                <div className="text-sm text-neutral-600 dark:text-neutral-300">Cargando…</div>
              ) : !activeThread ? (
                <div className="text-sm text-neutral-600 dark:text-neutral-300">Abrí una conversación.</div>
              ) : (
                <>
                  {messages.length > 0 && (
                    <div className="flex justify-center">
                      <button
                        onClick={loadOlder}
                        className="text-xs px-3 py-1 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                      >
                        Cargar anteriores
                      </button>
                    </div>
                  )}

                  {displayMessages.map((m) => {
                    const mine = m.role === "assistant";
                    return (
                      <div key={msgKey(m)} className={mine ? "flex justify-end" : "flex justify-start"}>
                        <div
                          className={[
                            "max-w-[78%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                            mine
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-200/80 dark:bg-neutral-800/70 text-neutral-900 dark:text-neutral-50",
                          ].join(" ")}
                        >
                          {m.content}
                          <div className="mt-1 text-[11px] opacity-70">
                            {new Date(m.time).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-neutral-200/40 dark:border-neutral-800/60">
              {activeThread?.metadata?.takeoverMode === "BOT" && (
                <div className="mb-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-200">
                    <ShieldAlert className="h-4 w-4" />
                    Para responder, activá el <span className="font-semibold">modo humano</span>.
                  </div>
                  <button
                    onClick={onToggleTakeover}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500"
                    title="Activar modo humano"
                  >
                    Tomar control
                  </button>
                </div>
              )}

              {isReadOnlyLock && (
                <div className="mb-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
                  <ShieldAlert className="h-4 w-4" />
                  Bloqueado por otro usuario. Solo lectura.
                </div>
              )}

              {pending && (
                <div className="mb-2 rounded-lg border border-neutral-200/50 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/40 p-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {pending.kind === "image" && (
                        <img
                          src={pending.previewUrl}
                          alt="preview"
                          className="max-h-[220px] w-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800/60"
                        />
                      )}
                      {pending.kind === "video" && (
                        <video
                          src={pending.previewUrl}
                          controls
                          className="max-h-[220px] w-auto rounded-lg border border-neutral-200/60 dark:border-neutral-800/60"
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
                      <div className="mt-1 text-[11px] text-neutral-500">
                        Vista previa.
                      </div>
                    </div>

                    <button
                      onClick={() => setPending(null)}
                      className="p-1 rounded-md hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70"
                      title="Quitar adjunto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <button
                  onClick={onPickFile}
                  disabled={!activeThread || !canSend}
                  className="p-2 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50"
                  title="Adjuntar"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                {/*                 <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!activeThread || !canSend}
                  className={[
                    "p-2 rounded-lg disabled:opacity-50",
                    isRecording
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700",
                  ].join(" ")}
                  title={isRecording ? "Detener grabación" : "Grabar audio"}
                >
                  {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button> */}

                <button
                  onClick={() => {
                    if (pending && (pending.kind === "video" || pending.kind === "image")) {
                      // no-op, just a hint button spot if you want later
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
                      ? "Seleccioná una conversación…"
                      : !canSend
                        ? "Activá modo humano para responder (Shift+Enter para salto de línea)."
                        : "Escribí un mensaje… (Shift+Enter para salto de línea)"
                  }
                  className="flex-1 rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 resize-none"
                />
                <button
                  onClick={onSend}
                  disabled={!activeThread || !canSend || (!pending && !draft.trim())}
                  className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                  title="Enviar"
                >
                  <Send className="h-5 w-5" />
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

      <LeadActionsModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        title={leadTitle}
        campaignId={selectedCampaign?.id || null}
        conversationId={leadConversationId}
        areas={areas}
        areasLoading={areasLoading}
      />
    </OnlineLayout>
  );
}
