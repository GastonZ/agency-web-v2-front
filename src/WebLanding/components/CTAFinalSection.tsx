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
      className="relative w-full border-t border-white/10 bg-[#090909] "
    >
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-16 md:py-24">
        <motion.div {...fadeUp} className="text-center flex flex-col items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Badge variant="outline" className="mb-3 sm:mb-4 md:mb-6 bg-[#090909]/50 border-white/20 text-white/90 rounded-none px-3 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 text-xs sm:text-sm md:text-base font-medium">
              {t('cta.badge')}
            </Badge>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            id="cta-final-title"
            className="font-heading bg-gradient-to-b from-white from-[55%] to-white/50 bg-clip-text text-transparent text-3xl md:text-5xl tracking-tight font-semibold mb-4"
          >
            {t('cta.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-orange-400 font-semibold text-base md:text-lg mb-2"
          >
            {t('cta.subtitle')}
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-white/70 max-w-2xl mx-auto text-base md:text-lg leading-relaxed"
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
              className="bg-white text-black hover:bg-gray-100 font-medium px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base"
            >
              {t('cta.button')}
              <img src="/arrow-icon.svg" alt="Arrow" className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </motion.div>
          {/* Oferta / urgencia: barra simple, no compite con el CTA */}
          <motion.div
            {...fadeUp}
            className="mt-8 rounded-md border border-orange-500/25 bg-gradient-to-r from-orange-500/10 to-red-500/10 px-4 py-3 text-orange-300"
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
