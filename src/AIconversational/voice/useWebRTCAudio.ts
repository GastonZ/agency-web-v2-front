import { useEffect, useRef, useState } from "react";

type Tool = {
    type: "function";
    name: string;
    description: string;
    parameters?: {
        type: "object";
        properties?: Record<string, any>;
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
    // Vite
    const viteAny = (import.meta as any)?.env?.[name];
    // Node-style (por si acaso)
    const nextAny = (globalThis as any)?.process?.env?.[name];
    return (viteAny ?? nextAny ?? fallback) as string | undefined;
}
function coerceNumber(v: unknown, def: number) {
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

export default function useWebRTCAudio(
    voice: string,
    tools: Tool[]
) {
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

    // === EPHEMERAL TOKEN ===
    const REALTIME_DEBUG =
        (import.meta as any)?.env?.VITE_REALTIME_DEBUG === "1"

    function mask(t?: string) {
        if (!t) return t;
        if (t.length <= 10) return "***" + t.slice(-3);
        return t.slice(0, 4) + "…(masked)…" + t.slice(-6);
    }

    async function getEphemeralToken(): Promise<string> {
        // 1) URL del backend (igual que en tu POC, pero desde Vite)
        const backendUrl = import.meta.env.VITE_API_CONVERSATION

        const url = `${backendUrl}/realtime/sessions`;

        // 2) Leemos envs del FRONT (equivalentes a las que usaba tu route.ts de Next)
        const model =
            (import.meta as any)?.env?.VITE_OPENAI_MODEL ||
            (globalThis as any)?.process?.env?.OPENAI_MODEL ||
            "gpt-realtime";

        const voice =
            (import.meta as any)?.env?.VITE_OPENAI_VOICE ||
            (globalThis as any)?.process?.env?.OPENAI_VOICE ||
            "alloy";

        const speedRaw =
            (import.meta as any)?.env?.VITE_OPENAI_SPEED ||
            (globalThis as any)?.process?.env?.OPENAI_SPEED ||
            "1";

        const temperatureRaw =
            (import.meta as any)?.env?.VITE_OPENAI_TEMPERATURE ||
            (globalThis as any)?.process?.env?.OPENAI_TEMPERATURE ||
            "0.7";

        // normalizamos números (soporta "0,7")
        const toNum = (v: unknown, def: number) => {
            if (typeof v === "number" && !Number.isNaN(v)) return v;
            if (typeof v === "string") {
                const n = parseFloat(v.replace(",", "."));
                if (!Number.isNaN(n)) return n;
            }
            return def;
        };
        const clamp = (n: number, min: number, max: number) =>
            Math.min(max, Math.max(min, n));

        const speed = clamp(toNum(speedRaw, 1), 0.5, 3.0);
        const temperature = clamp(toNum(temperatureRaw, 0.7), 0.6, 2.0); // 👈 min 0.6 (igual POC pero blindado)

        // 3) Payload **idéntico** al de tu Next `route.ts` (P-O-C)
        const payload = {
            model,
            voice,
            modalities: ["audio", "text"],
            instructions:
                "Start conversation with the user by saying ne argentino 'Hello, my name is Sarah, how can I help you today?' Use the available tools when relevant. After executing a tool, you will need to respond (create a subsequent conversation item) to the user sharing the function result or error. If you do not respond with additional message with function result, user will not know you successfully executed the tool. Speak and respond in the language of the user.",
            tool_choice: "auto",
            speed,
            temperature,
        };

        if (REALTIME_DEBUG) {
            console.groupCollapsed("[/realtime/sessions] REQUEST (from Vite)");
            console.log("url:", url);
            console.log("payload:", payload);
            console.groupEnd();
        }

        // 4) Llamada al backend con el payload completo (como hacía /api/session)
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

        if (!res.ok) {
            throw new Error(`Failed to get ephemeral token: ${res.status} ${raw}`);
        }

        const token =
            body?.client_secret?.value ?? body?.value ?? body?.token;
        if (!token) throw new Error("Ephemeral token not found in response");
        return token;
    }

    function setupInboundAudioTrack(pc: RTCPeerConnection) {
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        pc.ontrack = (ev) => {
            audioEl.srcObject = ev.streams[0];
            // volumen (RMS)
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        // session.update: activa audio+texto, STT y tools
        const sessionUpdate = {
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                input_audio_transcription: { model: "gpt-4o-transcribe" },
                tools,
            },
        };
        console.log("[session.update] tools:", sessionUpdate.session.tools);
        dc.send(JSON.stringify(sessionUpdate));
    }

    async function startSession() {
        try {
            setStatus("Pidiendo micrófono…");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            setStatus("Pidiendo token efímero…");
            const token = await getEphemeralToken();

            setStatus("Conectando con OpenAI Realtime…");
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            setupInboundAudioTrack(pc);

            const dc = pc.createDataChannel("oai-events");
            dataChannelRef.current = dc;

            dc.onopen = () => configureDataChannel(dc);
            dc.onmessage = onDataMessage;

            // mic → peer
            pc.addTrack(stream.getTracks()[0]);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = readEnv("VITE_OPENAI_MODEL", "gpt-4o-realtime-preview-2025-06-03")!;
            const speedRaw = coerceNumber(readEnv("VITE_OPENAI_SPEED", "1"), 1);
            const temperatureRaw = coerceNumber(readEnv("VITE_OPENAI_TEMPERATURE", "0.7"), 0.7);
            const speed = clamp(speedRaw, 0.5, 3.0);
            const temperature = clamp(temperatureRaw, 0.6, 2.0); // min 0.6 para evitar 400 del back de la POC

            const q = new URLSearchParams({
                model,
                voice,
                speed: String(speed),
                temperature: String(temperature),
            });

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
            audioStreamRef.current.getTracks().forEach(t => t.stop());
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
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") return;
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
        setConversation(prev => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", text, isFinal: true, timestamp: new Date().toISOString() },
        ]);
    }

    function registerFunction(name: string, fn: Function) {
        functionRegistry.current[name] = fn;
    }

    async function onDataMessage(ev: MessageEvent) {
        try {
            const msg = JSON.parse(ev.data);

            switch (msg.type) {
                // parciales de transcripción de voz del asistente (TTS → transcript)
                case "response.audio_transcript.delta": {
                    const last = conversation[conversation.length - 1];
                    if (last?.role === "assistant" && !last.isFinal) {
                        setConversation(prev => {
                            const cp = [...prev];
                            cp[cp.length - 1] = { ...last, text: last.text + msg.delta };
                            return cp;
                        });
                    } else {
                        setConversation(prev => [
                            ...prev,
                            { id: crypto.randomUUID(), role: "assistant", text: msg.delta ?? "", isFinal: false },
                        ]);
                    }
                    break;
                }
                case "response.audio_transcript.done": {
                    setConversation(prev => {
                        if (!prev.length) return prev;
                        const cp = [...prev];
                        cp[cp.length - 1] = { ...cp[cp.length - 1], isFinal: true };
                        return cp;
                    });
                    break;
                }

                // llamada a función por parte del modelo
                case "response.function_call_arguments.done": {
                    console.log("[AI → function]", msg.name, msg.arguments); // 👈
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

                    // responder con output de función + pedir respuesta
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
                    // otros eventos de estado / debugging
                    break;
            }
        } catch (e) {
            console.error("onDataMessage parse error", e);
        }
    }

    useEffect(() => () => stopSession(), []); // cleanup unmount

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
