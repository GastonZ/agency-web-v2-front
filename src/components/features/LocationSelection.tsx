import * as React from "react";
import { Label, TextInput } from "../../features/ModerationCampaign/components/Primitives";
import {
  fetchCountries,
  fetchStatesByCountry,
  type CountryItem,
  type StateItem,
} from "../../services/geo";
import { useTranslation } from "react-i18next";

export type GeoLean = {
  countryId?: string;
  stateId?: string;
  city?: string;
  countryCode?: string;
  regionCode?: string;
};

type Props = {
  value: GeoLean;
  onChange: (patch: Partial<GeoLean>) => void;
  className?: string;
  languageOverride?: string;
  showPostalCode?: boolean;
};

const LocationSelection: React.FC<Props> = ({
  value,
  onChange,
  className = "",
  languageOverride,
  showPostalCode = false,
}) => {
  const { i18n } = useTranslation();
  const { t } = useTranslation('translations')
  const language = languageOverride || (i18n?.language as any) || "es";

  const [countries, setCountries] = React.useState<CountryItem[]>([]);
  const [states, setStates] = React.useState<StateItem[]>([]);
  const [loadingCountries, setLoadingCountries] = React.useState(false);
  const [loadingStates, setLoadingStates] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  const selectedCountryId = React.useMemo(() => {
    if (!value.countryId) return "";

    const byId = countries.find((c) => String(c.id) === String(value.countryId));
    if (byId) return String(byId.id);

    const byCode = countries.find((c) => c.code === value.countryId);
    if (byCode) return String(byCode.id);

    return "";
  }, [countries, value.countryId]);

  const selectedStateId = value.stateId || "";

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setGeoError(null);
        setLoadingCountries(true);
        const res = await fetchCountries(language);

        console.log('countries res', res);

        if (!alive) return;
        setCountries(res.filter((c) => (c as any).isAvailable ?? true));
      } catch {
        if (!alive) return;
        setGeoError("No se pudieron cargar los países.");
      } finally {
        if (alive) setLoadingCountries(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [language]);

  React.useEffect(() => {
    if (!selectedCountryId) {
      setStates([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setGeoError(null);
        setLoadingStates(true);
        const res = await fetchStatesByCountry(selectedCountryId, language);
        if (!alive) return;
        setStates(res);
      } catch {
        if (!alive) return;
        setGeoError("No se pudieron cargar las provincias/regiones.");
      } finally {
        if (alive) setLoadingStates(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [language, selectedCountryId]);

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryId = e.target.value || "";

    const selected = countries.find((c) => String(c.id) === newCountryId);
    const newCountryCode = selected?.code || "";

    onChange({
      countryId: newCountryId,
      countryCode: newCountryCode,
      stateId: "",
      regionCode: "",
    });
  };

  const onStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStateId = e.target.value || "";

    const selected = states.find((s) => String(s.id) === newStateId);
    const newRegionCode = (selected as any)?.code || "";

    onChange({
      stateId: newStateId,
      regionCode: newRegionCode,
    });
  };

  return (
    <div className={["grid grid-cols-1 sm:grid-cols-2 gap-4", className].join(" ")}>
      {geoError && (
        <div className="sm:col-span-2 mb-1 text-xs rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-300">
          {geoError}
        </div>
      )}

      <div>
        <Label htmlFor="geoCountry">{t("country")}</Label>
        <select
          id="geoCountry"
          value={selectedCountryId}
          onChange={onCountryChange}
          disabled={loadingCountries}
          className={[
            "w-full h-11 rounded-xl px-3 md:px-4",
            "bg-white/70 dark:bg-neutral-950/40",
            "border border-neutral-300/70 dark:border-neutral-700/70",
            "focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50",
          ].join(" ")}
        >
          <option value="">{loadingCountries ? t("loading") : t("select_country")}</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="geoProvince">{t("province_region")}</Label>
        <select
          id="geoProvince"
          value={selectedStateId}
          onChange={onStateChange}
          disabled={!selectedCountryId || loadingStates}
          className={[
            "w-full h-11 rounded-xl px-3 md:px-4",
            "bg-white/70 dark:bg-neutral-950/40",
            "border border-neutral-300/70 dark:border-neutral-700/70",
            "focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50",
          ].join(" ")}
        >
          <option value="">
            {!selectedCountryId
              ? t("select_country_first")
              : loadingStates
                ? t("loading")
                : t("province_region")}
          </option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="geoCity">{t("city")}</Label>
        <TextInput
          id="geoCity"
          placeholder="San Miguel de Tucumán"
          value={value.city || ""}
          onChange={(e) => onChange({ city: e.target.value })}
        />
      </div>

      {showPostalCode && (
        <div className="sm:col-span-2">
          <Label htmlFor="geoPostal">{t("postal_code_optional")}</Label>
          <TextInput
            id="geoPostal"
            placeholder="1406"
            // value={value.postalCode || ""}
            onChange={() => { }}
            disabled
          />
        </div>
      )}
    </div>
  );
};

export default LocationSelection;
