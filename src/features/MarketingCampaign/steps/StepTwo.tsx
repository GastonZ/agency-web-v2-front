// src/features/MarketingCampaign/steps/StepTwo.tsx
import * as React from "react";
import TopicsSection from "../components/TopicsSection";
import ContentTypesSection, { type ContentType } from "../components/ContentTypesSection";
import BaseImagesSection from "../components/BaseImageSection";
import PostCalendar, { type ScheduleEntry } from "../components/PostCalendar";

type Props = {
  initialTopics?: string[];
  initialContentTypes?: ContentType[];
  initialImages?: File[];
  initialSchedule?: ScheduleEntry[];
  initialTimezone?: string;
  onChange?: (state: {
    topics: string[];
    contentTypes: ContentType[];
    images: File[];
    schedule: ScheduleEntry[];
    timezone: string;
  }) => void;
};

const StepTwo: React.FC<Props> = ({
  initialTopics = [],
  initialContentTypes = [],
  initialImages = [],
  initialSchedule = [],
  initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Argentina/Buenos_Aires",
  onChange,
}) => {
  const [topics, setTopics] = React.useState<string[]>(initialTopics);
  const [contentTypes, setContentTypes] = React.useState<ContentType[]>(initialContentTypes);
  const [images, setImages] = React.useState<File[]>(initialImages);
  const [schedule, setSchedule] = React.useState<ScheduleEntry[]>(initialSchedule);
  const [timezone, setTimezone] = React.useState<string>(initialTimezone);

  React.useEffect(() => {
    onChange?.({ topics, contentTypes, images, schedule, timezone });
  }, [topics, contentTypes, images, schedule, timezone, onChange]);

  return (
    <div className="space-y-4">
      <TopicsSection value={topics} onChange={setTopics} />
      <ContentTypesSection value={contentTypes} onChange={setContentTypes} />
      <BaseImagesSection files={images} onChange={setImages} />
      <PostCalendar
        timezone={timezone}
        onTimezoneChange={setTimezone}
        schedule={schedule}
        onScheduleChange={setSchedule}
      />
      {/* Botonera de navegación del wizard si querés */}
      {/* <div className="flex justify-end gap-2">
        <button className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800">Atrás</button>
        <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Siguiente</button>
      </div> */}
    </div>
  );
};

export default StepTwo;
