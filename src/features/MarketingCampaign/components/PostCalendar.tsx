// src/features/MarketingCampaign/components/PostCalendar.tsx
import * as React from "react";
import { SectionTitle, GlassCard } from "../../ModerationCampaign/components/Primitives";
import { ChevronDown, ChevronUp } from "lucide-react";

export const DayOfWeek = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;
export type Day = typeof DayOfWeek[keyof typeof DayOfWeek];

export type ScheduleEntry = { dayOfWeek: Day; times: string[] };

type Props = {
  timezone: string;
  onTimezoneChange?: (tz: string) => void;
  schedule: ScheduleEntry[];
  onScheduleChange: (next: ScheduleEntry[]) => void;
  hours?: string[]; // opcional
  title?: string;
};

const DEFAULT_HOURS = [
  "07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00",
  "17:00","18:00","19:00","20:00",
];

const DAYS: Day[] = [
  DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY,
];

const LABELS: Record<Day, string> = {
  MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié", THURSDAY: "Jue",
  FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom",
};

const PostCalendar: React.FC<Props> = ({
  timezone,
  onTimezoneChange,
  schedule,
  onScheduleChange,
  hours = DEFAULT_HOURS,
  title = "Calendario de publicaciones",
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? hours : hours.slice(0, 6);

  const isDaySelected = (d: Day) => schedule.some((e) => e.dayOfWeek === d);
  const isTimeSelected = (d: Day, t: string) =>
    schedule.find((e) => e.dayOfWeek === d)?.times.includes(t) ?? false;

  const toggleDay = (d: Day) => {
    if (isDaySelected(d)) {
      onScheduleChange(schedule.filter((e) => e.dayOfWeek !== d));
    } else {
      onScheduleChange([...schedule, { dayOfWeek: d, times: [] }]);
    }
  };

  const toggleTime = (d: Day, t: string) => {
    const idx = schedule.findIndex((e) => e.dayOfWeek === d);
    if (idx === -1) {
      onScheduleChange([...schedule, { dayOfWeek: d, times: [t] }]);
      return;
    }
    const entry = { ...schedule[idx], times: [...schedule[idx].times] };
    if (entry.times.includes(t)) {
      entry.times = entry.times.filter((x) => x !== t);
      const next = [...schedule];
      entry.times.length ? (next[idx] = entry) : next.splice(idx, 1);
      onScheduleChange(next);
    } else {
      // máx 3 horarios por día: si supera, saca el más viejo
      if (entry.times.length >= 3) entry.times.shift();
      entry.times.push(t);
      const next = [...schedule];
      next[idx] = entry;
      onScheduleChange(next);
    }
  };

  return (
    <GlassCard>
      <SectionTitle title={title} subtitle="Configurá zona horaria, días y horas de publicación" />

      {/* Zona horaria */}
      <div className="mb-3">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
          Zona horaria
        </label>
        <input
          className="mt-1 w-full h-11 rounded-xl px-3 md:px-4 bg-white/70 dark:bg-neutral-950/40 border border-neutral-300/70 dark:border-neutral-700/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50"
          value={timezone}
          onChange={(e) => onTimezoneChange?.(e.target.value)}
          placeholder="America/Argentina/Buenos_Aires"
        />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Header días */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div />
            {DAYS.map((d) => {
              const active = isDaySelected(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={[
                    "h-9 rounded-lg text-xs border transition",
                    active
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-white/60 dark:bg-neutral-900/40 border-neutral-300/60 dark:border-neutral-700/60 hover:border-emerald-400/60",
                  ].join(" ")}
                >
                  {LABELS[d]}
                </button>
              );
            })}
          </div>

          {/* Grid horarios */}
          <div className="space-y-1">
            {visible.map((t) => (
              <div key={t} className="grid grid-cols-8 gap-1 items-center">
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-300/80">{t}</div>
                {DAYS.map((d) => {
                  const selected = isTimeSelected(d, t);
                  return (
                    <button
                      key={`${d}-${t}`}
                      type="button"
                      onClick={() => toggleTime(d, t)}
                      className={[
                        "h-7 rounded-md text-xs border transition",
                        selected
                          ? "bg-emerald-500/30 text-emerald-100 border-emerald-400/60 hover:bg-emerald-500/40"
                          : "bg-white/50 dark:bg-neutral-900/30 border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/40",
                      ].join(" ")}
                    >
                      {selected ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-3 w-full h-9 text-xs rounded-lg border border-neutral-300/50 dark:border-neutral-700/50 hover:border-emerald-400/60 bg-white/50 dark:bg-neutral-900/30"
            onClick={() => setShowAll((s) => !s)}
          >
            {showAll ? (
              <span className="inline-flex items-center gap-1">
                <ChevronUp className="w-4 h-4" /> Mostrar menos horas
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <ChevronDown className="w-4 h-4" /> Mostrar más horas
              </span>
            )}
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default PostCalendar;
