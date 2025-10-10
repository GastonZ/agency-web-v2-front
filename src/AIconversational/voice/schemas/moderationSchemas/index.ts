import { basicsSchema } from "./basics.schema";
import { geoSchema } from "./geo.schema";
import { audienceSchema } from "./audience.schema";
import { toneSchema } from "./tone.schema";
import { channelsSchema } from "./channels.schema";

export const moderationSchemas = [
  ...basicsSchema,
  ...geoSchema,
  ...audienceSchema,
  ...toneSchema,
  ...channelsSchema,
];
