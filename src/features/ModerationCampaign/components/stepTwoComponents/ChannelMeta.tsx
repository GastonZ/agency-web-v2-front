import * as React from "react";
import { Instagram, Facebook, MessageSquare, Mail, Twitter } from "lucide-react";
import { CHANNELS } from "../../../../context/ModerationContext";

type ChannelIconProps = { className?: string };
const IconInstagram: React.FC<ChannelIconProps> = (p) => <Instagram {...p} />;
const IconFacebook: React.FC<ChannelIconProps> = (p) => <Facebook {...p} />;
const IconWhatsApp: React.FC<ChannelIconProps> = (p) => <MessageSquare {...p} />;
const IconEmail: React.FC<ChannelIconProps> = (p) => <Mail {...p} />;
const IconX: React.FC<ChannelIconProps> = (p) => <Twitter {...p} />;

export const CHANNEL_META: Record<
  (typeof CHANNELS)[number],
  { title: string; subtitle: string; Icon: React.FC<ChannelIconProps> }
> = {
  instagram: {
    title: "Instagram",
    subtitle: "DMs y comentarios en posts y stories",
    Icon: IconInstagram,
  },
  facebook: {
    title: "Facebook",
    subtitle: "Mensajes de página y comentarios",
    Icon: IconFacebook,
  },
  whatsapp: {
    title: "WhatsApp",
    subtitle: "Atención directa y flujos rápidos",
    Icon: IconWhatsApp,
  },
  email: {
    title: "Email",
    subtitle: "Respuestas y seguimiento por correo",
    Icon: IconEmail,
  },
  x: {
    title: "X / Twitter",
    subtitle: "Respuestas públicas y DMs",
    Icon: IconX,
  },
};
