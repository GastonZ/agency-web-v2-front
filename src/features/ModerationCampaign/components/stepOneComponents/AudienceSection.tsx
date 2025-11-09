import * as React from "react";
import { GlassCard, SectionTitle, Label, TextArea } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";
import LocationSelection from "../../../../components/features/LocationSelection";
import { notifyBotManualChange, flushBotManualChange } from "../../../../utils/helper";

const AudienceSection: React.FC = () => {
  const { data, setGeo, setAudience } = useModeration();
  const { i18n } = useTranslation();
  const { t } = useTranslation('translations');
  const language = i18n.language as any;

  return (
    <GlassCard>
      <SectionTitle title={t("target_audience")} subtitle={t("segment_geo_demo")} />

      <LocationSelection
        value={{
          countryId: (data as any).audience?.geo?.countryId || "",
          stateId: (data as any).audience?.geo?.stateId || "",
          city: data.audience.geo.city || "",
        }}
        onChange={(patch) => {
          setGeo(patch);

          if ("countryId" in patch) {
            flushBotManualChange({
              namespace: "moderation",
              field: "audience.geo.countryId",
              label: "País",
              value: patch.countryId || "",
            });
          }
          if ("stateId" in patch) {
            flushBotManualChange({
              namespace: "moderation",
              field: "audience.geo.stateId",
              label: "Provincia/Estado",
              value: patch.stateId || "",
            });
          }
          if ("city" in patch) {
            flushBotManualChange({
              namespace: "moderation",
              field: "audience.geo.city",
              label: "Ciudad",
              value: patch.city || "",
            });
          }
        }}
        languageOverride={language}
      />

      <div className="mt-6">
        <Label htmlFor="audienceCulture">{t("cultural_segmentation")}</Label>
        <TextArea
          id="audienceCulture"
          rows={3}
          placeholder="Ej. Gamers, tech, local culture…"
          value={data.audience.cultural || ""}
          onChange={(e) => {
            const v = e.target.value;
            setAudience({ cultural: v });
            notifyBotManualChange(
              {
                namespace: "moderation",
                field: "audience.cultural",
                label: "Segmentación cultural / Intereses",
                value: v,
              },
              600
            );
          }}
          onBlur={(e) =>
            flushBotManualChange({
              namespace: "moderation",
              field: "audience.cultural",
              label: "Segmentación cultural / Intereses",
              value: e.target.value,
            })
          }
        />
      </div>
    </GlassCard>
  );
};

export default AudienceSection;
