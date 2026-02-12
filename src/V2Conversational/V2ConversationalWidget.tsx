import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  ArrowUp,
  CheckCircle2,
  CircleSlash2,
  Loader2,
  Mic,
  MicOff,
  RefreshCcw,
  Settings,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { PROMPT_TEMPLATE } from "./promptTemplate";
import { DEFAULT_PROMPT_CONTEXT } from "./promptUtils";
import type { PromptContext } from "./promptUtils";
import { apiPromptReset, apiSavePrompt, apiSaveSession } from "./realtimeApi";
import type { SessionLogItem } from "./realtimeApi";
import { useV2RealtimeSession } from "./useV2RealtimeSession";

import { clearDraft, readDraft } from "./draftStore";

import { useModeration } from "../context/ModerationContext";

const CONTEXT_STORAGE_KEY = "v2conversational:context";
const USER_BUFFER_KEY = "v2conversational:user_buffer:v1";
const PENDING_DRAFT_KEY = "v2conversational:pending_draft:v1";
type ToolCountry = { code?: string; name?: string };
type ToolAssistant = { name?: string; greeting?: string; conversationLogic?: string };

type ToolState = {
  campaign_type?: string;
  name?: string;
  goal?: string;
  summary?: string;
  leadDefinition?: string;
  country?: ToolCountry;

  // Step 2
  assistant?: ToolAssistant;
  knowHow?: Array<{ id: string; question: string; answer: string }>;
  escalationItems?: string[];
  escalationPhone?: string;

  // Step 3
  channels?: Array<"instagram" | "facebook" | "whatsapp" | "webchat">;
  webchatDomain?: string;

  missing?: string[];
};

function useModerationOptional() {
  try {
    return useModeration();
  } catch {
    return null;
  }
}

function stripToolBlocks(text: string) {
  if (!text) return "";
  return text
    // remove any tool blocks (update/navigate/whatever)
    .replace(/\[TOOL_[A-Z_]+\][\s\S]*?\[\/TOOL_[A-Z_]+\]/g, "")
    // remove stray mentions
    .replace(/\bTOOL_UPDATE\b/g, "")
    .replace(/\bTOOL_NAVIGATE\b/g, "")
    .replace(/\bTOOL_COMPLETE\b/g, "")
    .replace(/\btool\s*update\b/gi, "")
    .replace(/\btool\s*complete\b/gi, "")
    .replace(/\btool\s*call\b/gi, "")
    .trim();
}

function computeMissing(s: ToolState): string[] {
  const missing: string[] = [];
  if (!s.name) missing.push("name");
  if (!s.goal) missing.push("goal");
  const code = s.country?.code || "";
  const name = s.country?.name || "";
  if (!code && !name) missing.push("country");
  if (!s.summary) missing.push("summary");
  if (!s.leadDefinition) missing.push("leadDefinition");
  return missing;
}

function wantsCreationNavigation(t: string): boolean {
  const v = (t || "").toLowerCase();
  return (
    v.includes("create the campaign") ||
    v.includes("create campaign") ||
    v.includes("go to creation") ||
    v.includes("let's create") ||
    v.includes("lets create") ||
    v.includes("crear la campaña") ||
    v.includes("crear campaña") ||
    v.includes("vamos a crear") ||
    v.includes("ir a crear")
  );
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-medium">
        <CheckCircle2 className="h-4 w-4" /> {t("v2Conversational.status.connected")}
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-medium">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("v2Conversational.status.connecting")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 px-3 py-1 text-xs font-medium">
      <CircleSlash2 className="h-4 w-4" /> {t("v2Conversational.status.disconnected")}
    </span>
  );
}

function FieldRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="text-xs text-right text-neutral-900 dark:text-neutral-100 font-medium break-words max-w-[70%]">
        {value && value.trim() ? value : "—"}
      </div>
    </div>
  );
}

