import { useEffect, useRef, useState } from "react";

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

export default function useWebRTCAudio(voice: string, tools: Tool[]) {
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
            voice: voice || "alloy",
            modalities: ["audio", "text"],
            instructions:
                "Respondé en español. Si el usuario pide navegar o cambiar el tema, llamá la tool correspondiente. Confirmá brevemente después de ejecutar.",
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
                tools, // 👈 importante: con `type: "function"`
            },
        };
        if (REALTIME_DEBUG) {
            console.log("[session.update] tools:", sessionUpdate.session.tools);
        }
        dc.send(JSON.stringify(sessionUpdate));
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

    function sendTextMessage(text: string) {
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open")
            return;
        const message = {
            type: "conversation.item.create",
            item: {
                type: "message",
                role: "user",
                content: [{ type: "input_text", text }],
            },
        };
        const response = { type: "response.create" };
        dataChannelRef.current.send(JSON.stringify(message));
        dataChannelRef.current.send(JSON.stringify(response));
        setConversation((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                role: "user",
                text,
                isFinal: true,
                timestamp: new Date().toISOString(),
            },
        ]);
    }

    function registerFunction(name: string, fn: Function) {
        functionRegistry.current[name] = fn;
    }

    async function onDataMessage(ev: MessageEvent) {
        try {
            const msg = JSON.parse(ev.data);

            switch (msg.type) {
                case "response.audio_transcript.delta":
                case "response.text.delta":
                case "response.output_text.delta": {
                    const piece = msg.delta ?? "";
                    setConversation(prev => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === "assistant" && !last.isFinal) {
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                ...last,
                                text: last.text + piece,
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
                case "response.audio_transcript.done":
                case "response.text.done":
                case "response.output_text.done": {
                    setConversation(prev => {
                        if (!prev.length) return prev;
                        const updated = [...prev];
                        updated[updated.length - 1] = { ...updated[updated.length - 1], isFinal: true };
                        return updated;
                    });
                    break;
                }

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
                    break;
            }
        } catch (e) {
            console.error("onDataMessage parse error", e);
        }
    }

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
    };
}
