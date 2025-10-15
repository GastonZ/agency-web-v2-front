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
    <div className="relative w-full border-b border-gray-200">
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
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent mb-3">
              {feature.title}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
              className="mt-3 sm:mt-4 text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
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
                    <span className="mt-1.5 sm:mt-2 inline-block h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-600 flex-shrink-0" />
                    <span className="text-gray-800 leading-relaxed font-medium">
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
              <Card className="bg-gray-50 border-2 border-gray-300 overflow-hidden max-w-[466px] rounded-lg shadow-lg hover:bg-gray-50">
                {/* Aspect ratio responsive - Mobile First */}
                <div className="relative max-w-full overflow-hidden aspect-[466/513] lg:h-[513px] lg:max-w-[466px]">
                  {/* Background normal.png - Only for first feature */}
                  {index === 0 ? (
                    <img
                      src="/normal.png"
                      alt="Background"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    /* Other features background */
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50" />
                  )}

                  {/* Talk Icon - Only show for first feature (conversational interface) */}
                  {index === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      viewport={{ once: true }}
                      className="absolute top-1/2 right-1/4 transform -translate-y-1/2 z-10"
                    >
                      {/* AI Talk Button - Modern AI Design */}
                      <div className="relative">
                        {/* Main AI container */}
                        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4">
                          {/* AI Core - Green glowing orb */}
                          <div className="relative">
                            {/* Outer glow effect */}
                            <div className="absolute inset-0 bg-green-400/50 rounded-full blur-lg animate-pulse"></div>
                            {/* Main glowing orb */}
                            <div className="relative w-12 h-12 bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                              {/* Inner glow layers */}
                              <div className="absolute inset-1 bg-gradient-to-br from-green-200/60 to-transparent rounded-full"></div>
                              <div className="absolute inset-2 bg-gradient-to-br from-white/50 to-transparent rounded-full"></div>
                              {/* AI sparkle core */}
                              <div className="relative w-5 h-5 bg-white/95 rounded-full animate-pulse shadow-inner"></div>
                            </div>
                          </div>
                          
                          {/* "AI Talking" text */}
                          <span className="text-gray-800 font-medium text-sm">AI Talking</span>
                          
                          {/* Audio bars */}
                          <div className="flex items-end gap-1">
                            <motion.div
                              animate={{ height: [4, 8, 4] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="w-1 h-1 bg-green-500 rounded-full"
                            />
                            <motion.div
                              animate={{ height: [8, 4, 8] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.2
                              }}
                              className="w-1 h-2 bg-green-500 rounded-full"
                            />
                            <motion.div
                              animate={{ height: [4, 8, 4] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.4
                              }}
                              className="w-1 h-1 bg-green-500 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Feature illustration - NO renderizar imagen para la primera feature (AI Talking) */}
                  {feature.image && index !== 0 && (
                    <img
                      src={feature.image}
                      alt={feature.imageAlt ?? ""}
                      className="absolute inset-0 w-full h-full object-contain invert"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback si la imagen no carga - ocultar completamente
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.style.visibility = 'hidden';
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
        image: index === 0 ? "/interfaz-conversacional.png" : 
               index === 1 ? "/datos-confiables.png" : 
               index === 2 ? "/tareas.png" : 
               "/audiencia.png",
        imageAlt: feature.title,
        benefits: feature.benefits,
        icon: index === 0 ? <MessageChatbot size={24} className="text-white/80" /> :
               index === 1 ? <ClipboardText size={24} className="text-white/80" /> :
               index === 2 ? <MessageChatbot size={24} className="text-white/80" /> :
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
      className="relative w-full bg-white"
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
            <Badge variant="outline" className="mb-3 sm:mb-4 bg-white border-gray-200 text-gray-800 rounded-full px-6 py-2 text-sm font-medium shadow-sm">
              {t('benefits.badge')}
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            id="benefits-title"
            className="font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4"
          >
            {t('benefits.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-gray-700 max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto mt-3 sm:mt-4 text-xs xs:text-sm sm:text-base md:text-lg leading-relaxed px-2 font-medium">
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
