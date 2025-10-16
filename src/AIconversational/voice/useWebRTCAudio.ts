import { useEffect, useRef, useState, useCallback } from "react";
import { internalSummaryTool } from "./internal/internalSummaryTool";

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
    maxTurns?: number;
    debugLogs?: boolean;
};

export default function useWebRTCAudio(voice: string, tools: Tool[], opts?: UseRtcOpts) {
    const [status, setStatus] = useState("");
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [conversation, setConversation] = useState<ConversationItem[]>([]);
    const [currentVolume, setCurrentVolume] = useState(0);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const volumeIntervalRef = useRef<number | null>(null);
    const functionRegistry = useRef<Record<string, Function>>({});

    const sessionTurnsRef = useRef(0);
    const shouldRestartRef = useRef(false);

    const isRestartingRef = useRef(false);

    const currentVolumeRef = useRef(0);
    useEffect(() => { currentVolumeRef.current = currentVolume; }, [currentVolume]);

    const startedRef = useRef(false);

    const rollingSummaryRef = useRef<{ text: string; ver: number }>({ text: "", ver: 0 });

    const maxTurns = opts?.maxTurns ?? 2;
    const debugLogs = !!opts?.debugLogs;

    function waitForRollingSummary(prevVer: number, timeoutMs = 1800): Promise<boolean> {
        const start = Date.now();
        return new Promise((resolve) => {
            const iv = setInterval(() => {
                if (rollingSummaryRef.current.ver > prevVer) {
                    clearInterval(iv);
                    resolve(true);
                } else if (Date.now() - start > timeoutMs) {
                    clearInterval(iv);
                    resolve(false);
                }
            }, 60);
        });
    }

    useEffect(() => {
        functionRegistry.current["__setRollingSummary"] = (args: { summary: string }) => {
            const s = (args?.summary ?? "").trim();
            if (s) {
                rollingSummaryRef.current = { text: s, ver: rollingSummaryRef.current.ver + 1 };
                if (debugLogs) console.info("[summary] stored:", s);
                return { ok: true };
            }
            return { ok: false, error: "Empty summary" };
        };
    }, [debugLogs]);

    const logSessionWindow = useCallback((label: string) => {
        if (!debugLogs) return;
        const dc = dataChannelRef.current;
        const pc = pcRef.current;

        const windowTurns = conversation.slice(-maxTurns);
        const rows = windowTurns.map((t, i) => ({
            idx: i + Math.max(0, conversation.length - maxTurns) + 1,
            role: t.role,
            text: (t.text || "").length > 80 ? (t.text || "").slice(0, 80) + "…" : (t.text || ""),
            ts: t.timestamp?.slice(11, 19) ?? "",
            final: !!t.isFinal,
        }));

        console.groupCollapsed(
            `%c[Realtime] ${label} – window=${windowTurns.length}/${conversation.length}`,
            "color:#10b981;font-weight:600"
        );
        console.table(rows);
        console.log("session:", {
            maxTurns,
            dataChannel: dc?.readyState,
            ice: pc?.iceConnectionState,
            isSessionActive,
            status,
        });
        console.groupEnd();
    }, [debugLogs, conversation, maxTurns, isSessionActive, status]);

    // ===== token efímero: replica la POC (payload completo a /realtime/sessions) =====
    async function getEphemeralToken(): Promise<string> {
        const backendUrl = import.meta.env.VITE_API_CONVERSATION

        const model = import.meta.env.VITE_OPENAI_MODEL
        const speed = clamp(toNum(readEnv("VITE_OPENAI_SPEED") || "1", 1), 0.5, 3.0);
        const temperature = clamp(
            toNum(readEnv("VITE_OPENAI_TEMPERATURE") || "0.7", 0.7),
            0.6,
            2.0
        );

        const payload = {
            model,
            voice,
            modalities: ["audio", "text"],
            instructions:
                "Tu nombre es Alma, presentate y respondé en español. Si el usuario pide navegar o cambiar el tema, llamá la tool correspondiente. Confirmá brevemente después de ejecutar.",
            tool_choice: "auto",
            speed,
            temperature,
        };

        const url = `${backendUrl}/realtime/sessions`;
        if (REALTIME_DEBUG) {
            console.groupCollapsed("[/realtime/sessions] REQUEST");
            console.log("url:", url);
            console.log("payload:", payload);
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
        try {
            body = JSON.parse(raw);
        } catch { }

        if (REALTIME_DEBUG) {
            console.groupCollapsed("[/realtime/sessions] RESPONSE");
            console.log("status:", res.status, res.statusText);
            console.log("body:", body);
            const tokenPreview =
                body?.client_secret?.value ?? body?.value ?? body?.token;
            console.log("token:", mask(tokenPreview));
            console.groupEnd();
        }

        if (!res.ok) throw new Error(`Failed to get token: ${res.status} ${raw}`);

        const token =
            body?.client_secret?.value ?? body?.value ?? body?.token;
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
        const sessionUpdate = {
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                input_audio_transcription: { model: "gpt-4o-transcribe" },
                tools: [...tools, internalSummaryTool],
            },
        };
        if (REALTIME_DEBUG) {
            console.log("[session.update] tools:", sessionUpdate.session.tools);
        }
        dc.send(JSON.stringify(sessionUpdate));
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

            // si ya abrió entre líneas:
            if (dc.readyState === "open") {
                clearTimeout(to);
                dc.removeEventListener?.("open", onOpen as any);
                resolve();
            }
        });

        return dataChannelRef.current!;
    }

    async function startSession() {
        try {
            setStatus("Pidiendo micrófono…");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
            sessionTurnsRef.current = 0;
            shouldRestartRef.current = false;
        } catch (err: any) {
            console.error("startSession error:", err);
            setStatus(`Error: ${err?.message ?? err}`);
            stopSession();
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
    }

    function handleStartStopClick() {
        if (isSessionActive) stopSession();
        else startSession();
    }


    /* ------- */


    const getLastTurns = useCallback((n: number) => {
        const msgs = conversation.slice(-n);
        return msgs.map(m => ({ role: m.role as "user" | "assistant", text: m.text }));
    }, [conversation]);

    const restartSessionWithLastTurns = useCallback(async (n: number) => {
        const last = getLastTurns(Math.max(0, n));

        await stopSession();

        await startSession();

        let dc: RTCDataChannel;
        try {
            dc = await waitForDataChannelOpen(5000);
        } catch (e) {
            if (debugLogs) console.warn("[restart] DC no abrió a tiempo:", e);
            return;
        }

        const summary = (rollingSummaryRef.current.text || "").trim();
        dc.send(JSON.stringify({
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                input_audio_transcription: { model: "gpt-4o-transcribe" },
                tools: [...tools, internalSummaryTool],
                ...(summary
                    ? {
                        instructions:
                            `Tu nombre es Alma. Respondé en español.\n` +
                            `Contexto breve de la conversación previa:\n${summary}\n` +
                            `Mantené coherencia con ese contexto sin inventar detalles.`,
                    }
                    : {}),
            },
        }));

        for (const t of last) {
            dc.send(JSON.stringify({
                type: "conversation.item.create",
                item: { type: "message", role: t.role, content: [{ type: "input_text", text: t.text }] },
            }));
        }
        sessionTurnsRef.current = last.length;
        shouldRestartRef.current = sessionTurnsRef.current >= maxTurns;
    }, [getLastTurns, tools, stopSession, startSession, waitForDataChannelOpen, debugLogs, maxTurns]);



    async function sendTextMessage(text: string) {
        const clean = (text ?? "").trim();
        if (!clean) return;

        logSessionWindow("before-send");

        // 1) ventana deslizante: si con este mensaje supero maxTurns, reinicio y rehidrato (maxTurns - 1)
        const currentLen = Array.isArray(conversation) ? conversation.length : 0;

        const willServerTurns = sessionTurnsRef.current + 1;
        if (shouldRestartRef.current || willServerTurns > maxTurns) {
            try {
                await restartSessionWithLastTurns(Math.max(0, maxTurns - 1));
                shouldRestartRef.current = false;            // ✅ apagamos la bandera tras reiniciar
                logSessionWindow("after-restart");
            } catch (err) {
                if (debugLogs) console.warn("[send] restart failed, sigo igual:", err);
            }
        }

        // 2) asegurar canal abierto (puede haberse recreado)
        let dc = dataChannelRef.current;
        if (!dc) return;
        if (dc.readyState !== "open") {
            try {
                dc = await waitForDataChannelOpen(4000);
            } catch {
                return;
            }
        }

        // 3) enviar mensaje del usuario + pedir respuesta
        dc.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
                type: "message",
                role: "user",
                content: [{ type: "input_text", text: clean }],
            },
        }));
        dc.send(JSON.stringify({ type: "response.create" }));

        sessionTurnsRef.current = Math.min(maxTurns, sessionTurnsRef.current + 1);
        if (sessionTurnsRef.current >= maxTurns) {
            shouldRestartRef.current = true;               // ✅ marcar reinicio para el próximo turn
        }

        // 4) actualizar conversación local y recortar ventana
        setConversation((prev) => {
            const next = [
                ...(prev ?? []),
                {
                    id: crypto.randomUUID(),
                    role: "user",
                    text: clean,
                    isFinal: true,
                    timestamp: new Date().toISOString(),
                },
            ];
            // recortar a últimas maxTurns para que el estado local coincida con la ventana lógica
            return next.length > maxTurns ? next.slice(-maxTurns) : next;
        });

        logSessionWindow("after-user-append");
    }

    function registerFunction(name: string, fn: Function) {
        functionRegistry.current[name] = fn;
    }

    async function onDataMessage(ev: MessageEvent) {
        try {
            const msg = JSON.parse(ev.data);

            switch (msg.type) {
                // ===== DELTAS DEL ASSISTANT (crecen carácter a carácter) =====
                case "response.audio_transcript.delta":
                case "response.text.delta":
                case "response.output_text.delta": {
                    const piece = msg.delta ?? "";
                    setConversation((prev) => {
                        const last = prev[prev.length - 1];

                        // Si el último ya es del assistant y no está finalizado: concatenar texto
                        if (last && last.role === "assistant" && !last.isFinal) {
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                ...last,
                                text: (last.text || "") + piece,
                            };
                            // No recortamos acá porque no aumenta la longitud
                            return updated;
                        }

                        // Primer delta de un nuevo mensaje del assistant → aumenta longitud local
                        const next = [
                            ...prev,
                            {
                                id: crypto.randomUUID(),
                                role: "assistant",
                                text: piece,
                                isFinal: false,
                            },
                        ];
                        const trimmed = next.length > maxTurns ? next.slice(-maxTurns) : next;

                        // 🔹 también cuenta para el límite de la SESIÓN del servidor
                        sessionTurnsRef.current = Math.min(maxTurns, sessionTurnsRef.current + 1);

                        // Si alcanzó el límite, marcamos reinicio diferido (lo haremos al parar el audio)
                        if (sessionTurnsRef.current >= maxTurns) {
                            shouldRestartRef.current = true;
                            if (debugLogs) {
                                console.info(
                                    "[turns] assistant hit limit → will restart on output_audio_buffer.stopped:",
                                    sessionTurnsRef.current, "/", maxTurns
                                );
                            }
                        } else if (debugLogs) {
                            console.info("[turns] +assistant →", sessionTurnsRef.current, "/", maxTurns);
                        }

                        return trimmed;
                    });
                    break;
                }

                // ===== FIN DE MENSAJE DEL ASSISTANT (texto/transcripción) =====
                // Sólo marcamos isFinal; NO reiniciamos acá para no cortar el audio.
                case "response.audio_transcript.done":
                case "response.text.done":
                case "response.output_text.done": {
                    setConversation((prev) => {
                        if (!prev.length) return prev;
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            isFinal: true,
                        };
                        return updated.length > maxTurns ? updated.slice(-maxTurns) : updated;
                    });
                    // Log después de que React aplique el estado
                    setTimeout(() => logSessionWindow?.("assistant-replied"), 0);
                    break;
                }

                // ===== AUDIO TTS FINALIZADO (¡evento que viste en logs!) =====
                case "output_audio_buffer.stopped": {
                    if (debugLogs) console.info("[audio] output_audio_buffer.stopped");

                    (async () => {
                        if (shouldRestartRef.current && !isRestartingRef.current) {
                            try {
                                isRestartingRef.current = true;

                                // 1) Pedimos al modelo que resuma y lo guarde vía la tool interna
                                const prevVer = rollingSummaryRef.current.ver;
                                const dc = dataChannelRef.current;
                                if (dc && dc.readyState === "open") {
                                    const prompt =
                                        "Antes de continuar, sintetiza los últimos mensajes en 1–2 frases claras " +
                                        "y llama a la función __setRollingSummary({ summary: \"...\" }). " +
                                        "No devuelvas nada más por voz ni texto.";
                                    dc.send(JSON.stringify({
                                        type: "conversation.item.create",
                                        item: {
                                            type: "message",
                                            role: "user",
                                            content: [{ type: "input_text", text: prompt }],
                                        },
                                    }));
                                    dc.send(JSON.stringify({ type: "response.create" }));

                                    // Esperar a que el modelo guarde el resumen (o que expire el timeout)
                                    await waitForRollingSummary(prevVer, 1800);
                                }

                                // 2) Reiniciar con (maxTurns - 1) e inyectar el resumen como instructions
                                await restartSessionWithLastTurns(Math.max(0, maxTurns - 1));
                                shouldRestartRef.current = false;

                                if (debugLogs) console.info("[restart] done after output_audio_buffer.stopped (with summary)");
                            } catch (e) {
                                if (debugLogs) console.warn("[restart] failed after output_audio_buffer.stopped:", e);
                            } finally {
                                isRestartingRef.current = false;
                            }
                        }
                    })();

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

                default:
                    if (debugLogs && msg?.type) {
                        console.debug("[RTC] Unhandled message type:", msg.type, msg);
                    }
                    break;
            }
        } catch (e) {
            console.error("onDataMessage parse error", e);
        }
    }


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
        logSessionWindow
    };
}