/**
 * === Remote (assistant) audio volume meter for the OpenAI Realtime SDK ===
 * The SDK creates RTCPeerConnection internally; we patch the constructor to tap ontrack
 * and compute RMS volume from the remote audio stream.
 */
type StreamListener = (stream: MediaStream) => void;
let __pcPatchRefCount = 0;
let __origPC: any = null;
let __streamListeners: Set<StreamListener> = new Set();
let __pcPatched = false;

function ensurePeerConnectionPatch() {
  if (__pcPatched) return;
  if (typeof window === "undefined") return;
  const Original = (window as any).RTCPeerConnection;
  if (!Original) return;

  __origPC = Original;

  class PatchedRTCPeerConnection extends Original {
    constructor(cfg?: RTCConfiguration) {
      super(cfg);

      try {
        this.addEventListener("track", (ev: RTCTrackEvent) => {
          try {
            if (ev?.track?.kind !== "audio") return;
            const stream = ev?.streams?.[0];
            if (!stream) return;
            __streamListeners.forEach((fn) => {
              try {
                fn(stream);
              } catch {
                // ignore
              }
            });
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore
      }
    }
  }

  (window as any).RTCPeerConnection = PatchedRTCPeerConnection as any;
  __pcPatched = true;
}

function maybeRestorePeerConnectionPatch() {
  if (!__pcPatched) return;
  if (__pcPatchRefCount > 0) return;
  try {
    if (typeof window !== "undefined" && __origPC) {
      (window as any).RTCPeerConnection = __origPC;
    }
  } catch {
    // ignore
  } finally {
    __origPC = null;
    __pcPatched = false;
  }
}

function useRemoteAssistantVolume() {
  const [currentVolume, setCurrentVolume] = useState(0);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const activeStreamIdRef = useRef<string | null>(null);

  useEffect(() => {
    ensurePeerConnectionPatch();
    __pcPatchRefCount += 1;

    const onStream: StreamListener = (stream) => {
      try {
        const id = stream.id || null;
        if (id && activeStreamIdRef.current === id) return;
        activeStreamIdRef.current = id;

        // Cleanup any previous analyzer
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        analyserRef.current = null;
        if (audioCtxRef.current) {
          try {
            audioCtxRef.current.close();
          } catch {
            // ignore
          }
          audioCtxRef.current = null;
        }

        const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as any;
        if (!Ctx) return;

        const ctx: AudioContext = new Ctx();
        audioCtxRef.current = ctx;

        // Resume if needed (some browsers start suspended)
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => undefined);
        }

        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;

        intervalRef.current = window.setInterval(() => {
          const a = analyserRef.current;
          if (!a) return;

          const data = new Uint8Array(a.frequencyBinCount);
          a.getByteTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const f = (data[i] - 128) / 128;
            sum += f * f;
          }

          const rms = Math.sqrt(sum / data.length);
          // Smooth a bit to avoid jitter
          setCurrentVolume((prev) => prev * 0.55 + rms * 0.45);
        }, 100);
      } catch {
        // ignore
      }
    };

    __streamListeners.add(onStream);

    return () => {
      __streamListeners.delete(onStream);
      __pcPatchRefCount -= 1;

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      analyserRef.current = null;
      activeStreamIdRef.current = null;

      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
        audioCtxRef.current = null;
      }

      maybeRestorePeerConnectionPatch();
    };
  }, []);

  return currentVolume;
}

