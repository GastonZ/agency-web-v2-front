import { basicsSchema } from "./basics.schema";
import { geoSchema } from "./geo.schema";
import { audienceSchema } from "./audience.schema";
import { toneSchema } from "./tone.schema";
import { channelsSchema } from "./channels.schema";
import { validationSchema } from "./validation.schema";
import { assistantSchema } from "./assistant.schema";
import { communicationSchema } from "./communication.schema";

export const moderationSchemas = [
  ...basicsSchema,
  ...geoSchema,
  ...audienceSchema,
  ...toneSchema,
  ...channelsSchema,
  ...validationSchema,
  ...assistantSchema,
  ...communicationSchema
];
