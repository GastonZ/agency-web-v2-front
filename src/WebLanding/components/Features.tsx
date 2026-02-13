
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import {
  IconBroadcast,
  IconUsers,
  IconMessages,
  IconChartBar,
  IconPlug
} from "@tabler/icons-react";
import OmnichannelIllustration from "./OmnichannelIllustration";
import {
  SocialListeningIllustration,
  ConversationsIllustration,
  IntegrationsIllustration,
  PerformanceIllustration
} from "./FeatureIllustrations";

const SECTION_BADGE_STYLE = "mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-5 py-2 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-white/60 select-none cursor-default";

export default function Features() {
  const { t } = useI18n();

  return (
    <section
      id="caracteristicas"
      className="relative w-full overflow-visible"
    >
      {/* Brand Aurora Atmosphere */}
      <div className="absolute inset-x-0 -top-40 bottom-0 pointer-events-none overflow-visible select-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/[0.03] blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -left-[10%] w-[60%] h-[60%] bg-emerald-900/[0.03] blur-[150px] rounded-full"
        />
      </div>

      <div className="mx-auto max-w-7xl py-24 sm:py-32 px-4 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20 sm:mb-28 px-4"
        >
          <div className="flex justify-center">
            <Badge variant="outline" className={SECTION_BADGE_STYLE}>
              {t('features.badge')}
            </Badge>
          </div>
          <h2 className="text-3xl lg:text-[36px] font-heading font-bold text-white tracking-tight mb-8 max-w-3xl mx-auto leading-[1.1]">
            Un equipo coordinado para <span className="text-white">escuchar</span>, <span className="text-emerald-500">atraer</span> y <span className="text-white">responder</span>.
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
            Cada módulo se especializa en una parte del ciclo. Datacivis transforma tus indicaciones en resultados: hablar es hacer.
          </p>
        </motion.header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[450px] sm:auto-rows-[400px]">

          {/* Main Card: Marketing Engine */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 md:row-span-2 premium-glass-card group flex flex-col p-8 sm:p-14 justify-between relative overflow-hidden"
          >
            {/* Background Illustration */}
            <OmnichannelIllustration />

           

            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <IconUsers size={24} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight font-heading">{t('features.items.1.title')}</h3>
                </div>
              </div>
              <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-md font-medium">
                {t('features.items.1.description')}
              </p>
            </div>
          </motion.div>

          {/* Card: Social Intelligence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 md:row-span-1 premium-glass-card group relative overflow-hidden flex flex-col"
          >
            <div className="relative z-10 p-8 pb-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                  <IconBroadcast size={20} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-tight text-sm font-heading">{t('features.items.0.title')}</h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed font-medium">
                Detección de temas, crisis y sentimiento en tiempo real. Insights que activan acciones automáticas y reportes listos para compartir.
              </p>
            </div>

            <div className="relative flex-1">
              <SocialListeningIllustration />
            </div>
          </motion.div>

          {/* Card: Performance/Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-1 md:row-span-1 premium-glass-card group p-8 flex flex-col justify-between"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                  <IconChartBar size={20} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-tight text-sm font-heading">Performance</h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed font-medium">Optimización proactiva de rentabilidad real mediante análisis predictivo.</p>
            </div>

            <PerformanceIllustration />
          </motion.div>

          {/* Card: Conversational Core */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-1 md:row-span-1 premium-glass-card group p-8 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="relative z-20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                  <IconMessages size={20} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-tight text-sm font-heading">{t('features.items.2.title')}</h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed font-medium">
                Bandeja unificada con asistente de voz y texto. Reglas con <span className="text-white/80">humano en el circuito</span> cuando hace falta escalamiento.
              </p>
            </div>

            <ConversationsIllustration />
          </motion.div>

          {/* Card: Integración Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2 md:row-span-1 premium-glass-card group p-8 sm:p-12 flex items-center justify-between relative overflow-hidden"
          >
            <div className="max-w-sm relative z-10">
              <div className="flex items-center gap-5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                  <IconPlug size={20} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-tight text-sm font-heading">Integración Total</h3>
              </div>
              <p className="text-white/50 text-base leading-relaxed font-medium">
                WhatsApp, Instagram, Facebook y tus CRMs favoritos trabajando en un solo lugar. Conectividad nativa para una operación sin interrupciones.
              </p>
            </div>

            <div className="flex-1 h-full">
              <IntegrationsIllustration />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
