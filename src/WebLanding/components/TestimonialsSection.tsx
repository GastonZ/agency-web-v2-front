"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "../components/ui/badge";
import { useI18n } from "../lib/i18n";

type Testimonial = {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
};

export default function TestimonialsSection() {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Obtener testimonios de las traducciones
  const testimonialsData = t('testimonials.items');
  const testimonials: Testimonial[] = Array.isArray(testimonialsData)
    ? testimonialsData.map((testimonial: any) => ({
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company,
      content: testimonial.content,
      avatar: "/placeholder-user.jpg"
    }))
    : [
      // Fallback si no hay traducciones
      {
        name: "María González",
        role: "Directora de Comunicación",
        company: "Municipio de San Martín",
        content: "Implementamos Datacivis y en 30 días ya teníamos respuestas automáticas funcionando 24/7. La ciudadanía está más satisfecha y nuestro equipo puede enfocarse en tareas estratégicas.",
        avatar: "/placeholder-user.jpg"
      },
      {
        name: "Carlos Rodríguez",
        role: "Gerente de Operaciones",
        company: "Cooperativa El Progreso",
        content: "La automatización de encuestas nos permitió reducir el tiempo de procesamiento de 3 días a 2 horas. Los datos llegan limpios y listos para tomar decisiones.",
        avatar: "/placeholder-user.jpg"
      },
      {
        name: "Ana Martínez",
        role: "Jefa de Atención al Cliente",
        company: "Empresa de Servicios Públicos",
        content: "El chatbot maneja el 80% de las consultas sin intervención humana. La calidad de las respuestas es excelente y los usuarios no notan la diferencia.",
        avatar: "/placeholder-user.jpg"
      },
      {
        name: "Roberto Silva",
        role: "Director de Tecnología",
        company: "Organización No Gubernamental",
        content: "La escucha social nos ayuda a entender mejor las necesidades de nuestra comunidad. Los reportes son claros y accionables.",
        avatar: "/placeholder-user.jpg"
      },
      {
        name: "Laura Fernández",
        role: "Coordinadora de Proyectos",
        company: "Ministerio de Desarrollo Social",
        content: "Datacivis nos permitió escalar nuestro programa de asistencia sin aumentar el personal. La implementación fue rápida y sin complicaciones.",
        avatar: "/placeholder-user.jpg"
      }
    ];

  // Duplicar testimonios para el efecto infinito
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section
      id="testimonios"
      aria-labelledby="testimonials-title"
      className="relative w-full border-t border-gray-200"
    >
      <div className="mx-auto max-w-7xl py-20 sm:py-24">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-6 bg-white border-gray-200 text-gray-800 rounded-full px-6 py-2 text-sm font-medium shadow-sm">
            {t('testimonials.badge')}
          </Badge>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            id="testimonials-title"
            className="font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4"
          >
            {t('testimonials.title')}
          </motion.h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
            {t('testimonials.description')}
          </p>
        </motion.header>

        {/* Contenedor de scroll infinito */}
        <div className="relative overflow-hidden">
          <motion.div
            ref={containerRef}
            className="flex gap-6"
            animate={{
              x: -currentIndex * (280 + 24), // 280px width + 24px gap for mobile
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            style={{ width: 'max-content' }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${testimonial.name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
                className="flex-shrink-0 w-72 sm:w-80 bg-gray-50 border-2 border-gray-300 p-4 sm:p-6 backdrop-blur-sm"
              >
                {/* Avatar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-8 h-8 object-cover"
                    />
                  </div>
                  <div>
                    <motion.h4
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      viewport={{ once: true, amount: 0.3 }}
                      className="text-gray-900 font-medium text-xs sm:text-sm">
                      {testimonial.name}
                    </motion.h4>
                    <p className="text-gray-500 text-xs">
                      {testimonial.role}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {testimonial.company}
                    </p>
                  </div>
                </div>

                {/* Contenido del testimonio */}
                <blockquote className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>
              </motion.div>
            ))}
          </motion.div>

          {/* Indicadores de scroll */}
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 transition-colors duration-300 ${index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
                  }`}
                animate={{
                  scale: index === currentIndex ? 1.2 : 1,
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}