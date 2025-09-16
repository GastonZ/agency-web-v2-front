import * as React from "react";
import { GlassCard, SectionTitle, Label, TextArea, } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";
import LocationSelection from "../../../../components/features/LocationSelection";

const AudienceSection: React.FC = () => {
  const { data, setGeo,  setAudience } = useModeration();
  const { i18n } = useTranslation();
  const language = i18n.language as any

  return (
    <GlassCard>
      <SectionTitle title="Público objetivo" subtitle="Segmenta geografía y demografía" />

      <LocationSelection
        value={{
          countryId: (data as any).audience?.geo?.countryId || "",
          stateId: (data as any).audience?.geo?.stateId || "",
          city: data.audience.geo.city || "",
        }}
        onChange={(patch) => setGeo(patch)}
        languageOverride={language}
      />

      <div className="mt-6">
        <Label htmlFor="culturalSeg">Segmentación cultural / Intereses</Label>
        <TextArea
          id="culturalSeg"
          rows={3}
          placeholder="Ej. Gamers, tecnología, cultura local…"
          value={data.audience.cultural || ""}
          onChange={(e) => setAudience({ cultural: e.target.value })}
        />
      </div>
    </GlassCard>
  );
};

export default AudienceSection;
