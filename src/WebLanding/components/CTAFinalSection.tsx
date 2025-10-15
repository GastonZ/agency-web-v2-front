import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { useI18n } from "../lib/i18n";

export default function CTAFinalSection() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const fadeUp = {
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
    viewport: { once: true, amount: 0.3 },
  };

  return (
    <section
      id="cta-final"
      aria-labelledby="cta-final-title"
      className="relative w-full border-t border-gray-200 bg-white"
    >
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
        <motion.div {...fadeUp} className="text-center flex flex-col items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Badge variant="outline" className="mb-3 sm:mb-4 md:mb-6 bg-white border-gray-200 text-gray-800 rounded-full px-6 py-2 text-sm font-medium shadow-sm">
              {t('cta.badge')}
            </Badge>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            id="cta-final-title"
            className="font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4"
          >
            {t('cta.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-orange-500 font-semibold text-base md:text-lg mb-2"
          >
            {t('cta.subtitle')}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg leading-relaxed"
          >
            {t('cta.description')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col items-center w-full"
          >
            <Button
              size="lg"
              className="bg-gray-900 text-white hover:bg-gray-800 font-medium px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base"
            >
              {t('cta.button')}
              <img src="/arrow-icon.svg" alt="Arrow" className="w-3 h-3 sm:w-4 sm:h-4 invert" />
            </Button>
          </motion.div>
          {/* Oferta / urgencia: barra simple, no compite con el CTA */}
          <motion.div
            {...fadeUp}
            className="mt-8 rounded-md border border-green-500/25 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-4 py-3 text-green-700"
            role="note"
          >
            <p className="flex items-center justify-center gap-2 text-sm">
              <Phone className="h-4 w-4" aria-hidden />
              <strong>{t('cta.limitedOffer')}</strong>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
