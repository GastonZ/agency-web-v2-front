
import React from "react"
import { motion } from "framer-motion"
import { Button } from "./ui/button"
import ComparativaSection from "./ComparativaSection"
import { Badge } from "./ui/badge"
import TechCarousel from "./TechCarousel"
import FloatingParticles from "./FloatingParticles"
import { useI18n } from "../lib/i18n"
import { Spotlight } from "./ui/spotlight"
import { useSmoothScroll } from "../hooks/use-smooth-scroll"
import HeroDashboard from "./HeroDashboard"

const HeroGrid = () => {
  const { t } = useI18n()
  const { scrollToSection } = useSmoothScroll()

  return (
    <section id="home" className="pt-28 w-full flex flex-col items-center justify-center font-body hero-section relative group bg-[#090909] z-10 overflow-visible">


      {/* Brand Pattern Background */}
      <div className="absolute inset-x-0 -top-40 bottom-0 z-0 overflow-visible">
        <Spotlight
          className="absolute inset-0"
          fill="rgba(16, 185, 129, 0.04)"
        >
          <div className="h-full w-full" />
        </Spotlight>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingParticles />
        </motion.div>

      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-32 pb-8 px-4 text-center w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <Badge variant="outline" className={SECTION_BADGE_STYLE}>
            {t('hero.badge')}
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 text-3xl font-bold tracking-tight lg:text-[56px] font-heading text-white whitespace-pre-line leading-[1.15] max-w-screen-xl"
        >
          {t('hero.title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-10 max-w-2xl text-base text-white/45 sm:text-lg leading-relaxed font-normal"
        >
          {t('hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center gap-4 mb-10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <Button
              size="lg"
              onClick={() => scrollToSection('conversational')}
              className="relative font-bold px-10 py-7 rounded-full bg-white text-black hover:bg-white/90 shadow-2xl transition-all duration-300"
            >
              {t('hero.cta')}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* 3D Dashboard Stage */}
      <div className="relative w-full h-[500px] sm:h-[800px] perspective-[3000px] z-20 -mt-4 overflow-visible flex justify-start pointer-events-none">
        <motion.div
          initial={{ opacity: 0, transform: "translateY(150px) rotateX(25deg)" }}
          whileInView={{
            opacity: 1,
            transform: "translate(-5%, 0%) scale(1.1) rotateX(45deg) rotateY(0deg) rotateZ(-25deg)"
          }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center top",
            width: '120%',
            height: '100%'
          }}
          className="relative will-change-transform flex-shrink-0"
        >
          {/* Transparent Content Stage */}
          <div className="relative w-full h-full pointer-events-auto">
            {/* Very subtle transition masks only at edges */}
            <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#090909] to-transparent pointer-events-none z-30" />
            <div className="absolute inset-y-0 right-0 w-[40%] bg-gradient-to-l from-[#090909] to-transparent pointer-events-none z-30" />

            <div className="scale-[0.9] origin-top-left p-12">
              <HeroDashboard />
            </div>
          </div>

        </motion.div>
      </div>

      {/* Carrusel de tecnologías */}
      <div className="w-full border-t border-white/5 bg-[#090909]/50 backdrop-blur-sm relative z-20">
        <TechCarousel />
      </div>
    </section>
  )
}

const SECTION_BADGE_STYLE = "mb-6 bg-[#141414] border-white/5 text-white/40 rounded-full px-4 py-1.5 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:text-white/60";

export default HeroGrid;
