import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PROMPT_TEMPLATE } from "./promptTemplate";
import {
  DEFAULT_PROMPT_CONTEXT,
  interpolatePrompt,
} from "./promptUtils";
import type { PromptContext } from "./promptUtils";
import { getRealtimeClientSecret } from "./realtimeClient";

type SessionStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
};

export type ToolEvent =
  | { type: "update"; payload: any; messageId: string }
  | { type: "navigate"; payload: { path: string }; messageId: string };

type AnyRealtimeSession = {
  on: (event: string, cb: (...args: any[]) => void) => void;
  off?: (event: string, cb: (...args: any[]) => void) => void;
  close: () => void;
  interrupt: () => void;
  connect: (opts: { apiKey: string }) => Promise<void>;
  sendMessage: (msg: any) => void;
  mute?: (muted?: boolean) => void;
  updateAgent?: (agent: any) => Promise<any>;
};

type AnyRealtimeAgentCtor = new (opts: any) => any;
type AnyRealtimeSessionCtor = new (agent: any, opts?: any) => AnyRealtimeSession;

function extractTextFromContent(content: any): string {
  if (!content) return "";

  // Some SDK versions return { content: [...] }, others return [...] directly
  const items = Array.isArray(content) ? content : content?.content;
  if (!Array.isArray(items)) return "";

  const parts: string[] = [];
  for (const c of items) {
    if (!c) continue;
    if (c.type === "input_text" || c.type === "output_text") {
      if (typeof c.text === "string") parts.push(c.text);
    }
    // Audio items can include transcripts
    if ((c.type === "input_audio" || c.type === "output_audio") && c.transcript) {
      if (typeof c.transcript === "string") parts.push(c.transcript);
    }
  }
  return parts.join(" ").trim();
}

function isValidUserText(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return false;
  if (t.length < 2) return false;

  // quick noise filters (mirrors the python demo heuristics)
  const banned = [
    "...",
    "..",
    "eh",
    "ehm",
    "mmm",
    "mm",
    "uh",
    "um",
    "ok",
    "okay",
    "sí",
    "si",
    "aja",
    "ajá",
    "no",
    "dale",
  ];
  if (banned.includes(t.toLowerCase())) return false;

  // Mostly punctuation?
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/.test(t)) return false;

  return true;
}

function buildPrompt(template: string, ctx: PromptContext): string {
  return interpolatePrompt(template, ctx);
}

type HookOptions = {
  agentName?: string;
  model?: string;
  tools?: any[];
  defaultPrompt?: string;
  defaultContext?: PromptContext;
  ttlSeconds?: number;
  onToolEvent?: (evt: ToolEvent) => void;
};

