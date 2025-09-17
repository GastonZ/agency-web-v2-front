// src/features/MarketingCampaign/steps/StepTwo.tsx
import * as React from "react";
import TopicsSection from "../components/TopicsSection";
import ContentTypesSection, { type ContentType } from "../components/ContentTypesSection";
import BaseImagesSection from "../components/BaseImageSection";
import PostCalendar, { type ScheduleEntry, DayOfWeek as UiDayConst, type Day as UiDay } from "../components/PostCalendar";
import { useMarketing, type DayOfWeek } from "../../../context/MarketingContext";
import PersistedImagesSection from "../components/PersistedImagesSection";

export type StepTwoHandle = {
  getSelectedFiles: () => File[];
  clearSelectedFiles: () => void;
};

const UI_TO_SHORT: Record<UiDay, "mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun"> = {
  MONDAY: "mon",
  TUESDAY: "tue",
  WEDNESDAY: "wed",
  THURSDAY: "thu",
  FRIDAY: "fri",
  SATURDAY: "sat",
  SUNDAY: "sun",
};
const SHORT_TO_UI: Record<"mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun", UiDay> = {
  mon: UiDayConst.MONDAY,
  tue: UiDayConst.TUESDAY,
  wed: UiDayConst.WEDNESDAY,
  thu: UiDayConst.THURSDAY,
  fri: UiDayConst.FRIDAY,
  sat: UiDayConst.SATURDAY,
  sun: UiDayConst.SUNDAY,
};

function plusOneHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const nh = Math.min(23, h + 1);
  return `${String(nh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const StepTwo = React.forwardRef<StepTwoHandle>((_, ref) => {
  const {
    data,
    setTopics,
    setContentTypes,
    setTimezone,
    setPublishingSchedule,
  } = useMarketing();

  // Archivos locales (se suben al hacer Next en el main)
  const [files, setFiles] = React.useState<File[]>([]);
  React.useImperativeHandle(ref, () => ({
    getSelectedFiles: () => files,
    clearSelectedFiles: () => setFiles([]),
  }), [files]);

  // Inicializar calendario UI desde context
  const initialUiSchedule: ScheduleEntry[] = React.useMemo(() => {
    const slots = data.content.publishingSchedule.timeSlots;
    const entries: ScheduleEntry[] = [];
    (Object.keys(slots) as Array<keyof typeof slots>).forEach((shortDay) => {
      const uiDay = SHORT_TO_UI[shortDay as DayOfWeek];
      const times = (slots[shortDay] || []).map((r) => r.start);
      if (uiDay && times.length) entries.push({ dayOfWeek: uiDay, times });
    });
    return entries;
  }, [data.content.publishingSchedule.timeSlots]);

  const [uiSchedule, setUiSchedule] = React.useState<ScheduleEntry[]>(initialUiSchedule);
  const [tz, setTz] = React.useState<string>(data.content.publishingSchedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Sync hacia context cuando cambia algo en UI
  React.useEffect(() => {
    // activeDays = días con alguna hora marcada
    const activeShortDays = Array.from(
      new Set(
        uiSchedule
          .filter((e) => (e.times?.length || 0) > 0)
          .map((e) => UI_TO_SHORT[e.dayOfWeek])
      )
    );

    // timeSlots = cada "09:00" -> rango 1h
    const timeSlots: any = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    uiSchedule.forEach((e) => {
      const sd = UI_TO_SHORT[e.dayOfWeek];
      const ranges = (e.times || []).map((t) => ({ start: t, end: plusOneHour(t) }));
      timeSlots[sd] = ranges;
    });

    setPublishingSchedule({
      activeDays: activeShortDays as any,
      timeSlots,
      timezone: tz,
    });
  }, [uiSchedule, tz, setPublishingSchedule]);

  return (
    <div className="space-y-4">
      <TopicsSection value={data.content.topics} onChange={setTopics} />
      <ContentTypesSection value={data.content.contentTypes as ContentType[]} onChange={setContentTypes as any} />
      <BaseImagesSection files={files} onChange={setFiles} />
      <PersistedImagesSection baseUrl={import.meta.env.VITE_API_URL} paths={data.content.persistedImages} />
      <PostCalendar
        timezone={tz}
        onTimezoneChange={(newTz) => { setTz(newTz); setTimezone(newTz); }}
        schedule={uiSchedule}
        onScheduleChange={setUiSchedule}
      />
    </div>
  );
});
StepTwo.displayName = "StepTwo";

export default StepTwo;
