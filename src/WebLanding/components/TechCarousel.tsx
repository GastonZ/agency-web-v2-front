
import { motion } from "framer-motion"
import { useI18n } from "../lib/i18n"

const TechCarousel = () => {
  const { t } = useI18n()
  
  // Fallback si las traducciones no están disponibles
  const getTranslation = (key: string, fallback: string) => {
    try {
      const translation = t(key)
      return translation || fallback
    } catch (error) {
      return fallback
    }
  }
  
  const technologies = [
    // Modelos de Lenguaje y Conversación
    "OpenAI GPT-4", "Qwen", "LLaMA", "LangChain",
    
    // Voz y Audio
    "ElevenLabs", "FFmpeg",
    
    // Imagen y Video
    "Stable Diffusion", "DALL·E", "Google Vision", "AWS Rekognition",
    
    // Mensajería y Canales
    "WhatsApp API", "Twilio", "Meta Cloud API", "Facebook API", "Instagram API", "X/Twitter API",
    
    // Social Listening
    "Google Custom Search", "RapidAPI", "NewsAPI", "GNews",
    
    // Datos y Análisis
    "Pandas", "NumPy", "Matplotlib", "Plotly", "NetworkX", "Scikit-learn", "SpaCy", "Transformers",
    
    // Infraestructura
    "PostgreSQL", "MongoDB", "FastAPI", "Flask", "Docker", "PM2", "NGINX", "Redis"
  ]

  return (
    <div className="w-full">
      {/* Contenedor que respeta el mismo ancho que las otras secciones */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative py-8 sm:py-12">
          {/* Título */}
          <div className="text-center mb-8 sm:mb-12">
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="text-white/80 text-sm sm:text-base font-medium">
              {getTranslation('tech.title', 'Tecnologías que impulsan nuestra plataforma')}
            </motion.h3>
          </div>

          {/* Carrusel infinito con gradiente sutil */}
          <div className="relative overflow-hidden rounded-lg">
            {/* Gradientes suaves en los bordes para efecto fade natural */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#090909] to-transparent pointer-events-none z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#090909] to-transparent pointer-events-none z-10"></div>
            
            <motion.div
              className="flex gap-6 sm:gap-8 md:gap-12"
              animate={{
                x: [0, -100 * technologies.length]
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 60,
                  ease: "linear",
                },
              }}
              style={{
                width: `${technologies.length * 2}00px`
              }}
            >
              {/* Primera pasada */}
              {technologies.map((tech, index) => (
                <motion.div
                  key={`first-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="flex-shrink-0 flex items-center justify-center"
                >
                  <div className="bg-[#090909] border border-white/10 px-4 sm:px-6 py-2 sm:py-3 hover:bg-white/10 transition-colors">
                    <span className="text-white/70 text-sm sm:text-base font-medium whitespace-nowrap">
                      {tech}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {/* Segunda pasada para continuidad */}
              {technologies.map((tech, index) => (
                <div
                  key={`second-${index}`}
                  className="flex-shrink-0 flex items-center justify-center"
                >
                  <div className="bg-[#090909] border border-white/10 px-4 sm:px-6 py-2 sm:py-3 hover:bg-white/10 transition-colors">
                    <span className="text-white/70 text-sm sm:text-base font-medium whitespace-nowrap">
                      {tech}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TechCarousel
