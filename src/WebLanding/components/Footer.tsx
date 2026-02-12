
import React from "react";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { useSmoothScroll } from "../hooks/use-smooth-scroll";

export default function Footer() {
  const { t } = useI18n();
  const { scrollToSection } = useSmoothScroll();

  return (
    <footer className="relative w-full border-t border-white/[0.08] bg-[#090909] pt-24 pb-12 overflow-hidden">
      {/* Background glow removed for sharpness */}

      <div className="mx-auto max-w-7xl px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

          {/* Brand block */}
          <div className="md:col-span-4 lg:col-span-5 space-y-8">
            <button onClick={() => scrollToSection('home')} className="flex items-center">
              <img
                src="/DT_logo.png"
                alt="Datacivis"
                className="h-10 w-auto"
              />
            </button>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Datacivis es el Large Intelligence System Agent diseñado para equipos que prefieren hablar antes que configurar. Automatización de marketing real, hecha en LATAM.
            </p>
          </div>

          {/* Links blocks */}
          <div className="md:col-span-1 lg:col-span-2 space-y-6">
            <h4 className="text-white font-bold text-sm tracking-widest uppercase opacity-70">Producto</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => scrollToSection('beneficios')} className="text-white/50 hover:text-white transition-colors text-sm">
                  {t('nav.benefits')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('caracteristicas')} className="text-white/50 hover:text-white transition-colors text-sm">
                  {t('nav.features')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('demo')} className="text-white/50 hover:text-white transition-colors text-sm">
                  Dashboard
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1 lg:col-span-2 space-y-6">
            <h4 className="text-white font-bold text-sm tracking-widest uppercase opacity-70">Compañía</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => scrollToSection('casos-de-uso')} className="text-white/50 hover:text-white transition-colors text-sm">
                  {t('nav.useCases')}
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('stack')} className="text-white/50 hover:text-white transition-colors text-sm">
                  Stack de I.A.
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('comparativa')} className="text-white/50 hover:text-white transition-colors text-sm">
                  Diferencial
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-1 lg:col-span-3 space-y-6">
            <h4 className="text-white font-bold text-sm tracking-widest uppercase opacity-70">Contacto</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:hola@datacivis.com" className="text-white hover:text-white/80 transition-colors text-lg font-bold">
                  hola@datacivis.com
                </a>
              </li>
              <li className="text-white/50 text-sm">
                Buenos Aires, Argentina<br />
                En todo LATAM.
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-white/20 text-xs tracking-wider">
            © {new Date().getFullYear()} DATACIVIS. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-white/20 hover:text-white/40 text-[10px] font-bold tracking-widest uppercase transition-colors">Privacidad</a>
            <a href="#" className="text-white/20 hover:text-white/40 text-[10px] font-bold tracking-widest uppercase transition-colors">Términos</a>
          </div>
        </div>
      </div>

      {/* Large Watermark */}
      <div className="mt-12 pointer-events-none select-none overflow-hidden flex justify-center relative top-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: .9, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="w-full max-w-7xl px-4"
        >
          <img
            src="/datacivis-logo-watermark.svg"
            alt="Datacivis"
            className="w-full h-auto"
          />
        </motion.div>
      </div>
    </footer>
  );
}
