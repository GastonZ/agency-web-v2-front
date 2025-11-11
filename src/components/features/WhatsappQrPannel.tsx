// src/components/features/WhatsappQrPannel.tsx
import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useUserQrChannel } from "../../hooks/useUserQrChannel";
import { activateWhatsappBot } from "../../services/campaigns";
import { AlertTriangle } from "lucide-react";

type CampaignStatus = "draft" | "active" | "paused" | "archived" | string;

type QrScannedPayload = {
    agentId?: string;
    phoneNumber?: string;
    scannedAt?: string;
    message?: string;
    qrScanRecord?: {
        scannedAt?: string;
        scannedBy?: string;
        scannedByPhone?: string;
    };
    timestamp?: string;
    campaignId?: string;
    userId?: string;
    [k: string]: any;
};

type Props = {
    userId: string;
    campaignId: string;
    socketUrl?: string;
    token?: string;
    campaignStatus?: CampaignStatus;
    onQrScanned?: (payload: QrScannedPayload) => void;
    whatsappStatus?: {
        qrScanned: boolean;
        qrScannedAt: string | null;
        qrScannedBy: string | null;
        qrScannedByPhone: string | null;
    };
};

type QrPayload = { data?: string; qr?: string; campaignId?: string;[k: string]: any };

const WhatsappQrPanel: React.FC<Props> = ({
    userId,
    campaignId,
    socketUrl = import.meta.env.VITE_API_URL,
    token,
    campaignStatus,
    onQrScanned,
    whatsappStatus
}) => {
    const { connected, qr, error, resetQr, startSocket, disconnect, lastScan } =
        useUserQrChannel({ userId, socketUrl, token, autoStart: false });
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [info, setInfo] = useState<string | null>(null);
    const [displayedQr, setDisplayedQr] = useState<QrPayload | null>(null);
    const [showConfirmNewQr, setShowConfirmNewQr] = useState(false);
    const [localWhatsappStatus, setLocalWhatsappStatus] = useState<{
        qrScanned: boolean;
        qrScannedAt: string | null;
        qrScannedBy: string | null;
        qrScannedByPhone: string | null;
    } | null>(() => {
        return whatsappStatus
            ? {
                qrScanned: whatsappStatus.qrScanned,
                qrScannedAt: whatsappStatus.qrScannedAt,
                qrScannedBy: whatsappStatus.qrScannedBy,
                qrScannedByPhone: whatsappStatus.qrScannedByPhone,
            }
            : null;
    });

    useEffect(() => {
        if (!whatsappStatus) return;

        setLocalWhatsappStatus((prev) => {
            if (!prev) {
                return {
                    qrScanned: whatsappStatus.qrScanned,
                    qrScannedAt: whatsappStatus.qrScannedAt,
                    qrScannedBy: whatsappStatus.qrScannedBy,
                    qrScannedByPhone: whatsappStatus.qrScannedByPhone,
                };
            }

            if (prev.qrScanned && !whatsappStatus.qrScanned) {
                return prev;
            }
            if (!prev.qrScanned && whatsappStatus.qrScanned) {
                return {
                    qrScanned: whatsappStatus.qrScanned,
                    qrScannedAt: whatsappStatus.qrScannedAt,
                    qrScannedBy: whatsappStatus.qrScannedBy,
                    qrScannedByPhone: whatsappStatus.qrScannedByPhone,
                };
            }

            return prev;
        });
    }, [whatsappStatus]);

    const handleReconnect = async () => {
        try {
            await startSocket();
        } catch { }
    };
    const handleDisconnect = () => {
        disconnect();
    };

    const handleCopyRaw = async () => {
        try {
            const payload = displayedQr ?? qr ?? {};
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 800);
        } catch { }
    };

    const hardResetQr = () => {
        resetQr();
        setDisplayedQr(null);
        setActionError(null);
        setInfo(null);
    };

    const performRequestQr = async () => {
        setBusy(true);
        try {
            if (!connected) {
                setInfo("Conectando al socket…");
                await startSocket();
            }

            if (campaignStatus !== "active") {
                setActionError(
                    "La campaña no está activa. Activala desde las opciones de arriba y luego solicita el QR."
                );
                return;
            }

            hardResetQr();
            setInfo("Activando el bot de WhatsApp y generando QR…");

            const resp = await activateWhatsappBot(campaignId);
            if (!resp?.success) {
                setActionError(resp?.message || "No se pudo activar el bot de WhatsApp.");
                return;
            }

            setLocalWhatsappStatus({
                qrScanned: false,
                qrScannedAt: null,
                qrScannedBy: null,
                qrScannedByPhone: null,
            });

            setInfo(
                resp.qrGenerated
                    ? "QR generado. Mostrando…"
                    : "Esperando QR del servidor…"
            );
        } catch (e: any) {
            setActionError(e?.message ?? "Error al solicitar el QR.");
        } finally {
            setBusy(false);
        }
    };

    const requestQr = async () => {
        setActionError(null);
        setInfo(null);

        if (localWhatsappStatus?.qrScanned) {
            setShowConfirmNewQr(true);
            return;
        }

        await performRequestQr();
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

    useEffect(() => {
        console.log("[WhatsappQrPanel] useEffect(lastScan) disparado con:", lastScan);

        if (!lastScan) {
            return;
        }

        const record = lastScan.qrScanRecord || {};

        const rawPhone =
            record.scannedByPhone ||
            record.scannedBy ||
            lastScan.phoneNumber ||
            null;

        const scannedAt =
            record.scannedAt ||
            lastScan.scannedAt ||
            lastScan.timestamp ||
            null;

        const prettyPhone = rawPhone
            ? rawPhone.replace(/@.+$/, "")
            : null;

        const nextStatus = {
            qrScanned: true,
            qrScannedAt: scannedAt ?? null,
            qrScannedBy: record.scannedBy || lastScan.agentId || null,
            qrScannedByPhone: prettyPhone,
        };

        setLocalWhatsappStatus(nextStatus);

        setInfo(
            prettyPhone
                ? `QR escaneado correctamente. Número vinculado: ${prettyPhone}`
                : "QR escaneado correctamente. WhatsApp quedó vinculado."
        );
        setActionError(null);

        if (typeof onQrScanned === "function") {
            onQrScanned(lastScan as QrScannedPayload);
        }
    }, [lastScan, onQrScanned]);

    const rawValue =
        (displayedQr?.data && typeof displayedQr.data === "string" && displayedQr.data.trim()) ||
        (displayedQr?.qr && typeof displayedQr.qr === "string" && displayedQr.qr.trim()) ||
        "";
    const isImageDataUrl = rawValue.startsWith("data:image");

    const handleConfirmNewQr = async () => {
        setShowConfirmNewQr(false);
        await performRequestQr();
    };

    return (
        <div className="rounded-xl border border-emerald-500/25 bg-white/60 dark:bg-neutral-900/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm">
                    <div className="font-medium">WhatsApp</div>
                    {error && (
                        <p className="text-xs text-red-500 mt-1">
                            {String(error)}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-start">

                <button
                    onClick={requestQr}
                    disabled={busy}
                    className="h-9 px-3 rounded-lg bg-emerald-600 text-white disabled:opacity-60 text-sm"
                    title="Solicitar QR"
                >
                    {busy ? "Solicitando…" : "Solicitar QR"}
                </button>

                {localWhatsappStatus?.qrScanned && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                        Actualmente vinculado al número{" "}
                        <span className="font-mono">
                            {localWhatsappStatus.qrScannedByPhone}
                        </span>
                        {localWhatsappStatus.qrScannedAt
                            ? ` (desde ${new Date(localWhatsappStatus.qrScannedAt).toLocaleString()})`
                            : ""}
                    </span>
                )}

                {actionError && <span className="text-sm text-red-500">{actionError}</span>}
                {info && !actionError && (
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">{info}</span>
                )}
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-white h-[400px] w-[400px] p-4 flex items-center justify-center">
                {!rawValue ? (
                    <span className="text-sm opacity-60 text-center">
                        {info || "Esperando solicitud..."}
                    </span>
                ) : isImageDataUrl ? (
                    <img src={rawValue} alt="QR" className="h-[400px] w-[400px]" />
                ) : (
                    <QRCode value={rawValue} size={208} />
                )}
            </div>
            {showConfirmNewQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-xl w-full max-w-md p-6 ring-1 ring-amber-400/50">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-amber-500/10 ring-1 ring-amber-400/40 p-2">
                                <AlertTriangle className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[15px] font-semibold leading-tight">
                                    ¿Solicitar un nuevo QR de WhatsApp?
                                </h3>
                                <p className="mt-1 text-sm opacity-80">
                                    {localWhatsappStatus?.qrScannedByPhone
                                        ? `Ya hay un dispositivo de WhatsApp vinculado a esta campaña (${localWhatsappStatus.qrScannedByPhone}).`
                                        : "Ya hay un dispositivo de WhatsApp vinculado a esta campaña."}
                                </p>
                                <p className="mt-1 text-sm opacity-80">
                                    Si solicitás un nuevo código QR, se cerrará la sesión anterior y ese número quedará desvinculado.
                                </p>

                                {localWhatsappStatus?.qrScannedAt && (
                                    <p className="mt-2 text-xs opacity-70">
                                        Vinculado desde:{" "}
                                        {(() => {
                                            const d = new Date(localWhatsappStatus.qrScannedAt);
                                            return isNaN(d.getTime())
                                                ? localWhatsappStatus.qrScannedAt
                                                : d.toLocaleString();
                                        })()}
                                    </p>
                                )}

                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        className="text-sm px-3 py-1.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70"
                                        onClick={() => setShowConfirmNewQr(false)}
                                        disabled={busy}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
                                        onClick={handleConfirmNewQr}
                                        disabled={busy}
                                    >
                                        {busy ? "Solicitando…" : "Continuar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsappQrPanel;
