// src/components/features/WhatsappQrPannel.tsx
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useUserQrChannel } from "../../hooks/useUserQrChannel";
import { activateWhatsappBot } from "../../services/campaigns";

type CampaignStatus = "draft" | "active" | "paused" | "archived" | string;

type Props = {
    userId: string;
    campaignId: string;
    socketUrl?: string;
    token?: string;
    campaignStatus?: CampaignStatus;
};

type QrPayload = { data?: string; qr?: string; campaignId?: string;[k: string]: any };

const WhatsappQrPanel: React.FC<Props> = ({
    userId,
    campaignId,
    socketUrl = "http://localhost:9000",
    token,
    campaignStatus,
}) => {
    const { connected, qr, error, resetQr, startSocket, disconnect } =
        useUserQrChannel({ userId, socketUrl, token, autoStart: false });

    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [info, setInfo] = useState<string | null>(null);
    const [displayedQr, setDisplayedQr] = useState<QrPayload | null>(null);

    const handleReconnect = async () => {
        try { await startSocket(); } catch { }
    };
    const handleDisconnect = () => { disconnect(); };

    const handleCopyRaw = async () => {
        try {
            const payload = displayedQr ?? qr ?? {};
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            setCopied(true); setTimeout(() => setCopied(false), 800);
        } catch { }
    };

    const hardResetQr = () => { resetQr(); setDisplayedQr(null); setActionError(null); setInfo(null); };

    const requestQr = async () => {
        setActionError(null);
        setInfo(null);
        setBusy(true);
        try {
            if (!connected) {
                setInfo("Conectando al socket…");
                await startSocket();
            }

            if (campaignStatus !== "active") {
                setActionError("La campaña no está activa. Activala desde las opciones de arriba y luego solicita el QR.");
                return;
            }

            hardResetQr();
            setInfo("Activando el bot de WhatsApp y generando QR…");

            const resp = await activateWhatsappBot(campaignId);
            if (!resp?.success) {
                setActionError(resp?.message || "No se pudo activar el bot de WhatsApp.");
                return;
            }

            setInfo(resp.qrGenerated ? "QR generado. Mostrando…" : "Esperando QR del servidor…");
        } catch (e: any) {
            setActionError(e?.message ?? "Error al solicitar el QR.");
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        if (!qr) return;

        const incomingId = (qr as any).campaignId;
        if (!incomingId) {
            setInfo((prev) => prev ?? "Se recibió un QR sin campaignId. Ignorando…");
            return;
        }

        if (incomingId === campaignId) {
            setDisplayedQr(qr);
            setActionError(null);
            setInfo(null);
        } else {
            setActionError("Se recibió un QR de otra campaña. Ignorando y manteniendo el actual.");
        }
    }, [qr, campaignId]);

    const rawValue =
        (displayedQr?.data && typeof displayedQr.data === "string" && displayedQr.data.trim()) ||
        (displayedQr?.qr && typeof displayedQr.qr === "string" && displayedQr.qr.trim()) ||
        "";
    const isImageDataUrl = rawValue.startsWith("data:image");

    return (
        <div className="rounded-xl border border-emerald-500/25 bg-white/60 dark:bg-neutral-900/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm">
                    <div className="font-medium">WhatsApp</div>
                    <div className="opacity-70">
                        Socket: {connected ? "Conectado" : "Desconectado"}
                        {error && <span className="ml-2 text-red-500">({error})</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleReconnect} className="text-xs px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800">
                        Re-conectar
                    </button>
                    <button onClick={handleDisconnect} className="text-xs px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800">
                        Desconectar
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-start">
                <button onClick={hardResetQr} className="h-9 px-3 rounded-lg bg-neutral-2 00/70 dark:bg-neutral-800/70">
                    Limpiar QR
                </button>

                <button
                    onClick={requestQr}
                    disabled={busy}
                    className="h-9 px-3 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
                    title="Solicitar QR"
                >
                    {busy ? "Solicitando…" : "Solicitar QR"}
                </button>

                {actionError && <span className="text-sm text-red-500">{actionError}</span>}
                {info && !actionError && <span className="text-sm text-emerald-700 dark:text-emerald-300">{info}</span>}

                {displayedQr && (
                    <button onClick={handleCopyRaw} className="h-9 px-3 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70" title="Copiar payload">
                        {copied ? "¡Copiado!" : "Copiar payload"}
                    </button>
                )}

                <span className="text-xs opacity-70">Escuchando <code>qr-generated</code> para <b>{userId}</b>.</span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-white h-[400px] w-[400px] p-4 flex items-center justify-center">
                {!rawValue ? (
                    <span className="text-sm opacity-60 text-center">{info || "Esperando QR…"}</span>
                ) : isImageDataUrl ? (
                    <img src={rawValue} alt="QR" className="h-[400px] w-[400px]" />
                ) : (
                    <QRCode value={rawValue} size={208} />
                )}
            </div>

            {displayedQr && (
                <details className="text-xs opacity-80">
                    <summary className="cursor-pointer select-none">Payload (debug)</summary>
                    <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded max-h-64 overflow-auto">
                        {JSON.stringify(displayedQr, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
};

export default WhatsappQrPanel;
