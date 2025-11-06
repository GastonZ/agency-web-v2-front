export const CHANNEL_STATUS = {
  instagram: "available",
  whatsapp: "available",
  facebook: "available",
  email: "available",
  x: "available",
} as const;

export type ChannelKey = keyof typeof CHANNEL_STATUS;

export function isChannelAvailable(ch: string) {
  return CHANNEL_STATUS[ch as ChannelKey] === "available";
}
