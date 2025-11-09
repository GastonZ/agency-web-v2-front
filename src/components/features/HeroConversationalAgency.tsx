import React, { useState, useEffect, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../../WebLanding/components/ui/button"
import { Badge } from "../../WebLanding/components/ui/badge"
import { useTranslation } from "react-i18next"

type ConversationState = 'greeting' | 'user-request' | 'agent-response' | 'campaign-creation' | 'campaign-complete'

const HeroConversationalAgency = () => {
  const { t } = useTranslation('translations')  
  const [conversationState, setConversationState] = useState<ConversationState>('greeting')
  const [isTyping, setIsTyping] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [showAgentCard, setShowAgentCard] = useState(false)
  const [showCampaignInterface, setShowCampaignInterface] = useState(false)
  const [campaignProgress, setCampaignProgress] = useState(0)
  
  const conversationFlow: Array<{ state: ConversationState; message: string; duration: number }> = [
    { state: 'greeting', message: t("messages1"), duration: 3000 },
    { state: 'greeting', message: t("messages2"), duration: 3000 },
    { state: 'user-request', message: t("messages3"), duration: 2000 },
    { state: 'agent-response', message: t("messages4"), duration: 2000 },
    { state: 'campaign-creation', message: t("messages5"), duration: 4000 },
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
    <section id="home" className="w-full flex flex-col items-center justify-center font-body overflow-hidden hero-section relative bg-white min-h-[80vh] rounded-2xl">
      

      {/* AI Agent Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-6xl mx-auto">


        {/* AI Orb floating directly */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative mb-12"
        >

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
          {t('ia_gets_you')}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          className="mb-8 max-w-3xl text-lg text-gray-700 sm:text-xl font-medium"
        >
          {t('ia_gets_sub')}
        </motion.p>

      </div>

    </section>
  )
}

export default HeroConversationalAgency

