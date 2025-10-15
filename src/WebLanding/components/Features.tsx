import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import { 
  LayersIntersect, 
  ClipboardText, 
  MessageChatbot, 
  BrandGooglePhotos,
  TargetArrow, 
  PigMoney 
} from "tabler-icons-react";

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function Features() {
  const { t } = useI18n()
  
  // Obtener las features de las traducciones
  const featuresData = t('features.items')
  const features: Feature[] = Array.isArray(featuresData) 
    ? featuresData.map((feature: any, index: number) => ({
        icon: index === 0 ? <ClipboardText size={24} className="text-white/80" /> :
               index === 1 ? <MessageChatbot size={24} className="text-white/80" /> :
               index === 2 ? <BrandGooglePhotos size={24} className="text-white/80" /> :
               index === 3 ? <TargetArrow  size={24} className="text-white/80" /> :
               index === 4 ? <TargetArrow size={24} className="text-white/80" /> :
               <PigMoney size={24} className="text-white/80" />,
        title: feature.title,
        description: feature.description,
      }))
    : [
        {
          icon: (
            <img 
              src="/bd.svg" 
              alt="Encuestas en tiempo real" 
              className="w-8 h-8"
            />
          ),
          title: "Encuestas en tiempo real",
          description: "Automatizá encuestas y obtené información pública y confiable para tomar decisiones sin demoras."
        },
        {
          icon: (
            <img 
              src="/bubble-msj.svg" 
              alt="Asistentes virtuales" 
              className="w-8 h-8"
            />
          ),
          title: "Asistentes virtuales en todos los canales",
          description: "Atendé a tu comunidad en WhatsApp, Facebook, Instagram y Web con asistentes inteligentes y disponibles 24/7."
        },
        {
          icon: (
            <img 
              src="/devpicos.svg" 
              alt="Escucha social inteligente" 
              className="w-8 h-8"
            />
          ),
          title: "Escucha social inteligente",
          description: "Analizamos la conversación pública en redes y medios para que comprendas a tu audiencia y detectes oportunidades a tiempo."
        },
        {
          icon: (
            <img 
              src="/lock.svg" 
              alt="Marketing estratégico con I.A." 
              className="w-8 h-8"
            />
          ),
          title: "Marketing estratégico con I.A.",
          description: "Transformamos datos públicos en campañas más efectivas, generando contenido en automático, publicando y enviando mensajes de impacto con resultados medibles."
        }
      ];

  return (
    <section
      id="caracteristicas"
      aria-labelledby="features-title"
      className="relative w-full bg-white"
    >
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-8 md:mb-12 lg:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Badge variant="outline" className="bg-white border-gray-200 text-gray-800 rounded-full px-6 py-2 text-sm font-medium shadow-sm mt-8 sm:mt-12 md:mt-16">
              {t('features.badge')}
            </Badge>
          </motion.div>
        </motion.header>

        {/* Grid de características - Estética Render */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className={`relative p-4 sm:p-6 md:p-8 border-t border-gray-200 bg-gray-50 hover:bg-white transition-colors ${
                index % 2 === 0 ? 'md:border-r border-gray-200' : ''
              }`}
            >
              <div className="py-6 sm:py-8">
                {/* Icono sin fondo */}
                <div className="mb-6">
                  {feature.icon}
                </div>

                            {/* Título */}
                            <motion.h3
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              viewport={{ once: true, amount: 0.3 }}
                              className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 tracking-tight font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent">
                              {feature.title}
                            </motion.h3>

                            {/* Descripción */}
                            <motion.p
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                              viewport={{ once: true, amount: 0.3 }}
                              className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed font-medium">
                              {feature.description}
                            </motion.p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
}
