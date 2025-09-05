import React, { useState } from "react";
import QRCode from "react-qr-code";
import { useUserQrChannel } from "../../hooks/useUserQrChannel";
import { disconnectSocket } from "../../services/socket/socket";
import { updateModerationCampaignStatus } from "../../services/campaigns";

type Props = {
    userId: string;
    campaignId: string;
    socketUrl?: string;
    token?: string;
};

const WhatsappQrPanel: React.FC<Props> = ({
    userId,
    campaignId,
    socketUrl = "http://localhost:9000",
    token,
}) => {
    const { connected, qr, error, resetQr, getSocket } = useUserQrChannel({ userId, socketUrl, token });
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleReconnect = () => {
        try { getSocket().connect(); } catch { }
    };

    const handleDisconnect = () => { disconnectSocket(); };

    const handleCopyRaw = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(qr ?? {}, null, 2));
            setCopied(true); setTimeout(() => setCopied(false), 800);
        } catch { }
    };

    const requestQr = async () => {
        setActionError(null);
        resetQr();
        setBusy(true);
        try {
            await updateModerationCampaignStatus(campaignId, "active");
        } catch (e: any) {
            setActionError(e?.message ?? "No se pudo activar la campaña");
        } finally {
            setBusy(false);
        }
    };

    const qrValue = (qr?.data && typeof qr.data === "string" && qr.data.trim()) || "";
    const isImageDataUrl = qrValue.startsWith("data:image");

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
                    <button onClick={handleReconnect} className="text-xs px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800">Re-conectar</button>
                    <button onClick={handleDisconnect} className="text-xs px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-800">Desconectar</button>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-start">
                <button onClick={resetQr} className="h-9 px-3 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70">Limpiar QR</button>

                <button
                    onClick={requestQr}
                    disabled={!connected || busy}
                    className="h-9 px-3 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
                    title={!connected ? "Conectá el socket para solicitar QR" : "Activa la campaña y solicita QR"}
                >
                    {busy ? "Solicitando…" : "Solicitar QR (activa campaña)"}
                </button>

                {actionError && <span className="text-sm text-red-500">{actionError}</span>}

                {qr && (
                    <button onClick={handleCopyRaw} className="h-9 px-3 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70" title="Copiar payload">
                        {copied ? "¡Copiado!" : "Copiar payload"}
                    </button>
                )}

                <span className="text-xs opacity-70">
                    Escuchando <code>qr-generated</code> para <b>{userId}</b>.
                </span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-white h-[400px] w-[400px] p-4 flex items-center justify-center">
                {!qrValue ? (
                    <span className="text-sm opacity-60 text-center">Esperando <code>qr-generated</code>…</span>
                ) : isImageDataUrl ? (
                    <img src={qrValue} alt="QR" className="h-[400px] w-[400px]" />
                ) : (
                    <QRCode value={qrValue} size={208} />
                )}
            </div>

            {qr && (
                <details className="text-xs opacity-80">
                    <summary className="cursor-pointer select-none">Payload (debug)</summary>
                    <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded max-h-64 overflow-auto">
                        {JSON.stringify(qr, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
};

export default WhatsappQrPanel;
