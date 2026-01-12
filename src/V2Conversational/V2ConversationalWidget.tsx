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

import { PROMPT_TEMPLATE } from "./promptTemplate";
import {
  DEFAULT_PROMPT_CONTEXT,
} from "./promptUtils";
import type { PromptContext } from "./promptUtils";
import {
  apiPromptReset,
  apiSavePrompt,
  apiSaveSession,
} from "./realtimeApi";
import type { SessionLogItem } from "./realtimeApi";
import { useV2RealtimeSession, type ToolEvent } from "./useV2RealtimeSession";

import { useModeration } from "../context/ModerationContext";

const CONTEXT_STORAGE_KEY = "v2conversational:context";

const MODERATION_DRAFT_KEYS = ["campaign:moderation:draft", "moderationCampaignCtx"];

type ToolCountry = { code?: string; name?: string };
type ToolState = {
  campaign_type?: string;
  name?: string;
  goal?: string;
  summary?: string;
  leadDefinition?: string;
  country?: ToolCountry;
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
    // Heuristic: 2-3 letters => code
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

function isReadyForCreation(s: ToolState): boolean {
  return computeMissing(s).length === 0;
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

function persistModerationDraft(patch: { name?: string; goal?: string; summary?: string; leadDefinition?: string; country?: ToolCountry }) {
  for (const key of MODERATION_DRAFT_KEYS) {
    const prev = readJson(localStorage.getItem(key)) || {};
    const next = {
      ...prev,
      name: patch.name ?? prev.name,
      goal: patch.goal ?? prev.goal,
      summary: patch.summary ?? prev.summary,
      leadDefinition: patch.leadDefinition ?? prev.leadDefinition,
      audience: {
        ...(prev.audience || {}),
        geo: {
          ...((prev.audience && prev.audience.geo) || {}),
          countryCode: patch.country?.code ?? ((prev.audience && prev.audience.geo && prev.audience.geo.countryCode) || ""),
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

function StatusBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-medium">
        <CheckCircle2 className="h-4 w-4" /> Connected
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-medium">
        <Loader2 className="h-4 w-4 animate-spin" /> Connecting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 px-3 py-1 text-xs font-medium">
      <CircleSlash2 className="h-4 w-4" /> Disconnected
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

export default function V2ConversationalWidget(props: { profile?: string; autoConnect?: boolean }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const moderation = useModerationOptional();

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
    return safeJsonParse<PromptContext>(
      localStorage.getItem(CONTEXT_STORAGE_KEY),
      DEFAULT_PROMPT_CONTEXT,
    );
  }, []);

  const [toolState, setToolState] = useState<ToolState>({
    campaign_type: "moderation",
    missing: ["name", "goal", "country", "summary", "leadDefinition"],
  });

  const [contextEditor, setContextEditor] = useState(() =>
    JSON.stringify(initialContext, null, 2),
  );
  const [contextEditorError, setContextEditorError] = useState<string | null>(null);

  const handleToolEvent = React.useCallback(
    (evt: ToolEvent) => {
      if (evt.type === "navigate") {
        const path = evt.payload?.path;
        if (typeof path === "string" && path.trim()) navigate(path);
        return;
      }

      if (evt.type !== "update") return;

      const p = evt.payload || {};

      // Backward-compatible field mapping (some prompts may emit legacy keys)
      const name =
        typeof p.name === "string"
          ? p.name
          : typeof p.campaign_name === "string"
            ? p.campaign_name
            : "";

      const goal =
        typeof p.goal === "string" ? p.goal : typeof p.objective === "string" ? p.objective : "";

      const country =
        normalizeCountry(p.country) ||
        normalizeCountry({
          code: typeof p.country_code === "string" ? p.country_code : undefined,
          name: typeof p.country_name === "string" ? p.country_name : undefined,
        });

      const summaryRaw =
        typeof p.summary === "string"
          ? p.summary
          : typeof p.campaign_summary === "string"
            ? p.campaign_summary
            : "";

      const leadDefRaw =
        typeof p.leadDefinition === "string"
          ? p.leadDefinition
          : typeof p.lead_definition === "string"
            ? p.lead_definition
            : "";

      const fixedName = ensureName(name, goal, country?.name);
      const fixedSummary = ensureSummary(summaryRaw, goal, country?.name);
      const fixedLeadDefinition = ensureLeadDefinition(leadDefRaw, goal);

      const nextState: ToolState = {
        campaign_type: p.campaign_type || "moderation",
        name: fixedName || undefined,
        goal: goal ? String(goal).trim() || undefined : undefined,
        country,
        summary: fixedSummary || undefined,
        leadDefinition: fixedLeadDefinition || undefined,
      };

      // Normalize missing keys from either new or legacy prompts
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

      setToolState(nextState);

      // Always persist as a fallback so the creation flow can hydrate even if the dashboard
      // isn't wrapped in ModerationProvider.
      persistModerationDraft({
        name: nextState.name,
        goal: nextState.goal,
        summary: nextState.summary,
        leadDefinition: nextState.leadDefinition,
        country: nextState.country,
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

  useEffect(() => {
    if (!showSettings) return;
    setContextEditor(JSON.stringify(context, null, 2));
    setContextEditorError(null);
  }, [showSettings]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPromptInfo(null);
      try {
        const serverPrompt = await apiPromptReset(profile);
        if (cancelled) return;
        const sp = String(serverPrompt || "");
        const looksLegacy =
          /arispeak/i.test(sp) ||
          /student_level/i.test(sp) ||
          /people and occupations/i.test(sp) ||
          /\[TOOL_MISSING\]/i.test(sp) ||
          !/\[TOOL_UPDATE\]/i.test(sp);
        if (looksLegacy) {
          setPrompt(PROMPT_TEMPLATE);
          setPromptInfo(
            `Loaded server prompt for profile "${profile}" but it looks legacy. Using local template. (Save prompt to update the backend.)`,
          );
        } else {
          setPrompt(sp);
        }
      } catch (e: any) {
        if (cancelled) return;
        // Fallback to local template if backend isn't available yet
        setPrompt(PROMPT_TEMPLATE);
        setPromptInfo(
          `Could not load server prompt for profile "${profile}". Using template. (${String(
            e?.message || e,
          )})`,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, setPrompt]);

  useEffect(() => {
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(context));
  }, [context]);

  useEffect(() => {
    if (props.autoConnect) {
      // Delay one tick so prompt reset can populate first.
      const t = setTimeout(() => {
        connect();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [connect, props.autoConnect]);

  useEffect(() => {
    // Autoscroll to bottom
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

  const onSend = () => {
    const t = text.trim();
    if (!t) return;

    // Friendly fallback: if user explicitly wants to create AND we already have data, go.
    if (wantsCreationNavigation(t) && readyForCreation) {
      navigate("/campaign_moderation_creation/");
      setText("");
      return;
    }

    sendText(t);
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
      if (status === "connected") {
        await restart();
      }
    } catch (e: any) {
      setContextEditorError(String(e?.message || e || "Invalid JSON"));
    }
  };

  const resetContext = async () => {
    setContext(DEFAULT_PROMPT_CONTEXT);
    setContextEditor(JSON.stringify(DEFAULT_PROMPT_CONTEXT, null, 2));
    setContextEditorError(null);
    if (status === "connected") {
      await restart();
    }
  };

  const savePrompt = async () => {
    setIsPromptBusy(true);
    setPromptInfo(null);
    try {
      await apiSavePrompt(profile, prompt);
      setPromptInfo(`Saved prompt for profile "${profile}".`);
      if (status === "connected") {
        await restart();
      }
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
      if (status === "connected") {
        await restart();
      }
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

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/55 dark:bg-neutral-900/45 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-800/60">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              V2 Conversational
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Profile: <span className="font-medium">{profile}</span>
            </span>
            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status !== "connected" ? (
              <button
                onClick={connect}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                Connect
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-white"
              >
                Disconnect
              </button>
            )}

            <button
              onClick={toggleMute}
              disabled={status !== "connected"}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isMuted ? "Unmute mic" : "Mute mic"}
            >
              {isMuted ? (
                <span className="inline-flex items-center gap-2">
                  <MicOff className="h-4 w-4" /> Muted
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Mic
                </span>
              )}
            </button>

            <button
              onClick={() => setShowSettings((v) => !v)}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
              title="Prompt / context settings"
            >
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" /> Settings
              </span>
            </button>

            <button
              onClick={clearMessages}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
              title="Clear chat"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Clear
              </span>
            </button>

            <button
              onClick={saveSession}
              disabled={isSavingSession || messages.length === 0}
              className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save transcript"
            >
              <span className="inline-flex items-center gap-2">
                {isSavingSession ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Save session
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
          <div className="lg:col-span-7">
            <div
              ref={scrollRef}
              className="h-[420px] overflow-y-auto rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-950/30 p-4"
            >
              {messages.length === 0 ? (
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {status === "connected"
                    ? "Say something (voice) or type below."
                    : "Connect to start chatting."}
                </div>
              ) : null}

              <div className="space-y-3">
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                          (isUser
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-200/70 text-neutral-900 dark:bg-neutral-800/70 dark:text-neutral-100")
                        }
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
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
                placeholder="Type a message…"
                className="flex-1 rounded-xl border border-neutral-200/70 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-950/30 px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
                disabled={status !== "connected"}
              />
              <button
                onClick={onSend}
                disabled={status !== "connected" || !text.trim()}
                className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Tip: when connected, you can also speak — the session will use your microphone.
            </div>
          </div>

          <div className="lg:col-span-5">
            {showSettings ? (
              <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-950/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Prompt & Context
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Prompt stored in backend. Context stored locally.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetPromptFromServer}
                      disabled={isPromptBusy}
                      className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      title="Reset prompt"
                    >
                      <span className="inline-flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4" /> Reset
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

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={resetContext}
                    className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    title="Reset context"
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" /> Reset context
                    </span>
                  </button>

                  <button
                    onClick={applyContextFromEditor}
                    className="px-3 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    title="Apply context JSON"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Apply context
                    </span>
                  </button>

                  <button
                    onClick={savePrompt}
                    disabled={isPromptBusy || !prompt.trim()}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save prompt to backend (recommended)"
                  >
                    <span className="inline-flex items-center gap-2">
                      {isPromptBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Save prompt
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-950/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Moderation draft
                    </div>
                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {moderation
                        ? "Using ModerationContext (autofill will be ready in the creation wizard)."
                        : "Not wrapped in ModerationProvider — using localStorage fallback."}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/campaign_moderation_creation/")}
                    disabled={!readyForCreation}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={readyForCreation ? "Go to moderation campaign creation" : "Waiting for the assistant to fill required fields"}
                  >
                    Go create
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <FieldRow label="Name" value={previewState.name} />
                  <FieldRow label="Goal" value={previewState.goal} />
                  <FieldRow
                    label="Country"
                    value={[previewState.country?.name, previewState.country?.code]
                      .filter(Boolean)
                      .join(" (")
                      .replace(/\($/, "") +
                      (previewState.country?.name && previewState.country?.code ? ")" : "")}
                  />
                  <FieldRow label="Summary" value={previewState.summary} />
                  <FieldRow label="Lead definition" value={previewState.leadDefinition} />
                </div>

                <div className="mt-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-950/30 px-3 py-2">
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Missing: {previewMissing.length ? previewMissing.join(", ") : "None"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
