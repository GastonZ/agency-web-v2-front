"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "../components/ui/badge";
import { 
  Building, 
  Briefcase, 
  Users, 
  ShieldLock 
} from "tabler-icons-react";

const useCases = [
  {
    id: "municipios",
    title: "Municipios",
    description: "Automatización de consultas ciudadanas y gestión de servicios públicos",
    icon: <Building size={24} className="text-white/80" />,
    metric: "70%",
    metricLabel: "menos consultas telefónicas",
    color: "border-blue-500/30"
  },
  {
    id: "empresas", 
    title: "Empresas",
    description: "Atención al cliente automatizada y análisis de mercado",
    icon: <Briefcase size={24} className="text-white/80" />,
    metric: "40%",
    metricLabel: "más conversiones",
    color: "border-green-500/30"
  },
  {
    id: "cooperativas",
    title: "Cooperativas", 
    description: "Gestión de socios y servicios financieros personalizados",
    icon: <Users size={24} className="text-white/80" />,
    metric: "24/7",
    metricLabel: "disponibilidad",
    color: "border-purple-500/30"
  },
  {
    id: "organizaciones",
    title: "Organizaciones",
    description: "Asistentes especializados para instituciones del sector",
    icon: <ShieldLock size={24} className="text-white/80" />, 
    metric: "100%",
    metricLabel: "cumplimiento legal",
    color: "border-orange-500/30"
  }
];

export default function UseCasesSection() {
  return (
    <section
      id="casos-de-uso"
      aria-labelledby="use-cases-title"
      className="relative w-full border-t border-white/10"
    >
      <div className="mx-auto max-w-7xl py-8 md:py-12 lg:py-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-8 md:mb-12 lg:mb-16"
        >
          <Badge variant="outline" className="mb-4 md:mb-6 bg-[#090909]/50 border-white/20 text-white/90 rounded-none px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base font-medium">
            Casos de uso
          </Badge>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            id="use-cases-title"
            className="font-heading bg-gradient-to-b from-white from-[55%] to-white/50 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4"
          >
            Soluciones adaptadas a cada sector
          </motion.h2>
          <p className="text-white/70 max-w-3xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">
            Desde gobiernos municipales hasta empresas privadas, nuestras soluciones de IA 
            se adaptan a las necesidades específicas de cada industria.
          </p>
        </motion.header>

        {/* Use Cases Grid - Diseño minimalista */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-white/10">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className={`relative border-b border-white/10 bg-[#090909]/20 backdrop-blur-sm hover:bg-[#090909]/30 transition-colors group ${useCase.color} ${
                index % 2 === 0 ? 'sm:border-r border-white/10' : ''
              } ${
                index % 4 !== 3 ? 'lg:border-r border-white/10' : ''
              }`}
            >
              <div>
                <div className="p-4 sm:p-6 md:p-8">

                {/* Icono */}
                <div className="mb-6">
                  <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                    {useCase.icon}
                  </div>
                </div>

                {/* Título */}
                <motion.h3 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="text-xl sm:text-2xl font-bold mb-3 tracking-tight font-heading bg-gradient-to-b from-white from-[55%] to-white/50 bg-clip-text text-transparent">
                  {useCase.title}
                </motion.h3>

                {/* Descripción */}
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                  {useCase.description}
                </p>
                    </div>
                <div className="border-t border-white/10 pt-3 sm:pt-4">
                    <div className="p-4 sm:p-6 md:p-8">

                {/* Métrica destacada */}
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {useCase.metric}
                  </div>
                  <div className="text-white/60 text-xs uppercase tracking-wide">
                    {useCase.metricLabel}
                  </div>
                </div>
</div>

              </div>

              {/* Efecto hover sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* CTA minimalista */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-white/70 mb-6 text-sm">
            ¿No ves tu sector? Contamos con experiencia en múltiples industrias.
          </p>
          <div className="inline-flex items-center gap-2 text-white/60 text-sm hover:text-white transition-colors cursor-pointer">
            <span>Consultar implementación</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
