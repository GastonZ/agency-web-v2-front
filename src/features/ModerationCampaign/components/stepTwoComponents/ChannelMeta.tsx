// ChannelMeta.ts
import { Instagram, Facebook, MessageCircle, Globe } from "lucide-react";
import type { Channel } from "../../../../context/ModerationContext";

export const CHANNEL_META: Record<
  Channel,
  {
    title: string;
    subtitle: string;
    description: string;
    bullets: string[];
    tags: string[];
    Icon: any;
  }
> = {
  instagram: {
    title: "Instagram",
    subtitle: "Mensajes directos (DM)",
    description:
      "Conversaciones desde mensajes directos de Instagram.",
    bullets: [
      "Atención rápida y consultas comerciales",
      "Contacto desde publicaciones o anuncios",
    ],
    tags: ["Rápido", "Social", "DM"],
    Icon: Instagram,
  },
  facebook: {
    title: "Facebook",
    subtitle: "Messenger",
    description:
      "Mensajes recibidos desde Facebook Messenger.",
    bullets: [
      "Consultas generales y soporte",
      "Campañas de anuncios y comunidades",
    ],
    tags: ["Messenger", "Comunidad", "Ads"],
    Icon: Facebook,
  },
  whatsapp: {
    title: "WhatsApp",
    subtitle: "Atención directa 1:1",
    description:
      "Atención directa por WhatsApp.",
    bullets: [
      "Seguimiento de leads y coordinación",
      "Atención personalizada",
    ],
    tags: ["1:1", "Leads", "Personal"],
    Icon: MessageCircle,
  },
  webchat: {
    title: "Webchat",
    subtitle: "Widget en tu sitio",
    description:
      "Chat integrado en tu sitio web.",
    bullets: [
      "Atiende visitantes sin salir del sitio",
      "Ideal para consultas mientras navegan",
    ],
    tags: ["Website", "Widget", "On-site"],
    Icon: Globe,
  },
};
