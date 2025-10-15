import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { useI18n } from "../lib/i18n";
import { 
  ClipboardText, 
  MessageChatbot, 
  TargetArrow 
} from "tabler-icons-react";

type Feature = {
  title: string;
  description: string;
  visual?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  benefits?: string[];
  icon?: React.ReactNode;
};

function FeatureRow({
  feature,
  reverse = false,
  index,
  isLast,
}: {
  feature: Feature;
  reverse?: boolean;
  index: number;
  isLast?: boolean;
}) {
  return (
    // Wrapper full-bleed: acá vive la línea
    <div className="relative w-full border-b border-white/10">
      {/* Contenedor con padding y animación SOLO del contenido */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 w-full">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.06 }}
          viewport={{ once: true, amount: 0.3 }}
          className={`relative flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-center py-4 sm:py-6 lg:py-8 w-full max-w-full`}
          style={{ maxWidth: '100%', width: '100%' }}
        >
          {/* Texto - Mobile First */}
          <div className={`flex-1 w-full max-w-full ${reverse ? "lg:order-2" : ""}`} style={{ maxWidth: '100%' }}>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight font-heading bg-gradient-to-b from-white from-[55%] to-white/50 bg-clip-text text-transparent mb-3">
              {feature.title}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
              className="mt-3 sm:mt-4 text-white/70 text-sm sm:text-base md:text-lg leading-relaxed">
              {feature.description}
            </motion.p>

            {feature.benefits && (
              <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                {feature.benefits.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                    className="flex items-start gap-2 sm:gap-3 text-xs xs:text-sm sm:text-base"
                  >
                    <span className="mt-1.5 sm:mt-2 inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-400 flex-shrink-0" />
                    <span className="text-white/80 leading-relaxed">
                      {b}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {/* Visual - Mobile First */}
          <div className={`flex-1 w-full max-w-full ${reverse ? "lg:order-1" : ""}`} style={{ maxWidth: '100%' }}>
            {feature.visual ? (
              feature.visual
            ) : (
              <Card className="bg-[#0b0b0b]/50 border-white/10 overflow-hidden max-w-[466px] rounded-none">
                {/* Aspect ratio responsive - Mobile First */}
                <div className="relative  max-w-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] overflow-hidden aspect-[466/513] lg:h-[513px] lg:max-w-[466px]">
                  {feature.image && (
                    <img
                      src={feature.image}
                      alt={feature.imageAlt ?? ""}
                      className="absolute inset-0 w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback si la imagen no carga
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        </motion.article>
      </div>
    </div>
  );
}

export default function Benefits() {
  const { t } = useI18n()
  
  // Obtener las features de las traducciones
  const featuresData = t('benefits.features')
  const features: Feature[] = Array.isArray(featuresData) 
    ? featuresData.map((feature: any, index: number) => ({
        title: feature.title,
        description: feature.description,
        image: index === 0 ? "/datos-confiables.png" : 
               index === 1 ? "/tareas.png" : 
               "/audiencia.png",
        imageAlt: feature.title,
        benefits: feature.benefits,
        icon: index === 0 ? <ClipboardText size={24} className="text-white/80" /> :
               index === 1 ? <MessageChatbot size={24} className="text-white/80" /> :
               <TargetArrow size={24} className="text-white/80" />,
      }))
    : [
        // Fallback si no hay traducciones
        {
          title: "Decisiones más rápidas con datos confiables",
          description: "Tomá decisiones estratégicas con datos públicos y sociales procesados en tiempo real.",
          image: "/datos-confiables.png",
          imageAlt: "Gráfico de barras 3D mostrando estado optimizado con bajo costo y alta automatización",
          benefits: [
            "Análisis en tiempo real",
            "Métricas trazables y confiables",
            "Dashboards personalizados",
            "Alertas automáticas",
          ],
        },
        {
          title: "Automatizamos tareas repetitivas",
          description: "Reducimos la carga operativa eliminando tareas repetitivas. Más tiempo para la estrategia, menos para lo manual.",
          image: "/tareas.png",
          imageAlt: "Engranaje con nodos que representa orquestación de procesos",
          benefits: [
            "Reducción del 70% en tareas manuales",
            "Flujos automatizados 24/7",
            "Integración con sistemas existentes",
            "Liberación de recursos humanos",
          ],
        },
        {
          title: "Marketing basado en datos, no en suposiciones",
          description: "Convertí la información en campañas más efectivas. Segmentá audiencias, medí impacto y optimizá tu comunicación en tiempo real.",
          image: "/audiencia.png",
          imageAlt: "Tablero con métricas y segmentación",
          benefits: [
            "Segmentación de audiencias",
            "Optimización en tiempo real",
            "Métricas de impacto claras",
            "Comunicación personalizada",
          ],
        },
      ];

  return (
    <section 
      id="beneficios" 
      aria-labelledby="benefits-title" 
      className="relative w-full"
      role="main"
    >
      {/* Header Section - Mobile First */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Badge variant="outline" className="mb-3 sm:mb-4 bg-[#090909]/50 border-white/20 rounded-none text-white/90 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5">
              {t('benefits.badge')}
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            id="benefits-title"
            className="font-heading bg-gradient-to-b from-white from-[55%] to-white/50 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4"
          >
            {t('benefits.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-white/70 max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto mt-3 sm:mt-4 text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed px-2">
            {t('benefits.description')}
          </motion.p>
        </div>
      </div>

      {/* Items (full-bleed wrappers con línea) */}
      {features.map((f, i) => (
        <FeatureRow
          key={i}
          feature={f}
          reverse={i % 2 === 1}
          index={i}
          isLast={i === features.length - 1}
        />
      ))}
    </section>
  );
}