export default function V2ConversationalWidget(props: { profile?: string; autoConnect?: boolean }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const moderation = useModerationOptional();
  const { t } = useTranslation("translations");

  const profile = useMemo(() => {
    if (props.profile) return props.profile;
    const p1 = (params as any).profile;
    if (typeof p1 === "string" && p1.trim()) return p1.trim();
    const q = new URLSearchParams(location.search);
    const p2 = q.get("profile");
    if (p2 && p2.trim()) return p2.trim();
    return "default";
  }, [location.search, params, props.profile]);

  const initialPrompt = useMemo(() => PROMPT_TEMPLATE, []);
  const initialContext = useMemo<PromptContext>(() => {
    return safeJsonParse<PromptContext>(localStorage.getItem(CONTEXT_STORAGE_KEY), DEFAULT_PROMPT_CONTEXT);
  }, []);

  const [draftPreview, setDraftPreview] = useState<ToolState>(() => {
    const prev = readDraft();
    return {
      campaign_type: "moderation",
      name: prev?.name,
      goal: prev?.goal,
      summary: prev?.summary,
      leadDefinition: prev?.leadDefinition,
      country: prev?.country,
      assistant: prev?.assistant,
      knowHow: (prev as any)?.knowHow,
      channels: (prev as any)?.channels,
      webchatDomain: (prev as any)?.webchatDomain,
      escalationItems: (prev as any)?.escalationItems,
      escalationPhone: (prev as any)?.escalationPhone,
      missing: prev?.missing,
    };
  });

  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [userBuffer, setUserBuffer] = useState<string[]>(
    () => safeJsonParse<string[]>(localStorage.getItem(USER_BUFFER_KEY), []),
  );

  const [contextEditor, setContextEditor] = useState(() => JSON.stringify(initialContext, null, 2));
  const [contextEditorError, setContextEditorError] = useState<string | null>(null);


  const {
    status,
    isMuted,
    error,
    prompt,
    setPrompt,
    context,
    setContext,
    messages,
    connect,
    disconnect,
    sendText,
    toggleMute,
    clearMessages,
    restart,
  } = useV2RealtimeSession({
    agentName: "Assistant",
    defaultPrompt: initialPrompt,
    defaultContext: initialContext,
    ttlSeconds: 600,
  });

  const [text, setText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isPromptBusy, setIsPromptBusy] = useState(false);
  const [promptInfo, setPromptInfo] = useState<string | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Fallback activity for text-only responses (streaming)
  const [isAssistantStreaming, setIsAssistantStreaming] = useState(false);
  const lastAssistantRef = useRef<{ id: string; text: string } | null>(null);
  const streamTimerRef = useRef<number | null>(null);

  // Remote assistant audio volume (0..~1 RMS)
  const currentVolume = useRemoteAssistantVolume();

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    const prev = lastAssistantRef.current;
    const changed = !prev || prev.id !== lastAssistant.id || prev.text !== lastAssistant.text;
    if (!changed) return;

    setIsAssistantStreaming(true);
    lastAssistantRef.current = { id: lastAssistant.id, text: lastAssistant.text };

    if (streamTimerRef.current) window.clearTimeout(streamTimerRef.current);
    streamTimerRef.current = window.setTimeout(() => {
      setIsAssistantStreaming(false);
      streamTimerRef.current = null;
    }, 900);
  }, [messages]);

  useEffect(() => {
    if (!showSettings) return;
    setContextEditor(JSON.stringify(context, null, 2));
    setContextEditorError(null);
  }, [showSettings, context]);

  // Load server prompt, but fallback to local template if it doesn't include our v2 fields
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPromptInfo(null);
      try {
        const serverPrompt = await apiPromptReset(profile);
        if (cancelled) return;

        const sp = String(serverPrompt || "");
        const lacksV2Fields = !/(assistant|knowHow|\bchannels\b|webchatDomain|conversationLogic|escalationItems)/i.test(sp);
        const looksLegacy = /\[TOOL_MISSING\]/i.test(sp) || !/\[TOOL_UPDATE\]/i.test(sp) || lacksV2Fields;

        setPrompt(looksLegacy ? PROMPT_TEMPLATE : sp);
      } catch (e: any) {
        if (cancelled) return;
        setPrompt(PROMPT_TEMPLATE);
        setPromptInfo(
          `Could not load server prompt for profile "${profile}". Using template. (${String(e?.message || e)})`,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, setPrompt]);

  // Persist context
  useEffect(() => {
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(context));
    } catch { }
  }, [context]);

  // Optional auto connect
  useEffect(() => {
    if (!props.autoConnect) return;
    const t = setTimeout(() => connect(), 50);
    return () => clearTimeout(t);
  }, [connect, props.autoConnect]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    const userMsgs = messages
      .filter((m) => m.role === "user")
      .map((m) => (m.text || "").trim())
      .filter(Boolean);

    setUserBuffer(userMsgs);
    try {
      localStorage.setItem(USER_BUFFER_KEY, JSON.stringify(userMsgs.slice(-160)));
    } catch { }
  }, [messages]);


  const previewState: ToolState = useMemo(() => {
    const countryCodeFromCtx = moderation?.data?.audience?.geo?.countryCode;
    const countryNameFromCtx = moderation?.data?.audience?.geo?.country;
    return {
      campaign_type: "moderation",
      name: (moderation?.data?.name || draftPreview.name || "").trim() || undefined,
      goal: (moderation?.data?.goal || draftPreview.goal || "").trim() || undefined,
      summary: (moderation?.data?.summary || draftPreview.summary || "").trim() || undefined,
      leadDefinition: (moderation?.data?.leadDefinition || draftPreview.leadDefinition || "").trim() || undefined,
      country: {
        code: (countryCodeFromCtx || draftPreview.country?.code || "").trim() || undefined,
        name: (countryNameFromCtx || draftPreview.country?.name || "").trim() || undefined,
      },
    };
  }, [moderation, draftPreview]);

  const previewMissing = useMemo(() => computeMissing(previewState), [previewState]);
  const canGenerateDraft = userBuffer.length > 0;

  const goToModerationCreation = React.useCallback(() => {
    navigate("/campaign_moderation_creation/");
  }, [navigate]);

  type PendingDraftPayload = {
    version: 1;
    profile?: string;
    campaignType: "moderation";
    transcript: string;
    uiLanguage?: string;
    schemaVersion: number;
    createdAt: string;
  };

  function persistPendingDraft(payload: PendingDraftPayload) {
    try {
      localStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(payload));
    } catch { }
  }

  const buildTranscript = React.useCallback((extraUserText?: string) => {
    const lines: string[] = [];
    for (const m of messages) {
      const role = m.role === "assistant" ? "Assistant" : "User";
      const clean = stripToolBlocks(m.text || "");
      if (clean) lines.push(`${role}: ${clean}`);
    }
    if (extraUserText && extraUserText.trim()) {
      lines.push(`User: ${extraUserText.trim()}`);
    }
    return lines.join("\n");
  }, [messages]);

  const queueDraftAndGo = React.useCallback((extraUserText?: string) => {
    if (isGeneratingDraft) return;

    setGenerateError(null);

    const transcript = buildTranscript(extraUserText);
    if (!transcript.trim()) {
      setGenerateError(t("v2Conversational.generate.empty", "No conversation yet. Tell me about your campaign first."));
      return;
    }

    setIsGeneratingDraft(true);
    try {
      persistPendingDraft({
        version: 1,
        profile,
        campaignType: "moderation",
        transcript,
        uiLanguage: (context as any)?.uiLanguage,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
      });
      goToModerationCreation();
    } finally {
      // If navigation is blocked for some reason, unlock the button.
      setTimeout(() => setIsGeneratingDraft(false), 250);
    }
  }, [buildTranscript, context, goToModerationCreation, isGeneratingDraft, t]);

  // Auto-trigger: if the user (voice or text) says "vamos a crear la campaña", we navigate immediately.
  const lastAutoCreateMsgIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const txt = (lastUser.text || "").trim();
    if (!txt) return;
    if (!wantsCreationNavigation(txt)) return;
    const marker = String((lastUser as any).id || lastUser.createdAt || txt);
    if (lastAutoCreateMsgIdRef.current === marker) return;
    lastAutoCreateMsgIdRef.current = marker;
    queueDraftAndGo();
  }, [messages, queueDraftAndGo]);



  const onSend = () => {
    const msg = text.trim();
    if (!msg) return;

    if (wantsCreationNavigation(msg)) {
      setText("");
      queueDraftAndGo(msg);
      return;
    }

    sendText(msg);
    setText("");
  };

  const applyContextFromEditor = async () => {
    const raw = contextEditor.trim();
    if (!raw) {
      setContextEditorError("Context JSON is empty.");
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        setContextEditorError("Context must be a JSON object.");
        return;
      }
      setContext(parsed);
      setContextEditorError(null);
      if (status === "connected") await restart();
    } catch (e: any) {
      setContextEditorError(String(e?.message || e || "Invalid JSON"));
    }
  };

  const resetContext = async () => {
    setContext(DEFAULT_PROMPT_CONTEXT);
    setContextEditor(JSON.stringify(DEFAULT_PROMPT_CONTEXT, null, 2));
    setContextEditorError(null);
    if (status === "connected") await restart();
  };

  const savePrompt = async () => {
    setIsPromptBusy(true);
    setPromptInfo(null);
    try {
      await apiSavePrompt(profile, prompt);
      setPromptInfo(`Saved prompt for profile "${profile}".`);
      if (status === "connected") await restart();
    } catch (e: any) {
      setPromptInfo(`Failed to save prompt: ${String(e?.message || e)}`);
    } finally {
      setIsPromptBusy(false);
    }
  };

  const resetPromptFromServer = async () => {
    setIsPromptBusy(true);
    setPromptInfo(null);
    try {
      const next = await apiPromptReset(profile);
      setPrompt(next);
      setPromptInfo(`Prompt reset for profile "${profile}".`);
      if (status === "connected") await restart();
    } catch (e: any) {
      setPromptInfo(`Failed to reset prompt: ${String(e?.message || e)}`);
    } finally {
      setIsPromptBusy(false);
    }
  };

  const saveSession = async () => {
    setIsSavingSession(true);
    try {
      const log: SessionLogItem[] = messages.map((m) => ({
        role: m.role,
        text: m.text,
        ts: new Date(m.createdAt).toISOString(),
      }));
      await apiSaveSession(profile, log);
      setPromptInfo(`Session saved for profile "${profile}".`);
    } catch (e: any) {
      setPromptInfo(`Failed to save session: ${String(e?.message || e)}`);
    } finally {
      setIsSavingSession(false);
    }
  };

  const countryLabel = useMemo(() => {
    const n = previewState.country?.name || "";
    const c = previewState.country?.code || "";
    if (n && c) return `${n} (${c})`;
    return (n || c || "").trim() || undefined;
  }, [previewState.country?.code, previewState.country?.name]);

  const missingText = useMemo(() => {
    const items = previewMissing.length
      ? previewMissing.join(", ")
      : t("v2Conversational.draftPanel.missingNone", "None");
    return t("v2Conversational.draftPanel.missing", "Missing: {{items}}", { items });
  }, [previewMissing, t]);

  // Activity drives glow even if there's no audio (text streaming)
  const isSessionActive = status === "connected";
  const activity = isSessionActive ? Math.max(currentVolume, isAssistantStreaming ? 0.08 : 0) : 0;
  const glowScale = isSessionActive ? 1 + Math.min(activity * 2.5, 0.25) : 1;
  const glowOpacity = isSessionActive ? Math.min(0.7 + activity * 1.2, 1) : 0.7;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/55 dark:bg-neutral-900/45 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-800/60">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t("v2Conversational.title", "Conversational Builder")}
            </h2>

            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t("v2Conversational.profile", "Profile")}: <span className="font-medium">{profile}</span>
            </span>

            <StatusBadge status={status} t={t} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status !== "connected" ? (
              <button
                onClick={connect}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                {t("v2Conversational.actions.connect", "Connect")}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
              >
                {t("v2Conversational.actions.disconnect", "Disconnect")}
              </button>
            )}

            <button
              onClick={toggleMute}
              disabled={status !== "connected"}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isMuted
                  ? t("v2Conversational.actions.unmuteTitle", "Unmute mic")
                  : t("v2Conversational.actions.muteTitle", "Mute mic")
              }
            >
              {isMuted ? (
                <span className="inline-flex items-center gap-2">
                  <MicOff className="h-4 w-4" /> {t("v2Conversational.actions.muted", "Muted")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Mic className="h-4 w-4" /> {t("v2Conversational.actions.mic", "Mic")}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowSettings((v) => !v)}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
              title={t("v2Conversational.actions.settingsTitle", "Prompt / context settings")}
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" /> {t("v2Conversational.actions.settings", "Settings")}
              </span>
            </button>

            <button
              onClick={() => {
                clearMessages();
                clearDraft();
	                setDraftPreview({ campaign_type: "moderation" });
                try { localStorage.removeItem(USER_BUFFER_KEY); } catch { }
                setUserBuffer([]);
              }}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
              title={t("v2Conversational.actions.clearTitle", "Clear chat")}
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> {t("v2Conversational.actions.clear", "Clear")}
              </span>
            </button>

            <button
              onClick={saveSession}
              disabled={isSavingSession || messages.length === 0}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("v2Conversational.actions.saveSessionTitle", "Save transcript")}
            >
              <span className="inline-flex items-center gap-2">
                {isSavingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {t("v2Conversational.actions.saveSession", "Save session")}
              </span>
            </button>
          </div>
        </div>

        {promptInfo ? (
          <div className="mt-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-950/30 px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300">
            {promptInfo}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Chat */}
          <div className="lg:col-span-7">
            <div className="relative h-[420px] rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-950/30 overflow-hidden">
              {/* Big bubble glow (always visible) */}
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <motion.div
                  className="rounded-full blur-2xl"
                  style={{
                    width: "14rem",
                    height: "14rem",
                    background:
                      "radial-gradient(closest-side, rgba(0,255,128,0.9), rgba(0,255,128,0.35) 60%, transparent 70%)",
                  }}
                  animate={{
                    scale: [glowScale, glowScale + 0.06, glowScale],
                    opacity: [glowOpacity, Math.min(glowOpacity + 0.15, 1), glowOpacity],
                    filter: ["blur(28px)", "blur(22px)", "blur(28px)"],
                  }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Small floating dot (always visible) */}
              <div className="absolute top-3 right-3 z-10">
                <span className="sr-only">{t("v2Conversational.aiTalking", "AI is responding")}</span>
                <motion.div
                  className="h-3 w-3 rounded-full bg-emerald-500"
                  animate={{
                    scale: [1, 1 + Math.min(activity * 2.2, 0.55), 1],
                    opacity: [0.65, Math.min(0.75 + activity * 2.0, 1), 0.65],
                  }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    boxShadow: `0 0 ${10 + Math.min(26, activity * 140)}px rgba(16,185,129,0.75)`,
                  }}
                />
              </div>

              {/* Scroll content */}
              <div ref={scrollRef} className="absolute inset-0 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {status === "connected"
                      ? t("v2Conversational.empty.connected", "Say something (voice) or type below.")
                      : t("v2Conversational.empty.disconnected", "Connect to start chatting.")}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {messages.map((m) => {
                    const isUser = m.role === "user";
                    const displayText = isUser ? m.text : stripToolBlocks(m.text);
                    if (!displayText) return null;
                    return (
                      <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap " +
                            (isUser
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-200/70 text-neutral-900 dark:bg-neutral-800/70 dark:text-neutral-100")
                          }
                        >
                          {displayText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                placeholder={t("v2Conversational.input.placeholder", "Type a message…")}
                className="flex-1 rounded-xl border border-neutral-200/70 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/30 px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                disabled={status !== "connected"}
              />
              <button
                onClick={onSend}
                disabled={status !== "connected" || !text.trim()}
                className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t("v2Conversational.actions.send", "Send")}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {t(
                "v2Conversational.tip",
                "Tip: when connected, you can also speak — the session will use your microphone.",
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-5">
            {showSettings ? (
              <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-950/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {t("v2Conversational.settingsPanel.title", "Prompt & Context")}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t(
                        "v2Conversational.settingsPanel.subtitle",
                        "Prompt stored in backend. Context stored locally.",
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetPromptFromServer}
                      disabled={isPromptBusy}
                      className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      title={t("v2Conversational.settingsPanel.resetPromptTitle", "Reset prompt")}
                    >
                      <span className="inline-flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4" /> {t("v2Conversational.settingsPanel.resetPrompt", "Reset")}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full min-h-[220px] rounded-xl border border-neutral-200/70 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/30 px-4 py-3 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="mt-3">
                  {/* no extra i18n keys needed; keep it minimal */}
                  <textarea
                    value={contextEditor}
                    onChange={(e) => setContextEditor(e.target.value)}
                    className="w-full min-h-[160px] rounded-xl border border-neutral-200/70 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/30 px-4 py-3 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  {contextEditorError ? (
                    <div className="mt-2 text-xs text-rose-600 dark:text-rose-300">{contextEditorError}</div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={resetContext}
                    className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    title={t("v2Conversational.settingsPanel.resetContext", "Reset context")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" /> {t("v2Conversational.settingsPanel.resetContext", "Reset context")}
                    </span>
                  </button>

                  <button
                    onClick={applyContextFromEditor}
                    className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    title={t("v2Conversational.settingsPanel.applyContext", "Apply context")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> {t("v2Conversational.settingsPanel.applyContext", "Apply context")}
                    </span>
                  </button>

                  <button
                    onClick={savePrompt}
                    disabled={isPromptBusy || !prompt.trim()}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t("v2Conversational.settingsPanel.savePrompt", "Save prompt")}
                  >
                    <span className="inline-flex items-center gap-2">
                      {isPromptBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t("v2Conversational.settingsPanel.savePrompt", "Save prompt")}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-950/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {t("v2Conversational.draftPanel.title", "Moderation draft")}
                    </div>
                  </div>

                  <button
                    onClick={() => queueDraftAndGo()}
                    disabled={!canGenerateDraft || isGeneratingDraft}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      isGeneratingDraft
                        ? t("v2Conversational.draftPanel.generatingTitle", "Preparing…")
                        : !canGenerateDraft
                          ? t("v2Conversational.draftPanel.goCreateTitleNoChat", "Start chatting first so I can prepare the draft")
                          : t("v2Conversational.draftPanel.goCreateTitleReady", "Go to moderation campaign creation (the draft will be generated on the next screen)")
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      {isGeneratingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {isGeneratingDraft
                        ? t("v2Conversational.draftPanel.generating", "Preparing…")
                        : t("v2Conversational.draftPanel.goCreate", "Go create")}
                    </span>
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <FieldRow label={t("v2Conversational.draftPanel.fields.name", "Name")} value={previewState.name} />
                  <FieldRow label={t("v2Conversational.draftPanel.fields.goal", "Goal")} value={previewState.goal} />
                  <FieldRow label={t("v2Conversational.draftPanel.fields.country", "Country")} value={countryLabel} />
                  <FieldRow label={t("v2Conversational.draftPanel.fields.summary", "Summary")} value={previewState.summary} />
                  <FieldRow
                    label={t("v2Conversational.draftPanel.fields.leadDefinition", "Lead definition")}
                    value={previewState.leadDefinition}
                  />

                {generateError ? (
                  <div className="mt-3 rounded-xl border border-rose-200/60 dark:border-rose-800/40 bg-rose-50/60 dark:bg-rose-950/25 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                    {generateError}
                  </div>
                ) : null}

                <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  {t("v2Conversational.draftPanel.captured", "Captured user messages: {{n}}", { n: userBuffer.length })}
                </div>

                </div>

                <div className="mt-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-950/30 px-3 py-2">
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">{missingText}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
