
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { useI18n } from "../lib/i18n";
import { IconQuote } from "@tabler/icons-react";

export default function TestimonialsSection() {
  const { t } = useI18n();
  const rawData = t('testimonials.items') || [];

  // Ensure we have enough data to fill columns.
  // If we have few items, duplicate them until we have a substantial list.
  if (!rawData || rawData.length === 0) return null;

  let testimonialsData = [...rawData];
  while (testimonialsData.length < 9) {
    testimonialsData = [...testimonialsData, ...rawData];
  }

  // Split data into 3 columns
  const chunk1 = testimonialsData.slice(0, Math.ceil(testimonialsData.length / 3));
  const chunk2 = testimonialsData.slice(Math.ceil(testimonialsData.length / 3), Math.ceil(2 * testimonialsData.length / 3));
  const chunk3 = testimonialsData.slice(Math.ceil(2 * testimonialsData.length / 3));

  // Duplicating for infinite scroll effect
  const column1 = [...chunk1, ...chunk1];
  const column2 = [...chunk2, ...chunk2];
  const column3 = [...chunk3, ...chunk3];

  const TestimonialCard = ({ item }: { item: any }) => (
    <div className="mb-6 break-inside-avoid relative rounded-2xl bg-[#0F0F0F] border border-white/10 p-6 shadow-lg hover:border-white/20 transition-colors duration-300">
      <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
        "{item.content}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/40 font-bold text-xs border border-white/10">
          {item.name.charAt(0)}
        </div>
        <div>
          <h4 className="text-white font-bold text-xs">{item.name}</h4>
          <p className="text-white/30 text-[10px] uppercase tracking-wide">
            {item.role}, {item.company}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section id="testimonios" className="relative w-full border-t border-white/[0.08] bg-[#090909] py-24 sm:py-32 overflow-hidden">

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <Badge variant="outline" className="mb-6 bg-white/5 border-white/10 text-white/90 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-md mx-auto">
            {t('testimonials.badge')}
          </Badge>
          <h2 className="text-3xl lg:text-[36px] font-heading font-bold text-white tracking-tight mb-6">
            {t('testimonials.title')}
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            {t('testimonials.description')}
          </p>
        </motion.header>

        {/* Vertical Marquee Grid */}
        <div className="relative h-[600px] overflow-hidden">
          {/* Top and Bottom Fade Masks */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#090909] to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#090909] to-transparent z-20 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full">
            {/* Column 1 - Down to Up */}
            <div className="relative h-full overflow-hidden">
              <motion.div
                initial={{ y: "0%" }}
                animate={{ y: "-50%" }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="flex flex-col gap-0"
              >
                {column1.map((item, idx) => (
                  <TestimonialCard key={`col1-${idx}`} item={item} />
                ))}
              </motion.div>
            </div>

            {/* Column 2 - Up to Down (Reverse) - Hidden on mobile if needed, or just scrolling differently */}
            <div className="relative h-full overflow-hidden hidden md:block">
              <motion.div
                initial={{ y: "-50%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 50,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="flex flex-col gap-0"
              >
                {column2.map((item, idx) => (
                  <TestimonialCard key={`col2-${idx}`} item={item} />
                ))}
              </motion.div>
            </div>

            {/* Column 3 - Down to Up - Hidden on tablet/mobile if needed */}
            <div className="relative h-full overflow-hidden hidden lg:block">
              <motion.div
                initial={{ y: "0%" }}
                animate={{ y: "-50%" }}
                transition={{
                  duration: 45,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="flex flex-col gap-0"
              >
                {column3.map((item, idx) => (
                  <TestimonialCard key={`col3-${idx}`} item={item} />
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}