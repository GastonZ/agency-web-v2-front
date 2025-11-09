import * as React from "react";
import { GlassCard, SectionTitle } from "../components/Primitives";
import { useModeration, CHANNELS } from "../../../context/ModerationContext";
import { ChannelCard } from "../components/stepTwoComponents/ChannelCard";
import { SelectedSummary } from "../components/stepTwoComponents/SelectedSummary";
import { CHANNEL_STATUS } from "../../../AIconversational/voice/tools/ModerationTools/channelAvailability";
import { useTranslation } from "react-i18next";

const StepTwo: React.FC = () => {
  const { data, setChannels } = useModeration();

  const { t } = useTranslation('translations')
  const toggleChannel = (ch: (typeof CHANNELS)[number]) => {
    const has = data.channels?.includes(ch);
    const next = has ? data.channels.filter((c: any) => c !== ch) : [...(data.channels || []), ch];
    setChannels(next as any);
  };

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
      </GlassCard>
    </div>
  );
};

export default StepTwo;
