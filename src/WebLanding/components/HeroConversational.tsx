import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { useI18n } from "../lib/i18n"

type ConversationState = 'greeting' | 'user-request' | 'agent-response' | 'campaign-creation' | 'campaign-complete'

const HeroConversational = () => {
  const { t } = useI18n()
  const [conversationState, setConversationState] = useState<ConversationState>('greeting')
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [showAgentCard, setShowAgentCard] = useState(false)
  const [showCampaignInterface, setShowCampaignInterface] = useState(false)
  const [campaignProgress, setCampaignProgress] = useState(0)
  
  const conversationFlow: Array<{ state: ConversationState; message: string; duration: number }> = [
    { state: 'greeting', message: "Hola, soy tu asistente de IA", duration: 3000 },
    { state: 'greeting', message: "¿En qué puedo ayudarte hoy?", duration: 3000 },
    { state: 'user-request', message: "Quiero crear una campaña", duration: 2000 },
    { state: 'agent-response', message: "Dale, creo una campaña pump", duration: 2000 },
    { state: 'campaign-creation', message: "Configurando campaña...", duration: 4000 },
    { state: 'campaign-complete', message: "¡Campaña creada exitosamente!", duration: 3000 }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(true)
      setTimeout(() => {
        const nextIndex = (currentMessage + 1) % conversationFlow.length
        setCurrentMessage(nextIndex)
        setConversationState(conversationFlow[nextIndex].state)
        setIsTyping(false)
        
        // Show agent card when agent responds
        if (conversationFlow[nextIndex].state === 'agent-response') {
          setTimeout(() => setShowAgentCard(true), 500)
        }
        
        // Show campaign interface when creating campaign
        if (conversationFlow[nextIndex].state === 'campaign-creation') {
          setTimeout(() => setShowCampaignInterface(true), 500)
          // Simulate campaign creation progress
          let progress = 0
          const progressInterval = setInterval(() => {
            progress += 10
            setCampaignProgress(progress)
            if (progress >= 100) {
              clearInterval(progressInterval)
            }
          }, 200)
        }
        
        // Hide elements when conversation resets
        if (conversationFlow[nextIndex].state === 'greeting') {
          setShowAgentCard(false)
          setShowCampaignInterface(false)
          setCampaignProgress(0)
        }
      }, 2000)
    }, conversationFlow[currentMessage]?.duration || 4000)

    return () => clearInterval(interval)
  }, [currentMessage])

  return (
    <section id="home" className="w-full flex flex-col items-center justify-center font-body overflow-hidden hero-section relative bg-white min-h-screen">
      

      {/* AI Agent Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-6xl mx-auto pt-20">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <Badge variant="outline" className="bg-white border-gray-200 text-gray-800 rounded-full px-6 py-2 text-sm font-medium shadow-sm">
            {t('hero.badge')}
          </Badge>
        </motion.div>

        {/* AI Orb floating directly */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-12"
        >
          {/* Just the glowing green orb floating */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* AI Talk Button - Simple Glowing Orb */}
            <div className="relative">
              {/* Just the glowing green orb */}
              <div className="relative">
                {/* Outer glow effect with more blur */}
                <div className="absolute inset-0 bg-green-400/60 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute inset-0 bg-green-300/30 rounded-full blur-3xl animate-pulse"></div>
                {/* Main glowing orb */}
                <div className="relative w-20 h-20 bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm">
                  {/* Inner glow layers with blur */}
                  <div className="absolute inset-2 bg-gradient-to-br from-green-200/70 to-transparent rounded-full blur-sm"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-white/50 to-transparent rounded-full blur-sm"></div>
                  {/* AI sparkle core - displaced for better blur effect */}
                  <motion.div 
                    animate={{
                      x: [0, 2, -1, 1, 0],
                      y: [0, -1, 1, -0.5, 0],
                      scale: [1, 1.1, 0.9, 1.05, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative w-8 h-8 bg-white/95 rounded-full shadow-inner blur-sm"
                  ></motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Chat Bubble */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="relative mb-8"
        >
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl border border-green-200 p-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 rounded-full bg-white/90"></div>
              </div>
              <span className="text-sm font-medium text-green-800">
                {conversationState === 'user-request' ? 'Usuario' : 'Asistente IA'}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-green-900 text-left font-medium"
              >
                {conversationFlow[currentMessage]?.message}
                {isTyping && <span className="animate-pulse">...</span>}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>


        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="mb-6 text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl font-heading bg-gradient-to-b from-gray-900 from-[55%] to-gray-600 bg-clip-text text-transparent"
        >
          {t('hero.title')}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          className="mb-8 max-w-3xl text-lg text-gray-700 sm:text-xl font-medium"
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
          className="mb-16 relative"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 text-white hover:from-green-600 hover:via-emerald-700 hover:to-green-800 font-medium px-8 py-4 transition-all duration-300 flex items-center gap-3 text-base shadow-2xl hover:shadow-green-500/25 hover:shadow-2xl border border-green-500/20 relative z-10"
            aria-label="Agendar una llamada con el equipo de Datacivis"
            style={{
              boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.3), 0 10px 10px -5px rgba(34, 197, 94, 0.1)'
            }}
          >
            {t('hero.cta')}
            <img src="/arrow-icon.svg" alt="Arrow" className="w-4 h-4 invert" />
          </Button>
        </motion.div>
      </div>

    </section>
  )
}

export default HeroConversational

