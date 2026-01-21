import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Mic, Paperclip, Send, ShieldAlert, Square, X, Video } from "lucide-react";
import OnlineLayout from "../layout/OnlineLayout";
import { initSocket, getSocket } from "../services/socket/socket";
import { getToken, getUserId } from "../utils/helper";
import { searchMyModerationCampaigns } from "../services/campaigns";
import type { ModerationCampaignItem } from "../services/types/moderation-types";
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

export default function Inbox() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const executingUserId = React.useMemo(() => getUserId() || "", []);
  const token = React.useMemo(() => getToken(), []);

  const routeAgentRaw = params.agentId;
  const routeAgentId = React.useMemo(() => {
    if (!routeAgentRaw) return "";
    try {
      return decodeURIComponent(routeAgentRaw);
    } catch {
      return routeAgentRaw;
    }
  }, [routeAgentRaw]);

  const [campaigns, setCampaigns] = React.useState<ModerationCampaignItem[]>([]);
  const [agentId, setAgentId] = React.useState<string>(routeAgentId || "");

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

  const [activeContactId, setActiveContactId] = React.useState<string | null>(null);
  const [activeThread, setActiveThread] = React.useState<InboxThread | null>(null);

  const [messages, setMessages] = React.useState<InboxMessage[]>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);

  const [draft, setDraft] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [pending, setPending] = React.useState<PendingAttachment | null>(null);

  const chatScrollRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const isPrependingRef = React.useRef(false);
  const prevScrollHeightRef = React.useRef(0);
  const prevScrollTopRef = React.useRef(0);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const recorderStreamRef = React.useRef<MediaStream | null>(null);
  const recorderChunksRef = React.useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);

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
        const initial = (routeAgentId || last || items?.[0]?.name || "").trim();
        if (initial) {
          setAgentId(initial);
          if (!routeAgentId) navigate(`/inbox/${encodeURIComponent(initial)}`, { replace: true });
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
    if (routeAgentId && routeAgentId !== agentId) {
      setAgentId(routeAgentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeAgentId]);

  const refreshThreads = React.useCallback(async () => {
    if (!agentId) return;
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const data = await listThreads(agentId, { limit: 100, channel: "whatsapp" });
      const ordered = (data || []).slice().sort((a, b) => {
        const da = new Date(a.lastMessageDate || 0).getTime();
        const db = new Date(b.lastMessageDate || 0).getTime();
        return db - da;
      });
      setThreads(ordered);
    } catch (e: any) {
      setThreadsError(e?.data?.message || e?.message || "No se pudo cargar la bandeja");
    } finally {
      setThreadsLoading(false);
    }
  }, [agentId]);

  // Load threads when agent changes.
  React.useEffect(() => {
    if (!agentId) return;
    localStorage.setItem("inbox:lastAgentId", agentId);
    refreshThreads();
    // Reset chat on agent change
    setActiveContactId(null);
    setActiveThread(null);
    setMessages([]);
    setChatError(null);
  }, [agentId, refreshThreads]);

  const openThread = React.useCallback(
    async (t: InboxThread) => {
      setActiveContactId(t.contactId);
      setActiveThread(t);
      setMessages([]);
      setChatError(null);
      setPending(null);
      setDraft("");
      setChatLoading(true);
      try {
        const res: ThreadMessagesResponse = await getThreadMessages(agentId, t.contactId, {
          limit: 50,
          channel: "whatsapp",
        });
        setActiveThread(res.thread);
        setMessages((res.messages || []).slice().sort((a, b) => a.time - b.time));

        // Mark read if needed.
        const unread = res.thread?.metadata?.unreadCount ?? 0;
        if (unread > 0) {
          const mr = await markThreadRead(agentId, t.contactId, { expectedUnread: unread }, { channel: "whatsapp" });
          setThreads((prev) =>
            prev.map((x) =>
              x.contactId === t.contactId
                ? { ...x, metadata: { ...x.metadata, unreadCount: mr.unreadCount } }
                : x
            )
          );
          setActiveThread((prev) =>
            prev ? { ...prev, metadata: { ...prev.metadata, unreadCount: mr.unreadCount } } : prev
          );
        }
      } catch (e: any) {
        setChatError(e?.data?.message || e?.message || "No se pudo cargar el chat");
      } finally {
        setChatLoading(false);
      }
    },
    [agentId]
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
    if (!agentId || !queryContactId) return;
    const key = `${agentId}|${queryContactId}`;
    if (autoOpenedRef.current === key) return;
    if (activeContactId === queryContactId) {
      autoOpenedRef.current = key;
      return;
    }

    const existing = threads.find((t) => t.contactId === queryContactId);
    if (existing) {
      autoOpenedRef.current = key;
      openThread(existing);
      return;
    }

    // If not in list (limit), try direct fetch.
    autoOpenedRef.current = key;
    (async () => {
      setActiveContactId(queryContactId);
      setActiveThread(null);
      setMessages([]);
      setChatError(null);
      setChatLoading(true);

      try {
        const res: ThreadMessagesResponse = await getThreadMessages(agentId, queryContactId, {
          limit: 50,
          channel: "whatsapp",
        });

        setActiveThread(res.thread);
        setMessages((res.messages || []).slice().sort((a, b) => a.time - b.time));

        // Ensure appears in list.
        if (res.thread) {
          setThreads((prev) => {
            const next = prev.filter((x) => x.contactId !== res.thread.contactId);
            next.unshift(res.thread);
            next.sort(
              (a, b) =>
                new Date(b.lastMessageDate || 0).getTime() -
                new Date(a.lastMessageDate || 0).getTime(),
            );
            return next;
          });
        }

        // Mark read if needed.
        const unread = res.thread?.metadata?.unreadCount ?? 0;
        if (unread > 0) {
          const mr = await markThreadRead(
            agentId,
            queryContactId,
            { expectedUnread: unread },
            { channel: "whatsapp" },
          );
          setThreads((prev) =>
            prev.map((x) =>
              x.contactId === queryContactId
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
    })();
  }, [agentId, queryContactId, threads, openThread, activeContactId]);

  const canSend = React.useMemo(() => {
    if (!activeThread) return false;
    const md = activeThread.metadata;
    return md?.takeoverMode === "HUMAN" && md?.lockedByUserId === executingUserId;
  }, [activeThread, executingUserId]);

  const isReadOnlyLock = React.useMemo(() => {
    if (!activeThread) return false;
    const md = activeThread.metadata;
    return md?.takeoverMode === "HUMAN" && Boolean(md?.lockedByUserId) && md?.lockedByUserId !== executingUserId;
  }, [activeThread, executingUserId]);

  const onToggleTakeover = React.useCallback(async () => {
    if (!activeThread || !agentId) return;
    const md = activeThread.metadata;
    const nextMode = md.takeoverMode === "HUMAN" ? "BOT" : "HUMAN";
    try {
      const res = await takeoverThread(agentId, activeThread.contactId, { mode: nextMode, force: false }, { channel: "whatsapp" });
      setActiveThread(res.thread);
      setThreads((prev) =>
        prev.map((x) => (x.contactId === activeThread.contactId ? res.thread : x))
      );
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "No se pudo cambiar el takeover";
      alert(msg);
    }
  }, [activeThread, agentId]);

  const onSend = React.useCallback(async () => {
    if (!activeThread || !activeContactId) return;
    if (!canSend) {
      alert("Tenés que estar en HUMAN y con lock propio para enviar.");
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

        await sendMessage(agentId, activeContactId, body, { channel: "whatsapp" });
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
      agentId,
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
      await sendMessage(agentId, activeContactId, body, { channel: "whatsapp" });
      scrollToBottom("smooth");
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "No se pudo enviar el mensaje";
      alert(msg);
    }
  }, [draft, activeThread, activeContactId, canSend, agentId, executingUserId, pending, scrollToBottom]);

  const onPickFile = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !activeThread || !activeContactId) return;
      if (!canSend) {
        alert("Tenés que estar en HUMAN y con lock propio para enviar.");
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
      alert("Tenés que estar en HUMAN y con lock propio para enviar.");
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
      if (payload.agentId !== agentId) return;
      const updated: InboxThread = {
        agentId: payload.agentId,
        channel: payload.channel,
        contactId: payload.contactId,
        name: payload.name,
        lastMessageDate: payload.lastMessageDate,
        metadata: payload.metadata,
      };

      setThreads((prev) => {
        const next = prev.filter((t) => t.contactId !== updated.contactId);
        next.unshift(updated);
        next.sort((a, b) => new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime());
        return next;
      });

      setActiveThread((prev) => (prev && prev.contactId === updated.contactId ? updated : prev));
    };

    const onInboxMessage = (payload: any) => {
      if (!payload) return;
      if (payload.agentId !== agentId) return;
      const contactId = payload.contactId;
      const msg = payload.message as InboxMessage;
      if (!msg) return;

      // Update preview / date ordering.
      setThreads((prev) => {
        const existing = prev.find((t) => t.contactId === contactId);
        const updated: InboxThread = existing
          ? {
            ...existing,
            lastMessageDate: new Date(msg.time).toISOString(),
            metadata: {
              ...existing.metadata,
              lastMessagePreview: msg.content,
              lastMessageDirection: payload.direction,
              // unreadCount will be handled by inbox-thread-updated; keep existing here.
            },
          }
          : {
            agentId,
            channel: "whatsapp",
            contactId,
            name: payload.name,
            lastMessageDate: new Date(msg.time).toISOString(),
            metadata: {
              takeoverMode: "BOT",
              lockedByUserId: null,
              lockedAt: null,
              unreadCount: 0,
              lastMessagePreview: msg.content,
              lastMessageDirection: payload.direction,
            },
          };

        const next = prev.filter((t) => t.contactId !== contactId);
        next.unshift(updated);
        next.sort((a, b) => new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime());
        return next;
      });

      // If chat open, append (deduped).
      if (activeContactId && contactId === activeContactId) {
        setMessages((prev) => mergeUniqueMessages(prev, [msg]));
      }
    };

    socket.on("inbox-thread-updated", onThreadUpdated);
    socket.on("inbox-message", onInboxMessage);

    return () => {
      socket.off("inbox-thread-updated", onThreadUpdated);
      socket.off("inbox-message", onInboxMessage);
    };
  }, [agentId, activeContactId]);

  const loadOlder = React.useCallback(async () => {
    if (!activeThread || !activeContactId) return;
    const oldest = messages[0];
    if (!oldest) return;

    const el = chatScrollRef.current;
    if (el) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;
    }

    try {
      const res = await getThreadMessages(agentId, activeContactId, {
        limit: 50,
        before: oldest.time,
        channel: "whatsapp",
      });
      setMessages((prev) => mergeUniqueMessages(res.messages || [], prev));
    } catch (e: any) {
      alert(e?.data?.message || e?.message || "No se pudieron cargar mensajes anteriores");
    }
  }, [activeThread, activeContactId, messages, agentId]);

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
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

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

            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 && !threadsLoading ? (
                <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                  {agentId ? "No hay conversaciones." : "Seleccioná una campaña."}
                </div>
              ) : (
                <ul className="divide-y divide-neutral-200/40 dark:divide-neutral-800/60">
                  {threads.map((t) => {
                    const isActive = activeContactId === t.contactId;
                    const unread = t.metadata?.unreadCount || 0;
                    const takeover = t.metadata?.takeoverMode;
                    const lockedBy = t.metadata?.lockedByUserId;

                    return (
                      <li key={t.contactId}>
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
                    onClick={onToggleTakeover}
                    className="px-3 py-1.5 rounded-lg text-xs bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                  >
                    {activeThread.metadata?.takeoverMode === "HUMAN" ? "Devolver a BOT" : "Tomar control (Modo humano)"}
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

              <div className="flex items-center gap-2">
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
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  disabled={!activeThread || !canSend}
                  placeholder={
                    !activeThread
                      ? "Seleccioná una conversación…"
                      : !canSend
                        ? "Necesitás activar el modo humano arriba a la derecha y tu cuenta debe ser propietaria del chat."
                        : "Escribí un mensaje…"
                  }
                  className="flex-1 rounded-lg border border-neutral-300/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60"
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
    </OnlineLayout>
  );
}
