import type { StepConfig, RegisterFn } from "../../chatbot/step-config";

import { basicsSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/basics.schema";
import { geoSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/geo.schema";
import { audienceSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/audience.schema";
import { toneSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/tone.schema";
import { channelsSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/channels.schema";
import { validationSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/validation.schema";
import { assistantSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/assistant.schema";
import { communicationSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/communication.schema";
import { calendarSchema } from "../../../AIconversational/voice/schemas/moderationSchemas/calendar.schema";

import { useModerationBasicsTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationBasicsTools";
import { useModerationGeoTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationGeoTools";
import { useModerationAudienceTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationAudienceTools";
import { useModerationToneTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationToneTools";
import { useModerationChannelsTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationChannelsTools";
import { useModerationAssistantTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationAssistantTools";
import { useModerationCommsTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationCommsTools";
import { useModerationCalendarTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationCalendarTools";
import { useModerationValidationTools } from "../../../AIconversational/voice/tools/ModerationTools/useModerationValidationTools";

export type ModerationFns = ReturnType<typeof useModerationFns>;

export function useModerationFns() {
  const b = useModerationBasicsTools();
  const g = useModerationGeoTools();
  const a = useModerationAudienceTools();
  const t = useModerationToneTools();
  const ch = useModerationChannelsTools();
  const asst = useModerationAssistantTools();
  const comm = useModerationCommsTools();
  const cal = useModerationCalendarTools();
  const val = useModerationValidationTools();

  return {
    // paso 0
    getModerationOverview: b.getModerationOverview,
    explainModerationField: b.explainModerationField,
    updateModerationBasics: b.updateModerationBasics,
    updateModerationGeoByName: g.updateModerationGeoByName,
    updateModerationAudienceCultural: a.updateModerationAudienceCultural,
    updateModerationToneChoice: t.updateModerationToneChoice,

    // paso 1
    setModerationChannels: ch.setModerationChannels,
    addModerationChannel: ch.addModerationChannel,
    removeModerationChannel: ch.removeModerationChannel,
    describeModerationChannels: ch.describeModerationChannels,

    // paso 2 - assistant
    setModerationAssistantConfig: asst.setModerationAssistantConfig,
    explainAssistantVoiceFormat: asst.explainAssistantVoiceFormat,
    explainKnowledgeBaseUpload: asst.explainKnowledgeBaseUpload,
    addModerationQAPair: asst.addModerationQAPair,
    updateModerationQA: asst.updateModerationQA,
    updateModerationQAMatch: asst.updateModerationQAMatch,
    removeModerationQAMatch: asst.removeModerationQAMatch,

    // paso 2 - comunicación
    addModerationAllowedTopics: comm.addModerationAllowedTopics,
    removeModerationAllowedTopics: comm.removeModerationAllowedTopics,
    listModerationAllowedTopics: comm.listModerationAllowedTopics,
    addModerationEscalationCases: comm.addModerationEscalationCases,
    removeModerationEscalationCases: comm.removeModerationEscalationCases,
    listModerationEscalationCases: comm.listModerationEscalationCases,
    setModerationContactNumber: comm.setModerationContactNumber,
    getModerationContactNumber: comm.getModerationContactNumber,

    // paso 2 - calendario
    explainAndEnableCalendars: cal.explainAndEnableCalendars,
    createModerationCalendar: cal.createModerationCalendar,
    updateModerationCalendarMeta: cal.updateModerationCalendarMeta,
    removeModerationCalendar: cal.removeModerationCalendar,
    toggleModerationCalendarDay: cal.toggleModerationCalendarDay,
    addModerationTimeSlot: cal.addModerationTimeSlot,
    addModerationTimeSlotsBulk: cal.addModerationTimeSlotsBulk,
    removeModerationTimeSlot: cal.removeModerationTimeSlot,

    // comunes
    checkModerationStepStatus: val.checkModerationStepStatus,
  };
}

export const moderationStepConfig: StepConfig<ModerationFns> = {
  getSchemas(step) {
    if (step === 0) return [...basicsSchema, ...geoSchema, ...audienceSchema, ...toneSchema, ...validationSchema];
    if (step === 1) return [...channelsSchema, ...validationSchema];
    if (step === 2) return [...assistantSchema, ...communicationSchema, ...calendarSchema];
    return [...validationSchema];
  },

  registerStep(register: RegisterFn, step: number, fns: ModerationFns) {
    if (step === 0) {
      register("getModerationOverview", fns.getModerationOverview);
      register("explainModerationField", fns.explainModerationField);
      register("updateModerationBasics", fns.updateModerationBasics);
      register("updateModerationGeoByName", fns.updateModerationGeoByName);
      register("updateModerationAudienceCultural", fns.updateModerationAudienceCultural);
      register("updateModerationToneChoice", fns.updateModerationToneChoice);
      return;
    }
    if (step === 1) {
      register("setModerationChannels", fns.setModerationChannels);
      register("addModerationChannel", fns.addModerationChannel);
      register("removeModerationChannel", fns.removeModerationChannel);
      register("describeModerationChannels", fns.describeModerationChannels);
      return;
    }
    if (step === 2) {
      // Assistant
      register("setModerationAssistantConfig", fns.setModerationAssistantConfig);
      register("explainAssistantVoiceFormat", fns.explainAssistantVoiceFormat);
      register("explainKnowledgeBaseUpload", fns.explainKnowledgeBaseUpload);
      register("addModerationQAPair", fns.addModerationQAPair);
      register("updateModerationQA", fns.updateModerationQA);
      register("updateModerationQAMatch", fns.updateModerationQAMatch);
      register("removeModerationQAMatch", fns.removeModerationQAMatch);
      // Comms
      register("addModerationAllowedTopics", fns.addModerationAllowedTopics);
      register("removeModerationAllowedTopics", fns.removeModerationAllowedTopics);
      register("listModerationAllowedTopics", fns.listModerationAllowedTopics);
      register("addModerationEscalationCases", fns.addModerationEscalationCases);
      register("removeModerationEscalationCases", fns.removeModerationEscalationCases);
      register("listModerationEscalationCases", fns.listModerationEscalationCases);
      register("setModerationContactNumber", fns.setModerationContactNumber);
      register("getModerationContactNumber", fns.getModerationContactNumber);
      // Calendario
      register("explainAndEnableCalendars", fns.explainAndEnableCalendars);
      register("createModerationCalendar", fns.createModerationCalendar);
      register("updateModerationCalendarMeta", fns.updateModerationCalendarMeta);
      register("removeModerationCalendar", fns.removeModerationCalendar);
      register("toggleModerationCalendarDay", fns.toggleModerationCalendarDay);
      register("addModerationTimeSlot", fns.addModerationTimeSlot);
      register("addModerationTimeSlotsBulk", fns.addModerationTimeSlotsBulk);
      register("removeModerationTimeSlot", fns.removeModerationTimeSlot);
      return;
    }
  },
};