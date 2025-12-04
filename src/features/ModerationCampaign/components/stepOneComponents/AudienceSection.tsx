import * as React from "react";
import { GlassCard, SectionTitle, Label, TextArea } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";
import { useTranslation } from "react-i18next";
import LocationSelection from "../../../../components/features/LocationSelection";
import { notifyBotManualChange, flushBotManualChange } from "../../../../utils/helper";

const AudienceSection: React.FC = () => {
  const { data, setGeo, setAudience } = useModeration();
  const { i18n } = useTranslation();
  const { t } = useTranslation("translations");
  const language = i18n.language as any;

  const geo: any = (data as any).audience?.geo || {};

  // Países seleccionados (fuente de verdad)
  const countryIds: string[] = Array.isArray(geo.countryIds) ? geo.countryIds : [];

  // País principal (para el selector)
  const primaryCountryId: string =
    geo.countryId ||
    geo.countryCode ||
    geo.country ||
    countryIds[0] ||
    "";

  const selectedCountryIds: string[] =
    countryIds.length > 0
      ? countryIds
      : primaryCountryId
      ? [primaryCountryId]
      : [];

  const hasMultipleCountries = selectedCountryIds.length > 1;

  // Valor que le pasamos a LocationSelection
  const locationValue = {
    countryId: primaryCountryId,
    // Si hay más de un país, forzamos provincia / ciudad vacías
    stateId:
      hasMultipleCountries
        ? ""
        : geo.stateId || geo.regionCode || geo.region || "",
    city: hasMultipleCountries ? "" : geo.city || "",
  };

  const handleLocationChange = (patch: { countryId?: string; stateId?: string; city?: string }) => {
    // Actualizamos el geo base: setGeo se encarga de integrar countryIds
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
  };

  const handleRemoveCountry = (code: string) => {
    const current = selectedCountryIds;
    const next = current.filter((c) => c !== code);

    // Actualizamos lista de países
    setGeo({
      countryIds: next,
      countryId: next[0] || "",
      // si no queda ningún país, limpiamos también estado/ciudad
      ...(next.length === 0
        ? { stateId: "", city: "" }
        : {}),
    });

    flushBotManualChange({
      namespace: "moderation",
      field: "audience.geo.countryIds",
      label: "Países",
      value: next.join(","),
    });
  };

  return (
    <GlassCard>
      <SectionTitle
        title={t("target_audience")}
        subtitle={t("segment_geo_demo")}
      />

      {/* Selector de país / provincia / ciudad */}
      <LocationSelection
        value={locationValue}
        onChange={handleLocationChange}
        languageOverride={language}
      />

      {/* Hint cuando hay varios países */}
      {hasMultipleCountries && (
        <p className="mt-2 text-[11px] text-neutral-500">
          {t(
            "multi_country_hint",
            "Al elegir varios países, la provincia y la ciudad no se utilizarán en la segmentación."
          )}
        </p>
      )}

      {/* Chips de países seleccionados */}
      {selectedCountryIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCountryIds.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] bg-emerald-500/10 ring-1 ring-emerald-400/40"
            >
              <span>{code}</span>
              <button
                type="button"
                onClick={() => handleRemoveCountry(code)}
                className="text-xs px-1 rounded-full hover:bg-emerald-500/20"
                aria-label={t("remove_country", "Quitar país")}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Segmentación cultural */}
      <div className="mt-6">
        <Label htmlFor="audienceCulture">{t("cultural_segmentation")}</Label>
        <TextArea
          id="audienceCulture"
          rows={3}
          placeholder={t("target_audience_example")}
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
