import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput, TextArea, Chip } from "../Primitives";
import { useModeration, AGE_GROUPS, GENDERS, SOCIOECONOMIC } from "../../../../context/ModerationContext";
import { fetchCountries, fetchStatesByCountry, type CountryItem, type StateItem } from "../../../../services/geo";
import { useTranslation } from "react-i18next";

const AudienceSection: React.FC = () => {
  const { data, setGeo, setDemographic, setAudience } = useModeration();
  const { i18n } = useTranslation();
  const language = i18n.language as any

  const [countries, setCountries] = React.useState<CountryItem[]>([]);
  const [states, setStates] = React.useState<StateItem[]>([]);
  const [loadingCountries, setLoadingCountries] = React.useState(false);
  const [loadingStates, setLoadingStates] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setGeoError(null);
        setLoadingCountries(true);
        const res = await fetchCountries(language);
        if (!alive) return;
        setCountries(res.filter(c => c.isAvailable));
      } catch (e: any) {
        if (!alive) return;
        setGeoError("No se pudieron cargar los países.");
      } finally {
        if (alive) setLoadingCountries(false);
      }
    })();
    return () => { alive = false; };
  }, [language]);

  React.useEffect(() => {
    const countryId = (data as any).audience?.geo?.countryId as string | undefined;
    if (!countryId) {
      setStates([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setGeoError(null);
        setLoadingStates(true);
        const res = await fetchStatesByCountry(countryId, language);
        if (!alive) return;
        setStates(res);
      } catch (e: any) {
        if (!alive) return;
        setGeoError("No se pudieron cargar las provincias/regiones.");
      } finally {
        if (alive) setLoadingStates(false);
      }
    })();
    return () => { alive = false; };
  }, [language, (data as any).audience?.geo?.countryId]);

  const toggleArrayValue = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const handleAgeToggle = (value: (typeof AGE_GROUPS)[number]) => {
    setDemographic({ ageGroups: toggleArrayValue(data.audience.demographic.ageGroups, value) as any });
  };

  const handleSocioToggle = (value: (typeof SOCIOECONOMIC)[number]) => {
    setDemographic({ socioeconomic: toggleArrayValue(data.audience.demographic.socioeconomic, value) as any });
  };

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value || "";
    const c = countries.find((x) => x.id === selectedId);
    setGeo({
      country: c?.name || "",
      countryCode: c?.code || "",
      countryId: c?.id || "",
      region: "",
      regionCode: "",
      stateId: "",
      city: data.audience.geo.city || "",
      postalCode: data.audience.geo.postalCode || "",
    });
  };

  const onStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value || "";
    const s = states.find((x) => x.id === selectedId);
    setGeo({
      region: s?.name || "",
      regionCode: s?.code || "",
      stateId: s?.id || "",
    });
  };

  const selectedCountryId = (data as any).audience?.geo?.countryId || "";
  const selectedStateId = (data as any).audience?.geo?.stateId || "";

  return (
    <GlassCard>
      <SectionTitle title="Público objetivo" subtitle="Segmenta geografía y demografía" />

      {geoError && (
        <div className="mb-3 text-sm rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-300">
          {geoError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <Label htmlFor="geoCountry">País</Label>
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
              <option value="">{loadingCountries ? "Cargando..." : "Seleccionar país"}</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="geoRegion">Provincia/Región</Label>
            <select
              id="geoRegion"
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
                {!selectedCountryId ? "Seleccionar país primero" : loadingStates ? "Cargando..." : "Seleccionar provincia/región"}
              </option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="geoCity">Ciudad</Label>
            <TextInput
              id="geoCity"
              placeholder="San Miguel de Tucumán"
              value={data.audience.geo.city || ""}
              onChange={(e) => setGeo({ city: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="geoPostal">Código Postal (opcional)</Label>
            <TextInput
              id="geoPostal"
              placeholder="4000"
              value={data.audience.geo.postalCode || ""}
              onChange={(e) => setGeo({ postalCode: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Edad (múltiple)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AGE_GROUPS.map((a) => (
                <Chip
                  key={a}
                  active={data.audience.demographic.ageGroups.includes(a)}
                  onClick={() => handleAgeToggle(a)}
                >
                  {a === "kids" ? "Niños" : a === "youth" ? "Jóvenes" : "Adultos"}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>Género</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {GENDERS.map((g) => (
                <Chip
                  key={g}
                  active={data.audience.demographic.gender === g}
                  onClick={() => setDemographic({ gender: g })}
                >
                  {g === "M" ? "Masculino" : g === "F" ? "Femenino" : "Todos"}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>Nivel socioeconómico (múltiple)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SOCIOECONOMIC.map((s) => (
                <Chip
                  key={s}
                  active={data.audience.demographic.socioeconomic.includes(s)}
                  onClick={() => handleSocioToggle(s)}
                >
                  {s === "high" ? "Alta" : s === "middle" ? "Media" : "Baja"}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

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
