import * as React from "react";
import { GlassCard, SectionTitle, Label, TextInput } from "../Primitives";
import { useModeration } from "../../../../context/ModerationContext";

const DatesSection: React.FC = () => {
  const { data, setDates } = useModeration();

  // Helpers (YYYY-MM-DD)
  const fromISODate = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

  return (
    <GlassCard>
      <SectionTitle title="Calendario" subtitle="Define la duración de la campaña" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateStart">Fecha inicio</Label>
          <TextInput
            id="dateStart"
            className="input-date h-11 w-full rounded-lg bg-white/70 dark:bg-neutral-900/70 ring-1 ring-emerald-400/20 px-3 text-sm"
            type="date"
            value={fromISODate(data.dates.start)}
            onChange={(e) => setDates(e.target.value, data.dates.end)}
          />
        </div>
        <div>
          <Label htmlFor="dateEnd">Fecha fin</Label>
          <TextInput
            id="dateEnd"
            className="input-date h-11 w-full rounded-lg bg-white/70 dark:bg-neutral-900/70 ring-1 ring-emerald-400/20 px-3 text-sm"
            type="date"
            value={fromISODate(data.dates.end)}
            onChange={(e) => setDates(data.dates.start, e.target.value)}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default DatesSection;
