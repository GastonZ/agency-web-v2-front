import * as React from "react";
import {
  Mic,
  UploadCloud,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import { GlassCard, SectionTitle, Label, Chip } from "../components/Primitives";
import { useModeration } from "../../../context/ModerationContext";
import { useTranslation } from "react-i18next";
import {
  getModerationCampaignVoiceStatus,
  deleteModerationCampaignVoice,
} from "../../../services/campaigns";

type Mode = "upload" | "record";

function isLikelyMp3(file?: File | null) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  return name.endsWith(".mp3") || type.includes("audio/mpeg");
}

function formatBytes(bytes: number) {
  const b = Number(bytes || 0);
  if (!b) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(b) / Math.log(k)));
  const v = b / Math.pow(k, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function StepVoice() {
  const { data, setVoiceFile } = useModeration();
  const { t, i18n } = useTranslation("translations");

  const [mode, setMode] = React.useState<Mode>("upload");
  const [err, setErr] = React.useState<string | null>(null);

  // --- recorder state ---
  const [recording, setRecording] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const voiceFile: File | null = (data as any)?.assistant?.voiceFile ?? null;

  const [existingVoice, setExistingVoice] = React.useState<boolean | null>(null);
  const [deletingVoice, setDeletingVoice] = React.useState(false);

  React.useEffect(() => {
    const id = (data as any)?.campaignId as string | undefined;
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        const st = await getModerationCampaignVoiceStatus(id);
        if (!cancelled) setExistingVoice(!!st?.hasVoice);
      } catch {
        if (!cancelled) setExistingVoice(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [(data as any)?.campaignId]);

  const readingText = React.useMemo(() => {
    const isEn = i18n.language?.startsWith("en");
    return isEn
      ? t("voiceStep.record.readingText", {
        defaultValue:
          "Hello! This is a short voice sample to configure my assistant. I speak naturally and clearly, with a friendly tone. I will help users with their questions and guide them step by step.",
      })
      : t("voiceStep.record.readingText", {
        defaultValue:
          "Hola, este es un audio de prueba para configurar la voz del asistente. Hablo de forma natural y clara, con un tono amable. Voy a ayudar a los usuarios con sus preguntas y a guiarlos paso a paso.",
      });
  }, [i18n.language, t]);

  const onPickFile = React.useCallback(
    (file?: File | null) => {
      setErr(null);
      if (!file) return;
      if (file.size > MAX_SIZE_BYTES) {
        setErr(
          t("voiceStep.errors.tooLarge", {
            defaultValue: `Archivo demasiado grande (máx. ${MAX_SIZE_MB} MB).`,
          })
        );
        return;
      }
      if (!String(file.type || "").toLowerCase().includes("audio")) {
        setErr(
          t("voiceStep.errors.notAudio", {
            defaultValue: "Por favor subí un archivo de audio.",
          })
        );
        return;
      }
      setVoiceFile(file);
      try {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      } catch { }
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl, setVoiceFile, t]
  );

  const stopAndCleanupStream = React.useCallback(() => {
    try {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch { }
    try {
      streamRef.current?.getTracks?.().forEach((tr) => tr.stop());
    } catch { }
    streamRef.current = null;
    recRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = React.useCallback(async () => {
    setErr(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setErr(
        t("voiceStep.errors.noMicSupport", {
          defaultValue: "Tu navegador no soporta grabación de audio.",
        })
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer a common mime type
      const preferred = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];

      let mimeType: string | undefined;
      for (const mt of preferred) {
        // @ts-ignore
        if (window.MediaRecorder && MediaRecorder.isTypeSupported?.(mt)) {
          mimeType = mt;
          break;
        }
      }

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recRef.current = rec;
      chunksRef.current = [];
      setSeconds(0);

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, {
            type: rec.mimeType || "audio/webm",
          });
          const ext = (blob.type || "").includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `voice-recording.${ext}`, {
            type: blob.type || "audio/webm",
          });
          onPickFile(file);
        } catch (e: any) {
          setErr(e?.message || "No se pudo procesar la grabación.");
        } finally {
          stopAndCleanupStream();
        }
      };

      rec.start();
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch (e: any) {
      setErr(e?.message || "No se pudo acceder al micrófono.");
      stopAndCleanupStream();
    }
  }, [onPickFile, stopAndCleanupStream, t]);

  const stopRecording = React.useCallback(() => {
    try {
      recRef.current?.stop?.();
    } catch {
      stopAndCleanupStream();
    } finally {
      setRecording(false);
    }
  }, [stopAndCleanupStream]);

  const onDeleteVoice = React.useCallback(async () => {
    const campaignId = (data as any)?.campaignId as string | undefined;
    if (!campaignId) return;

    setErr(null);
    setDeletingVoice(true);

    try {
      recRef.current?.stop?.();
    } catch { }
    try {
      stopAndCleanupStream();
    } catch { }

    try {
      await deleteModerationCampaignVoice(campaignId);

      setExistingVoice(false);

      setSeconds(0);
      setRecording(false);
      setVoiceFile(null as any);

      try {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      } catch { }
      setPreviewUrl(null);

      // Opcional: toast
      // @ts-ignore
      toast?.success?.(
        t("voiceStep.toast.deleted", { defaultValue: "Voz eliminada correctamente." })
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t("voiceStep.errors.deleteFailed", { defaultValue: "No se pudo eliminar la voz." });

      setErr(msg);

      // Opcional: toast
      // @ts-ignore
      toast?.error?.(msg);
    } finally {
      setDeletingVoice(false);
    }
  }, [data, previewUrl, setVoiceFile, stopAndCleanupStream, t]);

  React.useEffect(() => {
    return () => {
      try {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      } catch { }
      stopAndCleanupStream();
    };
  }, [previewUrl, stopAndCleanupStream]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <GlassCard>
        <SectionTitle
          title={t("voiceStep.title", { defaultValue: "Configuración de voz" })}
          subtitle={t("voiceStep.subtitle", {
            defaultValue:
              "Subí una voz o grabá ahora mismo para que el bot responda con audios en WhatsApp.",
          })}
        />

        <div className="flex flex-wrap gap-2">
          <Chip active={mode === "upload"} onClick={() => setMode("upload")}>
            <span className="inline-flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              {t("voiceStep.tabs.upload", { defaultValue: "Subir audio" })}
            </span>
          </Chip>
          <Chip active={mode === "record"} onClick={() => setMode("record")}>
            <span className="inline-flex items-center gap-2">
              <Mic className="h-4 w-4" />
              {t("voiceStep.tabs.record", { defaultValue: "Grabar" })}
            </span>
          </Chip>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-7">
            {mode === "upload" ? (
              <div className="space-y-3">
                <Label>{t("voiceStep.upload.label", { defaultValue: "Archivo de voz" })}</Label>

                <div
                  className={[
                    "relative rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60",
                    "bg-white/30 dark:bg-neutral-950/20 backdrop-blur",
                    "p-4 md:p-5",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl grid place-items-center border border-emerald-400/25 bg-emerald-500/10">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {t("voiceStep.upload.title", {
                          defaultValue: "Subí un audio (recomendado: mp3)",
                        })}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {t("voiceStep.upload.help", {
                          defaultValue:
                            `Sugerencia: un audio leyendo un texto de forma natural. Máximo ${MAX_SIZE_MB} MB.`,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      id="voiceFileUpload"
                      data-field="voice.file"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 file:border-neutral-300/70 dark:file:border-neutral-700/70 file:bg-white/70 dark:file:bg-neutral-900/40 file:text-neutral-700 dark:file:text-neutral-200"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>{t("voiceStep.record.label", { defaultValue: "Grabación" })}</Label>
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/30 dark:bg-neutral-950/20 p-4 md:p-5 backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {t("voiceStep.record.title", {
                          defaultValue: "Grabá tu voz leyendo este texto",
                        })}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {t("voiceStep.record.help", {
                          defaultValue:
                            "Buscamos un tono natural y claro. Podés repetir si no te gusta.",
                        })}
                      </p>
                    </div>

                    <div className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-neutral-300/60 dark:border-neutral-700/60 bg-white/40 dark:bg-neutral-900/30">
                      {recording ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          {mm}:{ss}
                        </span>
                      ) : (
                        <span className="opacity-70">{mm}:{ss}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/30 p-3 md:p-4">
                    <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">
                      {readingText}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={recording ? stopRecording : startRecording}
                      className={[
                        "inline-flex items-center gap-2 h-11 px-4 rounded-xl border transition-all",
                        recording
                          ? "bg-red-500/10 text-red-700 dark:text-red-200 border-red-400/40 hover:bg-red-500/15"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-400/50 hover:bg-emerald-500/20",
                      ].join(" ")}
                    >
                      <Mic className="h-4 w-4" />
                      {recording
                        ? t("voiceStep.record.stop", { defaultValue: "Finalizar" })
                        : t("voiceStep.record.start", { defaultValue: "Grabar" })}
                    </button>

                    {voiceFile ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErr(null);
                          setSeconds(0);
                          setRecording(false);
                          setVoiceFile(null as any);
                          try {
                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                          } catch { }
                          setPreviewUrl(null);
                        }}
                        className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border bg-white/60 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-200 border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/50"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        {t("voiceStep.record.reset", { defaultValue: "Repetir" })}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {err ? (
              <div className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-200">
                <span className="inline-flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>{err}</span>
                </span>
              </div>
            ) : null}
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/25 dark:bg-neutral-950/20 p-4 md:p-5 backdrop-blur">
              <Label>{t("voiceStep.preview.label", { defaultValue: "Vista previa" })}</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {existingVoice === null ? (
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    {t("voiceStep.status.loading", { defaultValue: "Verificando voz actual..." })}
                  </span>
                ) : existingVoice ? (
                  <span className="text-xs px-2 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                    {t("voiceStep.status.exists", { defaultValue: "Voz configurada" })}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full border border-neutral-300/60 dark:border-neutral-700/60 bg-white/40 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-200">
                    {t("voiceStep.status.none", { defaultValue: "Sin voz" })}
                  </span>
                )}

                {existingVoice ? (
                  <button
                    type="button"
                    onClick={onDeleteVoice}
                    disabled={deletingVoice}
                    className={[
                      "inline-flex items-center gap-2 h-9 px-3 rounded-xl border transition-all text-xs",
                      "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-200 hover:bg-red-500/15",
                      deletingVoice ? "opacity-60 pointer-events-none" : "",
                    ].join(" ")}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingVoice
                      ? t("voiceStep.actions.deleting", { defaultValue: "Eliminando..." })
                      : t("voiceStep.actions.delete", { defaultValue: "Eliminar voz" })}
                  </button>
                ) : null}
              </div>
              <div className="mt-3">
                {voiceFile ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl grid place-items-center border border-emerald-400/25 bg-emerald-500/10">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate" title={voiceFile.name}>
                          {voiceFile.name}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                          {formatBytes(voiceFile.size)}
                          {isLikelyMp3(voiceFile) ? (
                            <span className="ml-2 text-emerald-700 dark:text-emerald-200">mp3</span>
                          ) : (
                            <span className="ml-2 opacity-70">{(voiceFile.type || "audio")}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {previewUrl ? (
                      <audio controls src={previewUrl} className="w-full" />
                    ) : null}

                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {t("voiceStep.preview.nextHint", {
                        defaultValue:
                          "Cuando hagas clic en “Siguiente”, subiremos este audio para configurar la voz del bot.",
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t("voiceStep.preview.empty", {
                      defaultValue:
                        "Podés dejar este paso vacío para que el bot responda solo por texto. Si querés, elegí “Subir” o “Grabar”.",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
