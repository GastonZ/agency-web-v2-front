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
import { useV2RealtimeSession, type ToolEvent } from "./useV2RealtimeSession";

import { mergeDraft, clearDraft } from "./draftStore";

import { useModeration } from "../context/ModerationContext";

const CONTEXT_STORAGE_KEY = "v2conversational:context";
const MODERATION_DRAFT_KEYS = ["campaign:moderation:draft", "moderationCampaignCtx"];

type ToolCountry = { code?: string; name?: string };
type ToolAssistant = { name?: string; greeting?: string; conversationLogic?: string };
type ToolKnowHow = { id?: string; question?: string; answer?: string };

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

function normalizeCountry(p: any): ToolCountry | undefined {
  if (!p) return undefined;
  if (typeof p === "string") {
    const s = p.trim();
    if (!s) return undefined;
    if (/^[A-Za-z]{2,3}$/.test(s)) return { code: s.toUpperCase() };
    return { name: s };
  }
  if (typeof p === "object") {
    const code = typeof p.code === "string" ? p.code.trim().toUpperCase() : undefined;
    const name = typeof p.name === "string" ? p.name.trim() : undefined;
    return code || name ? { code, name } : undefined;
  }
  return undefined;
}

const TOOL_CHANNELS = ["instagram", "facebook", "whatsapp", "webchat"] as const;
type ToolChannel = (typeof TOOL_CHANNELS)[number];

function stripToolBlocks(text: string) {
  if (!text) return "";
  return text
    // remove any tool blocks (update/navigate/whatever)
    .replace(/\[TOOL_[A-Z_]+\][\s\S]*?\[\/TOOL_[A-Z_]+\]/g, "")
    // remove stray mentions
    .replace(/\bTOOL_UPDATE\b/g, "")
    .replace(/\bTOOL_NAVIGATE\b/g, "")
    .trim();
}

function normalizeStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeChannels(v: any): ToolChannel[] {
  const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  const cleaned = (arr as any[])
    .map((x) => (typeof x === "string" ? x.trim().toLowerCase() : ""))
    .filter(Boolean)
    .filter((x): x is ToolChannel => (TOOL_CHANNELS as readonly string[]).includes(x));
  return Array.from(new Set(cleaned));
}

function normalizeAssistant(v: any): ToolAssistant | undefined {
  if (!v || typeof v !== "object") return undefined;
  const name = typeof v.name === "string" ? v.name.trim() : "";
  const greeting = typeof v.greeting === "string" ? v.greeting.trim() : "";
  const conversationLogic =
    typeof v.conversationLogic === "string"
      ? v.conversationLogic.trim()
      : typeof (v as any).logic === "string"
        ? String((v as any).logic).trim()
        : "";
  const out: ToolAssistant = {};
  if (name) out.name = name;
  if (greeting) out.greeting = greeting;
  if (conversationLogic) out.conversationLogic = conversationLogic;
  return Object.keys(out).length ? out : undefined;
}

function genId(prefix = "qa"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
}

function normalizeKnowHow(v: any): Array<{ id: string; question: string; answer: string }> {
  const arr: ToolKnowHow[] =
    Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : Array.isArray(v?.qa) ? v.qa : [];
  const out: Array<{ id: string; question: string; answer: string }> = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const question = typeof item.question === "string" ? item.question.trim() : "";
    const answer = typeof item.answer === "string" ? item.answer.trim() : "";
    if (!question || !answer) continue;
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : genId("qa");
    out.push({ id, question, answer });
  }
  return out;
}

function ensureName(name?: string, goal?: string, countryName?: string) {
  const n = (name || "").trim();
  if (n) return n;
  const g = (goal || "Moderation").trim();
  const c = (countryName || "Global").trim();
  return `${g.slice(0, 48)} • ${c}`.trim();
}

function ensureSummary(summary?: string, goal?: string, countryName?: string) {
  const s = (summary || "").trim();
  if (s) return s;
  const g = (goal || "").trim();
  const c = (countryName || "").trim();
  if (g && c) return `Moderation campaign in ${c} focused on: ${g}.`;
  if (g) return `Moderation campaign focused on: ${g}.`;
  return "";
}

