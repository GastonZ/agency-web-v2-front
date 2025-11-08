import { useEffect, useRef, useState, useCallback } from "react";
import { extractUserTextFromContent } from "../../utils/helper";

export type Tool = {
  type: "function";
  name: string;
  description: string;
  parameters?: {
    type: "object";
    properties?: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
};

type ConversationItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  isFinal?: boolean;
  timestamp?: string;
};

function readEnv(name: string, fallback?: string) {
  const viteAny = (import.meta as any)?.env?.[name];
  const nextAny = (globalThis as any)?.process?.env?.[name];
  return (viteAny ?? nextAny ?? fallback) as string | undefined;
}
function toNum(v: unknown, def: number) {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    if (!Number.isNaN(n)) return n;
  }
  return def;
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
const REALTIME_DEBUG =
  readEnv("VITE_REALTIME_DEBUG") === "1" ||
  readEnv("NEXT_PUBLIC_REALTIME_DEBUG") === "1";

function mask(t?: string) {
  if (!t) return t;
  if (t.length <= 10) return "***" + t.slice(-3);
  return t.slice(0, 4) + "…(masked)…" + t.slice(-6);
}

type UseRtcOpts = {
  autoStart?: boolean;
  startDelayMs?: number;
  debugLogs?: boolean;
  getBootInstructions?: () => string | undefined;
};

