import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput } from "../components/Primitives";
import { useModeration, CHANNELS } from "../../../context/ModerationContext";
import { ChannelCard } from "../components/stepTwoComponents/ChannelCard";
import { SelectedSummary } from "../components/stepTwoComponents/SelectedSummary";
import { CHANNEL_STATUS } from "../../../AIconversational/voice/tools/ModerationTools/channelAvailability";
import { useTranslation } from "react-i18next";

const StepTwo: React.FC = () => {
  const { data, setChannels, setWebchatDomain } = useModeration();

  const { t } = useTranslation('translations')
  const toggleChannel = (ch: (typeof CHANNELS)[number]) => {
    const has = data.channels?.includes(ch);
    const next = has ? data.channels.filter((c: any) => c !== ch) : [...(data.channels || []), ch];
    setChannels(next as any);
  };

  const hasWebchat = data.channels?.includes("webchat");

  console.log(data);
  

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <GlassCard>
        <SectionTitle
          title={t("channels_to_use")}
          subtitle={t("select_channels")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHANNELS.map((ch) => (
            <ChannelCard
              key={ch}
              channel={ch}
              available={CHANNEL_STATUS[ch] === "available"}
              active={Boolean(data.channels?.includes(ch))}
              onToggle={() => toggleChannel(ch)}
            />
          ))}
        </div>

        <SelectedSummary items={data.channels} />


        {hasWebchat && (
          <div className="mt-6 space-y-2">
            <Label htmlFor="webchatDomain">
              {t("webchat_domain_label") ?? "Dominio para embebido Webchat"}
            </Label>
            <TextInput
              id="webchatDomain"
              type="url"
              placeholder={
                t("webchat_domain_placeholder") ??
                "Ej: https://midominio.com"
              }
              value={(data as any).webchatDomain || ""}
              onChange={(e) => setWebchatDomain(e.target.value)}
            />
            <p className="text-xs text-neutral-500">
              {t("webchat_domain_help") ??
                "Usaremos este dominio para configurar el widget de Webchat en tu sitio."}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default StepTwo;