function ensureLeadDefinition(leadDefinition?: string, goal?: string) {
  const ld = (leadDefinition || "").trim();
  if (ld) return ld;
  const g = (goal || "").trim();
  if (!g) return "";
  return `A lead is a person who shows clear interest in: ${g}. They ask for pricing, availability, booking, or next steps.`;
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

function readJson(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistModerationDraft(patch: {
  name?: string;
  goal?: string;
  summary?: string;
  leadDefinition?: string;
  country?: ToolCountry;
  channels?: ToolChannel[];
  webchatDomain?: string;
  assistant?: ToolAssistant;
  knowHow?: Array<{ id: string; question: string; answer: string }>;
  escalationItems?: string[];
  escalationPhone?: string;
}) {
  for (const key of MODERATION_DRAFT_KEYS) {
    const prev = readJson(localStorage.getItem(key)) || {};
    const prevAssistant =
      (prev as any)?.assistant && typeof (prev as any).assistant === "object" ? (prev as any).assistant : {};

    const next = {
      ...prev,
      name: patch.name ?? prev.name,
      goal: patch.goal ?? prev.goal,
      summary: patch.summary ?? prev.summary,
      leadDefinition: patch.leadDefinition ?? prev.leadDefinition,

      channels: patch.channels ?? prev.channels,
      webchatDomain: patch.webchatDomain ?? (prev as any).webchatDomain,
      assistant: patch.assistant ? { ...prevAssistant, ...patch.assistant } : prevAssistant,
      knowHow: patch.knowHow ?? (prev as any).knowHow,
      escalationItems: patch.escalationItems ?? (prev as any).escalationItems,
      escalationPhone: patch.escalationPhone ?? (prev as any).escalationPhone,

      // legacy aliases used in some older flows
      campaign_name: patch.name ?? (prev as any).campaign_name,
      objective: patch.goal ?? (prev as any).objective,
      lead_definition: patch.leadDefinition ?? (prev as any).lead_definition,
      country_code: patch.country?.code ?? (prev as any).country_code,
      country_name: patch.country?.name ?? (prev as any).country_name,
      audience: {
        ...(prev.audience || {}),
        geo: {
          ...((prev.audience && prev.audience.geo) || {}),
          countryCode:
            patch.country?.code ?? ((prev.audience && prev.audience.geo && prev.audience.geo.countryCode) || ""),
          country: patch.country?.name ?? ((prev.audience && prev.audience.geo && prev.audience.geo.country) || ""),
        },
      },
    };

    const code = (patch.country?.code || "").trim();
    if (code) {
      const prevIds = Array.isArray(next?.audience?.geo?.countryIds)
        ? next.audience.geo.countryIds
        : Array.isArray(prev?.audience?.geo?.countryIds)
          ? prev.audience.geo.countryIds
          : [];
      next.audience.geo.countryIds = Array.from(new Set([...(prevIds || []), code]));
    }

    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
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

  const [toolState, setToolState] = useState<ToolState>({
    campaign_type: "moderation",
    missing: ["name", "goal", "country", "summary", "leadDefinition"],
  });

  const [contextEditor, setContextEditor] = useState(() => JSON.stringify(initialContext, null, 2));
  const [contextEditorError, setContextEditorError] = useState<string | null>(null);

  const handleToolEvent = React.useCallback(
    (evt: ToolEvent) => {
      if (evt.type === "navigate") {
        const path = evt.payload?.path;
        if (typeof path === "string" && path.trim()) {
          if (path.includes("/campaign_moderation_creation")) {
            try {
              localStorage.setItem("v2conversational:apply_draft_once", "1");
            } catch { }
          }
          navigate(path);
        }
        return;
      }

      if (evt.type !== "update") return;

      const p = evt.payload || {};

      const name =
        typeof p.name === "string" ? p.name : typeof p.campaign_name === "string" ? p.campaign_name : "";

      const goal = typeof p.goal === "string" ? p.goal : typeof p.objective === "string" ? p.objective : "";

      const country =
        normalizeCountry(p.country) ||
        normalizeCountry({
          code: typeof p.country_code === "string" ? p.country_code : undefined,
          name: typeof p.country_name === "string" ? p.country_name : undefined,
        });

      const summaryRaw =
        typeof p.summary === "string" ? p.summary : typeof p.campaign_summary === "string" ? p.campaign_summary : "";

      const leadDefRaw =
        typeof p.leadDefinition === "string"
          ? p.leadDefinition
          : typeof p.lead_definition === "string"
            ? p.lead_definition
            : "";

      const fixedName = ensureName(name, goal, country?.name);
      const fixedSummary = ensureSummary(summaryRaw, goal, country?.name);
      const fixedLeadDefinition = ensureLeadDefinition(leadDefRaw, goal);

      const channels = normalizeChannels(p.channels ?? p.channel ?? p.communicationChannel ?? p.communication_channel);

      const webchatDomain =
        typeof p.webchatDomain === "string"
          ? p.webchatDomain.trim()
          : typeof p.webchat_domain === "string"
            ? p.webchat_domain.trim()
            : typeof p.domain === "string"
              ? p.domain.trim()
              : undefined;

      const assistant =
        normalizeAssistant(p.assistant) ||
        normalizeAssistant({
          name:
            typeof p.assistantName === "string"
              ? p.assistantName
              : typeof p.assistant_name === "string"
                ? p.assistant_name
                : undefined,
          greeting:
            typeof p.assistantGreeting === "string"
              ? p.assistantGreeting
              : typeof p.assistant_greeting === "string"
                ? p.assistant_greeting
                : typeof p.greeting === "string"
                  ? p.greeting
                  : undefined,
          conversationLogic:
            typeof p.conversationLogic === "string"
              ? p.conversationLogic
              : typeof p.conversation_logic === "string"
                ? p.conversation_logic
                : typeof p.assistantLogic === "string"
                  ? p.assistantLogic
                  : typeof p.assistant_logic === "string"
                    ? p.assistant_logic
                    : undefined,
        });

      const knowHowRaw = normalizeKnowHow(p.knowHow ?? p.knowhow ?? p.qa ?? p.questionsAndAnswers ?? p.questions_answers);
      const knowHow = knowHowRaw.length ? knowHowRaw : undefined;

      const escalationItemsRaw = normalizeStringArray(p.escalationItems ?? p.escalation_items);
      const escalationItems = escalationItemsRaw.length ? escalationItemsRaw : undefined;

      const escalationPhone =
        typeof p.escalationPhone === "string"
          ? p.escalationPhone.trim()
          : typeof p.escalation_phone === "string"
            ? p.escalation_phone.trim()
            : undefined;

      const nextState: ToolState = {
        campaign_type: p.campaign_type || "moderation",
        name: fixedName || undefined,
        goal: goal ? String(goal).trim() || undefined : undefined,
        country,
        summary: fixedSummary || undefined,
        leadDefinition: fixedLeadDefinition || undefined,

        assistant,
        knowHow,
        escalationItems,
        escalationPhone,

        channels: channels.length ? channels : undefined,
        webchatDomain: webchatDomain || undefined,
      };

      const rawMissing = Array.isArray(p.missing) ? p.missing : null;
      const mapKey = (k: string) => {
        const key = String(k || "").trim();
        if (!key) return "";
        const table: Record<string, string> = {
          campaign_name: "name",
          objective: "goal",
          country_code: "country",
          country_name: "country",
          lead_definition: "leadDefinition",
        };
        return table[key] || key;
      };

      nextState.missing = Array.isArray(rawMissing)
        ? Array.from(new Set(rawMissing.map(mapKey).filter(Boolean)))
        : computeMissing(nextState);

      mergeDraft({
        campaign_type: nextState.campaign_type as any,
        name: nextState.name,
        goal: nextState.goal,
        summary: nextState.summary,
        leadDefinition: nextState.leadDefinition,
        country: nextState.country,
        assistant: nextState.assistant,
        knowHow: nextState.knowHow,
        channels: nextState.channels as any,
        webchatDomain: nextState.webchatDomain,
        escalationItems: nextState.escalationItems,
        escalationPhone: nextState.escalationPhone,
        missing: nextState.missing,
      });

      setToolState(nextState);

      persistModerationDraft({
        name: nextState.name,
        goal: nextState.goal,
        summary: nextState.summary,
        leadDefinition: nextState.leadDefinition,
        country: nextState.country,
        channels: nextState.channels as any,
        webchatDomain: nextState.webchatDomain,
        assistant: nextState.assistant,
        knowHow: nextState.knowHow,
        escalationItems: nextState.escalationItems,
        escalationPhone: nextState.escalationPhone,
      });

      if (moderation) {
        const basicsPatch: any = {};
        if (nextState.name) basicsPatch.name = nextState.name;
        if (nextState.goal) basicsPatch.goal = nextState.goal;
        if (nextState.summary) basicsPatch.summary = nextState.summary;
        if (nextState.leadDefinition) basicsPatch.leadDefinition = nextState.leadDefinition;
        if (Object.keys(basicsPatch).length) moderation.setBasics(basicsPatch);

        if (nextState.country?.code || nextState.country?.name) {
          const geoPatch: any = {
            countryCode: nextState.country?.code || "",
            country: nextState.country?.name || "",
          };
          if (nextState.country?.code) geoPatch.countryIds = [nextState.country.code];
          moderation.setGeo(geoPatch);
        }

        if (nextState.channels?.length) moderation.setChannels(nextState.channels as any);
        if (typeof nextState.webchatDomain === "string") moderation.setWebchatDomain(nextState.webchatDomain);
        if (nextState.assistant) moderation.setAssistant(nextState.assistant as any);
        if (nextState.escalationItems) moderation.setEscalationItems(nextState.escalationItems);
        if (typeof nextState.escalationPhone === "string") moderation.setEscalationPhone(nextState.escalationPhone);

        if (nextState.knowHow && nextState.knowHow.length) {
          try {
            moderation.clearQA();
            nextState.knowHow.forEach((qa) => {
              moderation.addQA({ question: qa.question, answer: qa.answer });
            });
          } catch {
            // ignore
          }
        }
      }
    },
    [moderation, navigate],
  );

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
    onToolEvent: handleToolEvent,
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

  const previewState: ToolState = useMemo(() => {
    const countryCodeFromCtx = moderation?.data?.audience?.geo?.countryCode;
    const countryNameFromCtx = moderation?.data?.audience?.geo?.country;
    return {
      campaign_type: "moderation",
      name: (moderation?.data?.name || toolState.name || "").trim() || undefined,
      goal: (moderation?.data?.goal || toolState.goal || "").trim() || undefined,
      summary: (moderation?.data?.summary || toolState.summary || "").trim() || undefined,
      leadDefinition: (moderation?.data?.leadDefinition || toolState.leadDefinition || "").trim() || undefined,
      country: {
        code: (countryCodeFromCtx || toolState.country?.code || "").trim() || undefined,
        name: (countryNameFromCtx || toolState.country?.name || "").trim() || undefined,
      },
    };
  }, [moderation, toolState]);

  const previewMissing = useMemo(() => computeMissing(previewState), [previewState]);
  const readyForCreation = previewMissing.length === 0;

  const goToModerationCreation = React.useCallback(() => {
    try {
      localStorage.setItem("v2conversational:apply_draft_once", "1");
    } catch { }
    navigate("/campaign_moderation_creation/");
  }, [navigate]);

  const didAutoNavRef = useRef(false);
  useEffect(() => {
    if (didAutoNavRef.current) return;
    if (!readyForCreation) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    if (!wantsCreationNavigation(lastUser.text)) return;

    didAutoNavRef.current = true;
    goToModerationCreation();
  }, [messages, readyForCreation, goToModerationCreation]);

  useEffect(() => {
    if (!readyForCreation) didAutoNavRef.current = false;
  }, [readyForCreation]);

  const onSend = () => {
    const msg = text.trim();
    if (!msg) return;

    if (wantsCreationNavigation(msg) && readyForCreation) {
      goToModerationCreation();
      setText("");
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
                    onClick={() => goToModerationCreation()}
                    disabled={!readyForCreation}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      readyForCreation
                        ? t("v2Conversational.draftPanel.goCreateTitleReady", "Go to moderation campaign creation")
                        : t(
                          "v2Conversational.draftPanel.goCreateTitleWaiting",
                          "Waiting for the assistant to fill required fields",
                        )
                    }
                  >
                    {t("v2Conversational.draftPanel.goCreate", "Go create")}
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
