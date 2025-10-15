import { motion } from "framer-motion";
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import TechCarousel from "./TechCarousel";
import FloatingParticles from "./FloatingParticles"
import { useI18n } from "../lib/i18n"

const HeroGrid = () => {
  const { t } = useI18n()
  return (
    <section id="home" className="w-full flex flex-col items-center justify-center font-body overflow-x-hidden hero-section relative">
      {/* Grid de fondo - Solo en la parte superior del Hero */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl h-[600px] z-0 bg-[#090909]">
        {/* Grid con CSS puro - solo en la parte superior */}
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.11) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.11) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 0 0'
          }}
        />

        {/* Múltiples rayos de luz */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 overflow-hidden">

          {/* Rayo principal - diagonal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            className="absolute top-0 left-0 w-full h-full light-ray" />

          {/* Rayo secundario - más a la derecha */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
            className="absolute top-0 left-0 w-full h-full light-ray-2" />

          {/* Rayo terciario - más abajo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.9 }}
            className="absolute top-0 left-0 w-full h-full light-ray-3" />

          {/* Rayo cuarto - aún más a la derecha */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.20 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 1.2 }}
            className="absolute top-0 left-0 w-full h-full light-ray-4" />

          {/* Partículas flotantes alrededor de todos los rayos */}
          <FloatingParticles />
        </motion.div>
        {/* Overlay con gradiente que va de abajo hacia arriba */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/60 to-transparent"></div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <Badge variant="outline" className="bg-[#090909]/50 border-white/20 text-white/90 rounded-none px-4 py-2 text-sm font-medium">
            {t('hero.badge')}
          </Badge>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-6 text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl font-heading bg-gradient-to-b from-white from-[55%] to-white/50 bg-clip-text text-transparent"
        >
          {t('hero.title')}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mb-8 max-w-3xl text-lg text-white/80 sm:text-xl"
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-100 font-medium px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base"
            aria-label="Agendar una llamada con el equipo de Datacivis"
          >
            {t('hero.cta')}
            <img src="/arrow-icon.svg" alt="Flecha hacia la derecha" className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </motion.div>

      </div>

      {/* Carrusel de tecnologías */}
      <div className="w-full border-t border-white/10">
        <TechCarousel />
      </div>
    </section>
  )
}

export default HeroGrid