function safeJsonParse(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractToolBlocks(text: string): { cleanText: string; events: Array<{ type: "update" | "navigate"; payload: any }> } {
  if (!text) return { cleanText: "", events: [] };

  const events: Array<{ type: "update" | "navigate"; payload: any }> = [];

  // Match any [TOOL_XXX] ... [/TOOL_XXX] block and strip it from user-visible text.
  // We parse known types and ignore unknown ones.
  const TOOL_BLOCK_RE = /\[(TOOL_[A-Z0-9_]+)\]([\s\S]*?)\[\/\1\]/g;

  const cleanText = String(text).replace(TOOL_BLOCK_RE, (_full, tag, inner) => {
    const payload = safeJsonParse(String(inner || "").trim());

    if (tag === "TOOL_NAVIGATE") {
      if (payload) events.push({ type: "navigate", payload });
    } else if (tag === "TOOL_UPDATE") {
      if (payload) events.push({ type: "update", payload });
    } else if (tag === "TOOL_MISSING") {
      // Backward-compatible: treat TOOL_MISSING as an update that only carries missing fields.
      if (payload) events.push({ type: "update", payload: { missing: payload.missing ?? payload } });
    } else {
      // Unknown tool blocks are stripped but not processed.
    }

    return "";
  });

  // Also hide any incomplete tool block (during streaming) so tags never flash in the UI.
  const openIdx = cleanText.indexOf("[TOOL_");
  const safeText = openIdx === -1 ? cleanText : cleanText.slice(0, openIdx);

  return { cleanText: safeText.trim(), events };
}


export function useV2RealtimeSession(options?: HookOptions) {
  const agentName = options?.agentName || "AriSpeak";
  const model = options?.model || "gpt-realtime";
  const ttlSeconds = options?.ttlSeconds ?? 600;

  const [status, setStatus] = useState<SessionStatus>("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState(options?.defaultPrompt ?? PROMPT_TEMPLATE);
  const [context, setContext] = useState<PromptContext>(
    options?.defaultContext ?? DEFAULT_PROMPT_CONTEXT,
  );

  const compiledPrompt = useMemo(() => buildPrompt(prompt, context), [prompt, context]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sessionRef = useRef<AnyRealtimeSession | null>(null);
  const processedToolMessagesRef = useRef<Set<string>>(new Set());
  const sdkRef = useRef<{
    RealtimeAgent?: AnyRealtimeAgentCtor;
    RealtimeSession?: AnyRealtimeSessionCtor;
  } | null>(null);

  const originalGetUserMediaRef = useRef<
    ((constraints?: MediaStreamConstraints) => Promise<MediaStream>) | null
  >(null);

  const patchGetUserMedia = useCallback(() => {
    // Patch only once per hook instance
    if (originalGetUserMediaRef.current) return;
    if (!navigator?.mediaDevices?.getUserMedia) return;

    const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    originalGetUserMediaRef.current = orig;

    navigator.mediaDevices.getUserMedia = async (
      constraints: MediaStreamConstraints = {},
    ) => {
      const audioDefaults: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      const next: MediaStreamConstraints = {
        ...constraints,
        audio:
          constraints.audio === true
            ? audioDefaults
            : typeof constraints.audio === "object"
              ? { ...audioDefaults, ...constraints.audio }
              : constraints.audio,
      };
      return orig(next);
    };
  }, []);

  const restoreGetUserMedia = useCallback(() => {
    if (!originalGetUserMediaRef.current) return;
    if (!navigator?.mediaDevices) return;
    navigator.mediaDevices.getUserMedia = originalGetUserMediaRef.current;
    originalGetUserMediaRef.current = null;
  }, []);

  const syncHistoryToMessages = useCallback((history: any[]) => {
    if (!Array.isArray(history)) return;

    const next: ChatMessage[] = [];
    for (const item of history) {
      if (!item || item.type !== "message") continue;
      const role = item.role === "assistant" ? "assistant" : "user";
      const rawText = extractTextFromContent(item.content);
      const id = String(item.id || `${role}-${next.length}`);

      // Tool parsing (assistant only)
      let text = rawText;
      if (role === "assistant" && rawText) {
        const parsed = extractToolBlocks(rawText);
        text = parsed.cleanText;

        if (!processedToolMessagesRef.current.has(id) && parsed.events.length) {
          for (const ev of parsed.events) {
            if (ev.type === "navigate") {
              const path = typeof ev.payload?.path === "string" ? ev.payload.path : "";
              if (path && options?.onToolEvent) {
                options.onToolEvent({ type: "navigate", payload: { path }, messageId: id });
              }
            }
            if (ev.type === "update") {
              if (options?.onToolEvent) {
                options.onToolEvent({ type: "update", payload: ev.payload, messageId: id });
              }
            }
          }
          processedToolMessagesRef.current.add(id);
        }
      }
      if (!text) continue;
      if (role === "user" && !isValidUserText(text)) continue;

      next.push({
        id,
        role,
        text,
        createdAt: Date.now(),
      });
    }

    setMessages(next);
  }, [options]);

  const loadSdk = useCallback(async () => {
    if (sdkRef.current?.RealtimeAgent && sdkRef.current?.RealtimeSession) return sdkRef.current;

    // We import from CDN so you don't need to add deps yet.
    // Vite: keep this as-is at runtime.
    const mod: any = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@openai/agents-realtime/+esm"
    );

    sdkRef.current = {
      RealtimeAgent: mod.RealtimeAgent,
      RealtimeSession: mod.RealtimeSession,
    };
    return sdkRef.current;
  }, []);

  const connect = useCallback(async () => {
    if (status === "connecting" || status === "connected") return;
    setError(null);
    setStatus("connecting");

    try {
      patchGetUserMedia();
      const { RealtimeAgent, RealtimeSession } = await loadSdk();
      if (!RealtimeAgent || !RealtimeSession) throw new Error("Realtime SDK not available");

      const apiKey = await getRealtimeClientSecret(ttlSeconds);

      const agent = new RealtimeAgent({
        name: agentName,
        instructions: compiledPrompt,
        tools: options?.tools || [],
      });

      const session = new RealtimeSession(agent, {
        transport: "webrtc",
        model,
      });

      session.on("history_updated", (history: any[]) => {
        syncHistoryToMessages(history);
      });

      // Keep a tiny error surface if the SDK emits a top-level error
      session.on?.("error", (e: any) => {
        setError(String(e?.message || e || "Realtime error"));
      });

      await session.connect({ apiKey });

      sessionRef.current = session;
      setStatus("connected");
    } catch (e: any) {
      setError(String(e?.message || e || "Failed to connect"));
      setStatus("disconnected");
      restoreGetUserMedia();
    }
  }, [
    agentName,
    compiledPrompt,
    loadSdk,
    model,
    options?.tools,
    patchGetUserMedia,
    restoreGetUserMedia,
    status,
    syncHistoryToMessages,
  ]);

  const disconnect = useCallback(() => {
    if (status === "disconnecting" || status === "disconnected") return;
    setStatus("disconnecting");

    try {
      const session = sessionRef.current;
      sessionRef.current = null;
      session?.interrupt?.();
      session?.close?.();
    } finally {
      restoreGetUserMedia();
      setIsMuted(false);
      setStatus("disconnected");
    }
  }, [restoreGetUserMedia, status]);

  const restart = useCallback(async () => {
    // Restart ensures new instructions/tools apply cleanly, like the python demo
    disconnect();
    await new Promise((r) => setTimeout(r, 80));
    await connect();
  }, [connect, disconnect]);

  const sendText = useCallback((text: string) => {
    const session = sessionRef.current;
    if (!session) return;

    const t = text.trim();
    if (!t) return;

    // RealtimeUserInputText
    session.sendMessage({ type: "input_text", text: t });
  }, []);

  const toggleMute = useCallback(() => {
    const session = sessionRef.current;
    if (!session?.mute) {
      // Not supported by all transports/versions
      setIsMuted((v) => !v);
      return;
    }
    const next = !isMuted;
    session.mute(next);
    setIsMuted(next);
  }, [isMuted]);

  const applyPromptToLiveSession = useCallback(async () => {
    const session = sessionRef.current;
    const sdk = sdkRef.current;
    if (!session || !sdk?.RealtimeAgent || !session.updateAgent) return;

    const nextAgent = new sdk.RealtimeAgent({
      name: agentName,
      instructions: compiledPrompt,
      tools: options?.tools || [],
    });

    await session.updateAgent(nextAgent);
  }, [agentName, compiledPrompt, options?.tools]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => {
      try {
        sessionRef.current?.close?.();
      } finally {
        sessionRef.current = null;
        restoreGetUserMedia();
      }
    };
  }, [restoreGetUserMedia]);

  return {
    status,
    isMuted,
    error,

    prompt,
    setPrompt,
    context,
    setContext,
    compiledPrompt,

    messages,
    clearMessages,

    connect,
    disconnect,
    restart,
    sendText,
    toggleMute,
    applyPromptToLiveSession,
  };
}