export default function useWebRTCAudio(voice: string, tools: Tool[], opts?: UseRtcOpts) {
  const [status, setStatus] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);

  const [isStarting, setIsStarting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
  const functionRegistry = useRef<Record<string, Function>>({});

  const currentVolumeRef = useRef(0);
  useEffect(() => { currentVolumeRef.current = currentVolume; }, [currentVolume]);

  const startedRef = useRef(false);

  const debugLogs = true /* !!opts?.debugLogs */

  const logSessionWindow = useCallback((label: string) => {
    if (!debugLogs) return;
    const dc = dataChannelRef.current;
    const pc = pcRef.current;

    console.groupCollapsed(
      `%c[Realtime] ${label} – turns=${conversation.length}`,
      "color:#10b981;font-weight:600"
    );
    console.table(
      conversation.slice(-10).map((t, i) => ({
        idx: conversation.length - Math.min(10, conversation.length) + i + 1,
        role: t.role,
        text: (t.text || "").length > 80 ? (t.text || "").slice(0, 80) + "…" : (t.text || ""),
        ts: t.timestamp?.slice(11, 19) ?? "",
        final: !!t.isFinal,
      }))
    );
    console.log("session:", {
      dataChannel: dc?.readyState,
      ice: pc?.iceConnectionState,
      isSessionActive,
      status,
    });
    console.groupEnd();
  }, [debugLogs, conversation, isSessionActive, status]);

  async function getEphemeralToken(): Promise<string> {
    const backendUrl = import.meta.env.VITE_API_CONVERSATION;

    const model = import.meta.env.VITE_OPENAI_MODEL;
    const speed = clamp(toNum(readEnv("VITE_OPENAI_SPEED") || "1", 1), 0.5, 3.0);
    const temperature = clamp(toNum(readEnv("VITE_OPENAI_TEMPERATURE") || "0.7", 0.7), 0.6, 2.0);

    const boot = (opts?.getBootInstructions?.() || "").trim();

    const PREAMBLE = `
    Presentate

Ejemplo de presentación inicial: “Hola, soy Lisa — mi nombre completo es Large Intelligence System Agent, pero entre nosotros, LISA está perfecto.   
Desde este panel puedo ayudarte a crear y configurar tus campañas de inteligencia artificial: Marketing, Moderación o Escucha Social.  
Solo contame de qué trata tu negocio o proyecto, y te guío paso a paso para elegir la mejor opción.”
=== PERSONALIDAD (instrucciones internas) ===

* Tono amable, profesional y claro; humor sutil, nunca sarcástico ni exagerado.
* Lenguaje cotidiano, cero frases robóticas o repetitivas.
* Empática y proactiva: si algo falta o es confuso, lo señalo con tacto y propongo opciones.
* Mantengo el idioma del usuario durante toda la sesión.
* Evito tecnicismos innecesarios; priorizo explicaciones simples y accionables.
* IMPORTANTE: Usa las tools  disponibles cuando sea relevante.
`

    const combinedInstructions = [PREAMBLE, boot]
      .filter(Boolean)
      .join("\n\n=== BOOT CONTEXT ===\n");

    if (debugLogs) {
      console.groupCollapsed("[Realtime][token] instructions");
      console.log("len:", combinedInstructions.length);
      console.log("preview:\n" + combinedInstructions.slice(0, 800));
      console.groupEnd();
    }

    const payload = {
      model,
      voice,
      modalities: ["audio", "text"],
      instructions: combinedInstructions,
      tool_choice: "auto",
      speed,
      temperature: 0.6,
    };

    console.log('PAYLOAD #################', payload);


    const url = `${backendUrl}/realtime/sessions`;
    if (REALTIME_DEBUG || debugLogs) {
      console.groupCollapsed("[/realtime/sessions] REQUEST");
      console.log("url:", url);
      console.log("payload:", { ...payload, instructions: `<${combinedInstructions.length} chars>` });
      console.groupEnd();
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const raw = await res.clone().text();
    let body: any = raw;
    try { body = JSON.parse(raw); } catch { }

    if (!res.ok) throw new Error(`Failed to get token: ${res.status} ${raw}`);

    const token = body?.client_secret?.value ?? body?.value ?? body?.token;
    if (!token) throw new Error("Ephemeral token not found in response");
    return token;
  }


  function setupInboundAudio(pc: RTCPeerConnection) {
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    pc.ontrack = (ev) => {
      audioEl.srcObject = ev.streams[0];

      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(ev.streams[0]);
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      src.connect(analyzer);
      analyserRef.current = analyzer;

      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const float = (dataArray[i] - 128) / 128;
          sum += float * float;
        }
        setCurrentVolume(Math.sqrt(sum / dataArray.length));
      }, 100);
    };
  }

  function configureDataChannel(dc: RTCDataChannel) {
    const sessionUpdate: any = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        input_audio_transcription: { model: "gpt-4o-transcribe", language: "es" },
        tools: [...tools],
      },
    };

    const extra = opts?.getBootInstructions?.();
    if (extra && typeof extra === "string" && extra.trim().length) {
      const ctxId = `BOOT@${new Date().toISOString()}`;
      sessionUpdate.session.instructions = `${extra}\n\n[CTX_ID:${ctxId}]`;
    }

    console.groupCollapsed("[Realtime][boot] session.update payload");
    const tnames = (sessionUpdate.session.tools || []).map((t: any) => t?.name).filter(Boolean);
    console.log("tools:", tnames);
    if (sessionUpdate.session.instructions) {
      const instr = sessionUpdate.session.instructions as string;
      console.log("instructions.len:", instr.length);
      console.log("instructions.preview:\n" + instr);
    } else {
      console.log("instructions: <none>");
    }
    console.groupEnd();

    dc.send(JSON.stringify(sessionUpdate));

    setTimeout(() => {
      try {
        const again: any = { ...sessionUpdate };
        const instr = (again.session.instructions || "").toString();
        const ctxId2 = `BOOT_AGAIN@${new Date().toISOString()}`;
        again.session.instructions = `${instr}\n\n[CTX_ID:${ctxId2}]`;
        if (debugLogs) {
          console.groupCollapsed("[Realtime][boot] session.update (again)");
          console.log("len:", again.session.instructions.length);
          console.log("preview:\n" + again.session.instructions.slice(0, 400));
          console.groupEnd();
        }
        dc.send(JSON.stringify(again));
      } catch { }
    }, 300);
  }

  async function waitForDataChannelOpen(timeoutMs = 4000): Promise<RTCDataChannel> {
    const dc = dataChannelRef.current;
    if (!dc) throw new Error("DataChannel no inicializado");

    if (dc.readyState === "open") return dc;

    await new Promise<void>((resolve, reject) => {
      let done = false;
      const onOpen = () => {
        if (done) return;
        done = true;
        dc.removeEventListener?.("open", onOpen as any);
        resolve();
      };

      dc.addEventListener?.("open", onOpen as any);

      const to = setTimeout(() => {
        if (done) return;
        done = true;
        dc.removeEventListener?.("open", onOpen as any);
        reject(new Error("Timeout esperando DataChannel 'open'"));
      }, timeoutMs);

      if (dc.readyState === "open") {
        clearTimeout(to);
        dc.removeEventListener?.("open", onOpen as any);
        resolve();
      }
    });

    return dataChannelRef.current!;
  }

  /* 
    Silent message sync with LISA
  */

  async function sendSilentUserNote(
    text: string,
    forceRespond: boolean = false,
    showInUI: boolean = true
  ) {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open") return;

    const clean = (text ?? "").trim();
    if (!clean) return;

    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: clean }],
      },
    }));

    if (forceRespond) {
      dc.send(JSON.stringify({ type: "response.create" }));
    }

    if (showInUI) {
      setConversation((prev) => ([
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: clean,
          isFinal: true,
          timestamp: new Date().toISOString(),
        },
      ]));
    }
  }

  function nudgeResponse() {
    try {
      const dc = dataChannelRef.current;
      if (dc && dc.readyState === "open") {
        dc.send(JSON.stringify({ type: "response.create" }));
      }
    } catch { }
  }

  function updateSessionContext(extra?: string) {
    const dc = dataChannelRef.current;
    if (!dc || dc.readyState !== "open") return;

    const ctxId = `CTX_REFRESH@${new Date().toISOString()}`;

    const sessionUpdate: any = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        input_audio_transcription: { model: "gpt-4o-transcribe", language: "es" },
        tools: [...tools],
      },
    };

    const fresh = opts?.getBootInstructions?.();
    const merged = [fresh, (extra || "").trim(), `[CTX_ID:${ctxId}]`]
      .filter(Boolean)
      .join("\n\n");

    if (merged) sessionUpdate.session.instructions = merged;

    console.groupCollapsed("[Realtime][ctx-refresh] session.update payload");
    console.log("dataChannel:", dc.readyState);
    console.log("hasInstructions:", !!merged, "len:", merged?.length || 0);
    console.log("preview:\n" + merged.slice(0, 800));
    console.groupEnd();

    dc.send(JSON.stringify(sessionUpdate));
  }

  async function startSession() {
    try {
      setIsStarting(true);
      setStatus("Pidiendo micrófono…");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000
        }
      });
      audioStreamRef.current = stream;

      setStatus("Obteniendo token efímero…");
      const token = await getEphemeralToken();

      setStatus("Conectando con OpenAI Realtime…");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      setupInboundAudio(pc);

      const dc = pc.createDataChannel("oai-events");
      dataChannelRef.current = dc;
      dc.onopen = () => configureDataChannel(dc);
      dc.onmessage = onDataMessage;

      pc.addTrack(stream.getTracks()[0]);

      if (debugLogs) {
        const bootNow = (opts?.getBootInstructions?.() || "").trim();
        console.groupCollapsed("[Realtime][pre-offer] boot snapshot");
        console.log("pre-offer.len:", bootNow.length);
        console.log("pre-offer.preview:\n" + bootNow.slice(0, 800));
        console.groupEnd();
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = readEnv("VITE_OPENAI_MODEL_REALTIME") ||
        readEnv("VITE_OPENAI_MODEL") ||
        "gpt-4o-realtime-preview-2025-06-03";

      const speed = clamp(toNum(readEnv("VITE_OPENAI_SPEED") || "1", 1), 0.5, 3.0);
      const temperature = clamp(
        toNum(readEnv("VITE_OPENAI_TEMPERATURE") || "0.7", 0.7),
        0.6,
        2.0
      );

      const q = new URLSearchParams({
        model,
        voice,
        speed: String(speed),
        temperature: String(temperature),
      });

      if (REALTIME_DEBUG) {
        console.groupCollapsed("[OpenAI Realtime] REQUEST");
        console.log("query:", Object.fromEntries(q.entries()));
        console.groupEnd();
      }

      const resp = await fetch(`${baseUrl}?${q}`, {
        method: "POST",
        body: offer.sdp!,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = await resp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });

      setIsSessionActive(true);
      setStatus("Sesión activa ✅");
    } catch (err: any) {
      console.error("startSession error:", err);
      setStatus(`Error: ${err?.message ?? err}`);
      stopSession();
    } finally {
      setIsStarting(false);
    }
  }

  function stopSession() {
    try {
      dataChannelRef.current?.close();
    } catch { }
    try {
      pcRef.current?.close();
    } catch { }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    analyserRef.current = null;
    pcRef.current = null;
    dataChannelRef.current = null;
    audioStreamRef.current = null;
    setIsSessionActive(false);
    setStatus("Sesión detenida");
    setIsStarting(false);
    setIsThinking(false);
  }

  function handleStartStopClick() {
    if (isSessionActive) stopSession();
    else startSession();
  }

  async function sendTextMessage(text: string) {
    const clean = (text ?? "").trim();
    if (!clean) return;

    setIsThinking(true);
    logSessionWindow("before-send");

    let dc = dataChannelRef.current;
    if (!dc) return;
    if (dc.readyState !== "open") {
      try {
        dc = await waitForDataChannelOpen(4000);
      } catch {
        return;
      }
    }

    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: clean }],
      },
    }));
    dc.send(JSON.stringify({ type: "response.create" }));

    setConversation((prev) => ([
      ...(prev ?? []),
      {
        id: crypto.randomUUID(),
        role: "user",
        text: clean,
        isFinal: true,
        timestamp: new Date().toISOString(),
      },
    ]));

    logSessionWindow("after-user-append");
  }

  function registerFunction(name: string, fn: Function) {
    functionRegistry.current[name] = fn;
  }

  async function onDataMessage(ev: MessageEvent) {
    try {
      const msg = JSON.parse(ev.data);

      switch (msg.type) {
        // ===== DELTAS DEL ASSISTANT =====
        case "response.audio_transcript.delta":
        case "response.text.delta":
        case "response.output_text.delta": {
          setIsThinking(false);
          const piece = msg.delta ?? "";
          setConversation((prev) => {
            const last = prev[prev.length - 1];

            if (last && last.role === "assistant" && !last.isFinal) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...last,
                text: (last.text || "") + piece,
              };
              return updated;
            }

            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                text: piece,
                isFinal: false,
              },
            ];
          });
          break;
        }

        // ===== FIN DE MENSAJE DEL ASSISTANT =====
        case "response.audio_transcript.done":
        case "response.text.done":
        case "response.output_text.done": {
          setIsThinking(false);
          setConversation((prev) => {
            if (!prev.length) return prev;
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              isFinal: true,
            };
            return updated;
          });
          setTimeout(() => logSessionWindow?.("assistant-replied"), 0);
          break;
        }

        // ===== TOOLS / FUNCTION CALLS =====
        case "response.function_call_arguments.done": {
          if (REALTIME_DEBUG) {
            console.log("[AI → function]", msg.name, msg.arguments);
          }
          const name = msg.name as string;
          const args = JSON.parse(msg.arguments || "{}");
          const callId = msg.call_id;

          const fn = functionRegistry.current[name];
          let result: any = { ok: true };
          if (typeof fn === "function") {
            try {
              result = await fn(args);
            } catch (e: any) {
              result = { ok: false, error: e?.message ?? String(e) };
            }
          } else {
            result = { ok: false, error: `Function ${name} not registered` };
          }

          const out = {
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify(result),
            },
          };
          const resume = { type: "response.create" };
          dataChannelRef.current?.send(JSON.stringify(out));
          dataChannelRef.current?.send(JSON.stringify(resume));
          break;
        }
        case "conversation.item.created": {
          const item = msg?.item;
          if (item?.type === "message" && (item?.role === "user" || item?.role === "User")) {
            const text = extractUserTextFromContent(item?.content || []);
            if (text) {
              setConversation(prev => ([
                ...prev,
                {
                  id: item?.id || crypto.randomUUID(),
                  role: "user",
                  text,
                  isFinal: true,
                  timestamp: new Date().toISOString(),
                },
              ]));
              if (debugLogs) console.debug("[RTC] user message captured (created):", text.slice(0, 120));
            }
          }
          break;
        }

        case "conversation.item.input_audio_transcription.completed":
        case "input_audio_transcription.completed":
        case "response.input_audio_transcription.completed": {
          const transcript =
            msg?.transcript ||
            msg?.item?.content?.find?.((c: any) => c?.type === "input_audio_transcription")?.transcript ||
            msg?.item?.content?.find?.((c: any) => c?.type === "transcript")?.text ||
            "";

          const clean = (transcript || "").trim();
          if (clean) {
            setConversation(prev => ([
              ...prev,
              {
                id: msg?.item_id || crypto.randomUUID(),
                role: "user",
                text: clean,
                isFinal: true,
                timestamp: new Date().toISOString(),
              },
            ]));
            if (debugLogs) console.debug("[RTC] user transcript captured (completed):", clean.slice(0, 120));
          }
          break;
        }
      }
    } catch (e) {
      console.error("onDataMessage parse error", e);
    }
  }


  console.log("LOGS DE CONVERSACION ############", conversation);

  useEffect(() => {
    if (!opts?.autoStart || startedRef.current) return;
    startedRef.current = true;

    const id = window.setTimeout(() => {
      startSession().catch(err => {
        console.error("[RTC] autoStart error:", err);
        setStatus(`Error: ${err?.message ?? err}`);
      });
    }, Math.max(0, opts?.startDelayMs ?? 0));

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.autoStart, opts?.startDelayMs]);

  useEffect(() => () => stopSession(), []);

  return {
    status,
    isSessionActive,
    currentVolume,
    conversation,
    startSession,
    stopSession,
    handleStartStopClick,
    sendTextMessage,
    registerFunction,
    logSessionWindow,
    isStarting,
    isThinking,

    sendSilentUserNote,
    updateSessionContext,
    nudgeResponse
  };
}
