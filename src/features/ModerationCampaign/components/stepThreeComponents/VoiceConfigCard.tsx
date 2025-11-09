import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";

const VoiceConfigCard: React.FC = () => {
  const { data, setAssistant, setVoiceFile } = useModeration();
  const [err, setErr] = React.useState<string | null>(null);
  const { t } = useTranslation('translations')

  const onFile = (file: File) => {
    setErr(null);
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErr("Archivo demasiado grande (máx. 15 MB).");
      return;
    }
    setVoiceFile(file);
  };

  return (
    <GlassCard>
      <SectionTitle title={t("voice_config")} subtitle={t("upload_or_record_voice")}/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t("upload_voice")}</Label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files && onFile(e.target.files[0])}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 file:border-neutral-300/70 dark:file:border-neutral-700/70 file:bg-white/70 dark:file:bg-neutral-900/40 file:text-neutral-700 dark:file:text-neutral-200"
          />
          {data.assistant.voiceFile && (
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              {t("file_uploaded")} <span className="font-medium">{data.assistant.voiceFile.name}</span>
            </p>
          )}
          {err && <p className="text-sm text-red-500 mt-1">{err}</p>}
        </div>

        <div>
          <Label>{t("url_voice")}</Label>
          <TextInput
            placeholder="https://…/voice.mp3"
            value={data.assistant.voiceUrl || ""}
            onChange={(e) => setAssistant({ voiceUrl: e.target.value || null })}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default VoiceConfigCard;
